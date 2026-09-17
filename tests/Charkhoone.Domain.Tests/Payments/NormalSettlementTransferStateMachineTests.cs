using Charkhoone.Domain.Payments;
using Xunit;

namespace Charkhoone.Domain.Tests.Payments;

public sealed class NormalSettlementTransferStateMachineTests
{
    [Fact]
    public void Pending_CanBecomeUnknownThenSucceeded()
    {
        var status = NormalSettlementTransferStateMachine.Transition(
            NormalSettlementTransferStatus.Pending,
            NormalSettlementTransferStatus.Unknown);

        status = NormalSettlementTransferStateMachine.Transition(
            status,
            NormalSettlementTransferStatus.Succeeded);

        Assert.Equal(NormalSettlementTransferStatus.Succeeded, status);
        Assert.True(NormalSettlementTransferStateMachine.IsCompleted(status));
    }

    [Fact]
    public void NotRequired_IsCompletedAndTerminal()
    {
        Assert.True(NormalSettlementTransferStateMachine.IsCompleted(
            NormalSettlementTransferStatus.NotRequired));

        Assert.Throws<InvalidOperationException>(() =>
            NormalSettlementTransferStateMachine.Transition(
                NormalSettlementTransferStatus.NotRequired,
                NormalSettlementTransferStatus.Succeeded));
    }

    [Fact]
    public void Failed_IsTerminal()
    {
        Assert.Throws<InvalidOperationException>(() =>
            NormalSettlementTransferStateMachine.Transition(
                NormalSettlementTransferStatus.Failed,
                NormalSettlementTransferStatus.Succeeded));
    }
}
