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

public sealed class CancellationNotificationConsumerIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;

    public Task InitializeAsync() => _factory.MigrateAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task DeliveredNotifications_AreValidatedAuditedAndIdempotent_ForAllStakeholders()
    {
        var now = DateTimeOffset.Parse("2026-09-18T13:00:00+00:00");
        var fixture = await SeedCancelledContractAsync(now);
        var adapter = new RecordingAdapter(CancellationNotificationDeliveryStatus.Delivered);
        var options = CreateOptions(maxAttempts: 3);

        await using var provider = BuildProvider(adapter, options, now);
        var consumer = CreateConsumer(provider, options, now);

        var deliveries = new[]
        {
            new
            {
                MessageId = Guid.NewGuid(),
                EventType = CharkhooneWorker.CancellationNotificationConsumer.OwnerEventType,
                Payload = JsonSerializer.Serialize(new
                {
                    contractId = fixture.ContractId,
                    ownerUserId = fixture.OwnerId,
                    cancellationSettlementId = fixture.CancellationSettlementId,
                    amountRial = 300_000_000m,
                    occurredAtUtc = now,
                }),
            },
            new
            {
                MessageId = Guid.NewGuid(),
                EventType = CharkhooneWorker.CancellationNotificationConsumer.TenantEventType,
                Payload = JsonSerializer.Serialize(new
                {
                    contractId = fixture.ContractId,
                    tenantUserId = fixture.TenantId,
                    cancellationSettlementId = fixture.CancellationSettlementId,
                    tenantContributionBeforeSettlementRial = 300_000_000m,
                    lostFundReturnRial = 0m,
                    ownerResidualAmountRial = 300_000_000m,
                    cancellationEffectiveAtUtc = now.AddHours(-2),
                    occurredAtUtc = now,
                }),
            },
            new
            {
                MessageId = Guid.NewGuid(),
                EventType = CharkhooneWorker.CancellationNotificationConsumer.BankEventType,
                Payload = JsonSerializer.Serialize(new
                {
                    contractId = fixture.ContractId,
                    cancellationSettlementId = fixture.CancellationSettlementId,
                    bankId = fixture.BankId,
                    amountRial = fixture.FrozenPrincipalRial,
                    externalTransactionId = fixture.BankReturnExternalTransactionId,
                    occurredAtUtc = now,
                }),
            },
            new
            {
                MessageId = Guid.NewGuid(),
                EventType = CharkhooneWorker.CancellationNotificationConsumer.FundEventType,
                Payload = JsonSerializer.Serialize(new
                {
                    contractId = fixture.ContractId,
                    cancellationSettlementId = fixture.CancellationSettlementId,
                    fundProvider = fixture.FundProvider,
                    fundReference = fixture.FundReference,
                    bankId = fixture.BankId,
                    amountRial = fixture.FrozenPrincipalRial,
                    externalTransactionId = fixture.BankReturnExternalTransactionId,
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
                CharkhooneWorker.CancellationNotificationHandlingOutcome.Acknowledge,
                outcome);
        }

        Assert.Equal(4, adapter.CallCount);

        var replay = await consumer.HandleAsync(
            deliveries[0].MessageId,
            deliveries[0].EventType,
            deliveries[0].Payload);

        Assert.Equal(
            CharkhooneWorker.CancellationNotificationHandlingOutcome.Acknowledge,
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
                && x.Action == "cancellation_notification_delivered"));
        Assert.Equal(
            0,
            await db.OutboxMessages.CountAsync(x =>
                x.Type == CharkhooneWorker.CancellationNotificationConsumer.ReviewRequiredEventType
                && messageIds.Any(id => x.PayloadJson.Contains(id.ToString("D")))));
    }

    [Fact]
    public async Task IndeterminateDelivery_RetriesUntilLimit_ThenQueuesReview()
    {
        var now = DateTimeOffset.Parse("2026-09-18T14:00:00+00:00");
        var fixture = await SeedCancelledContractAsync(now);
        var adapter = new RecordingAdapter(
            CancellationNotificationDeliveryStatus.Indeterminate,
            reasonCode: "provider_timeout");
        var options = CreateOptions(maxAttempts: 2);

        await using var provider = BuildProvider(adapter, options, now);
        var consumer = CreateConsumer(provider, options, now);
        var messageId = Guid.NewGuid();
        var payload = OwnerPayload(fixture, now);

        var first = await consumer.HandleAsync(
            messageId,
            CharkhooneWorker.CancellationNotificationConsumer.OwnerEventType,
            payload);
        var second = await consumer.HandleAsync(
            messageId,
            CharkhooneWorker.CancellationNotificationConsumer.OwnerEventType,
            payload);
        var replay = await consumer.HandleAsync(
            messageId,
            CharkhooneWorker.CancellationNotificationConsumer.OwnerEventType,
            payload);

        Assert.Equal(
            CharkhooneWorker.CancellationNotificationHandlingOutcome.Retry,
            first);
        Assert.Equal(
            CharkhooneWorker.CancellationNotificationHandlingOutcome.ReviewQueued,
            second);
        Assert.Equal(
            CharkhooneWorker.CancellationNotificationHandlingOutcome.Acknowledge,
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
                && x.Action == "cancellation_notification_indeterminate"));
        Assert.Equal(
            1,
            await db.OutboxMessages.CountAsync(x =>
                x.Type == CharkhooneWorker.CancellationNotificationConsumer.ReviewRequiredEventType
                && x.PayloadJson.Contains(messageId.ToString("D"))));
    }

    [Fact]
    public async Task DefinitiveFailure_IsAuditedAndQuarantinedWithoutBlindRetry()
    {
        var now = DateTimeOffset.Parse("2026-09-18T15:00:00+00:00");
        var fixture = await SeedCancelledContractAsync(now);
        var adapter = new RecordingAdapter(
            CancellationNotificationDeliveryStatus.Failed,
            reasonCode: "recipient_rejected");
        var options = CreateOptions(maxAttempts: 5);

        await using var provider = BuildProvider(adapter, options, now);
        var consumer = CreateConsumer(provider, options, now);
        var messageId = Guid.NewGuid();
        var payload = OwnerPayload(fixture, now);

        var first = await consumer.HandleAsync(
            messageId,
            CharkhooneWorker.CancellationNotificationConsumer.OwnerEventType,
            payload);
        var replay = await consumer.HandleAsync(
            messageId,
            CharkhooneWorker.CancellationNotificationConsumer.OwnerEventType,
            payload);

        Assert.Equal(
            CharkhooneWorker.CancellationNotificationHandlingOutcome.ReviewQueued,
            first);
        Assert.Equal(
            CharkhooneWorker.CancellationNotificationHandlingOutcome.Acknowledge,
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
                && x.Action == "cancellation_notification_failed"));
        Assert.Equal(
            1,
            await db.OutboxMessages.CountAsync(x =>
                x.Type == CharkhooneWorker.CancellationNotificationConsumer.ReviewRequiredEventType
                && x.PayloadJson.Contains(messageId.ToString("D"))));
    }

    private async Task<Fixture> SeedCancelledContractAsync(DateTimeOffset now)
    {
        var contractId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var fundingAllocationId = Guid.NewGuid();
        var fundFreezeId = Guid.NewGuid();
        var cancellationSettlementId = Guid.NewGuid();
        var bankExternalId = Guid.NewGuid();

        const decimal frozenPrincipalRial = 600_000_000m;
        const string bankId = "notification-integration-bank";
        const string fundProvider = "notification-integration-fund";
        var fundReference = $"notification-fund-{contractId:D}";

        await using var db = CreateDbContext();

        db.Users.AddRange(
            new UserRow
            {
                Id = tenantId,
                OidcSubject = $"notification-tenant-{tenantId:D}",
                CreatedAtUtc = now.AddMonths(-4),
            },
            new UserRow
            {
                Id = ownerId,
                OidcSubject = $"notification-owner-{ownerId:D}",
                CreatedAtUtc = now.AddMonths(-4),
            });

        db.CreditApplications.Add(new CreditApplicationRow
        {
            Id = applicationId,
            ApplicantUserId = tenantId,
            Status = CreditApplicationStatus.ApprovedFunded,
            CreatedAtUtc = now.AddMonths(-4),
            UpdatedAtUtc = now.AddMonths(-4),
        });

        db.LeaseContracts.Add(new LeaseContractRow
        {
            Id = contractId,
            TenantUserId = tenantId,
            OwnerUserId = ownerId,
            PropertyId = Guid.NewGuid(),
            CreditApplicationId = applicationId,
            Status = LeaseContractStatus.Cancelled,
            CreatedAtUtc = now.AddMonths(-4),
            UpdatedAtUtc = now.AddHours(-1),
        });

        db.CancellationSettlements.Add(new CancellationSettlementRow
        {
            Id = cancellationSettlementId,
            ContractId = contractId,
            OwnerUserId = ownerId,
            AmountRial = 300_000_000m,
            Status = CancellationSettlementStatus.Completed,
            RemainingTenantContributionRial = 0m,
            CreatedAtUtc = now.AddHours(-2),
            UpdatedAtUtc = now.AddHours(-1),
            CompletedAtUtc = now.AddHours(-1),
        });

        db.FundingAllocations.Add(new FundingAllocationRow
        {
            Id = fundingAllocationId,
            CreditApplicationId = applicationId,
            ContractId = contractId,
            BankLoanPlanId = Guid.NewGuid(),
            BankLoanPlanVersion = "notification-integration-v1",
            BankId = bankId,
            FullDepositEquivalentRial = frozenPrincipalRial,
            MaximumEligibleLoanRial = frozenPrincipalRial,
            BankApprovedLoanRial = frozenPrincipalRial,
            TenantContributionRial = 0m,
            CreatedAtUtc = now.AddMonths(-4),
            UpdatedAtUtc = now.AddMonths(-4),
        });

        db.FundPrincipalFreezes.Add(new FundPrincipalFreezeRow
        {
            Id = fundFreezeId,
            FundingAllocationId = fundingAllocationId,
            Provider = fundProvider,
            Status = "Confirmed",
            IdempotencyKey = $"notification-freeze:{fundingAllocationId:D}",
            FundReference = fundReference,
            ExternalReference = $"notification-freeze-ref:{fundFreezeId:D}",
            AttemptCount = 1,
            CreatedAtUtc = now.AddMonths(-4),
            UpdatedAtUtc = now.AddMonths(-4),
        });

        db.FrozenPrincipals.Add(new FrozenPrincipalRow
        {
            ContractId = contractId,
            BankId = bankId,
            AmountRial = frozenPrincipalRial,
            FundReference = fundReference,
            FrozenAtUtc = now.AddMonths(-4),
        });

        db.ExternalTransactions.Add(new ExternalTransactionRow
        {
            Id = bankExternalId,
            Provider = "notification-bank-return-provider",
            OperationType = "cancellation_bank_principal_return",
            AggregateType = "LeaseContract",
            AggregateId = contractId,
            Status = ExternalTransactionStatus.Succeeded,
            AmountRial = frozenPrincipalRial,
            Currency = "IRR",
            IdempotencyKey = $"cancellation-bank-principal:{contractId:D}:v1",
            ExternalReference = $"notification-bank-return:{bankExternalId:D}",
            CreatedAtUtc = now.AddHours(-1),
            UpdatedAtUtc = now.AddHours(-1),
        });

        await db.SaveChangesAsync();

        return new Fixture(
            contractId,
            tenantId,
            ownerId,
            cancellationSettlementId,
            bankExternalId,
            bankId,
            fundProvider,
            fundReference,
            frozenPrincipalRial);
    }

    private static string OwnerPayload(Fixture fixture, DateTimeOffset now) =>
        JsonSerializer.Serialize(new
        {
            contractId = fixture.ContractId,
            ownerUserId = fixture.OwnerId,
            cancellationSettlementId = fixture.CancellationSettlementId,
            amountRial = 300_000_000m,
            occurredAtUtc = now,
        });

    private ServiceProvider BuildProvider(
        IExternalCancellationNotificationAdapter adapter,
        CharkhooneWorker.RabbitMqWorkerOptions options,
        DateTimeOffset now)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<CharkhooneDbContext>(db =>
            db.UseNpgsql(_factory.ConnectionString));
        services.AddSingleton(adapter);
        services.AddSingleton<IExternalCancellationNotificationAdapter>(adapter);
        services.AddSingleton<TimeProvider>(new FixedTimeProvider(now));
        services.AddSingleton(options);
        return services.BuildServiceProvider();
    }

    private static CharkhooneWorker.CancellationNotificationConsumer CreateConsumer(
        ServiceProvider provider,
        CharkhooneWorker.RabbitMqWorkerOptions options,
        DateTimeOffset now) =>
        new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            options,
            new FixedTimeProvider(now),
            provider.GetRequiredService<ILogger<CharkhooneWorker.CancellationNotificationConsumer>>());

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
        CancellationNotificationDeliveryStatus status,
        string? reasonCode = null) : IExternalCancellationNotificationAdapter
    {
        public string Provider => "integration-notification-provider";

        public int CallCount { get; private set; }

        public Task<CancellationNotificationDeliveryResponse> DeliverAsync(
            CancellationNotificationDeliveryRequest request,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            return Task.FromResult(new CancellationNotificationDeliveryResponse(
                status,
                Provider,
                status == CancellationNotificationDeliveryStatus.Delivered
                    ? $"notification:{request.MessageId:D}"
                    : null,
                reasonCode));
        }
    }

    private sealed record Fixture(
        Guid ContractId,
        Guid TenantId,
        Guid OwnerId,
        Guid CancellationSettlementId,
        Guid BankReturnExternalTransactionId,
        string BankId,
        string FundProvider,
        string FundReference,
        decimal FrozenPrincipalRial);
}
