using Charkhoone.Application.Payments;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class TenantArrearsRepaymentIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;

    public Task InitializeAsync() => _factory.MigrateAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task ExactConfirmedRepayment_PostsPrincipalAndLostFundReturn_Once()
    {
        var now = DateTimeOffset.Parse("2026-09-18T18:00:00+00:00");
        var seeded = await SeedOpenArrearsAsync(now.AddDays(-10), 1_000_000m);
        var expectedAccrual = LostFundReturnTerms.CalculateAccruedReturn(
            LostFundReturnTerms.OpenExposure(
                seeded.ContractId,
                seeded.CoveragePaymentId,
                seeded.PrincipalRial,
                seeded.WithdrawnAtUtc),
            now);

        var adapter = new RecordingArrearsRepaymentAdapter(request =>
            new ExternalTenantArrearsRepaymentResponse(
                ExternalTenantArrearsRepaymentStatus.Confirmed,
                "postgres-test-provider",
                request.QuotedTotalRial,
                $"repayment:{request.ExternalTransactionId:D}",
                request.QuoteAtUtc));

        await using var provider = BuildProvider(adapter);

        ReconcileTenantArrearsRepaymentResult first;
        await using (var scope = provider.CreateAsyncScope())
        {
            var service = scope.ServiceProvider.GetRequiredService<ITenantArrearsRepaymentService>();
            first = await service.ReconcileAsync(
                seeded.ContractId,
                seeded.TenantId,
                now);
        }

        Assert.Equal(ReconcileTenantArrearsRepaymentOutcome.Reconciled, first.Outcome);
        Assert.NotNull(first.Repayment);
        Assert.NotNull(first.Replenishment);
        Assert.Equal(seeded.PrincipalRial, first.Repayment!.OutstandingPrincipalRial);
        Assert.Equal(expectedAccrual.PayableReturn.Rial, first.Repayment.LostFundReturnRial);
        Assert.Equal(
            seeded.PrincipalRial + expectedAccrual.PayableReturn.Rial,
            first.Repayment.TotalRepaymentRial);
        Assert.Equal(1, adapter.CallCount);

        await using (var verification = CreateDbContext())
        {
            var external = await verification.ExternalTransactions
                .AsNoTracking()
                .SingleAsync(x => x.Id == first.Repayment.ExternalTransactionId);
            var replenishment = await verification.TenantContributionReplenishments
                .AsNoTracking()
                .SingleAsync(x => x.ExternalTransactionId == external.Id);
            var lostReturn = await verification.LostFundReturns
                .AsNoTracking()
                .SingleAsync(x => x.CoveragePaymentId == seeded.CoveragePaymentId);
            var journalLines = await verification.JournalLines
                .AsNoTracking()
                .Where(x => x.JournalEntryId == replenishment.JournalEntryId)
                .ToListAsync();

            Assert.Equal(ExternalTransactionStatus.Succeeded, external.Status);
            Assert.Equal("tenant_contribution_replenishment", external.OperationType);
            Assert.Equal(now, external.UpdatedAtUtc);
            Assert.Equal(
                seeded.PrincipalRial + expectedAccrual.PayableReturn.Rial,
                external.AmountRial);
            Assert.Equal(seeded.PrincipalRial, replenishment.AmountRial);
            Assert.Equal(now, replenishment.ReplenishedAtUtc);
            Assert.Equal(expectedAccrual.PayableReturn.Rial, lostReturn.CalculatedReturnRial);
            Assert.Equal(now, lostReturn.ReplacedAtUtc);
            Assert.Equal(now, lostReturn.CalculationPeriodEndUtc);
            Assert.Equal(
                LostFundReturnTerms.CalculationPolicyVersion,
                lostReturn.CalculationPolicyVersion);
            Assert.Equal(external.AmountRial, journalLines.Sum(x => x.DebitRial));
            Assert.Equal(external.AmountRial, journalLines.Sum(x => x.CreditRial));
        }

        ReconcileTenantArrearsRepaymentResult replay;
        await using (var scope = provider.CreateAsyncScope())
        {
            var service = scope.ServiceProvider.GetRequiredService<ITenantArrearsRepaymentService>();
            replay = await service.ReconcileAsync(
                seeded.ContractId,
                seeded.TenantId,
                now.AddMinutes(1));
        }

        Assert.Equal(ReconcileTenantArrearsRepaymentOutcome.AlreadyReconciled, replay.Outcome);
        Assert.Equal(1, adapter.CallCount);

        await using var replayVerification = CreateDbContext();
        Assert.Equal(
            1,
            await replayVerification.TenantContributionReplenishments
                .CountAsync(x => x.ContractId == seeded.ContractId));
    }

    [Fact]
    public async Task ConfirmedAmountMismatch_RemainsUnknown_AndPostsNothing()
    {
        var now = DateTimeOffset.Parse("2026-09-18T19:00:00+00:00");
        var seeded = await SeedOpenArrearsAsync(now.AddDays(-15), 2_000_000m);

        var adapter = new RecordingArrearsRepaymentAdapter(request =>
            new ExternalTenantArrearsRepaymentResponse(
                ExternalTenantArrearsRepaymentStatus.Confirmed,
                "postgres-test-provider",
                request.QuotedTotalRial - 1m,
                $"mismatch:{request.ExternalTransactionId:D}",
                request.QuoteAtUtc));

        await using var provider = BuildProvider(adapter);
        ReconcileTenantArrearsRepaymentResult result;

        await using (var scope = provider.CreateAsyncScope())
        {
            var service = scope.ServiceProvider.GetRequiredService<ITenantArrearsRepaymentService>();
            result = await service.ReconcileAsync(
                seeded.ContractId,
                seeded.TenantId,
                now);
        }

        Assert.Equal(ReconcileTenantArrearsRepaymentOutcome.Indeterminate, result.Outcome);
        Assert.NotNull(result.Repayment);
        Assert.Equal(ExternalTransactionStatus.Unknown, result.Repayment!.TransactionStatus);

        await using var verification = CreateDbContext();
        var external = await verification.ExternalTransactions
            .AsNoTracking()
            .SingleAsync(x => x.Id == result.Repayment.ExternalTransactionId);
        var lostReturn = await verification.LostFundReturns
            .AsNoTracking()
            .SingleAsync(x => x.CoveragePaymentId == seeded.CoveragePaymentId);

        Assert.Equal(ExternalTransactionStatus.Unknown, external.Status);
        Assert.Equal("tenant_arrears_repayment_confirmation_mismatch", external.ReasonCode);
        Assert.False(await verification.TenantContributionReplenishments
            .AnyAsync(x => x.ExternalTransactionId == external.Id));
        Assert.Null(lostReturn.CalculatedReturnRial);
        Assert.Null(lostReturn.ReplacedAtUtc);
        Assert.Null(lostReturn.CalculationPeriodEndUtc);
    }

    private ServiceProvider BuildProvider(IExternalTenantArrearsRepaymentAdapter repaymentAdapter)
    {
        var services = new ServiceCollection();
        services.AddDbContext<CharkhooneDbContext>(options =>
            options.UseNpgsql(_factory.ConnectionString));
        services.AddSingleton(repaymentAdapter);
        services.AddSingleton<IExternalTenantArrearsRepaymentAdapter>(repaymentAdapter);
        services.AddSingleton<IExternalCoverageTransferAdapter, NeverCalledCoverageTransferAdapter>();
        services.AddScoped<ITenantContributionCoverageService, EfTenantContributionCoverageService>();
        services.AddScoped<ITenantArrearsRepaymentService, EfTenantArrearsRepaymentService>();
        return services.BuildServiceProvider();
    }

    private CharkhooneDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql(_factory.ConnectionString)
            .Options;
        return new CharkhooneDbContext(options);
    }

    private async Task<SeededArrears> SeedOpenArrearsAsync(
        DateTimeOffset withdrawnAtUtc,
        decimal principalRial)
    {
        var tenantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var contractId = Guid.NewGuid();
        var allocationId = Guid.NewGuid();
        var obligationId = Guid.NewGuid();
        var paymentInstructionId = Guid.NewGuid();
        var coverageExternalTransactionId = Guid.NewGuid();
        var coveragePaymentId = Guid.NewGuid();

        await using var db = CreateDbContext();

        db.Users.AddRange(
            new UserRow
            {
                Id = tenantId,
                OidcSubject = $"arrears-repayment-tenant-{tenantId:D}",
                CreatedAtUtc = withdrawnAtUtc.AddMonths(-3),
            },
            new UserRow
            {
                Id = ownerId,
                OidcSubject = $"arrears-repayment-owner-{ownerId:D}",
                CreatedAtUtc = withdrawnAtUtc.AddMonths(-3),
            });

        db.CreditApplications.Add(new CreditApplicationRow
        {
            Id = applicationId,
            ApplicantUserId = tenantId,
            Status = CreditApplicationStatus.ApprovedFunded,
            CreatedAtUtc = withdrawnAtUtc.AddMonths(-3),
            UpdatedAtUtc = withdrawnAtUtc.AddMonths(-3),
        });

        db.LeaseContracts.Add(new LeaseContractRow
        {
            Id = contractId,
            TenantUserId = tenantId,
            OwnerUserId = ownerId,
            PropertyId = Guid.NewGuid(),
            CreditApplicationId = applicationId,
            Status = LeaseContractStatus.Active,
            CreatedAtUtc = withdrawnAtUtc.AddMonths(-3),
            UpdatedAtUtc = withdrawnAtUtc,
        });

        db.FundingAllocations.Add(new FundingAllocationRow
        {
            Id = allocationId,
            CreditApplicationId = applicationId,
            ContractId = contractId,
            BankLoanPlanId = Guid.NewGuid(),
            BankLoanPlanVersion = "arrears-repayment-v1",
            BankId = "arrears-repayment-bank",
            FullDepositEquivalentRial = 5_000_000m,
            MaximumEligibleLoanRial = 3_000_000m,
            BankApprovedLoanRial = 2_000_000m,
            TenantContributionRial = 3_000_000m,
            CreatedAtUtc = withdrawnAtUtc.AddMonths(-3),
            UpdatedAtUtc = withdrawnAtUtc.AddMonths(-3),
        });

        db.TenantContributions.Add(new TenantContributionRow
        {
            ContractId = contractId,
            FundingAllocationId = allocationId,
            InitialAmountRial = 3_000_000m,
            FundReference = $"arrears-repayment-fund:{contractId:D}",
            FundedAtUtc = withdrawnAtUtc.AddMonths(-3),
        });

        db.LedgerAccounts.AddRange(
            new LedgerAccountRow
            {
                Id = Guid.NewGuid(),
                Code = $"contract:{contractId:D}:fund-held-tenant-contribution",
                Name = "Fund-held tenant contribution",
                Currency = "IRR",
                ContractId = contractId,
                CreatedAtUtc = withdrawnAtUtc.AddMonths(-3),
            },
            new LedgerAccountRow
            {
                Id = Guid.NewGuid(),
                Code = $"contract:{contractId:D}:tenant-contribution-balance",
                Name = "Tenant contribution balance",
                Currency = "IRR",
                ContractId = contractId,
                CreatedAtUtc = withdrawnAtUtc.AddMonths(-3),
            });

        db.MonthlyObligations.Add(new MonthlyObligationRow
        {
            Id = obligationId,
            ContractId = contractId,
            ContractMonthNumber = 1,
            DueAtUtc = withdrawnAtUtc.AddDays(-1),
            Status = MonthlyObligationStatus.Covered,
            CreatedAtUtc = withdrawnAtUtc.AddMonths(-1),
            UpdatedAtUtc = withdrawnAtUtc,
            ClosedAtUtc = withdrawnAtUtc,
        });

        db.PaymentInstructions.Add(new PaymentInstructionRow
        {
            Id = paymentInstructionId,
            ObligationId = obligationId,
            DueAtUtc = withdrawnAtUtc.AddDays(-1),
            BeneficiaryId = "arrears-repayment-owner-beneficiary",
            AmountRial = principalRial,
            IdempotencyKey = $"arrears-repayment-payment:{paymentInstructionId:D}",
            Status = PaymentInstructionStatus.Failed,
            CreatedAtUtc = withdrawnAtUtc.AddMonths(-1),
            UpdatedAtUtc = withdrawnAtUtc,
        });

        db.MonthlyObligationComponents.Add(new MonthlyObligationComponentRow
        {
            MonthlyObligationId = obligationId,
            PaymentInstructionId = paymentInstructionId,
            Kind = MonthlyObligationComponentKind.OwnerPayment,
        });

        db.ExternalTransactions.Add(new ExternalTransactionRow
        {
            Id = coverageExternalTransactionId,
            Provider = "arrears-repayment-coverage-provider",
            OperationType = "tenant_contribution_coverage",
            AggregateType = "PaymentInstruction",
            AggregateId = paymentInstructionId,
            Status = ExternalTransactionStatus.Succeeded,
            AmountRial = principalRial,
            Currency = "IRR",
            IdempotencyKey = $"arrears-repayment-coverage:{paymentInstructionId:D}",
            ExternalReference = $"coverage:{paymentInstructionId:D}",
            CreatedAtUtc = withdrawnAtUtc,
            UpdatedAtUtc = withdrawnAtUtc,
        });

        db.CoveragePayments.Add(new CoveragePaymentRow
        {
            Id = coveragePaymentId,
            ContractId = contractId,
            MonthlyObligationId = obligationId,
            PaymentInstructionId = paymentInstructionId,
            Kind = MonthlyObligationComponentKind.OwnerPayment,
            AmountRial = principalRial,
            BeneficiaryId = "arrears-repayment-owner-beneficiary",
            Status = CoveragePaymentStatus.Succeeded,
            ExternalTransactionId = coverageExternalTransactionId,
            RemainingTenantContributionRial = 3_000_000m - principalRial,
            CreatedAtUtc = withdrawnAtUtc,
            UpdatedAtUtc = withdrawnAtUtc,
            CoveredAtUtc = withdrawnAtUtc,
        });

        db.LostFundReturns.Add(new LostFundReturnRow
        {
            Id = Guid.NewGuid(),
            ContractId = contractId,
            CoveragePaymentId = coveragePaymentId,
            WithdrawnAmountRial = principalRial,
            MonthlyRate = LostFundReturnTerms.MonthlyRate,
            WithdrawnAtUtc = withdrawnAtUtc,
            CalculationPeriodStartUtc = withdrawnAtUtc,
            CreatedAtUtc = withdrawnAtUtc,
            UpdatedAtUtc = withdrawnAtUtc,
        });

        db.ContractDelinquencies.Add(new ContractDelinquencyRow
        {
            ContractId = contractId,
            ConsecutiveMissedMonths = 1,
            CancellationRequired = false,
            UpdatedAtUtc = withdrawnAtUtc,
        });

        await db.SaveChangesAsync();

        return new SeededArrears(
            tenantId,
            contractId,
            coveragePaymentId,
            principalRial,
            withdrawnAtUtc);
    }

    private sealed record SeededArrears(
        Guid TenantId,
        Guid ContractId,
        Guid CoveragePaymentId,
        decimal PrincipalRial,
        DateTimeOffset WithdrawnAtUtc);

    private sealed class RecordingArrearsRepaymentAdapter(
        Func<ExternalTenantArrearsRepaymentRequest, ExternalTenantArrearsRepaymentResponse> responseFactory)
        : IExternalTenantArrearsRepaymentAdapter
    {
        public string Provider => "postgres-test-provider";
        public int CallCount { get; private set; }

        public Task<ExternalTenantArrearsRepaymentResponse> EnsureOrQueryAsync(
            ExternalTenantArrearsRepaymentRequest request,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            return Task.FromResult(responseFactory(request));
        }
    }

    private sealed class NeverCalledCoverageTransferAdapter : IExternalCoverageTransferAdapter
    {
        public string Provider => "unused-coverage-provider";

        public Task<ExternalCoverageTransferResponse> EnsureOrQueryAsync(
            ExternalCoverageTransferRequest request,
            CancellationToken cancellationToken = default) =>
            throw new InvalidOperationException(
                "Arrears repayment tests must not initiate a new coverage transfer.");
    }
}
