extern alias worker;

using Charkhoone.Application.BankFunding;
using Charkhoone.Application.Contracts;
using Charkhoone.Application.Payments;
using Charkhoone.Application.TenantContributionFunding;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Finance;
using Charkhoone.Domain.Payments;
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

public sealed class TenantContributionFundingWorkerIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;
    private string? _isolatedConnectionString;
    private string? _isolatedDatabaseName;

    public async Task InitializeAsync()
    {
        var databaseName = $"charkhoone_tenant_funding_worker_{Guid.NewGuid():N}";
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
    public async Task Worker_ConfirmsPositiveTenantContribution_AndActivatesLeaseInSamePass()
    {
        var workerAt = DateTimeOffset.Parse("2026-09-18T22:00:00+00:00");
        var contractId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var allocationId = Guid.NewGuid();
        var planId = Guid.NewGuid();
        var freezeId = Guid.NewGuid();

        const decimal fullDepositEquivalentRial = 1_000_000_000m;
        const decimal bankApprovedLoanRial = 700_000_000m;
        const decimal tenantContributionRial = 300_000_000m;
        const string bankId = "worker-tenant-funding-bank";
        const string planVersion = "worker-tenant-funding-v1";
        var principalFundReference = $"worker-principal:{contractId:D}";

        await using (var db = CreateDbContext())
        {
            db.Users.AddRange(
                new UserRow
                {
                    Id = tenantId,
                    OidcSubject = $"worker-tenant-funding-tenant-{tenantId:D}",
                    CreatedAtUtc = workerAt.AddMonths(-1),
                },
                new UserRow
                {
                    Id = ownerId,
                    OidcSubject = $"worker-tenant-funding-owner-{ownerId:D}",
                    CreatedAtUtc = workerAt.AddMonths(-1),
                });

            db.BankLoanPlanVersions.Add(new BankLoanPlanVersionRow
            {
                Id = Guid.NewGuid(),
                PlanId = planId,
                Version = planVersion,
                BankId = bankId,
                Title = "Worker tenant funding plan",
                InterestTerms = "trusted worker fixture",
                Scope = BankLoanPlanScope.Public,
                Status = BankLoanPlanStatus.Published,
                TermMonths = BankLoanPlanVersion.RequiredTermMonths,
                CreatedAtUtc = workerAt.AddMonths(-1),
            });

            db.CreditApplications.Add(new CreditApplicationRow
            {
                Id = applicationId,
                ApplicantUserId = tenantId,
                Status = CreditApplicationStatus.ApprovedFunded,
                BankLoanPlanId = planId,
                BankLoanPlanVersion = planVersion,
                CreatedAtUtc = workerAt.AddDays(-7),
                UpdatedAtUtc = workerAt.AddMinutes(-10),
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
                CreatedAtUtc = workerAt.AddDays(-7),
                UpdatedAtUtc = workerAt.AddMinutes(-10),
            });

            db.FundingAllocations.Add(new FundingAllocationRow
            {
                Id = allocationId,
                CreditApplicationId = applicationId,
                ContractId = contractId,
                BankLoanPlanId = planId,
                BankLoanPlanVersion = planVersion,
                BankId = bankId,
                FullDepositEquivalentRial = fullDepositEquivalentRial,
                MaximumEligibleLoanRial = 800_000_000m,
                BankApprovedLoanRial = bankApprovedLoanRial,
                TenantContributionRial = tenantContributionRial,
                CreatedAtUtc = workerAt.AddMinutes(-9),
                UpdatedAtUtc = workerAt.AddMinutes(-9),
            });

            db.FundPrincipalFreezes.Add(new FundPrincipalFreezeRow
            {
                Id = freezeId,
                FundingAllocationId = allocationId,
                Provider = "worker-principal-fund",
                Status = FundPrincipalFreezeStatus.Confirmed.ToString(),
                IdempotencyKey = $"fund-principal-freeze:{allocationId:D}:v1",
                FundReference = principalFundReference,
                ExternalReference = $"worker-principal-freeze:{freezeId:D}",
                AttemptCount = 1,
                CreatedAtUtc = workerAt.AddMinutes(-8),
                UpdatedAtUtc = workerAt.AddMinutes(-8),
            });

            db.FrozenPrincipals.Add(new FrozenPrincipalRow
            {
                ContractId = contractId,
                BankId = bankId,
                AmountRial = bankApprovedLoanRial,
                FundReference = principalFundReference,
                FrozenAtUtc = workerAt.AddMinutes(-8),
            });

            db.LeaseContractTerms.Add(new LeaseContractTermsRow
            {
                ContractId = contractId,
                Calendar = "Persian",
                PersianStartYear = 1405,
                PersianStartMonth = 7,
                PersianStartDay = 1,
                TermMonths = 12,
                CashDepositRial = fullDepositEquivalentRial,
                MonthlyRentRial = 0m,
                FullDepositEquivalentRial = fullDepositEquivalentRial,
                OwnerBeneficiaryId = $"owner:{ownerId:D}",
                BankBeneficiaryId = bankId,
                SourceReference = $"worker-tenant-funding-terms:{contractId:D}",
                CapturedAtUtc = workerAt.AddMinutes(-7),
            });

            for (var month = 1; month <= 12; month++)
            {
                db.LeaseContractScheduleMonths.Add(new LeaseContractScheduleMonthRow
                {
                    ContractId = contractId,
                    ContractMonthNumber = month,
                    DueAtUtc = workerAt.AddMonths(month),
                    OwnerPaymentRial = 90_000_000m,
                    BankInterestRial = 10_000_000m,
                });
            }

            await db.SaveChangesAsync();
        }

        var fundAdapter = new ConfirmingTenantContributionFundAdapter(
            tenantContributionRial,
            $"worker-tenant-contribution:{allocationId:D}");

        await using var provider = BuildWorkerServiceProvider(fundAdapter, workerAt);
        var worker = new CharkhooneWorker.FinancialReconciliationWorker(
            provider.GetRequiredService<IServiceScopeFactory>(),
            new CharkhooneWorker.FinancialReconciliationWorkerOptions
            {
                Enabled = true,
                BatchSize = 32,
            },
            provider.GetRequiredService<TimeProvider>(),
            provider.GetRequiredService<ILogger<CharkhooneWorker.FinancialReconciliationWorker>>());

        var first = await worker.ReconcileOnceAsync();

        Assert.Equal(1, first.TenantContributionFundingCandidates);
        Assert.Equal(1, first.LeaseFundingCandidates);
        Assert.Equal(1, first.ScheduleProvisioningCandidates);
        Assert.Equal(0, first.PaymentCandidates);
        Assert.Equal(0, first.DueLifecycleCandidates);
        Assert.Equal(0, first.CoverageCandidates);
        Assert.Equal(1, fundAdapter.TenantContributionCallCount);
        Assert.Equal(0, fundAdapter.PrincipalFreezeCallCount);

        await using (var db = CreateDbContext())
        {
            var contract = await db.LeaseContracts.AsNoTracking()
                .SingleAsync(x => x.Id == contractId);
            var contribution = await db.TenantContributions.AsNoTracking()
                .SingleAsync(x => x.ContractId == contractId);
            var funding = await db.TenantContributionFundings.AsNoTracking()
                .SingleAsync(x => x.FundingAllocationId == allocationId);
            var external = await db.ExternalTransactions.AsNoTracking()
                .SingleAsync(x => x.Id == funding.ExternalTransactionId);
            var journal = await db.JournalEntries.AsNoTracking()
                .SingleAsync(x =>
                    x.IdempotencyKey == $"journal:tenant-contribution-funding:{allocationId:D}:v1");
            var lines = await db.JournalLines.AsNoTracking()
                .Where(x => x.JournalEntryId == journal.Id)
                .ToListAsync();

            Assert.Equal(LeaseContractStatus.Active, contract.Status);
            Assert.Equal(tenantContributionRial, contribution.InitialAmountRial);
            Assert.Equal(funding.FundReference, contribution.FundReference);
            Assert.Equal(1, funding.AttemptCount);

            Assert.Equal(ExternalTransactionStatus.Succeeded, external.Status);
            Assert.Equal(tenantContributionRial, external.AmountRial);
            Assert.Equal("IRR", external.Currency);
            Assert.Equal("worker-tenant-contribution-fund", external.Provider);
            Assert.Equal($"worker-tenant-external:{funding.Id:D}", external.ExternalReference);

            Assert.Equal(2, lines.Count);
            Assert.Equal(tenantContributionRial, lines.Sum(x => x.DebitRial));
            Assert.Equal(tenantContributionRial, lines.Sum(x => x.CreditRial));

            Assert.Equal(
                3,
                await db.WorkflowTransitions.CountAsync(x =>
                    x.AggregateType == "LeaseContract"
                    && x.AggregateId == contractId));
            Assert.Equal(
                12,
                await db.MonthlyObligations.CountAsync(x => x.ContractId == contractId));
            Assert.Equal(
                1,
                await db.AuditEvents.CountAsync(x =>
                    x.AggregateType == "LeaseContract"
                    && x.AggregateId == contractId
                    && x.Action == "monthly_schedule_provisioned"));
        }

        var second = await worker.ReconcileOnceAsync();

        Assert.Equal(0, second.TenantContributionFundingCandidates);
        Assert.Equal(0, second.LeaseFundingCandidates);
        Assert.Equal(0, second.ScheduleProvisioningCandidates);
        Assert.Equal(1, fundAdapter.TenantContributionCallCount);
        Assert.Equal(0, fundAdapter.PrincipalFreezeCallCount);
    }

    private ServiceProvider BuildWorkerServiceProvider(
        IExternalFundAdapter fundAdapter,
        DateTimeOffset workerAt)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<CharkhooneDbContext>(options =>
            options.UseNpgsql(_isolatedConnectionString ?? _factory.ConnectionString));
        services.AddSingleton<TimeProvider>(new FixedTimeProvider(workerAt));
        services.AddSingleton(fundAdapter);
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

    private CharkhooneDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql(_isolatedConnectionString ?? _factory.ConnectionString)
            .Options;
        return new CharkhooneDbContext(options);
    }

    private sealed class FixedTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }

    private sealed class ConfirmingTenantContributionFundAdapter(
        decimal expectedAmountRial,
        string fundReference) : IExternalFundAdapter
    {
        public string Provider => "worker-tenant-contribution-fund";
        public int PrincipalFreezeCallCount { get; private set; }
        public int TenantContributionCallCount { get; private set; }

        public Task<FundPrincipalFreezeResponse> FreezePrincipalAsync(
            FundPrincipalFreezeRequest request,
            CancellationToken cancellationToken = default)
        {
            PrincipalFreezeCallCount++;
            throw new InvalidOperationException(
                "Tenant-contribution worker orchestration must not initiate or query principal freeze.");
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
                fundReference,
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

        public Task<TenantContributionBalanceView?> GetBalanceAsync(
            Guid contractId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<TenantContributionBalanceView?>(null);

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
