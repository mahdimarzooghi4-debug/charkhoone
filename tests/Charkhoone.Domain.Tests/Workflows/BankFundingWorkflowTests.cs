using Charkhoone.Domain.CreditApplications;
using Xunit;

namespace Charkhoone.Domain.Tests.Workflows;

public sealed class BankFundingWorkflowTests
{
    private static readonly DateTimeOffset Now = new(2026, 9, 16, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void IndeterminateBankApproval_CanResumeBankApprovalWithoutReopeningEarlierChecks()
    {
        var workflow = CreditApplicationWorkflow.Restore(CreditApplicationStatus.BankApprovalPending);

        workflow.MoveTo(
            CreditApplicationStatus.ExternalCheckIndeterminate,
            "bank:1",
            "bank result unknown",
            Now);
        workflow.MoveTo(
            CreditApplicationStatus.BankApprovalPending,
            "system:reconciliation",
            "bank query resumed",
            Now);

        Assert.Equal(CreditApplicationStatus.BankApprovalPending, workflow.Status);
    }

    [Fact]
    public void IndeterminateFundFreeze_CanResumeFundingWithoutRepeatingBankApproval()
    {
        var workflow = CreditApplicationWorkflow.Restore(CreditApplicationStatus.FundingPending);

        workflow.MoveTo(
            CreditApplicationStatus.ExternalCheckIndeterminate,
            "fund:1",
            "fund result unknown",
            Now);
        workflow.MoveTo(
            CreditApplicationStatus.FundingPending,
            "system:reconciliation",
            "fund query resumed",
            Now);

        Assert.Equal(CreditApplicationStatus.FundingPending, workflow.Status);
    }
}
