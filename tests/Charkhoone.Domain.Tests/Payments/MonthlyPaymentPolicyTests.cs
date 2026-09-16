using Charkhoone.Domain.Payments;
using Xunit;

namespace Charkhoone.Domain.Tests.Payments;

public sealed class MonthlyPaymentPolicyTests
{
    [Fact]
    public void FullCurrentMonthPayment_BreaksConsecutiveMissChain()
    {
        var tracker = new ConsecutiveMissedMonths();
        tracker.RegisterClosedMonth(tenantPaidInFull: false);
        tracker.RegisterClosedMonth(tenantPaidInFull: false);

        tracker.RegisterClosedMonth(tenantPaidInFull: true);

        Assert.Equal(0, tracker.Count);
        Assert.False(tracker.RequiresCancellation);
    }

    [Fact]
    public void ThirdConsecutiveMiss_RequiresCancellationAndCannotBeResetLater()
    {
        var tracker = new ConsecutiveMissedMonths();
        tracker.RegisterClosedMonth(tenantPaidInFull: false);
        tracker.RegisterClosedMonth(tenantPaidInFull: false);
        tracker.RegisterClosedMonth(tenantPaidInFull: false);

        Assert.True(tracker.RequiresCancellation);
        Assert.Equal(3, tracker.Count);
        Assert.Throws<InvalidOperationException>(() => tracker.RegisterClosedMonth(tenantPaidInFull: true));
    }

    [Fact]
    public void UnknownPayment_CanMoveToReconciliationRequiredWithoutBecomingSuccess()
    {
        var state = PaymentInstructionStateMachine.Transition(
            PaymentInstructionStatus.Pending,
            PaymentInstructionStatus.Unknown);

        state = PaymentInstructionStateMachine.Transition(
            state,
            PaymentInstructionStatus.ReconciliationRequired);

        Assert.Equal(PaymentInstructionStatus.ReconciliationRequired, state);
    }
}
