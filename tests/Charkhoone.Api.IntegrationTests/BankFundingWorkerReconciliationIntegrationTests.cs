extern alias worker;

using Charkhoone.Application.BankFunding;
using Charkhoone.Application.Contracts;
using Charkhoone.Application.Payments;
using Charkhoone.Application.TenantContributionFunding;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Finance;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.BankFunding;
using Charkhoone.Infrastructure.Contracts;
using Charkhoone.Infrastructure.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Charkhoone.Infrastructure.TenantContributionFunding;
using CharkhooneWorker = worker::Charkhoone.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Npgsql;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class BankFundingWorkerReconciliationIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;
    private string? _isolatedConnectionString;
    private string? _isolatedDatabaseName;

    public async Task InitializeAsync()
    {
        var databaseName = $"charkhoone_bank_funding_worker_{Guid.NewGuid():N}";
        var adminBuilder = new NpgsqlConnectionStringBuilder(_factory.ConnectionString)
        {
            Database = "postgres",
        };

        await using (var connection = new NpgsqlConnection(adminBuilder.ConnectionString))
        {
            await connection.OpenAsync();
            await using var command = connection.CreateCommand();
            command.CommandText = $"CREATE DATABASE \"{databaseName}\"";
            await command.ExecuteNonQueryAsync();
        }

        var isolatedBuilder = new NpgsqlConnectionStringBuilder(_factory.ConnectionString)
        {
            Database = databaseName,
        };
        _isolatedDatabaseName = databaseName;
        _isolatedConnectionString = isolatedBuilder.ConnectionString;

        await using var db = CreateDbContext();
        await db.Database.MigrateAsync();
    }

    public async Task DisposeAsync()
    {
        if (_isolatedDatabaseName is null)
        {
            return;
        }

        NpgsqlConnection.ClearAllPools();
        var adminBuilder = new NpgsqlConnectionStringBuilder(_factory.ConnectionString)
        {
            Database = "postgres",
        };

        await using var connection = new NpgsqlConnection(adminBuilder.ConnectionString);
        await connection.OpenAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = $"DROP DATABASE IF EXISTS \"{_isolatedDatabaseName}\" WITH (FORCE)";
        await command.ExecuteNonQueryAsync();
    }

    [Fact]
    public async Task Worker_ReconcilesAlreadyStartedBankApproval_ThroughActiveLeaseInSamePass()
    {
        var workerAt = DateTimeOffset.Parse("2026-09-18T22:30:00+00:00");
        var fixture = await SeedTrustedFundingAsync(
            workerAt,
            CreditApplicationStatus.BankApprovalPending,
            includeApprovedAllocation: false,
            includeStartedFreeze: false,
            includeStartedApproval: true);

        var bank = new RecordingBankAdapter(500_000_000m);
        var fund = new RecordingFundAdapter(500_000_000m);

        await using var provider = BuildWorkerServiceProvider(bank, fund, workerAt);
        var worker = CreateWorker(provider);

        var first = await worker.ReconcileOnceAsync();

        Assert.Equal(1, first.BankFundingCandidates);
        Assert.Equal(1, first.TenantContributionFundingCandidates);
        Assert.Equal(1, first.LeaseFundingCandidates);
        Assert.Equal(1, first.ScheduleProvisioningCandidates);
        Assert.Equal(1, bank.CallCount);
        Assert.Equal(1, fund.PrincipalFreezeCallCount);
        Assert.Equal(1, fund.TenantContributionCallCount);

        await using (var db = CreateDbContext())
        {
            var application = await db.CreditApplications.AsNoTracking()
                .SingleAsync(x => x.Id == fixture.ApplicationId);
            var contract = await db.LeaseContracts.AsNoTracking()
                .SingleAsync(x => x.Id == fixture.ContractId);
            var approval = await db.BankApprovals.AsNoTracking()
                .SingleAsync(x => x.CreditApplicationId == fixture.ApplicationId);
            var allocation = await db.FundingAllocations.AsNoTracking()
                .SingleAsync(x => x.CreditApplicationId == fixture.ApplicationId);
            var freeze = await db.FundPrincipalFreezes.AsNoTracking()
                .SingleAsync(x => x.FundingAllocationId == allocation.Id);
            var principal = await db.FrozenPrincipals.AsNoTracking()
                .SingleAsync(x => x.ContractId == fixture.ContractId);
            var contribution = await db.TenantContributions.AsNoTracking()
                .SingleAsync(x => x.ContractId == fixture.ContractId);

            Assert.Equal(CreditApplicationStatus.ApprovedFunded, application.Status);
            Assert.Equal(LeaseContractStatus.Active, contract.Status);

            Assert.Equal(nameof(BankApprovalDecisionStatus.Approved), approval.Status);
            Assert.Equal(500_000_000m, approval.ApprovedLoanRial);
            Assert.Equal("worker-bank-approved", approval.ExternalReference);
            Assert.Equal(1, approval.AttemptCount);

            Assert.Equal(1_000_000_000m, allocation.FullDepositEquivalentRial);
            Assert.Equal(550_000_000m, allocation.MaximumEligibleLoanRial);
            Assert.Equal(500_000_000m, allocation.BankApprovedLoanRial);
            Assert.Equal(500_000_000m, allocation.TenantContributionRial);

            Assert.Equal(nameof(FundPrincipalFreezeStatus.Confirmed), freeze.Status);
            Assert.NotNull(freeze.FundReference);
            Assert.NotNull(freeze.ExternalReference);
            Assert.Equal(1, freeze.AttemptCount);
            Assert.Equal(500_000_000m, principal.AmountRial);
            Assert.Equal(allocation.BankId, principal.BankId);

            Assert.Equal(500_000_000m, contribution.InitialAmountRial);
            Assert.Equal(
                1,
                await db.JournalEntries.CountAsync(x =>
                    x.IdempotencyKey == $"journal:tenant-contribution-funding:{allocation.Id:D}:v1"));
            Assert.Equal(
                12,
                await db.MonthlyObligations.CountAsync(x => x.ContractId == fixture.ContractId));
        }

        var second = await worker.ReconcileOnceAsync();

        Assert.Equal(0, second.BankFundingCandidates);
        Assert.Equal(0, second.TenantContributionFundingCandidates);
        Assert.Equal(0, second.LeaseFundingCandidates);
        Assert.Equal(0, second.ScheduleProvisioningCandidates);
        Assert.Equal(1, bank.CallCount);
        Assert.Equal(1, fund.PrincipalFreezeCallCount);
        Assert.Equal(1, fund.TenantContributionCallCount);
    }

    [Fact]
    public async Task Worker_ReconcilesStartedFundFreeze_ButDoesNotStartFreshDecisionReadyApproval()
    {
        var workerAt = DateTimeOffset.Parse("2026-09-18T23:00:00+00:00");
        var started = await SeedTrustedFundingAsync(
            workerAt,
            CreditApplicationStatus.FundingPending,
            includeApprovedAllocation: true,
            includeStartedFreeze: true,
            includeStartedApproval: true);
        var fresh = await SeedTrustedFundingAsync(
            workerAt.AddMinutes(1),
            CreditApplicationStatus.DecisionReady,
            includeApprovedAllocation: false,
            includeStartedFreeze: false,
            includeStartedApproval: false);

        var bank = new NeverCalledBankAdapter();
        var fund = new RecordingFundAdapter(500_000_000m);

        await using var provider = BuildWorkerServiceProvider(bank, fund, workerAt);
        var worker = CreateWorker(provider);

        var result = await worker.ReconcileOnceAsync();

        Assert.Equal(1, result.BankFundingCandidates);
        Assert.Equal(1, result.TenantContributionFundingCandidates);
        Assert.Equal(1, result.LeaseFundingCandidates);
        Assert.Equal(0, bank.CallCount);
        Assert.Equal(1, fund.PrincipalFreezeCallCount);
        Assert.Equal(1, fund.TenantContributionCallCount);

        await using var db = CreateDbContext();
        var startedApplication = await db.CreditApplications.AsNoTracking()
            .SingleAsync(x => x.Id == started.ApplicationId);
        var freshApplication = await db.CreditApplications.AsNoTracking()
            .SingleAsync(x => x.Id == fresh.ApplicationId);

        Assert.Equal(CreditApplicationStatus.ApprovedFunded, startedApplication.Status);
        Assert.Equal(CreditApplicationStatus.DecisionReady, freshApplication.Status);
        Assert.False(await db.BankApprovals.AnyAsync(x => x.CreditApplicationId == fresh.ApplicationId));
        Assert.False(await db.FundingAllocations.AnyAsync(x => x.CreditApplicationId == fresh.ApplicationId));
    }

    private async Task<Fixture> SeedTrustedFundingAsync(
        DateTimeOffset now,
        CreditApplicationStatus applicationStatus,
        bool includeApprovedAllocation,
        bool includeStartedFreeze,
        bool includeStartedApproval)
    {
        var tenantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var contractId = Guid.NewGuid();
        var planId = Guid.NewGuid();
        var approvalId = Guid.NewGuid();
        var allocationId = Guid.NewGuid();
        const string planVersion = "worker-bank-funding-v1";
        const string bankId = "worker-bank-funding-bank";

        await using var db = CreateDbContext();

        db.Users.AddRange(
            new UserRow
            {
                Id = tenantId,
                OidcSubject = $"worker-bank-tenant-{tenantId:D}",
                CreatedAtUtc = now.AddMonths(-1),
            },
            new UserRow
            {
                Id = ownerId,
                OidcSubject = $"worker-bank-owner-{ownerId:D}",
                CreatedAtUtc = now.AddMonths(-1),
            });

        db.BankLoanPlanVersions.Add(new BankLoanPlanVersionRow
        {
            Id = Guid.NewGuid(),
            PlanId = planId,
            Version = planVersion,
            BankId = bankId,
            Title = "Worker bank funding plan",
            InterestTerms = "trusted worker fixture",
            Scope = BankLoanPlanScope.Public,
            Status = BankLoanPlanStatus.Published,
            TermMonths = BankLoanPlanVersion.RequiredTermMonths,
            CreatedAtUtc = now.AddMonths(-1),
        });

        db.CreditApplications.Add(new CreditApplicationRow
        {
            Id = applicationId,
            ApplicantUserId = tenantId,
            Status = applicationStatus,
            BankLoanPlanId = planId,
            BankLoanPlanVersion = planVersion,
            CreatedAtUtc = now.AddDays(-7),
            UpdatedAtUtc = now.AddMinutes(-10),
        });

        db.LeaseContracts.Add(new LeaseContractRow
        {
            Id = contractId,
            TenantUserId = tenantId,
            OwnerUserId = ownerId,
            PropertyId = Guid.NewGuid(),
            CreditApplicationId = applicationId,
            Status = LeaseContractStatus.Draft,
            BankLoanPlanId = planId,
            BankLoanPlanVersion = planVersion,
            CreatedAtUtc = now.AddDays(-7),
            UpdatedAtUtc = now.AddMinutes(-10),
        });

        db.CreditEligibilityAssessments.Add(new CreditEligibilityAssessmentRow
        {
            Id = Guid.NewGuid(),
            CreditApplicationId = applicationId,
            Provider = "worker-credit-grade",
            Status = nameof(ExternalCreditResultStatus.Valid),
            ExternalSubGrade = "A1",
            ExternalReference = $"worker-credit:{applicationId:D}",
            FullDepositEquivalentRial = 1_000_000_000m,
            LoanRatio = 0.55m,
            MaximumEligibleLoanRial = 550_000_000m,
            IdempotencyKey = $"credit-grade:{applicationId:D}:v1",
            AttemptCount = 1,
            CreatedAtUtc = now.AddMinutes(-30),
            UpdatedAtUtc = now.AddMinutes(-30),
        });

        db.LeaseContractTerms.Add(new LeaseContractTermsRow
        {
            ContractId = contractId,
            Calendar = "Persian",
            PersianStartYear = 1405,
            PersianStartMonth = 7,
            PersianStartDay = 1,
            TermMonths = 12,
            CashDepositRial = 1_000_000_000m,
            MonthlyRentRial = 0m,
            FullDepositEquivalentRial = 1_000_000_000m,
            OwnerBeneficiaryId = $"owner:{ownerId:D}",
            BankBeneficiaryId = bankId,
            SourceReference = $"worker-bank-terms:{contractId:D}",
            CapturedAtUtc = now.AddMinutes(-20),
        });

        for (var month = 1; month <= 12; month++)
        {
            db.LeaseContractScheduleMonths.Add(new LeaseContractScheduleMonthRow
            {
                ContractId = contractId,
                ContractMonthNumber = month,
                DueAtUtc = now.AddMonths(month),
                OwnerPaymentRial = 90_000_000m,
                BankInterestRial = 10_000_000m,
            });
        }

        if (includeStartedApproval)
        {
            db.BankApprovals.Add(new BankApprovalRow
            {
                Id = approvalId,
                CreditApplicationId = applicationId,
                Provider = "worker-bank-provider",
                Status = includeApprovedAllocation
                    ? nameof(BankApprovalDecisionStatus.Approved)
                    : nameof(BankApprovalDecisionStatus.Indeterminate),
                MaximumEligibleLoanRial = 550_000_000m,
                ApprovedLoanRial = includeApprovedAllocation ? 500_000_000m : null,
                ExternalReference = includeApprovedAllocation ? "worker-bank-approved" : null,
                IdempotencyKey = $"bank-approval:{applicationId:D}:v1",
                AttemptCount = includeApprovedAllocation ? 1 : 0,
                CreatedAtUtc = now.AddMinutes(-15),
                UpdatedAtUtc = now.AddMinutes(-15),
            });
        }

        if (includeApprovedAllocation)
        {
            db.FundingAllocations.Add(new FundingAllocationRow
            {
                Id = allocationId,
                CreditApplicationId = applicationId,
                ContractId = contractId,
                BankLoanPlanId = planId,
                BankLoanPlanVersion = planVersion,
                BankId = bankId,
                FullDepositEquivalentRial = 1_000_000_000m,
                MaximumEligibleLoanRial = 550_000_000m,
                BankApprovedLoanRial = 500_000_000m,
                TenantContributionRial = 500_000_000m,
                CreatedAtUtc = now.AddMinutes(-14),
                UpdatedAtUtc = now.AddMinutes(-14),
            });

            if (includeStartedFreeze)
            {
                db.FundPrincipalFreezes.Add(new FundPrincipalFreezeRow
                {
                    Id = Guid.NewGuid(),
                    FundingAllocationId = allocationId,
                    Provider = "worker-fund-provider",
                    Status = nameof(FundPrincipalFreezeStatus.Indeterminate),
                    IdempotencyKey = $"fund-principal-freeze:{allocationId:D}:v1",
                    AttemptCount = 1,
                    ReasonCode = "provider_pending",
                    CreatedAtUtc = now.AddMinutes(-13),
                    UpdatedAtUtc = now.AddMinutes(-13),
                });
            }
        }

        await db.SaveChangesAsync();
        return new Fixture(applicationId, contractId);
    }

    private ServiceProvider BuildWorkerServiceProvider(
        IExternalBankApprovalAdapter bankAdapter,
        IExternalFundAdapter fundAdapter,
        DateTimeOffset workerAt)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<CharkhooneDbContext>(options =>
            options.UseNpgsql(_isolatedConnectionString ?? _factory.ConnectionString));
        services.AddSingleton<TimeProvider>(new FixedTimeProvider(workerAt));
        services.AddSingleton(bankAdapter);
        services.AddSingleton(fundAdapter);
        services.AddScoped<IBankFundingService, EfBankFundingService>();
        services.AddScoped<ITenantContributionFundingService, EfTenantContributionFundingService>();
        services.AddScoped<ILeaseFundingLifecycleService, EfLeaseFundingLifecycleService>();
        services.AddScoped<IMonthlyScheduleProvisioningService, EfMonthlyScheduleProvisioningService>();
        services.AddScoped<IPaymentReconciliationService, NoOpPaymentReconciliationService>();
        services.AddScoped<IMonthlyDueLifecycleService, NoOpMonthlyDueLifecycleService>();
        services.AddScoped<ITenantContributionCoverageService, NoOpCoverageService>();
        services.AddScoped<ICancellationSettlementService, NoOpCancellationSettlementService>();
        services.AddScoped<ICancellationBankPrincipalSettlementService, NoOpCancellationBankPrincipalSettlementService>();
        services.AddScoped<INormalMaturityService, NoOpNormalMaturityService>();
        services.AddScoped<INormalSettlementService, NoOpNormalSettlementService>();
        return services.BuildServiceProvider();
    }

    private CharkhooneWorker.FinancialReconciliationWorker CreateWorker(ServiceProvider provider) =>
        new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            new CharkhooneWorker.FinancialReconciliationWorkerOptions
            {
                Enabled = true,
                BatchSize = 32,
            },
            provider.GetRequiredService<TimeProvider>(),
            provider.GetRequiredService<ILogger<CharkhooneWorker.FinancialReconciliationWorker>>());

    private CharkhooneDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql(_isolatedConnectionString ?? _factory.ConnectionString)
            .Options;
        return new CharkhooneDbContext(options);
    }

    private sealed record Fixture(Guid ApplicationId, Guid ContractId);

    private sealed class FixedTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }

    private sealed class RecordingBankAdapter(decimal approvedLoanRial) : IExternalBankApprovalAdapter
    {
        public string Provider => "worker-bank-provider";
        public int CallCount { get; private set; }

        public Task<BankApprovalResponse> CheckAsync(
            BankApprovalRequest request,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            Assert.Equal(550_000_000m, request.MaximumEligibleLoanRial);
            return Task.FromResult(new BankApprovalResponse(
                BankApprovalDecisionStatus.Approved,
                Provider,
                approvedLoanRial,
                "worker-bank-approved"));
        }
    }

    private sealed class NeverCalledBankAdapter : IExternalBankApprovalAdapter
    {
        public string Provider => "worker-bank-never-called";
        public int CallCount { get; private set; }

        public Task<BankApprovalResponse> CheckAsync(
            BankApprovalRequest request,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            throw new InvalidOperationException("Worker must not start a fresh bank approval.");
        }
    }

    private sealed class RecordingFundAdapter(decimal expectedAmountRial) : IExternalFundAdapter
    {
        public string Provider => "worker-fund-provider";
        public int PrincipalFreezeCallCount { get; private set; }
        public int TenantContributionCallCount { get; private set; }

        public Task<FundPrincipalFreezeResponse> FreezePrincipalAsync(
            FundPrincipalFreezeRequest request,
            CancellationToken cancellationToken = default)
        {
            PrincipalFreezeCallCount++;
            Assert.Equal(expectedAmountRial, request.AmountRial);
            return Task.FromResult(new FundPrincipalFreezeResponse(
                FundPrincipalFreezeStatus.Confirmed,
                Provider,
                $"worker-principal-fund:{request.FundingAllocationId:D}",
                $"worker-principal-external:{request.RequestId:D}"));
        }

        public Task<FundTenantContributionResponse> CheckTenantContributionAsync(
            FundTenantContributionRequest request,
            CancellationToken cancellationToken = default)
        {
            TenantContributionCallCount++;
            Assert.Equal(expectedAmountRial, request.ExpectedAmountRial);
            return Task.FromResult(new FundTenantContributionResponse(
                FundTenantContributionStatus.Confirmed,
                Provider,
                request.ExpectedAmountRial,
                $"worker-tenant-fund:{request.FundingAllocationId:D}",
                $"worker-tenant-external:{request.RequestId:D}"));
        }
    }

    private sealed class NoOpPaymentReconciliationService : IPaymentReconciliationService
    {
        public Task<ReconcilePaymentResult> ReconcileAsync(
            Guid paymentInstructionId,
            Guid requestingUserId,
            DateTimeOffset occurredAtUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new ReconcilePaymentResult(ReconcilePaymentOutcome.InvalidState, null));
    }

    private sealed class NoOpMonthlyDueLifecycleService : IMonthlyDueLifecycleService
    {
        public Task<ProcessMonthlyDueResult> ProcessAsync(
            Guid monthlyObligationId,
            DateTimeOffset occurredAtUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new ProcessMonthlyDueResult(
                ProcessMonthlyDueOutcome.InvalidState,
                monthlyObligationId,
                0,
                null));
    }

    private sealed class NoOpCoverageService : ITenantContributionCoverageService
    {
        public Task<CoverMonthlyObligationResult> CoverAsync(
            Guid monthlyObligationId,
            DateTimeOffset occurredAtUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new CoverMonthlyObligationResult(
                CoverMonthlyObligationOutcome.InvalidState,
                monthlyObligationId,
                null,
                Array.Empty<CoveragePaymentView>()));

        public Task<Charkhoone.Application.Payments.TenantContributionBalanceView?> GetBalanceAsync(
            Guid contractId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<Charkhoone.Application.Payments.TenantContributionBalanceView?>(null);

        public Task<PostConfirmedReplenishmentResult> PostConfirmedReplenishmentAsync(
            Guid externalTransactionId,
            DateTimeOffset occurredAtUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new PostConfirmedReplenishmentResult(
                PostConfirmedReplenishmentOutcome.InvalidState,
                null,
                null));
    }

    private sealed class NoOpCancellationSettlementService : ICancellationSettlementService
    {
        public Task<SettleCancellationResult> SettleAsync(
            Guid contractId,
            DateTimeOffset occurredAtUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new SettleCancellationResult(SettleCancellationOutcome.InvalidState, null));

        public Task<CancellationSettlementView?> GetAsync(
            Guid contractId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<CancellationSettlementView?>(null);
    }

    private sealed class NoOpCancellationBankPrincipalSettlementService
        : ICancellationBankPrincipalSettlementService
    {
        public Task<SettleCancellationBankPrincipalResult> SettleAsync(
            Guid contractId,
            DateTimeOffset occurredAtUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new SettleCancellationBankPrincipalResult(
                SettleCancellationBankPrincipalOutcome.InvalidState,
                null));

        public Task<CancellationBankPrincipalReturnView?> GetAsync(
            Guid contractId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<CancellationBankPrincipalReturnView?>(null);
    }

    private sealed class NoOpNormalMaturityService : INormalMaturityService
    {
        public Task<PrepareNormalMaturityResult> PrepareAsync(
            Guid contractId,
            DateTimeOffset occurredAtUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new PrepareNormalMaturityResult(
                PrepareNormalMaturityOutcome.InvalidState,
                contractId));
    }

    private sealed class NoOpNormalSettlementService : INormalSettlementService
    {
        public Task<SettleNormalContractResult> SettleAsync(
            Guid contractId,
            DateTimeOffset occurredAtUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new SettleNormalContractResult(SettleNormalContractOutcome.InvalidState, null));

        public Task<NormalSettlementView?> GetAsync(
            Guid contractId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<NormalSettlementView?>(null);
    }
}
