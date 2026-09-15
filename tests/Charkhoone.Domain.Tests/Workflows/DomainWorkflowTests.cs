using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Payments;
using Xunit;

namespace Charkhoone.Domain.Tests.Workflows;

public sealed class DomainWorkflowTests
{
    private static readonly DateTimeOffset Now = new(2026, 9, 15, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void CreditApplication_PublicPath_ReachesApprovedFunded()
    {
        var workflow = new CreditApplicationWorkflow();

        workflow.MoveTo(CreditApplicationStatus.IdentityPending, "tenant:1", "submit", Now);
        workflow.MoveTo(CreditApplicationStatus.PlanSelectionPending, "system", "identity verified", Now);
        workflow.MoveTo(CreditApplicationStatus.PropertyContractPending, "tenant:1", "plan selected", Now);
        workflow.MoveTo(CreditApplicationStatus.ExternalChecksPending, "tenant:1", "property and contract supplied", Now);
        workflow.MoveTo(CreditApplicationStatus.DecisionReady, "system", "external checks valid", Now);
        workflow.MoveTo(CreditApplicationStatus.BankApprovalPending, "tenant:1", "terms accepted", Now);
        workflow.MoveTo(CreditApplicationStatus.FundingPending, "bank:1", "bank approved", Now);
        workflow.MoveTo(CreditApplicationStatus.ApprovedFunded, "fund:1", "loan and tenant contribution reconciled", Now);

        Assert.Equal(CreditApplicationStatus.ApprovedFunded, workflow.Status);
        Assert.Equal(8, workflow.Transitions.Count);
    }

    [Fact]
    public void ExternalCheckIndeterminate_IsNotBusinessRejection_AndCanBeRetriedByQueryFlow()
    {
        var workflow = ReachExternalChecks();

        workflow.MoveTo(CreditApplicationStatus.ExternalCheckIndeterminate, "system", "provider timeout", Now);
        workflow.MoveTo(CreditApplicationStatus.ExternalChecksPending, "operator:1", "query scheduled", Now);

        Assert.Equal(CreditApplicationStatus.ExternalChecksPending, workflow.Status);
    }

    [Fact]
    public void NeedsDocuments_ResumesOnlyToAWorkflowStateThatCanOriginallyRequestDocuments()
    {
        var workflow = new CreditApplicationWorkflow();
        workflow.MoveTo(CreditApplicationStatus.IdentityPending, "tenant:1", "submit", Now);
        workflow.MoveTo(CreditApplicationStatus.NeedsDocuments, "operator:1", "identity document missing", Now);

        workflow.ResumeFromNeedsDocuments(CreditApplicationStatus.IdentityPending, "tenant:1", "document supplied", Now);

        Assert.Equal(CreditApplicationStatus.IdentityPending, workflow.Status);
    }

    [Fact]
    public void NeedsDocuments_CannotResumeToFundingPending()
    {
        var workflow = new CreditApplicationWorkflow();
        workflow.MoveTo(CreditApplicationStatus.IdentityPending, "tenant:1", "submit", Now);
        workflow.MoveTo(CreditApplicationStatus.NeedsDocuments, "operator:1", "identity document missing", Now);

        Assert.Throws<InvalidOperationException>(() =>
            workflow.ResumeFromNeedsDocuments(CreditApplicationStatus.FundingPending, "operator:1", "invalid resume", Now));
    }

    [Fact]
    public void TerminalCreditApplication_CannotBeReopenedByDirectTransition()
    {
        var workflow = new CreditApplicationWorkflow();
        workflow.MoveTo(CreditApplicationStatus.Withdrawn, "tenant:1", "withdrawn", Now);

        Assert.Throws<InvalidOperationException>(() =>
            workflow.MoveTo(CreditApplicationStatus.IdentityPending, "tenant:1", "reopen", Now));
    }

    [Fact]
    public void LeaseContract_NormalSettlementPath_IsExplicit()
    {
        var workflow = ReachActiveLease();

        workflow.MoveTo(LeaseContractStatus.SettlementPending, "system", "contract end reached", Now);
        workflow.MoveTo(LeaseContractStatus.Settled, "operator:checker", "bank principal and tenant balance reconciled", Now);

        Assert.Equal(LeaseContractStatus.Settled, workflow.Status);
    }

    [Fact]
    public void LeaseContract_CancellationPath_StartsFromActive()
    {
        var workflow = ReachActiveLease();

        workflow.MoveTo(LeaseContractStatus.CancellationPending, "system", "three consecutive missed months", Now);
        workflow.MoveTo(LeaseContractStatus.Cancelled, "operator:checker", "authorized cancellation transfer reconciled", Now);

        Assert.Equal(LeaseContractStatus.Cancelled, workflow.Status);
    }

    [Fact]
    public void ThreeClosedMonthsWithoutFullTenantPayment_TriggerCancellation()
    {
        var counter = new ConsecutiveMissedMonths();

        counter.RegisterClosedMonth(false);
        counter.RegisterClosedMonth(false);
        Assert.False(counter.RequiresCancellation);

        counter.RegisterClosedMonth(false);

        Assert.Equal(3, counter.Count);
        Assert.True(counter.RequiresCancellation);
    }

    [Fact]
    public void FullPaymentOfCurrentMonth_BreaksConsecutiveChainWithoutModelingOldDebtAsSettled()
    {
        var counter = new ConsecutiveMissedMonths();
        counter.RegisterClosedMonth(false);
        counter.RegisterClosedMonth(true);

        Assert.Equal(0, counter.Count);
        Assert.False(counter.RequiresCancellation);
    }

    [Fact]
    public void UnknownPayment_IsNotBlindlyReturnedToPending()
    {
        var status = PaymentInstructionStateMachine.Transition(PaymentInstructionStatus.Created, PaymentInstructionStatus.Pending);
        status = PaymentInstructionStateMachine.Transition(status, PaymentInstructionStatus.Unknown);

        Assert.Throws<InvalidOperationException>(() =>
            PaymentInstructionStateMachine.Transition(status, PaymentInstructionStatus.Pending));

        Assert.True(PaymentInstructionStateMachine.CanTransition(status, PaymentInstructionStatus.ReconciliationRequired));
    }

    private static CreditApplicationWorkflow ReachExternalChecks()
    {
        var workflow = new CreditApplicationWorkflow();
        workflow.MoveTo(CreditApplicationStatus.IdentityPending, "tenant:1", "submit", Now);
        workflow.MoveTo(CreditApplicationStatus.PlanSelectionPending, "system", "identity verified", Now);
        workflow.MoveTo(CreditApplicationStatus.PropertyContractPending, "tenant:1", "plan selected", Now);
        workflow.MoveTo(CreditApplicationStatus.ExternalChecksPending, "tenant:1", "property and contract supplied", Now);
        return workflow;
    }

    private static LeaseContractWorkflow ReachActiveLease()
    {
        var workflow = new LeaseContractWorkflow();
        workflow.MoveTo(LeaseContractStatus.AwaitingFunding, "system", "contract registered", Now);
        workflow.MoveTo(LeaseContractStatus.AwaitingCompletion, "fund:1", "funding reconciled", Now);
        workflow.MoveTo(LeaseContractStatus.Active, "operator:checker", "delivery and completion confirmed", Now);
        return workflow;
    }
}
