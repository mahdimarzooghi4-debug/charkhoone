namespace Charkhoone.Domain.Workflows;

public sealed record WorkflowTransition<TStatus>(
    TStatus From,
    TStatus To,
    string ActorId,
    string Reason,
    DateTimeOffset OccurredAtUtc)
    where TStatus : struct, Enum;
