using Charkhoone.Domain.Payments;
using Xunit;

namespace Charkhoone.Domain.Tests.Workflows;

public sealed class CoveragePaymentStateMachineTests
{
    [Fact]
    public void UnknownCoverage_CanResolveButCannotBlindlyReturnToPending()
    {
        Assert.Equal(
            CoveragePaymentStatus.Succeeded,
            CoveragePaymentStateMachine.Transition(
                CoveragePaymentStatus.Unknown,
                CoveragePaymentStatus.Succeeded));

        Assert.Throws<InvalidOperationException>(() =>
            CoveragePaymentStateMachine.Transition(
                CoveragePaymentStatus.Unknown,
                CoveragePaymentStatus.Pending));
    }

    [Fact]
    public void FailedCoverage_IsTerminalForAutomaticFlow()
    {
        Assert.Throws<InvalidOperationException>(() =>
            CoveragePaymentStateMachine.Transition(
                CoveragePaymentStatus.Failed,
                CoveragePaymentStatus.Pending));
    }
}
