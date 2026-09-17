using System.Diagnostics;
using System.Text;
using System.Text.Json;
using Charkhoone.Application.IdentityVerification;
using Charkhoone.Infrastructure.Observability;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace Charkhoone.Worker;

public sealed class CreditApplicationSubmittedConsumer(
    IServiceScopeFactory scopeFactory,
    RabbitMqWorkerOptions options,
    ILogger<CreditApplicationSubmittedConsumer> logger) : BackgroundService
{
    private const string SubmittedEventType = "credit-application.submitted.v1";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!options.Enabled)
        {
            logger.LogInformation("RabbitMQ identity consumer is disabled.");
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
                logger.LogError(exception, "RabbitMQ identity consumer disconnected; retrying.");
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
            queue: options.IdentityQueue,
            durable: true,
            exclusive: false,
            autoDelete: false,
            cancellationToken: stoppingToken);

        await channel.QueueBindAsync(
            queue: options.IdentityQueue,
            exchange: options.Exchange,
            routingKey: SubmittedEventType,
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

            if (!string.Equals(delivery.RoutingKey, SubmittedEventType, StringComparison.Ordinal))
            {
                logger.LogWarning("Rejecting unexpected routing key {RoutingKey}.", delivery.RoutingKey);
                await channel.BasicRejectAsync(delivery.DeliveryTag, requeue: false, cancellationToken);
                return;
            }

            if (!Guid.TryParse(delivery.BasicProperties.MessageId, out var messageId))
            {
                logger.LogWarning("Rejecting RabbitMQ message without a valid GUID MessageId.");
                await channel.BasicRejectAsync(delivery.DeliveryTag, requeue: false, cancellationToken);
                return;
            }

            using var activity = CharkhooneTelemetry.StartWorkerActivity(
                "credit-application.submitted.consume",
                ActivityKind.Consumer);
            activity?.SetTag("messaging.system", "rabbitmq");
            activity?.SetTag("messaging.destination.name", options.IdentityQueue);
            activity?.SetTag("messaging.operation.name", "process");
            activity?.SetTag("messaging.message.type", SubmittedEventType);
            activity?.SetTag("messaging.rabbitmq.redelivered", delivery.Redelivered);

            var payload = Encoding.UTF8.GetString(delivery.Body.ToArray());

            try
            {
                var outcome = await HandleAsync(messageId, payload, cancellationToken);

                if (outcome == DeliveryHandlingOutcome.Retry)
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

                activity?.SetTag("charkhoone.processing.outcome", "acknowledge");
                activity?.SetStatus(ActivityStatusCode.Ok);
                CharkhooneTelemetry.RecordInboxProcessed();
                await channel.BasicAckAsync(
                    delivery.DeliveryTag,
                    multiple: false,
                    cancellationToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // Leave the delivery unacknowledged. RabbitMQ will redeliver it after the channel closes.
            }
            catch (Exception exception)
            {
                activity?.SetStatus(ActivityStatusCode.Error, "processing_failed");
                CharkhooneTelemetry.RecordInboxRetry();

                logger.LogError(
                    exception,
                    "Processing submitted credit application message {MessageId} failed.",
                    messageId);

                await RecordFailureAsync(messageId, exception, CancellationToken.None);

                if (!stoppingToken.IsCancellationRequested)
                {
                    await Task.Delay(options.RetryDelay, stoppingToken);
                    await channel.BasicNackAsync(
                        delivery.DeliveryTag,
                        multiple: false,
                        requeue: true,
                        stoppingToken);
                }
            }
        };

        await channel.BasicConsumeAsync(
            queue: options.IdentityQueue,
            autoAck: false,
            consumer: consumer,
            cancellationToken: stoppingToken);

        logger.LogInformation(
            "RabbitMQ identity consumer is listening on queue {Queue} for {MessageType}.",
            options.IdentityQueue,
            SubmittedEventType);

        await Task.Delay(Timeout.InfiniteTimeSpan, stoppingToken);
    }

    private async Task<DeliveryHandlingOutcome> HandleAsync(
        Guid messageId,
        string payload,
        CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
        var receivedAtUtc = DateTimeOffset.UtcNow;

        await dbContext.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO inbox_messages ("MessageId", "Type", "ReceivedAtUtc", "AttemptCount")
            VALUES ({messageId}, {SubmittedEventType}, {receivedAtUtc}, 0)
            ON CONFLICT ("MessageId") DO NOTHING
            """, cancellationToken);

        var inbox = await dbContext.InboxMessages
            .SingleAsync(x => x.MessageId == messageId, cancellationToken);

        if (inbox.ProcessedAtUtc is not null)
        {
            return DeliveryHandlingOutcome.Acknowledge;
        }

        inbox.AttemptCount += 1;
        inbox.LastError = null;
        await dbContext.SaveChangesAsync(cancellationToken);

        if (!TryReadApplicationId(payload, out var applicationId))
        {
            inbox.ProcessedAtUtc = receivedAtUtc;
            inbox.LastError = "invalid_credit_application_submitted_payload";
            await dbContext.SaveChangesAsync(cancellationToken);

            logger.LogWarning(
                "Quarantined submitted credit application message {MessageId} because its payload is invalid.",
                messageId);

            return DeliveryHandlingOutcome.Acknowledge;
        }

        var identityService = scope.ServiceProvider.GetRequiredService<ICreditApplicationIdentityService>();
        var result = await identityService.ProcessAsync(
            applicationId,
            receivedAtUtc,
            cancellationToken);

        if (result.Outcome == ProcessIdentityVerificationOutcome.Indeterminate)
        {
            inbox.LastError = "identity_verification_indeterminate";
            await dbContext.SaveChangesAsync(cancellationToken);
            return DeliveryHandlingOutcome.Retry;
        }

        inbox.ProcessedAtUtc = DateTimeOffset.UtcNow;
        inbox.LastError = result.Outcome switch
        {
            ProcessIdentityVerificationOutcome.NotFound => "credit_application_not_found",
            ProcessIdentityVerificationOutcome.InvalidState => "credit_application_invalid_state",
            _ => null,
        };
        await dbContext.SaveChangesAsync(cancellationToken);

        return DeliveryHandlingOutcome.Acknowledge;
    }

    private async Task RecordFailureAsync(
        Guid messageId,
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
                return;
            }

            inbox.LastError = TruncateError(exception);
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception recordException)
        {
            logger.LogWarning(
                recordException,
                "Could not persist inbox failure for message {MessageId}.",
                messageId);
        }
    }

    private static bool TryReadApplicationId(string payload, out Guid applicationId)
    {
        applicationId = Guid.Empty;

        try
        {
            using var document = JsonDocument.Parse(payload);
            return document.RootElement.TryGetProperty("applicationId", out var property)
                && property.TryGetGuid(out applicationId)
                && applicationId != Guid.Empty;
        }
        catch (JsonException)
        {
            return false;
        }
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

    private static string TruncateError(Exception exception)
    {
        const int maximumLength = 4000;
        var value = exception.ToString();
        return value.Length <= maximumLength ? value : value[..maximumLength];
    }

    private enum DeliveryHandlingOutcome
    {
        Acknowledge,
        Retry,
    }
}
