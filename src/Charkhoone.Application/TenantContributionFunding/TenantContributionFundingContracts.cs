using Charkhoone.Domain.CreditApplications;

namespace Charkhoone.Application.TenantContributionFunding;

public enum ReconcileTenantContributionOutcome
{
    Reconciled,
    AlreadyReconciled,
    Failed,
    Indeterminate,
    NotFound,
    InvalidState,
}

public sealed record TenantContributionFundingView(
    Guid CreditApplicationId,
    CreditApplicationStatus ApplicationStatus,
    Guid ContractId,
    Guid FundingAllocationId,
    decimal TenantContributionRial,
    string? FundReference,
    Guid? ExternalTransactionId,
    Guid? JournalEntryId,
    DateTimeOffset UpdatedAtUtc);

public sealed record ReconcileTenantContributionResult(
    ReconcileTenantContributionOutcome Outcome,
    TenantContributionFundingView? Funding);

public interface ITenantContributionFundingService
{
    Task<ReconcileTenantContributionResult> ReconcileAsync(
        Guid applicationId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default);
}
