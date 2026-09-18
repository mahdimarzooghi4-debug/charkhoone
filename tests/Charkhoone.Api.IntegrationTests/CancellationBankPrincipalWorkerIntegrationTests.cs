extern alias worker;

using Charkhoone.Application.Payments;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using CharkhooneWorker = worker::Charkhoone.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Npgsql;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class CancellationBankPrincipalWorkerIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;
    private string? _isolatedConnectionString;
    private string? _isolatedDatabaseName;

    public async Task InitializeAsync()
    {
        var databaseName = $"charkhoone_worker_{Guid.NewGuid():N}";
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
    public async Task Worker_ReconcilesCompletedCancellationBankPrincipal_AndDoesNotRequeueSucceededReturn()
    {
        var cancelledAt = DateTimeOffset.Parse("2026-09-18T09:00:00+00:00");
        var workerAt = cancelledAt.AddHours(4);
        var contractId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var cancellationSettlementId = Guid.NewGuid();

        const decimal frozenBankPrincipalRial = 600_000_000m;

        await using (var db = CreateDbContext())
        {
            db.Users.AddRange(
                new UserRow
                {
                    Id = tenantId,
                    OidcSubject = $"worker-bank-tenant-{tenantId:D}",
                    CreatedAtUtc = cancelledAt.AddMonths(-4),
                },
                new UserRow
                {
                    Id = ownerId,
                    OidcSubject = $"worker-bank-owner-{ownerId:D}",
                    CreatedAtUtc = cancelledAt.AddMonths(-4),
                });

            db.CreditApplications.Add(new CreditApplicationRow
            {
                Id = applicationId,
                ApplicantUserId = tenantId,
                Status = CreditApplicationStatus.ApprovedFunded,
                CreatedAtUtc = cancelledAt.AddMonths(-4),
                UpdatedAtUtc = cancelledAt.AddMonths(-4),
            });

            db.LeaseContracts.Add(new LeaseContractRow
            {
                Id = contractId,
                TenantUserId = tenantId,
                OwnerUserId = ownerId,
                PropertyId = Guid.NewGuid(),
                CreditApplicationId = applicationId,
                Status = LeaseContractStatus.Cancelled,
                CreatedAtUtc = cancelledAt.AddMonths(-4),
                UpdatedAtUtc = cancelledAt,
            });

            db.CancellationSettlements.Add(new CancellationSettlementRow
            {
                Id = cancellationSettlementId,
                ContractId = contractId,
                OwnerUserId = ownerId,
                AmountRial = 300_000_000m,
                Status = CancellationSettlementStatus.Completed,
                RemainingTenantContributionRial = 0m,
                CreatedAtUtc = cancelledAt,
                UpdatedAtUtc = cancelledAt,
                CompletedAtUtc = cancelledAt,
            });

            db.FrozenPrincipals.Add(new FrozenPrincipalRow
            {
                ContractId = contractId,
                BankId = "worker-bank-integration-bank",
                AmountRial = frozenBankPrincipalRial,
                FundReference = $"worker-bank-frozen-{contractId:D}",
                FrozenAtUtc = cancelledAt.AddMonths(-4),
            });

            await db.SaveChangesAsync();
        }

        var adapter = new ConfirmingBankPrincipalReturnAdapter();
        await using var provider = BuildWorkerServiceProvider(adapter, workerAt);
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

        Assert.Equal(0, first.PaymentCandidates);
        Assert.Equal(0, first.CoverageCandidates);
        Assert.Equal(0, first.CancellationCandidates);
        Assert.Equal(1, first.CancellationBankPrincipalCandidates);
        Assert.Equal(0, first.NormalSettlementCandidates);
        Assert.Equal(1, adapter.CallCount);
        Assert.Equal(contractId, adapter.LastRequest?.ContractId);
        Assert.Equal(frozenBankPrincipalRial, adapter.LastRequest?.ExpectedAmountRial);

        await using (var db = CreateDbContext())
        {
            var external = await db.ExternalTransactions.AsNoTracking()
                .SingleAsync(x => x.IdempotencyKey == $"cancellation-bank-principal:{contractId:D}:v1");
            Assert.Equal(ExternalTransactionStatus.Succeeded, external.Status);

            Assert.Equal(
                1,
                await db.JournalEntries.CountAsync(x =>
                    x.IdempotencyKey == $"journal:cancellation-bank-principal:{contractId:D}:v1"));
            Assert.Equal(
                1,
                await db.OutboxMessages.CountAsync(x =>
                    x.Type == "lease-contract.cancellation-bank-principal-returned.v1"));
        }

        var second = await worker.ReconcileOnceAsync();

        Assert.Equal(0, second.CancellationBankPrincipalCandidates);
        Assert.Equal(1, adapter.CallCount);
    }

    private ServiceProvider BuildWorkerServiceProvider(
        IExternalBankPrincipalReturnAdapter adapter,
        DateTimeOffset workerAt)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<CharkhooneDbContext>(options =>
            options.UseNpgsql(_isolatedConnectionString ?? _factory.ConnectionString));
        services.AddSingleton<TimeProvider>(new FixedTimeProvider(workerAt));
        services.AddSingleton(adapter);
        services.AddScoped<ICancellationBankPrincipalSettlementService, EfCancellationBankPrincipalSettlementService>();
        services.AddScoped<IPaymentReconciliationService, NoOpPaymentReconciliationService>();
        services.AddScoped<ITenantContributionCoverageService, NoOpCoverageService>();
        services.AddScoped<ICancellationSettlementService, NoOpCancellationSettlementService>();
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

    private sealed class ConfirmingBankPrincipalReturnAdapter : IExternalBankPrincipalReturnAdapter
    {
        public string Provider => "worker-bank-integration-provider";

        public int CallCount { get; private set; }

        public ExternalBankPrincipalReturnRequest? LastRequest { get; private set; }

        public Task<ExternalBankPrincipalReturnResponse> EnsureOrQueryAsync(
            ExternalBankPrincipalReturnRequest request,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            LastRequest = request;
            return Task.FromResult(new ExternalBankPrincipalReturnResponse(
                ExternalNormalSettlementTransferStatus.Confirmed,
                Provider,
                request.ExpectedAmountRial,
                $"worker-bank-return-{request.SettlementId:D}"));
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
