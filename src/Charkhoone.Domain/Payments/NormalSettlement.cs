namespace Charkhoone.Domain.Payments;

public enum NormalSettlementTransferStatus
{
    NotRequired,
    Pending,
    Unknown,
    Failed,
    Succeeded,
}

public static class NormalSettlementTransferStateMachine
{
    private static readonly IReadOnlyDictionary<NormalSettlementTransferStatus, IReadOnlySet<NormalSettlementTransferStatus>> AllowedTransitions =
        new Dictionary<NormalSettlementTransferStatus, IReadOnlySet<NormalSettlementTransferStatus>>
        {
            [NormalSettlementTransferStatus.NotRequired] = Set(),
            [NormalSettlementTransferStatus.Pending] = Set(
                NormalSettlementTransferStatus.Unknown,
                NormalSettlementTransferStatus.Failed,
                NormalSettlementTransferStatus.Succeeded),
            [NormalSettlementTransferStatus.Unknown] = Set(
                NormalSettlementTransferStatus.Unknown,
                NormalSettlementTransferStatus.Failed,
                NormalSettlementTransferStatus.Succeeded),
            [NormalSettlementTransferStatus.Failed] = Set(),
            [NormalSettlementTransferStatus.Succeeded] = Set(),
        };

    public static NormalSettlementTransferStatus Transition(
        NormalSettlementTransferStatus current,
        NormalSettlementTransferStatus next)
    {
        if (!AllowedTransitions[current].Contains(next))
        {
            throw new InvalidOperationException($"Normal-settlement transfer transition {current} -> {next} is not allowed.");
        }

        return next;
    }

    public static bool IsCompleted(NormalSettlementTransferStatus status) =>
        status is NormalSettlementTransferStatus.Succeeded or NormalSettlementTransferStatus.NotRequired;

    private static IReadOnlySet<NormalSettlementTransferStatus> Set(params NormalSettlementTransferStatus[] values) =>
        new HashSet<NormalSettlementTransferStatus>(values);
}
