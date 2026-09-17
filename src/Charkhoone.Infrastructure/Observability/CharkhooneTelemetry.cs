using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace Charkhoone.Infrastructure.Observability;

public static class CharkhooneTelemetry
{
    public const string ActivitySourceName = "Charkhoone";
    public const string MeterName = "Charkhoone";

    public static readonly ActivitySource ActivitySource = new(ActivitySourceName);
    public static readonly Meter Meter = new(MeterName);

    private static readonly Counter<long> OutboxPublishedCounter =
        Meter.CreateCounter<long>("charkhoone.outbox.published", unit: "{message}");

    private static readonly Counter<long> OutboxPublishFailureCounter =
        Meter.CreateCounter<long>("charkhoone.outbox.publish_failures", unit: "{message}");

    private static readonly Counter<long> InboxProcessedCounter =
        Meter.CreateCounter<long>("charkhoone.inbox.processed", unit: "{message}");

    private static readonly Counter<long> InboxRetryCounter =
        Meter.CreateCounter<long>("charkhoone.inbox.retries", unit: "{message}");

    public static Activity? StartWorkerActivity(string operation, ActivityKind kind = ActivityKind.Internal) =>
        ActivitySource.StartActivity(operation, kind);

    public static void RecordOutboxPublished(long count = 1) => OutboxPublishedCounter.Add(count);

    public static void RecordOutboxPublishFailure() => OutboxPublishFailureCounter.Add(1);

    public static void RecordInboxProcessed() => InboxProcessedCounter.Add(1);

    public static void RecordInboxRetry() => InboxRetryCounter.Add(1);
}
