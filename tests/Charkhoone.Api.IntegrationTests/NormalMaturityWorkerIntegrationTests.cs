extern alias worker;

using Charkhoone.Application.Contracts;
using Charkhoone.Application.Payments;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Contracts;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using CharkhooneWorker = worker::Charkhoone.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Npgsql;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class NormalMaturityWorkerIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;
    private string? _isolatedConnectionString;
    private string? _isolatedDatabaseName;

    public async Task InitializeAsync()
    {
        var databaseName = $"charkhoone_maturity_worker_{Guid.NewGuid():N}";
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
    public async Task Worker_PreparesMaturity_ThenOffersNormalSettlementInSamePass()
    {
        var workerAt = DateTimeOffset.Parse("2026-09-18T16:00:00+00:00");
        var contractId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();

        await using (var db = CreateDbContext())
        {
            db.Users.AddRange(
                new UserRow
                {
                    Id = tenantId,
                    OidcSubject = $"maturity-worker-tenant-{tenantId:D}",
                    CreatedAtUtc = workerAt.AddMonths(-13),
                },
                new UserRow
                {
                    Id = ownerId,
                    OidcSubject = $"maturity-worker-owner-{ownerId:D}",
                    CreatedAtUtc = workerAt.AddMonths(-13),
                });

            db.LeaseContracts.Add(new LeaseContractRow
            {
                Id = contractId,
                TenantUserId = tenantId,
                OwnerUserId = ownerId,
                PropertyId = Guid.NewGuid(),
                Status = LeaseContractStatus.Active,
                CreatedAtUtc = workerAt.AddMonths(-13),
                UpdatedAtUtc = workerAt.AddMonths(-1),
            });

            for (var month = 1; month <= 12; month++)
            {
                var dueAt = workerAt.AddMonths(month - 13);
                db.MonthlyObligations.Add(new MonthlyObligationRow
                {
                    Id = Guid.NewGuid(),
                    ContractId = contractId,
                    ContractMonthNumber = month,
                    DueAtUtc = dueAt,
                    Status = MonthlyObligationStatus.Paid,
                    CreatedAtUtc = dueAt.AddDays(-2),
                    UpdatedAtUtc = dueAt.AddHours(1),
                    ClosedAtUtc = dueAt.AddHours(1),
                });
            }

            await db.SaveChangesAsync();
        }

        var normalSettlement = new RecordingNormalSettlementService();
        await using var provider = BuildWorkerServiceProvider(normalSettlement, workerAt);

        var worker = new CharkhooneWorker.FinancialReconciliationWorker(
            provider.GetRequiredService<IServiceScopeFactory>(),
            new CharkhooneWorker.FinancialReconciliationWorkerOptions
            {
                Enabled = true,
                BatchSize = 32,
            },
            provider.GetRequiredService<TimeProvider>(),
            provider.GetRequiredService<ILogger<CharkhooneWorker.FinancialReconciliationWorker>>());

        var result = await worker.ReconcileOnceAsync();

        Assert.Equal(0, result.LeaseFundingCandidates);
        Assert.Equal(0, result.PaymentCandidates);
        Assert.Equal(0, result.CoverageCandidates);
        Assert.Equal(0, result.CancellationCandidates);
        Assert.Equal(0, result.CancellationBankPrincipalCandidates);
        Assert.Equal(1, result.NormalMaturityCandidates);
        Assert.Equal(1, result.NormalSettlementCandidates);
        Assert.Equal(1, normalSettlement.CallCount);
        Assert.Equal(contractId, normalSettlement.LastContractId);

        await using var finalDb = CreateDbContext();
        var contract = await finalDb.LeaseContracts.AsNoTracking()
            .SingleAsync(x => x.Id == contractId);
        Assert.Equal(LeaseContractStatus.SettlementPending, contract.Status);

        Assert.Equal(
            1,
            await finalDb.AuditEvents.CountAsync(x =>
                x.AggregateId == contractId
                && x.Action == "contract_entered_normal_settlement_pending"));
        Assert.Equal(
            1,
            await finalDb.OutboxMessages.CountAsync(x =>
                x.Type == "lease-contract.normal-settlement-pending.v1"));
    }

    [Fact]
    public async Task Worker_ActivatesFundingCompleteDraft_AndDoesNotRequeueActiveContract()
    {
        var workerAt = DateTimeOffset.Parse("2026-09-18T16:30:00+00:00");
        var contractId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var allocationId = Guid.NewGuid();
        var planId = Guid.NewGuid();
        var freezeId = Guid.NewGuid();
        var fundReference = $"worker-activation-fund-{contractId:D}";

        const decimal frozenPrincipalRial = 700_000_000m;
        const string bankId = "worker-activation-bank";
        const string planVersion = "worker-activation-v1";

        await using (var db = CreateDbContext())
        {
            db.Users.AddRange(
                new UserRow
                {
                    Id = tenantId,
                    OidcSubject = $"worker-activation-tenant-{tenantId:D}",
                    CreatedAtUtc = workerAt.AddMonths(-1),
                },
                new UserRow
                {
                    Id = ownerId,
                    OidcSubject = $"worker-activation-owner-{ownerId:D}",
                    CreatedAtUtc = workerAt.AddMonths(-1),
                });

            db.CreditApplications.Add(new CreditApplicationRow
            {
                Id = applicationId,
                ApplicantUserId = tenantId,
                Status = CreditApplicationStatus.ApprovedFunded,
                BankLoanPlanId = planId,
                BankLoanPlanVersion = planVersion,
                CreatedAtUtc = workerAt.AddDays(-10),
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
                CreatedAtUtc = workerAt.AddDays(-10),
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
                FullDepositEquivalentRial = frozenPrincipalRial,
                MaximumEligibleLoanRial = frozenPrincipalRial,
                BankApprovedLoanRial = frozenPrincipalRial,
                TenantContributionRial = 0m,
                CreatedAtUtc = workerAt.AddMinutes(-8),
                UpdatedAtUtc = workerAt.AddMinutes(-8),
            });

            db.FundPrincipalFreezes.Add(new FundPrincipalFreezeRow
            {
                Id = freezeId,
                FundingAllocationId = allocationId,
                Provider = "worker-activation-fund",
                Status = "Confirmed",
                IdempotencyKey = $"worker-activation-freeze:{allocationId:D}",
                FundReference = fundReference,
                ExternalReference = $"worker-activation-freeze-external:{freezeId:D}",
                AttemptCount = 1,
                CreatedAtUtc = workerAt.AddMinutes(-7),
                UpdatedAtUtc = workerAt.AddMinutes(-7),
            });

            db.FrozenPrincipals.Add(new FrozenPrincipalRow
            {
                ContractId = contractId,
                BankId = bankId,
                AmountRial = frozenPrincipalRial,
                FundReference = fundReference,
                FrozenAtUtc = workerAt.AddMinutes(-7),
            });

            await db.SaveChangesAsync();
        }

        var normalSettlement = new RecordingNormalSettlementService();
        await using var provider = BuildWorkerServiceProvider(normalSettlement, workerAt);
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

        Assert.Equal(1, first.LeaseFundingCandidates);
        Assert.Equal(0, first.PaymentCandidates);
        Assert.Equal(0, first.CoverageCandidates);
        Assert.Equal(0, first.CancellationCandidates);
        Assert.Equal(0, first.CancellationBankPrincipalCandidates);
        Assert.Equal(0, first.NormalMaturityCandidates);
        Assert.Equal(0, first.NormalSettlementCandidates);
        Assert.Equal(0, normalSettlement.CallCount);

        await using (var db = CreateDbContext())
        {
            var contract = await db.LeaseContracts.AsNoTracking()
                .SingleAsync(x => x.Id == contractId);
            Assert.Equal(LeaseContractStatus.Active, contract.Status);

            Assert.Equal(
                3,
                await db.WorkflowTransitions.CountAsync(x =>
                    x.AggregateType == "LeaseContract"
                    && x.AggregateId == contractId));
            Assert.Equal(
                1,
                await db.AuditEvents.CountAsync(x =>
                    x.AggregateId == contractId
                    && x.Action == "contract_activated"));
        }

        var second = await worker.ReconcileOnceAsync();

        Assert.Equal(0, second.LeaseFundingCandidates);
        Assert.Equal(0, second.NormalMaturityCandidates);
        Assert.Equal(0, normalSettlement.CallCount);
    }

    private ServiceProvider BuildWorkerServiceProvider(
        INormalSettlementService normalSettlement,
        DateTimeOffset workerAt)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<CharkhooneDbContext>(options =>
            options.UseNpgsql(_isolatedConnectionString ?? _factory.ConnectionString));
        services.AddSingleton<TimeProvider>(new FixedTimeProvider(workerAt));
        services.AddScoped<ILeaseFundingLifecycleService, EfLeaseFundingLifecycleService>();
        services.AddScoped<INormalMaturityService, EfNormalMaturityService>();
        services.AddSingleton(normalSettlement);
        services.AddSingleton<INormalSettlementService>(normalSettlement);
        services.AddScoped<IPaymentReconciliationService, NoOpPaymentReconciliationService>();
        services.AddScoped<ITenantContributionCoverageService, NoOpCoverageService>();
        services.AddScoped<ICancellationSettlementService, NoOpCancellationSettlementService>();
        services.AddScoped<ICancellationBankPrincipalSettlementService, NoOpCancellationBankPrincipalSettlementService>();
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

    private sealed class RecordingNormalSettlementService : INormalSettlementService
    {
        public int CallCount { get; private set; }
        public Guid? LastContractId { get; private set; }

        public Task<SettleNormalContractResult> SettleAsync(
            Guid contractId,
            DateTimeOffset occurredAtUtc,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            LastContractId = contractId;
            return Task.FromResult(new SettleNormalContractResult(
                SettleNormalContractOutcome.InvalidState,
                null));
        }

        public Task<NormalSettlementView?> GetAsync(
            Guid contractId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<NormalSettlementView?>(null);
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
}
