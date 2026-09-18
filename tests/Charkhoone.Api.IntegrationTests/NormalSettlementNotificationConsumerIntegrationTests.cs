extern alias worker;

using System.Text.Json;
using Charkhoone.Application.Payments;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using CharkhooneWorker = worker::Charkhoone.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class NormalSettlementNotificationConsumerIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;

    public Task InitializeAsync() => _factory.MigrateAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task DeliveredNotifications_AreValidatedAuditedAndIdempotent_ForAllStakeholders()
    {
        var now = DateTimeOffset.Parse("2026-09-18T17:00:00+00:00");
        var fixture = await SeedSettledContractAsync(now);
        var adapter = new RecordingAdapter(NormalSettlementNotificationDeliveryStatus.Delivered);
        var options = CreateOptions(maxAttempts: 3);

        await using var provider = BuildProvider(adapter, options, now);
        var consumer = CreateConsumer(provider, options, now);

        var deliveries = new[]
        {
            new
            {
                MessageId = Guid.NewGuid(),
                EventType = CharkhooneWorker.NormalSettlementNotificationConsumer.OwnerEventType,
                Payload = JsonSerializer.Serialize(new
                {
                    contractId = fixture.ContractId,
                    settlementId = fixture.SettlementId,
                    ownerUserId = fixture.OwnerId,
                    tenantUserId = fixture.TenantId,
                    occurredAtUtc = now,
                }),
            },
            new
            {
                MessageId = Guid.NewGuid(),
                EventType = CharkhooneWorker.NormalSettlementNotificationConsumer.TenantEventType,
                Payload = JsonSerializer.Serialize(new
                {
                    contractId = fixture.ContractId,
                    settlementId = fixture.SettlementId,
                    tenantUserId = fixture.TenantId,
                    tenantResidualAmountRial = 0m,
                    tenantExternalTransactionId = (Guid?)null,
                    tenantJournalEntryId = (Guid?)null,
                    occurredAtUtc = now,
                }),
            },
            new
            {
                MessageId = Guid.NewGuid(),
                EventType = CharkhooneWorker.NormalSettlementNotificationConsumer.BankEventType,
                Payload = JsonSerializer.Serialize(new
                {
                    contractId = fixture.ContractId,
                    settlementId = fixture.SettlementId,
                    bankId = fixture.BankId,
                    amountRial = fixture.FrozenPrincipalRial,
                    externalTransactionId = fixture.BankExternalTransactionId,
                    journalEntryId = fixture.BankJournalEntryId,
                    occurredAtUtc = now,
                }),
            },
            new
            {
                MessageId = Guid.NewGuid(),
                EventType = CharkhooneWorker.NormalSettlementNotificationConsumer.FundEventType,
                Payload = JsonSerializer.Serialize(new
                {
                    contractId = fixture.ContractId,
                    settlementId = fixture.SettlementId,
                    fundProvider = fixture.FundProvider,
                    fundReference = fixture.FundReference,
                    bankId = fixture.BankId,
                    amountRial = fixture.FrozenPrincipalRial,
                    occurredAtUtc = now,
                }),
            },
        };

        foreach (var delivery in deliveries)
        {
            var outcome = await consumer.HandleAsync(
                delivery.MessageId,
                delivery.EventType,
                delivery.Payload);

            Assert.Equal(
                CharkhooneWorker.NormalSettlementNotificationHandlingOutcome.Acknowledge,
                outcome);
        }

        Assert.Equal(4, adapter.CallCount);

        var replay = await consumer.HandleAsync(
            deliveries[0].MessageId,
            deliveries[0].EventType,
            deliveries[0].Payload);

        Assert.Equal(
            CharkhooneWorker.NormalSettlementNotificationHandlingOutcome.Acknowledge,
            replay);
        Assert.Equal(4, adapter.CallCount);

        await using var db = CreateDbContext();
        var messageIds = deliveries.Select(x => x.MessageId).ToArray();

        Assert.Equal(
            4,
            await db.InboxMessages.CountAsync(x =>
                messageIds.Contains(x.MessageId)
                && x.ProcessedAtUtc != null
                && x.LastError == null));
        Assert.Equal(
            4,
            await db.AuditEvents.CountAsync(x =>
                x.AggregateId == fixture.ContractId
                && x.Action == "normal_settlement_notification_delivered"));

        var reviewPayloads = await db.OutboxMessages.AsNoTracking()
            .Where(x => x.Type == CharkhooneWorker.NormalSettlementNotificationConsumer.ReviewRequiredEventType)
            .Select(x => x.PayloadJson)
            .ToListAsync();

        Assert.DoesNotContain(
            reviewPayloads,
            payload => messageIds.Any(id =>
                payload.Contains(id.ToString("D"), StringComparison.OrdinalIgnoreCase)));
    }

    [Fact]
    public async Task IndeterminateDelivery_RetriesUntilLimit_ThenQueuesReview()
    {
        var now = DateTimeOffset.Parse("2026-09-18T18:00:00+00:00");
        var fixture = await SeedSettledContractAsync(now);
        var adapter = new RecordingAdapter(
            NormalSettlementNotificationDeliveryStatus.Indeterminate,
            reasonCode: "provider_timeout");
        var options = CreateOptions(maxAttempts: 2);

        await using var provider = BuildProvider(adapter, options, now);
        var consumer = CreateConsumer(provider, options, now);
        var messageId = Guid.NewGuid();
        var payload = OwnerPayload(fixture, now);

        var first = await consumer.HandleAsync(
            messageId,
            CharkhooneWorker.NormalSettlementNotificationConsumer.OwnerEventType,
            payload);
        var second = await consumer.HandleAsync(
            messageId,
            CharkhooneWorker.NormalSettlementNotificationConsumer.OwnerEventType,
            payload);
        var replay = await consumer.HandleAsync(
            messageId,
            CharkhooneWorker.NormalSettlementNotificationConsumer.OwnerEventType,
            payload);

        Assert.Equal(
            CharkhooneWorker.NormalSettlementNotificationHandlingOutcome.Retry,
            first);
        Assert.Equal(
            CharkhooneWorker.NormalSettlementNotificationHandlingOutcome.ReviewQueued,
            second);
        Assert.Equal(
            CharkhooneWorker.NormalSettlementNotificationHandlingOutcome.Acknowledge,
            replay);
        Assert.Equal(2, adapter.CallCount);

        await using var db = CreateDbContext();
        var inbox = await db.InboxMessages.AsNoTracking()
            .SingleAsync(x => x.MessageId == messageId);

        Assert.Equal(2, inbox.AttemptCount);
        Assert.NotNull(inbox.ProcessedAtUtc);
        Assert.Equal("provider_timeout", inbox.LastError);
        Assert.Equal(
            2,
            await db.AuditEvents.CountAsync(x =>
                x.AggregateId == fixture.ContractId
                && x.Action == "normal_settlement_notification_indeterminate"));

        var reviewPayloads = await db.OutboxMessages.AsNoTracking()
            .Where(x => x.Type == CharkhooneWorker.NormalSettlementNotificationConsumer.ReviewRequiredEventType)
            .Select(x => x.PayloadJson)
            .ToListAsync();

        Assert.Single(
            reviewPayloads,
            value => value.Contains(
                messageId.ToString("D"),
                StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task DefinitiveFailure_IsAuditedAndQuarantinedWithoutBlindRetry()
    {
        var now = DateTimeOffset.Parse("2026-09-18T19:00:00+00:00");
        var fixture = await SeedSettledContractAsync(now);
        var adapter = new RecordingAdapter(
            NormalSettlementNotificationDeliveryStatus.Failed,
            reasonCode: "recipient_rejected");
        var options = CreateOptions(maxAttempts: 5);

        await using var provider = BuildProvider(adapter, options, now);
        var consumer = CreateConsumer(provider, options, now);
        var messageId = Guid.NewGuid();
        var payload = OwnerPayload(fixture, now);

        var first = await consumer.HandleAsync(
            messageId,
            CharkhooneWorker.NormalSettlementNotificationConsumer.OwnerEventType,
            payload);
        var replay = await consumer.HandleAsync(
            messageId,
            CharkhooneWorker.NormalSettlementNotificationConsumer.OwnerEventType,
            payload);

        Assert.Equal(
            CharkhooneWorker.NormalSettlementNotificationHandlingOutcome.ReviewQueued,
            first);
        Assert.Equal(
            CharkhooneWorker.NormalSettlementNotificationHandlingOutcome.Acknowledge,
            replay);
        Assert.Equal(1, adapter.CallCount);

        await using var db = CreateDbContext();
        var inbox = await db.InboxMessages.AsNoTracking()
            .SingleAsync(x => x.MessageId == messageId);

        Assert.Equal(1, inbox.AttemptCount);
        Assert.NotNull(inbox.ProcessedAtUtc);
        Assert.Equal("recipient_rejected", inbox.LastError);
        Assert.Equal(
            1,
            await db.AuditEvents.CountAsync(x =>
                x.AggregateId == fixture.ContractId
                && x.Action == "normal_settlement_notification_failed"));

        var reviewPayloads = await db.OutboxMessages.AsNoTracking()
            .Where(x => x.Type == CharkhooneWorker.NormalSettlementNotificationConsumer.ReviewRequiredEventType)
            .Select(x => x.PayloadJson)
            .ToListAsync();

        Assert.Single(
            reviewPayloads,
            value => value.Contains(
                messageId.ToString("D"),
                StringComparison.OrdinalIgnoreCase));
    }

    private async Task<Fixture> SeedSettledContractAsync(DateTimeOffset now)
    {
        var contractId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var fundingAllocationId = Guid.NewGuid();
        var fundFreezeId = Guid.NewGuid();
        var settlementId = Guid.NewGuid();
        var bankExternalTransactionId = Guid.NewGuid();
        var bankJournalEntryId = Guid.NewGuid();

        const decimal frozenPrincipalRial = 700_000_000m;
        const string bankId = "normal-consumer-bank";
        const string fundProvider = "normal-consumer-fund";
        var fundReference = $"normal-consumer-fund-{contractId:D}";

        await using var db = CreateDbContext();

        db.Users.AddRange(
            new UserRow
            {
                Id = tenantId,
                OidcSubject = $"normal-consumer-tenant-{tenantId:D}",
                CreatedAtUtc = now.AddMonths(-12),
            },
            new UserRow
            {
                Id = ownerId,
                OidcSubject = $"normal-consumer-owner-{ownerId:D}",
                CreatedAtUtc = now.AddMonths(-12),
            });

        db.CreditApplications.Add(new CreditApplicationRow
        {
            Id = applicationId,
            ApplicantUserId = tenantId,
            Status = CreditApplicationStatus.ApprovedFunded,
            CreatedAtUtc = now.AddMonths(-12),
            UpdatedAtUtc = now.AddMonths(-12),
        });

        db.LeaseContracts.Add(new LeaseContractRow
        {
            Id = contractId,
            TenantUserId = tenantId,
            OwnerUserId = ownerId,
            PropertyId = Guid.NewGuid(),
            CreditApplicationId = applicationId,
            Status = LeaseContractStatus.Settled,
            CreatedAtUtc = now.AddMonths(-12),
            UpdatedAtUtc = now.AddHours(-1),
        });

        db.FundingAllocations.Add(new FundingAllocationRow
        {
            Id = fundingAllocationId,
            CreditApplicationId = applicationId,
            ContractId = contractId,
            BankLoanPlanId = Guid.NewGuid(),
            BankLoanPlanVersion = "normal-consumer-v1",
            BankId = bankId,
            FullDepositEquivalentRial = frozenPrincipalRial,
            MaximumEligibleLoanRial = frozenPrincipalRial,
            BankApprovedLoanRial = frozenPrincipalRial,
            TenantContributionRial = 0m,
            CreatedAtUtc = now.AddMonths(-12),
            UpdatedAtUtc = now.AddMonths(-12),
        });

        db.FundPrincipalFreezes.Add(new FundPrincipalFreezeRow
        {
            Id = fundFreezeId,
            FundingAllocationId = fundingAllocationId,
            Provider = fundProvider,
            Status = "Confirmed",
            IdempotencyKey = $"normal-consumer-freeze:{fundingAllocationId:D}",
            FundReference = fundReference,
            ExternalReference = $"normal-consumer-freeze-external:{fundFreezeId:D}",
            AttemptCount = 1,
            CreatedAtUtc = now.AddMonths(-12),
            UpdatedAtUtc = now.AddMonths(-12),
        });

        db.FrozenPrincipals.Add(new FrozenPrincipalRow
        {
            ContractId = contractId,
            BankId = bankId,
            AmountRial = frozenPrincipalRial,
            FundReference = fundReference,
            FrozenAtUtc = now.AddMonths(-12),
        });

        db.ExternalTransactions.Add(new ExternalTransactionRow
        {
            Id = bankExternalTransactionId,
            Provider = "normal-consumer-bank-provider",
            OperationType = "normal_settlement_bank_principal_return",
            AggregateType = "LeaseContract",
            AggregateId = contractId,
            Status = ExternalTransactionStatus.Succeeded,
            AmountRial = frozenPrincipalRial,
            Currency = "IRR",
            IdempotencyKey = $"normal-settlement-bank-principal:{contractId:D}:v1",
            ExternalReference = $"normal-consumer-bank-return:{bankExternalTransactionId:D}",
            CreatedAtUtc = now.AddHours(-1),
            UpdatedAtUtc = now.AddHours(-1),
        });

        db.NormalSettlements.Add(new NormalSettlementRow
        {
            Id = settlementId,
            ContractId = contractId,
            TenantUserId = tenantId,
            BankId = bankId,
            FundReference = fundReference,
            BankPrincipalAmountRial = frozenPrincipalRial,
            BankPrincipalStatus = NormalSettlementTransferStatus.Succeeded,
            BankExternalTransactionId = bankExternalTransactionId,
            BankExternalReference = $"normal-consumer-bank-return:{bankExternalTransactionId:D}",
            BankJournalEntryId = bankJournalEntryId,
            BankPrincipalReturnedAtUtc = now.AddHours(-1),
            TenantResidualAmountRial = 0m,
            TenantResidualStatus = NormalSettlementTransferStatus.NotRequired,
            CreatedAtUtc = now.AddHours(-2),
            UpdatedAtUtc = now.AddHours(-1),
            CompletedAtUtc = now.AddHours(-1),
        });

        await db.SaveChangesAsync();

        return new Fixture(
            contractId,
            tenantId,
            ownerId,
            settlementId,
            bankExternalTransactionId,
            bankJournalEntryId,
            bankId,
            fundProvider,
            fundReference,
            frozenPrincipalRial);
    }

    private static string OwnerPayload(Fixture fixture, DateTimeOffset now) =>
        JsonSerializer.Serialize(new
        {
            contractId = fixture.ContractId,
            settlementId = fixture.SettlementId,
            ownerUserId = fixture.OwnerId,
            tenantUserId = fixture.TenantId,
            occurredAtUtc = now,
        });

    private ServiceProvider BuildProvider(
        IExternalNormalSettlementNotificationAdapter adapter,
        CharkhooneWorker.RabbitMqWorkerOptions options,
        DateTimeOffset now)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<CharkhooneDbContext>(db =>
            db.UseNpgsql(_factory.ConnectionString));
        services.AddSingleton<IExternalNormalSettlementNotificationAdapter>(adapter);
        services.AddSingleton<TimeProvider>(new FixedTimeProvider(now));
        services.AddSingleton(options);
        return services.BuildServiceProvider();
    }

    private static CharkhooneWorker.NormalSettlementNotificationConsumer CreateConsumer(
        ServiceProvider provider,
        CharkhooneWorker.RabbitMqWorkerOptions options,
        DateTimeOffset now) =>
        new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            options,
            new FixedTimeProvider(now),
            provider.GetRequiredService<ILogger<CharkhooneWorker.NormalSettlementNotificationConsumer>>());

    private CharkhooneDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql(_factory.ConnectionString)
            .Options;
        return new CharkhooneDbContext(options);
    }

    private static CharkhooneWorker.RabbitMqWorkerOptions CreateOptions(int maxAttempts) =>
        new()
        {
            Enabled = true,
            MaxDeliveryAttempts = maxAttempts,
            RetryDelayMilliseconds = 1000,
            OperationTimeoutSeconds = 15,
        };

    private sealed class FixedTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }

    private sealed class RecordingAdapter(
        NormalSettlementNotificationDeliveryStatus status,
        string? reasonCode = null) : IExternalNormalSettlementNotificationAdapter
    {
        public string Provider => "normal-consumer-notification-provider";

        public int CallCount { get; private set; }

        public Task<NormalSettlementNotificationDeliveryResponse> DeliverAsync(
            NormalSettlementNotificationDeliveryRequest request,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            return Task.FromResult(new NormalSettlementNotificationDeliveryResponse(
                status,
                Provider,
                status == NormalSettlementNotificationDeliveryStatus.Delivered
                    ? $"normal-notification:{request.MessageId:D}"
                    : null,
                reasonCode));
        }
    }

    private sealed record Fixture(
        Guid ContractId,
        Guid TenantId,
        Guid OwnerId,
        Guid SettlementId,
        Guid BankExternalTransactionId,
        Guid BankJournalEntryId,
        string BankId,
        string FundProvider,
        string FundReference,
        decimal FrozenPrincipalRial);
}
