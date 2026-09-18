using Microsoft.Extensions.Configuration;
using RabbitMQ.Client;

namespace Charkhoone.Worker;

public sealed class RabbitMqWorkerOptions
{
    public const string SectionName = "RabbitMq";

    public bool Enabled { get; init; }
    public string Host { get; init; } = "localhost";
    public int Port { get; init; } = 5672;
    public string UserName { get; init; } = "guest";
    public string Password { get; init; } = "guest";
    public string VirtualHost { get; init; } = "/";
    public string Exchange { get; init; } = "charkhoone.events";
    public string IdentityQueue { get; init; } = "charkhoone.identity-verification";
    public string IdentityReviewQueue { get; init; } = "charkhoone.identity-verification.review";
    public string CancellationNotificationQueue { get; init; } = "charkhoone.cancellation-notifications";
    public string CancellationNotificationReviewQueue { get; init; } = "charkhoone.cancellation-notifications.review";
    public ushort PrefetchCount { get; init; } = 4;
    public int MaxDeliveryAttempts { get; init; } = 5;
    public int OutboxBatchSize { get; init; } = 32;
    public int OutboxPollMilliseconds { get; init; } = 1000;
    public int RetryDelayMilliseconds { get; init; } = 30000;
    public int OperationTimeoutSeconds { get; init; } = 15;

    public TimeSpan OutboxPollInterval => TimeSpan.FromMilliseconds(OutboxPollMilliseconds);
    public TimeSpan RetryDelay => TimeSpan.FromMilliseconds(RetryDelayMilliseconds);
    public TimeSpan OperationTimeout => TimeSpan.FromSeconds(OperationTimeoutSeconds);

    public static RabbitMqWorkerOptions FromConfiguration(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        var section = configuration.GetSection(SectionName);

        return new RabbitMqWorkerOptions
        {
            Enabled = bool.TryParse(section["Enabled"], out var enabled) && enabled,
            Host = RequiredOrDefault(section["Host"], "localhost"),
            Port = PositiveInt(section["Port"], 5672, 1, 65535),
            UserName = RequiredOrDefault(section["UserName"], "guest"),
            Password = RequiredOrDefault(section["Password"], "guest"),
            VirtualHost = RequiredOrDefault(section["VirtualHost"], "/"),
            Exchange = RequiredOrDefault(section["Exchange"], "charkhoone.events"),
            IdentityQueue = RequiredOrDefault(section["IdentityQueue"], "charkhoone.identity-verification"),
            IdentityReviewQueue = RequiredOrDefault(section["IdentityReviewQueue"], "charkhoone.identity-verification.review"),
            CancellationNotificationQueue = RequiredOrDefault(section["CancellationNotificationQueue"], "charkhoone.cancellation-notifications"),
            CancellationNotificationReviewQueue = RequiredOrDefault(section["CancellationNotificationReviewQueue"], "charkhoone.cancellation-notifications.review"),
            PrefetchCount = (ushort)PositiveInt(section["PrefetchCount"], 4, 1, ushort.MaxValue),
            MaxDeliveryAttempts = PositiveInt(section["MaxDeliveryAttempts"], 5, 1, 100),
            OutboxBatchSize = PositiveInt(section["OutboxBatchSize"], 32, 1, 500),
            OutboxPollMilliseconds = PositiveInt(section["OutboxPollMilliseconds"], 1000, 100, 60000),
            RetryDelayMilliseconds = PositiveInt(section["RetryDelayMilliseconds"], 30000, 1000, 600000),
            OperationTimeoutSeconds = PositiveInt(section["OperationTimeoutSeconds"], 15, 1, 120),
        };
    }

    public ConnectionFactory CreateConnectionFactory() => new()
    {
        HostName = Host,
        Port = Port,
        UserName = UserName,
        Password = Password,
        VirtualHost = VirtualHost,
        AutomaticRecoveryEnabled = true,
        TopologyRecoveryEnabled = true,
        NetworkRecoveryInterval = TimeSpan.FromSeconds(5),
    };

    private static string RequiredOrDefault(string? value, string fallback) =>
        string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();

    private static int PositiveInt(string? value, int fallback, int minimum, int maximum) =>
        int.TryParse(value, out var parsed)
            ? Math.Clamp(parsed, minimum, maximum)
            : fallback;
}
