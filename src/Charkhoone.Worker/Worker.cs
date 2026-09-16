using System.Text;
using Charkhoone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using RabbitMQ.Client;

namespace Charkhoone.Worker;

public sealed class OutboxWorker(
    IServiceScopeFactory scopeFactory,
    RabbitMqWorkerOptions options,
    ILogger<OutboxWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!options.Enabled)
        {
            logger.LogInformation("RabbitMQ outbox worker is disabled.");
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
                logger.LogError(exception, "RabbitMQ outbox worker disconnected; retrying.");
                await DelayForRetryAsync(stoppingToken);
            }
        }
    }

    private async Task RunConnectedAsync(CancellationToken stoppingToken)
    {
        await using var connection = await options.CreateConnectionFactory()
            .CreateConnectionAsync(stoppingToken);

        var channelOptions = new CreateChannelOptions(
            publisherConfirmationsEnabled: true,
            publisherConfirmationTrackingEnabled: true);

        await using var channel = await connection.CreateChannelAsync(channelOptions, stoppingToken);

        await channel.ExchangeDeclareAsync(
            exchange: options.Exchange,
            type: ExchangeType.Topic,
            durable: true,
            autoDelete: false,
            cancellationToken: stoppingToken);

        logger.LogInformation(
            "RabbitMQ outbox publisher connected to exchange {Exchange}.",
            options.Exchange);

        while (!stoppingToken.IsCancellationRequested)
        {
            var result = await DispatchBatchAsync(channel, stoppingToken);

            if (result == DispatchBatchResult.PublishFailed)
            {
                throw new InvalidOperationException("RabbitMQ publish failed; the connection will be recreated.");
            }

            if (result == DispatchBatchResult.Empty)
            {
                await Task.Delay(options.OutboxPollInterval, stoppingToken);
            }
        }
    }

    private async Task<DispatchBatchResult> DispatchBatchAsync(
        IChannel channel,
        CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var messages = await dbContext.OutboxMessages
            .FromSqlInterpolated($"""
                SELECT *
                FROM outbox_messages
                WHERE "ProcessedAtUtc" IS NULL
                ORDER BY "OccurredAtUtc", "Id"
                FOR UPDATE SKIP LOCKED
                LIMIT {options.OutboxBatchSize}
                """)
            .ToListAsync(cancellationToken);

        if (messages.Count == 0)
        {
            await transaction.CommitAsync(cancellationToken);
            return DispatchBatchResult.Empty;
        }

        foreach (var message in messages)
        {
            message.AttemptCount += 1;

            try
            {
                using var publishTimeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                publishTimeout.CancelAfter(options.OperationTimeout);

                var properties = new BasicProperties
                {
                    ContentType = "application/json",
                    DeliveryMode = DeliveryModes.Persistent,
                    MessageId = message.Id.ToString("D"),
                    Type = message.Type,
                    Timestamp = new AmqpTimestamp(message.OccurredAtUtc.ToUnixTimeSeconds()),
                };

                await channel.BasicPublishAsync(
                    exchange: options.Exchange,
                    routingKey: message.Type,
                    mandatory: false,
                    basicProperties: properties,
                    body: Encoding.UTF8.GetBytes(message.PayloadJson),
                    cancellationToken: publishTimeout.Token);

                message.ProcessedAtUtc = DateTimeOffset.UtcNow;
                message.LastError = null;
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception exception)
            {
                message.LastError = TruncateError(exception);

                logger.LogWarning(
                    exception,
                    "Publishing outbox message {MessageId} ({MessageType}) failed on attempt {AttemptCount}.",
                    message.Id,
                    message.Type,
                    message.AttemptCount);

                await dbContext.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return DispatchBatchResult.PublishFailed;
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return DispatchBatchResult.Published;
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

    private enum DispatchBatchResult
    {
        Empty,
        Published,
        PublishFailed,
    }
}
