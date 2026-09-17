using Charkhoone.Domain.Payments;
using Xunit;

namespace Charkhoone.Domain.Tests.Payments;

public sealed class CancellationSettlementPolicyTests
{
    [Fact]
    public void UnknownSettlement_CanBeReconciledToCompleted()
    {
        var state = CancellationSettlementStateMachine.Transition(
            CancellationSettlementStatus.Pending,
            CancellationSettlementStatus.Unknown);

        state = CancellationSettlementStateMachine.Transition(
            state,
            CancellationSettlementStatus.Completed);

        Assert.Equal(CancellationSettlementStatus.Completed, state);
    }

    [Fact]
    public void CompletedSettlement_IsTerminal()
    {
        Assert.Throws<InvalidOperationException>(() =>
            CancellationSettlementStateMachine.Transition(
                CancellationSettlementStatus.Completed,
                CancellationSettlementStatus.Unknown));
    }

    [Fact]
    public void FailedSettlement_IsTerminalAndNotBlindlyRetried()
    {
        Assert.Throws<InvalidOperationException>(() =>
            CancellationSettlementStateMachine.Transition(
                CancellationSettlementStatus.Failed,
                CancellationSettlementStatus.Pending));
    }
}
