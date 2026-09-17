namespace Charkhoone.Domain.Payments;

public enum CancellationSettlementStatus
{
    Pending,
    Completed,
    Failed,
    Unknown,
}

public static class CancellationSettlementStateMachine
{
    private static readonly IReadOnlyDictionary<CancellationSettlementStatus, IReadOnlySet<CancellationSettlementStatus>> AllowedTransitions =
        new Dictionary<CancellationSettlementStatus, IReadOnlySet<CancellationSettlementStatus>>
        {
            [CancellationSettlementStatus.Pending] = Set(
                CancellationSettlementStatus.Completed,
                CancellationSettlementStatus.Failed,
                CancellationSettlementStatus.Unknown),
            [CancellationSettlementStatus.Unknown] = Set(
                CancellationSettlementStatus.Completed,
                CancellationSettlementStatus.Failed,
                CancellationSettlementStatus.Unknown),
            [CancellationSettlementStatus.Completed] = Set(),
            [CancellationSettlementStatus.Failed] = Set(),
        };

    public static CancellationSettlementStatus Transition(
        CancellationSettlementStatus current,
        CancellationSettlementStatus next)
    {
        if (!AllowedTransitions[current].Contains(next))
        {
            throw new InvalidOperationException($"Cancellation settlement transition {current} -> {next} is not allowed.");
        }

        return next;
    }

    private static IReadOnlySet<CancellationSettlementStatus> Set(params CancellationSettlementStatus[] values) =>
        new HashSet<CancellationSettlementStatus>(values);
}
