namespace Charkhoone.Application.Contracts;

public enum PrepareNormalMaturityOutcome
{
    Prepared,
    AlreadyPrepared,
    NotFound,
    NotMature,
    Blocked,
    InvalidState,
}

public sealed record PrepareNormalMaturityResult(
    PrepareNormalMaturityOutcome Outcome,
    Guid ContractId,
    DateTimeOffset? FinalMonthDueAtUtc = null,
    DateTimeOffset? FinalMonthClosedAtUtc = null);

public interface INormalMaturityService
{
    Task<PrepareNormalMaturityResult> PrepareAsync(
        Guid contractId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default);
}
