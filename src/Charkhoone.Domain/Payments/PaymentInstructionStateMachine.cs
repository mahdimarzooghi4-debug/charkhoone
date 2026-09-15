namespace Charkhoone.Domain.Payments;

public enum PaymentInstructionStatus
{
    Created,
    Pending,
    Succeeded,
    Failed,
    Unknown,
    ReconciliationRequired,
    Reversed,
}

public static class PaymentInstructionStateMachine
{
    private static readonly IReadOnlyDictionary<PaymentInstructionStatus, IReadOnlySet<PaymentInstructionStatus>> AllowedTransitions =
        new Dictionary<PaymentInstructionStatus, IReadOnlySet<PaymentInstructionStatus>>
        {
            [PaymentInstructionStatus.Created] = Set(PaymentInstructionStatus.Pending),
            [PaymentInstructionStatus.Pending] = Set(PaymentInstructionStatus.Succeeded, PaymentInstructionStatus.Failed, PaymentInstructionStatus.Unknown),
            [PaymentInstructionStatus.Unknown] = Set(PaymentInstructionStatus.ReconciliationRequired, PaymentInstructionStatus.Succeeded, PaymentInstructionStatus.Failed),
            [PaymentInstructionStatus.ReconciliationRequired] = Set(PaymentInstructionStatus.Succeeded, PaymentInstructionStatus.Failed, PaymentInstructionStatus.Unknown),
            [PaymentInstructionStatus.Succeeded] = Set(PaymentInstructionStatus.Reversed),
            [PaymentInstructionStatus.Failed] = Set(),
            [PaymentInstructionStatus.Reversed] = Set(),
        };

    public static bool CanTransition(PaymentInstructionStatus current, PaymentInstructionStatus next) =>
        AllowedTransitions[current].Contains(next);

    public static PaymentInstructionStatus Transition(PaymentInstructionStatus current, PaymentInstructionStatus next)
    {
        if (!CanTransition(current, next))
        {
            throw new InvalidOperationException($"Transition {current} -> {next} is not allowed.");
        }

        return next;
    }

    private static IReadOnlySet<PaymentInstructionStatus> Set(params PaymentInstructionStatus[] values) =>
        new HashSet<PaymentInstructionStatus>(values);
}
