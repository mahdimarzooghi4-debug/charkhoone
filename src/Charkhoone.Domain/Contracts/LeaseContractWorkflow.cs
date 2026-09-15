using Charkhoone.Domain.Workflows;

namespace Charkhoone.Domain.Contracts;

public enum LeaseContractStatus
{
    Draft,
    AwaitingFunding,
    AwaitingCompletion,
    Active,
    SettlementPending,
    Settled,
    CancellationPending,
    Cancelled,
}

public sealed class LeaseContractWorkflow
{
    private static readonly IReadOnlyDictionary<LeaseContractStatus, IReadOnlySet<LeaseContractStatus>> AllowedTransitions =
        new Dictionary<LeaseContractStatus, IReadOnlySet<LeaseContractStatus>>
        {
            [LeaseContractStatus.Draft] = Set(LeaseContractStatus.AwaitingFunding),
            [LeaseContractStatus.AwaitingFunding] = Set(LeaseContractStatus.AwaitingCompletion),
            [LeaseContractStatus.AwaitingCompletion] = Set(LeaseContractStatus.Active),
            [LeaseContractStatus.Active] = Set(LeaseContractStatus.SettlementPending, LeaseContractStatus.CancellationPending),
            [LeaseContractStatus.SettlementPending] = Set(LeaseContractStatus.Settled),
            [LeaseContractStatus.Settled] = Set(),
            [LeaseContractStatus.CancellationPending] = Set(LeaseContractStatus.Cancelled),
            [LeaseContractStatus.Cancelled] = Set(),
        };

    private readonly List<WorkflowTransition<LeaseContractStatus>> _transitions = [];

    public LeaseContractStatus Status { get; private set; } = LeaseContractStatus.Draft;
    public IReadOnlyList<WorkflowTransition<LeaseContractStatus>> Transitions => _transitions;

    public WorkflowTransition<LeaseContractStatus> MoveTo(
        LeaseContractStatus next,
        string actorId,
        string reason,
        DateTimeOffset occurredAtUtc)
    {
        if (!AllowedTransitions[Status].Contains(next))
        {
            throw new InvalidOperationException($"Transition {Status} -> {next} is not allowed.");
        }

        ArgumentException.ThrowIfNullOrWhiteSpace(actorId);
        ArgumentException.ThrowIfNullOrWhiteSpace(reason);

        var transition = new WorkflowTransition<LeaseContractStatus>(Status, next, actorId, reason, occurredAtUtc);
        Status = next;
        _transitions.Add(transition);
        return transition;
    }

    private static IReadOnlySet<LeaseContractStatus> Set(params LeaseContractStatus[] values) =>
        new HashSet<LeaseContractStatus>(values);
}
