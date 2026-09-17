using Charkhoone.Domain.Workflows;

namespace Charkhoone.Domain.CreditApplications;

public enum CreditApplicationStatus
{
    Draft,
    IdentityPending,
    OrganizationCheckPending,
    PlanSelectionPending,
    PropertyContractPending,
    ExternalChecksPending,
    ExternalCheckIndeterminate,
    NeedsDocuments,
    DecisionReady,
    BankApprovalPending,
    FundingPending,
    ApprovedFunded,
    Rejected,
    Withdrawn,
    Expired,
}

public sealed class CreditApplicationWorkflow
{
    private static readonly IReadOnlyDictionary<CreditApplicationStatus, IReadOnlySet<CreditApplicationStatus>> AllowedTransitions =
        new Dictionary<CreditApplicationStatus, IReadOnlySet<CreditApplicationStatus>>
        {
            [CreditApplicationStatus.Draft] = Set(CreditApplicationStatus.IdentityPending, CreditApplicationStatus.Withdrawn),
            [CreditApplicationStatus.IdentityPending] = Set(CreditApplicationStatus.OrganizationCheckPending, CreditApplicationStatus.PlanSelectionPending, CreditApplicationStatus.NeedsDocuments, CreditApplicationStatus.Rejected),
            [CreditApplicationStatus.OrganizationCheckPending] = Set(CreditApplicationStatus.PlanSelectionPending, CreditApplicationStatus.NeedsDocuments, CreditApplicationStatus.Rejected),
            [CreditApplicationStatus.PlanSelectionPending] = Set(CreditApplicationStatus.PropertyContractPending, CreditApplicationStatus.Withdrawn, CreditApplicationStatus.Expired),
            [CreditApplicationStatus.PropertyContractPending] = Set(CreditApplicationStatus.ExternalChecksPending, CreditApplicationStatus.NeedsDocuments, CreditApplicationStatus.Withdrawn),
            [CreditApplicationStatus.ExternalChecksPending] = Set(CreditApplicationStatus.DecisionReady, CreditApplicationStatus.ExternalCheckIndeterminate, CreditApplicationStatus.NeedsDocuments, CreditApplicationStatus.Rejected),
            [CreditApplicationStatus.ExternalCheckIndeterminate] = Set(CreditApplicationStatus.ExternalChecksPending, CreditApplicationStatus.DecisionReady, CreditApplicationStatus.BankApprovalPending, CreditApplicationStatus.FundingPending, CreditApplicationStatus.Rejected),
            [CreditApplicationStatus.NeedsDocuments] = Set(CreditApplicationStatus.Withdrawn, CreditApplicationStatus.Expired),
            [CreditApplicationStatus.DecisionReady] = Set(CreditApplicationStatus.BankApprovalPending, CreditApplicationStatus.Rejected),
            [CreditApplicationStatus.BankApprovalPending] = Set(CreditApplicationStatus.FundingPending, CreditApplicationStatus.ExternalCheckIndeterminate, CreditApplicationStatus.Rejected),
            [CreditApplicationStatus.FundingPending] = Set(CreditApplicationStatus.ApprovedFunded, CreditApplicationStatus.ExternalCheckIndeterminate, CreditApplicationStatus.Expired),
            [CreditApplicationStatus.ApprovedFunded] = Set(),
            [CreditApplicationStatus.Rejected] = Set(),
            [CreditApplicationStatus.Withdrawn] = Set(),
            [CreditApplicationStatus.Expired] = Set(),
        };

    private static readonly IReadOnlySet<CreditApplicationStatus> NeedsDocumentsResumeTargets = Set(
        CreditApplicationStatus.IdentityPending,
        CreditApplicationStatus.OrganizationCheckPending,
        CreditApplicationStatus.PropertyContractPending,
        CreditApplicationStatus.ExternalChecksPending);

    private readonly List<WorkflowTransition<CreditApplicationStatus>> _transitions = [];

    public CreditApplicationWorkflow()
        : this(CreditApplicationStatus.Draft)
    {
    }

    private CreditApplicationWorkflow(CreditApplicationStatus status)
    {
        Status = status;
    }

    public CreditApplicationStatus Status { get; private set; }
    public IReadOnlyList<WorkflowTransition<CreditApplicationStatus>> Transitions => _transitions;

    public static CreditApplicationWorkflow Restore(CreditApplicationStatus status) => new(status);

    public WorkflowTransition<CreditApplicationStatus> MoveTo(
        CreditApplicationStatus next,
        string actorId,
        string reason,
        DateTimeOffset occurredAtUtc)
    {
        if (!AllowedTransitions[Status].Contains(next))
        {
            throw new InvalidOperationException($"Transition {Status} -> {next} is not allowed.");
        }

        return Apply(next, actorId, reason, occurredAtUtc);
    }

    public WorkflowTransition<CreditApplicationStatus> ResumeFromNeedsDocuments(
        CreditApplicationStatus previousWorkflowStatus,
        string actorId,
        string reason,
        DateTimeOffset occurredAtUtc)
    {
        if (Status != CreditApplicationStatus.NeedsDocuments)
        {
            throw new InvalidOperationException("Resume is only valid from NeedsDocuments.");
        }

        if (!NeedsDocumentsResumeTargets.Contains(previousWorkflowStatus))
        {
            throw new InvalidOperationException($"{previousWorkflowStatus} is not a valid resumable source for NeedsDocuments.");
        }

        return Apply(previousWorkflowStatus, actorId, reason, occurredAtUtc);
    }

    private WorkflowTransition<CreditApplicationStatus> Apply(
        CreditApplicationStatus next,
        string actorId,
        string reason,
        DateTimeOffset occurredAtUtc)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(actorId);
        ArgumentException.ThrowIfNullOrWhiteSpace(reason);

        var transition = new WorkflowTransition<CreditApplicationStatus>(Status, next, actorId, reason, occurredAtUtc);
        Status = next;
        _transitions.Add(transition);
        return transition;
    }

    private static IReadOnlySet<CreditApplicationStatus> Set(params CreditApplicationStatus[] values) =>
        new HashSet<CreditApplicationStatus>(values);
}
