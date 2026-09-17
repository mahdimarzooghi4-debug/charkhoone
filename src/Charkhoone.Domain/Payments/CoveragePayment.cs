namespace Charkhoone.Domain.Payments;

public enum CoveragePaymentStatus
{
    Pending,
    Succeeded,
    Failed,
    Unknown,
}

public static class CoveragePaymentStateMachine
{
    private static readonly IReadOnlyDictionary<CoveragePaymentStatus, IReadOnlySet<CoveragePaymentStatus>> AllowedTransitions =
        new Dictionary<CoveragePaymentStatus, IReadOnlySet<CoveragePaymentStatus>>
        {
            [CoveragePaymentStatus.Pending] = Set(
                CoveragePaymentStatus.Succeeded,
                CoveragePaymentStatus.Failed,
                CoveragePaymentStatus.Unknown),
            [CoveragePaymentStatus.Unknown] = Set(
                CoveragePaymentStatus.Succeeded,
                CoveragePaymentStatus.Failed,
                CoveragePaymentStatus.Unknown),
            [CoveragePaymentStatus.Succeeded] = Set(),
            [CoveragePaymentStatus.Failed] = Set(),
        };

    public static CoveragePaymentStatus Transition(CoveragePaymentStatus current, CoveragePaymentStatus next)
    {
        if (!AllowedTransitions[current].Contains(next))
        {
            throw new InvalidOperationException($"Coverage transition {current} -> {next} is not allowed.");
        }

        return next;
    }

    private static IReadOnlySet<CoveragePaymentStatus> Set(params CoveragePaymentStatus[] values) =>
        new HashSet<CoveragePaymentStatus>(values);
}
