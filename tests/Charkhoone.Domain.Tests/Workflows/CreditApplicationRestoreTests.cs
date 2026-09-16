using Charkhoone.Domain.CreditApplications;
using Xunit;

namespace Charkhoone.Domain.Tests.Workflows;

public sealed class CreditApplicationRestoreTests
{
    private static readonly DateTimeOffset Now = new(2026, 9, 16, 18, 0, 0, TimeSpan.Zero);

    [Fact]
    public void RestoredIdentityPending_CanContinueToPlanSelection()
    {
        var workflow = CreditApplicationWorkflow.Restore(CreditApplicationStatus.IdentityPending);

        var transition = workflow.MoveTo(
            CreditApplicationStatus.PlanSelectionPending,
            "identity:test",
            "identity verified",
            Now);

        Assert.Equal(CreditApplicationStatus.IdentityPending, transition.From);
        Assert.Equal(CreditApplicationStatus.PlanSelectionPending, transition.To);
        Assert.Equal(CreditApplicationStatus.PlanSelectionPending, workflow.Status);
    }

    [Fact]
    public void RestoredTerminalState_RemainsTerminal()
    {
        var workflow = CreditApplicationWorkflow.Restore(CreditApplicationStatus.Rejected);

        Assert.Throws<InvalidOperationException>(() =>
            workflow.MoveTo(
                CreditApplicationStatus.IdentityPending,
                "system",
                "invalid reopen",
                Now));
    }
}
