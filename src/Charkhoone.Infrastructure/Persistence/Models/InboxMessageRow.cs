namespace Charkhoone.Infrastructure.Persistence.Models;

public sealed class InboxMessageRow
{
    public Guid MessageId { get; set; }
    public string Type { get; set; } = string.Empty;
    public DateTimeOffset ReceivedAtUtc { get; set; }
    public DateTimeOffset? ProcessedAtUtc { get; set; }
    public int AttemptCount { get; set; }
    public string? LastError { get; set; }
}
