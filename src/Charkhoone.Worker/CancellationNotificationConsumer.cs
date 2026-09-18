using System.Diagnostics;
using System.Text;
using System.Text.Json;
using Charkhoone.Application.Payments;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Observability;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace Charkhoone.Worker;

public enum CancellationNotificationHandlingOutcome
{
    Acknowledge,
    Retry,
    ReviewQueued,
}

public sealed class CancellationNotificationConsumer(
    IServiceScopeFactory scopeFactory,
    RabbitMqWorkerOptions options,
    TimeProvider timeProvider,
    ILogger<CancellationNotificationConsumer> logger) : BackgroundService
{
    public const string OwnerEventType = "lease-contract.cancelled-owner-notification-requested.v1";
    public const string TenantEventType = "lease-contract.cancelled-tenant-notification-requested.v1";
    public const string BankEventType = "lease-contract.cancelled-bank-notification-requested.v1";
    public const string FundEventType = "lease-contract.cancelled-fund-notification-requested.v1";
    public const string ReviewRequiredEventType = "lease-contract.cancellation-notification-review-required.v1";

    private static readonly string[] SupportedEventTypes =
    [
        OwnerEventType,
        TenantEventType,
        BankEventType,
        FundEventType,
    ];

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!options.Enabled)
        {
            logger.LogInformation("RabbitMQ cancellation notification consumer is disabled.");
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunConnectedAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "RabbitMQ cancellation notification consumer disconnected; retrying.");
                await DelayForRetryAsync(stoppingToken);
            }
        }
    }

    private async Task RunConnectedAsync(CancellationToken stoppingToken)
    {
        await using var connection = await options.CreateConnectionFactory()
            .CreateConnectionAsync(stoppingToken);
        await using var channel = await connection.CreateChannelAsync(cancellationToken: stoppingToken);

        await channel.ExchangeDeclareAsync(
            exchange: options.Exchange,
            type: ExchangeType.Topic,
            durable: true,
            autoDelete: false,
            cancellationToken: stoppingToken);

        await channel.QueueDeclareAsync(
            queue: options.CancellationNotificationQueue,
            durable: true,
            exclusive: false,
            autoDelete: false,
            cancellationToken: stoppingToken);

        await channel.QueueDeclareAsync(
            queue: options.CancellationNotificationReviewQueue,
            durable: true,
            exclusive: false,
            autoDelete: false,
            cancellationToken: stoppingToken);

        foreach (var eventType in SupportedEventTypes)
        {
            await channel.QueueBindAsync(
                queue: options.CancellationNotificationQueue,
                exchange: options.Exchange,
                routingKey: eventType,
                cancellationToken: stoppingToken);
        }

        await channel.QueueBindAsync(
            queue: options.CancellationNotificationReviewQueue,
            exchange: options.Exchange,
            routingKey: ReviewRequiredEventType,
            cancellationToken: stoppingToken);

        await channel.BasicQosAsync(
            prefetchSize: 0,
            prefetchCount: options.PrefetchCount,
            global: false,
            cancellationToken: stoppingToken);

        var consumer = new AsyncEventingBasicConsumer(channel);
        consumer.ReceivedAsync += async (_, delivery) =>
        {
            using var deliveryCancellation = CancellationTokenSource.CreateLinkedTokenSource(
                stoppingToken,
                delivery.CancellationToken);
            var cancellationToken = deliveryCancellation.Token;

            if (!SupportedEventTypes.Contains(delivery.RoutingKey, StringComparer.Ordinal))
            {
                logger.LogWarning(
                    "Rejecting unexpected cancellation notification routing key {RoutingKey}.",
                    delivery.RoutingKey);
                await channel.BasicRejectAsync(delivery.DeliveryTag, requeue: false, cancellationToken);
                return;
            }

            if (!Guid.TryParse(delivery.BasicProperties.MessageId, out var messageId))
            {
                logger.LogWarning("Rejecting cancellation notification without a valid GUID MessageId.");
                await channel.BasicRejectAsync(delivery.DeliveryTag, requeue: false, cancellationToken);
                return;
            }

            using var activity = CharkhooneTelemetry.StartWorkerActivity(
                "cancellation.notification.consume",
                ActivityKind.Consumer);
            activity?.SetTag("messaging.system", "rabbitmq");
            activity?.SetTag("messaging.destination.name", options.CancellationNotificationQueue);
            activity?.SetTag("messaging.operation.name", "process");
            activity?.SetTag("messaging.message.type", delivery.RoutingKey);
            activity?.SetTag("messaging.rabbitmq.redelivered", delivery.Redelivered);

            var payload = Encoding.UTF8.GetString(delivery.Body.ToArray());

            try
            {
                var outcome = await HandleAsync(
                    messageId,
                    delivery.RoutingKey,
                    payload,
                    cancellationToken);

                if (outcome == CancellationNotificationHandlingOutcome.Retry)
                {
                    activity?.SetTag("charkhoone.processing.outcome", "retry");
                    CharkhooneTelemetry.RecordInboxRetry();
                    await Task.Delay(options.RetryDelay, cancellationToken);
                    await channel.BasicNackAsync(
                        delivery.DeliveryTag,
                        multiple: false,
                        requeue: true,
                        cancellationToken);
                    return;
                }

                activity?.SetTag(
                    "charkhoone.processing.outcome",
                    outcome == CancellationNotificationHandlingOutcome.ReviewQueued
                        ? "review-queued"
                        : "acknowledge");
                activity?.SetStatus(ActivityStatusCode.Ok);
                CharkhooneTelemetry.RecordInboxProcessed();

                await channel.BasicAckAsync(
                    delivery.DeliveryTag,
                    multiple: false,
                    cancellationToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // Leave the delivery unacknowledged so RabbitMQ can redeliver it.
            }
            catch (Exception exception)
            {
                activity?.SetStatus(ActivityStatusCode.Error, "processing_failed");
                logger.LogError(
                    exception,
                    "Cancellation notification {MessageId} ({MessageType}) failed.",
                    messageId,
                    delivery.RoutingKey);

                var reviewQueued = await RecordFailureAsync(
                    messageId,
                    delivery.RoutingKey,
                    exception,
                    CancellationToken.None);

                if (!stoppingToken.IsCancellationRequested)
                {
                    if (reviewQueued)
                    {
                        CharkhooneTelemetry.RecordInboxProcessed();
                        await channel.BasicAckAsync(
                            delivery.DeliveryTag,
                            multiple: false,
                            stoppingToken);
                    }
                    else
                    {
                        CharkhooneTelemetry.RecordInboxRetry();
                        await Task.Delay(options.RetryDelay, stoppingToken);
                        await channel.BasicNackAsync(
                            delivery.DeliveryTag,
                            multiple: false,
                            requeue: true,
                            stoppingToken);
                    }
                }
            }
        };

        await channel.BasicConsumeAsync(
            queue: options.CancellationNotificationQueue,
            autoAck: false,
            consumer: consumer,
            cancellationToken: stoppingToken);

        logger.LogInformation(
            "RabbitMQ cancellation notification consumer is listening on {Queue}; exhausted or invalid deliveries route to {ReviewQueue}.",
            options.CancellationNotificationQueue,
            options.CancellationNotificationReviewQueue);

        await Task.Delay(Timeout.InfiniteTimeSpan, stoppingToken);
    }

    public async Task<CancellationNotificationHandlingOutcome> HandleAsync(
        Guid messageId,
        string eventType,
        string payload,
        CancellationToken cancellationToken = default)
    {
        if (messageId == Guid.Empty)
        {
            throw new ArgumentException("Message id is required.", nameof(messageId));
        }

        if (!SupportedEventTypes.Contains(eventType, StringComparer.Ordinal))
        {
            throw new ArgumentException("Unsupported cancellation notification event type.", nameof(eventType));
        }

        ArgumentNullException.ThrowIfNull(payload);

        await using var scope = scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
        var now = timeProvider.GetUtcNow();

        await dbContext.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO inbox_messages ("MessageId", "Type", "ReceivedAtUtc", "AttemptCount")
            VALUES ({messageId}, {eventType}, {now}, 0)
            ON CONFLICT ("MessageId") DO NOTHING
            """, cancellationToken);

        var inbox = await dbContext.InboxMessages
            .SingleAsync(x => x.MessageId == messageId, cancellationToken);

        if (inbox.ProcessedAtUtc is not null)
        {
            return CancellationNotificationHandlingOutcome.Acknowledge;
        }

        if (!string.Equals(inbox.Type, eventType, StringComparison.Ordinal))
        {
            inbox.ProcessedAtUtc = now;
            inbox.LastError = "cancellation_notification_message_type_mismatch";
            QueueReview(
                dbContext,
                inbox,
                contractId: null,
                recipientKind: null,
                recipientReference: null,
                inbox.LastError,
                now);
            await dbContext.SaveChangesAsync(cancellationToken);
            return CancellationNotificationHandlingOutcome.ReviewQueued;
        }

        inbox.AttemptCount += 1;
        inbox.LastError = null;
        await dbContext.SaveChangesAsync(cancellationToken);

        if (!TryParseNotification(eventType, payload, out var parsed, out var parseError))
        {
            inbox.ProcessedAtUtc = now;
            inbox.LastError = parseError;
            QueueReview(
                dbContext,
                inbox,
                parsed?.ContractId,
                parsed?.RecipientKind,
                parsed?.RecipientReference,
                parseError,
                now);

            if (parsed?.ContractId is Guid contractId && contractId != Guid.Empty)
            {
                AddAudit(
                    dbContext,
                    contractId,
                    "system:cancellation-notification",
                    "cancellation_notification_failed",
                    $"Notification payload validation failed for {eventType}: {parseError}.",
                    now);
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return CancellationNotificationHandlingOutcome.ReviewQueued;
        }

        var stateError = await ValidateRecipientStateAsync(dbContext, parsed!, cancellationToken);
        if (stateError is not null)
        {
            inbox.ProcessedAtUtc = now;
            inbox.LastError = stateError;

            AddAudit(
                dbContext,
                parsed!.ContractId,
                "system:cancellation-notification",
                "cancellation_notification_failed",
                $"Notification state validation failed for {eventType}: {stateError}.",
                now);
            QueueReview(
                dbContext,
                inbox,
                parsed.ContractId,
                parsed.RecipientKind,
                parsed.RecipientReference,
                stateError,
                now);

            await dbContext.SaveChangesAsync(cancellationToken);
            return CancellationNotificationHandlingOutcome.ReviewQueued;
        }

        var adapter = scope.ServiceProvider.GetRequiredService<IExternalCancellationNotificationAdapter>();
        var response = await adapter.DeliverAsync(
            new CancellationNotificationDeliveryRequest(
                messageId,
                eventType,
                parsed!.ContractId,
                parsed.RecipientKind,
                parsed.RecipientReference,
                payload),
            cancellationToken);

        var provider = string.IsNullOrWhiteSpace(response.Provider)
            ? adapter.Provider
            : response.Provider.Trim();

        if (response.Status == CancellationNotificationDeliveryStatus.Delivered
            && !string.IsNullOrWhiteSpace(response.ExternalReference))
        {
            inbox.ProcessedAtUtc = now;
            inbox.LastError = null;

            AddAudit(
                dbContext,
                parsed.ContractId,
                $"notification:{provider}",
                "cancellation_notification_delivered",
                $"Delivered {eventType} to {parsed.RecipientKind}:{parsed.RecipientReference}; external reference {response.ExternalReference.Trim()}.",
                now);

            await dbContext.SaveChangesAsync(cancellationToken);
            return CancellationNotificationHandlingOutcome.Acknowledge;
        }

        if (response.Status == CancellationNotificationDeliveryStatus.Failed)
        {
            var reason = NormalizeReason(
                response.ReasonCode,
                "cancellation_notification_delivery_failed");
            inbox.ProcessedAtUtc = now;
            inbox.LastError = reason;

            AddAudit(
                dbContext,
                parsed.ContractId,
                $"notification:{provider}",
                "cancellation_notification_failed",
                $"Definitive delivery failure for {eventType} to {parsed.RecipientKind}:{parsed.RecipientReference}; reason {reason}.",
                now);
            QueueReview(
                dbContext,
                inbox,
                parsed.ContractId,
                parsed.RecipientKind,
                parsed.RecipientReference,
                reason,
                now);

            await dbContext.SaveChangesAsync(cancellationToken);
            return CancellationNotificationHandlingOutcome.ReviewQueued;
        }

        var indeterminateReason = response.Status == CancellationNotificationDeliveryStatus.Delivered
            ? "cancellation_notification_delivery_confirmation_invalid"
            : NormalizeReason(
                response.ReasonCode,
                "cancellation_notification_delivery_indeterminate");

        inbox.LastError = indeterminateReason;
        AddAudit(
            dbContext,
            parsed.ContractId,
            $"notification:{provider}",
            "cancellation_notification_indeterminate",
            $"Delivery result for {eventType} to {parsed.RecipientKind}:{parsed.RecipientReference} is indeterminate; reason {indeterminateReason}.",
            now);

        if (inbox.AttemptCount >= options.MaxDeliveryAttempts)
        {
            inbox.ProcessedAtUtc = now;
            QueueReview(
                dbContext,
                inbox,
                parsed.ContractId,
                parsed.RecipientKind,
                parsed.RecipientReference,
                indeterminateReason,
                now);

            await dbContext.SaveChangesAsync(cancellationToken);
            return CancellationNotificationHandlingOutcome.ReviewQueued;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return CancellationNotificationHandlingOutcome.Retry;
    }

    private async Task<bool> RecordFailureAsync(
        Guid messageId,
        string eventType,
        Exception exception,
        CancellationToken cancellationToken)
    {
        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
            var inbox = await dbContext.InboxMessages
                .SingleOrDefaultAsync(x => x.MessageId == messageId, cancellationToken);

            if (inbox is null || inbox.ProcessedAtUtc is not null)
            {
                return inbox?.ProcessedAtUtc is not null;
            }

            inbox.LastError = TruncateError(exception);

            if (inbox.AttemptCount >= options.MaxDeliveryAttempts)
            {
                inbox.ProcessedAtUtc = timeProvider.GetUtcNow();
                QueueReview(
                    dbContext,
                    inbox,
                    contractId: null,
                    recipientKind: null,
                    recipientReference: null,
                    "cancellation_notification_processing_failed",
                    inbox.ProcessedAtUtc.Value);
                await dbContext.SaveChangesAsync(cancellationToken);
                return true;
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            return false;
        }
        catch (Exception recordException)
        {
            logger.LogWarning(
                recordException,
                "Could not persist cancellation notification failure for message {MessageId} ({MessageType}).",
                messageId,
                eventType);
            return false;
        }
    }

    private static async Task<string?> ValidateRecipientStateAsync(
        CharkhooneDbContext dbContext,
        ParsedNotification parsed,
        CancellationToken cancellationToken)
    {
        var contract = await dbContext.LeaseContracts
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == parsed.ContractId, cancellationToken);
        if (contract is null || contract.Status != LeaseContractStatus.Cancelled)
        {
            return "cancellation_notification_contract_not_cancelled";
        }

        var settlement = await dbContext.CancellationSettlements
            .AsNoTracking()
            .SingleOrDefaultAsync(
                x => x.Id == parsed.CancellationSettlementId
                    && x.ContractId == parsed.ContractId,
                cancellationToken);
        if (settlement is null || settlement.Status != CancellationSettlementStatus.Completed)
        {
            return "cancellation_notification_settlement_not_completed";
        }

        switch (parsed.RecipientKind)
        {
            case CancellationNotificationRecipientKind.Owner:
                return parsed.RecipientUserId == contract.OwnerUserId
                    ? null
                    : "cancellation_notification_owner_mismatch";

            case CancellationNotificationRecipientKind.Tenant:
                return parsed.RecipientUserId == contract.TenantUserId
                    ? null
                    : "cancellation_notification_tenant_mismatch";

            case CancellationNotificationRecipientKind.Bank:
            {
                var principal = await dbContext.FrozenPrincipals
                    .AsNoTracking()
                    .SingleOrDefaultAsync(x => x.ContractId == parsed.ContractId, cancellationToken);
                if (principal is null
                    || !string.Equals(principal.BankId, parsed.RecipientReference, StringComparison.Ordinal))
                {
                    return "cancellation_notification_bank_mismatch";
                }

                var succeeded = await dbContext.ExternalTransactions
                    .AsNoTracking()
                    .AnyAsync(
                        x => x.IdempotencyKey == $"cancellation-bank-principal:{parsed.ContractId:D}:v1"
                            && x.Status == ExternalTransactionStatus.Succeeded,
                        cancellationToken);
                return succeeded
                    ? null
                    : "cancellation_notification_bank_return_not_confirmed";
            }

            case CancellationNotificationRecipientKind.Fund:
            {
                var allocation = await dbContext.FundingAllocations
                    .AsNoTracking()
                    .SingleOrDefaultAsync(x => x.ContractId == parsed.ContractId, cancellationToken);
                if (allocation is null)
                {
                    return "cancellation_notification_fund_allocation_missing";
                }

                var freeze = await dbContext.FundPrincipalFreezes
                    .AsNoTracking()
                    .SingleOrDefaultAsync(
                        x => x.FundingAllocationId == allocation.Id,
                        cancellationToken);
                if (freeze is null
                    || !string.Equals(freeze.Status, "Confirmed", StringComparison.Ordinal)
                    || string.IsNullOrWhiteSpace(freeze.Provider)
                    || string.IsNullOrWhiteSpace(freeze.FundReference))
                {
                    return "cancellation_notification_fund_freeze_not_confirmed";
                }

                var actualReference = $"{freeze.Provider.Trim()}|{freeze.FundReference.Trim()}";
                return string.Equals(
                    actualReference,
                    parsed.RecipientReference,
                    StringComparison.Ordinal)
                    ? null
                    : "cancellation_notification_fund_mismatch";
            }

            default:
                return "cancellation_notification_recipient_kind_invalid";
        }
    }

    private static bool TryParseNotification(
        string eventType,
        string payload,
        out ParsedNotification? parsed,
        out string error)
    {
        parsed = null;
        error = "cancellation_notification_payload_invalid";

        try
        {
            using var document = JsonDocument.Parse(payload);
            var root = document.RootElement;

            if (!TryReadGuid(root, "contractId", out var contractId)
                || !TryReadGuid(root, "cancellationSettlementId", out var settlementId))
            {
                return false;
            }

            switch (eventType)
            {
                case OwnerEventType:
                    if (!TryReadGuid(root, "ownerUserId", out var ownerUserId))
                    {
                        parsed = new ParsedNotification(
                            contractId,
                            settlementId,
                            CancellationNotificationRecipientKind.Owner,
                            null,
                            string.Empty);
                        error = "cancellation_notification_owner_id_invalid";
                        return false;
                    }

                    parsed = new ParsedNotification(
                        contractId,
                        settlementId,
                        CancellationNotificationRecipientKind.Owner,
                        ownerUserId,
                        ownerUserId.ToString("D"));
                    return true;

                case TenantEventType:
                    if (!TryReadGuid(root, "tenantUserId", out var tenantUserId))
                    {
                        parsed = new ParsedNotification(
                            contractId,
                            settlementId,
                            CancellationNotificationRecipientKind.Tenant,
                            null,
                            string.Empty);
                        error = "cancellation_notification_tenant_id_invalid";
                        return false;
                    }

                    parsed = new ParsedNotification(
                        contractId,
                        settlementId,
                        CancellationNotificationRecipientKind.Tenant,
                        tenantUserId,
                        tenantUserId.ToString("D"));
                    return true;

                case BankEventType:
                    if (!TryReadNonBlankString(root, "bankId", out var bankId))
                    {
                        parsed = new ParsedNotification(
                            contractId,
                            settlementId,
                            CancellationNotificationRecipientKind.Bank,
                            null,
                            string.Empty);
                        error = "cancellation_notification_bank_id_invalid";
                        return false;
                    }

                    parsed = new ParsedNotification(
                        contractId,
                        settlementId,
                        CancellationNotificationRecipientKind.Bank,
                        null,
                        bankId);
                    return true;

                case FundEventType:
                    if (!TryReadNonBlankString(root, "fundProvider", out var fundProvider)
                        || !TryReadNonBlankString(root, "fundReference", out var fundReference))
                    {
                        parsed = new ParsedNotification(
                            contractId,
                            settlementId,
                            CancellationNotificationRecipientKind.Fund,
                            null,
                            string.Empty);
                        error = "cancellation_notification_fund_identity_invalid";
                        return false;
                    }

                    parsed = new ParsedNotification(
                        contractId,
                        settlementId,
                        CancellationNotificationRecipientKind.Fund,
                        null,
                        $"{fundProvider}|{fundReference}");
                    return true;

                default:
                    error = "cancellation_notification_event_type_invalid";
                    return false;
            }
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static bool TryReadGuid(
        JsonElement root,
        string propertyName,
        out Guid value)
    {
        value = Guid.Empty;
        return root.TryGetProperty(propertyName, out var property)
            && property.TryGetGuid(out value)
            && value != Guid.Empty;
    }

    private static bool TryReadNonBlankString(
        JsonElement root,
        string propertyName,
        out string value)
    {
        value = string.Empty;
        if (!root.TryGetProperty(propertyName, out var property)
            || property.ValueKind != JsonValueKind.String)
        {
            return false;
        }

        var raw = property.GetString();
        if (string.IsNullOrWhiteSpace(raw))
        {
            return false;
        }

        value = raw.Trim();
        return true;
    }

    private static void AddAudit(
        CharkhooneDbContext dbContext,
        Guid contractId,
        string actorId,
        string action,
        string reason,
        DateTimeOffset occurredAtUtc) =>
        dbContext.AuditEvents.Add(new AuditEventRow
        {
            Id = Guid.NewGuid(),
            AggregateType = "LeaseContract",
            AggregateId = contractId,
            ActorId = actorId,
            Action = action,
            Reason = reason,
            OccurredAtUtc = occurredAtUtc,
        });

    private static void QueueReview(
        CharkhooneDbContext dbContext,
        InboxMessageRow inbox,
        Guid? contractId,
        CancellationNotificationRecipientKind? recipientKind,
        string? recipientReference,
        string reason,
        DateTimeOffset occurredAtUtc)
    {
        inbox.ProcessedAtUtc = occurredAtUtc;
        inbox.LastError = reason;

        dbContext.OutboxMessages.Add(new OutboxMessageRow
        {
            Id = Guid.NewGuid(),
            OccurredAtUtc = occurredAtUtc,
            Type = ReviewRequiredEventType,
            PayloadJson = JsonSerializer.Serialize(new
            {
                messageId = inbox.MessageId,
                sourceType = inbox.Type,
                contractId,
                recipientKind = recipientKind?.ToString(),
                recipientReference,
                reason,
                attemptCount = inbox.AttemptCount,
            }),
            AttemptCount = 0,
        });
    }

    private async Task DelayForRetryAsync(CancellationToken cancellationToken)
    {
        try
        {
            await Task.Delay(options.RetryDelay, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
        }
    }

    private static string NormalizeReason(string? reason, string fallback) =>
        string.IsNullOrWhiteSpace(reason) ? fallback : reason.Trim();

    private static string TruncateError(Exception exception)
    {
        const int maximumLength = 4000;
        var value = exception.ToString();
        return value.Length <= maximumLength ? value : value[..maximumLength];
    }

    private sealed record ParsedNotification(
        Guid ContractId,
        Guid CancellationSettlementId,
        CancellationNotificationRecipientKind RecipientKind,
        Guid? RecipientUserId,
        string RecipientReference);
}
