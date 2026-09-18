using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;

namespace Charkhoone.Application.PilotOperations;

public enum PilotReconcileOperation
{
    Identity,
    PropertyContract,
    CreditEligibility,
    BankFunding,
    TenantContributionFunding,
}

public sealed record PilotCaseQueueQuery(
    CreditApplicationStatus? Status,
    int Page,
    int PageSize);

public sealed record PilotPaymentQueueQuery(
    Charkhoone.Domain.Payments.PaymentInstructionStatus? Status,
    int Page,
    int PageSize);

public sealed record PilotPaymentQueueItem(
    Guid PaymentInstructionId,
    Guid MonthlyObligationId,
    Guid ContractId,
    int ContractMonthNumber,
    Charkhoone.Domain.Payments.MonthlyObligationComponentKind Kind,
    string BeneficiaryId,
    decimal AmountRial,
    Charkhoone.Domain.Payments.PaymentInstructionStatus PaymentStatus,
    Guid? ExternalTransactionId,
    Charkhoone.Domain.Payments.ExternalTransactionStatus? ExternalTransactionStatus,
    string? Provider,
    string? ExternalReference,
    string? ReasonCode,
    DateTimeOffset DueAtUtc,
    DateTimeOffset UpdatedAtUtc);

public sealed record PilotCaseQueueItem(
    Guid CreditApplicationId,
    Guid ApplicantUserId,
    CreditApplicationStatus ApplicationStatus,
    Guid? ContractId,
    LeaseContractStatus? ContractStatus,
    string? LatestVerificationType,
    string? LatestVerificationStatus,
    string? CreditEligibilityStatus,
    string? BankApprovalStatus,
    string? FundFreezeStatus,
    string? TenantContributionStatus,
    PilotReconcileOperation? SuggestedOperation,
    DateTimeOffset UpdatedAtUtc);

public sealed record PilotVerificationView(
    Guid Id,
    string Type,
    string Provider,
    string Status,
    string? ExternalReference,
    string? ReasonCode,
    int AttemptCount,
    DateTimeOffset UpdatedAtUtc);

public sealed record PilotCreditEligibilityView(
    string Provider,
    string Status,
    string? ExternalSubGrade,
    decimal FullDepositEquivalentRial,
    decimal? LoanRatio,
    decimal? MaximumEligibleLoanRial,
    string? ExternalReference,
    string? ReasonCode,
    int AttemptCount,
    DateTimeOffset UpdatedAtUtc);

public sealed record PilotBankApprovalView(
    string Provider,
    string Status,
    decimal MaximumEligibleLoanRial,
    decimal? ApprovedLoanRial,
    string? ExternalReference,
    string? ReasonCode,
    int AttemptCount,
    DateTimeOffset UpdatedAtUtc);

public sealed record PilotFundingAllocationView(
    Guid Id,
    Guid ContractId,
    string BankId,
    decimal FullDepositEquivalentRial,
    decimal MaximumEligibleLoanRial,
    decimal BankApprovedLoanRial,
    decimal TenantContributionRial,
    DateTimeOffset UpdatedAtUtc);

public sealed record PilotFundFreezeView(
    string Provider,
    string Status,
    string? FundReference,
    string? ExternalReference,
    string? ReasonCode,
    int AttemptCount,
    DateTimeOffset UpdatedAtUtc);

public sealed record PilotTenantContributionFundingView(
    Guid FundingId,
    Guid ExternalTransactionId,
    string Provider,
    string Status,
    decimal AmountRial,
    string Currency,
    string? FundReference,
    string? ExternalReference,
    string? ReasonCode,
    int AttemptCount,
    DateTimeOffset UpdatedAtUtc);

public sealed record PilotAuditEventView(
    Guid Id,
    string ActorId,
    string Action,
    string Reason,
    DateTimeOffset OccurredAtUtc);

public sealed record PilotCaseDetail(
    Guid CreditApplicationId,
    Guid ApplicantUserId,
    CreditApplicationStatus ApplicationStatus,
    Guid? BankLoanPlanId,
    string? BankLoanPlanVersion,
    Guid? ContractId,
    LeaseContractStatus? ContractStatus,
    Guid? OwnerUserId,
    Guid? PropertyId,
    IReadOnlyList<PilotVerificationView> VerificationRequests,
    PilotCreditEligibilityView? CreditEligibility,
    PilotBankApprovalView? BankApproval,
    PilotFundingAllocationView? FundingAllocation,
    PilotFundFreezeView? FundFreeze,
    PilotTenantContributionFundingView? TenantContributionFunding,
    IReadOnlyList<PilotAuditEventView> RecentAuditEvents,
    PilotReconcileOperation? SuggestedOperation,
    DateTimeOffset UpdatedAtUtc);

public enum PilotReconcileOutcome
{
    Executed,
    NotFound,
    Conflict,
    InvalidState,
}

public sealed record PilotReconcileResult(
    PilotReconcileOutcome Outcome,
    PilotReconcileOperation Operation,
    string? OperationOutcome,
    CreditApplicationStatus? ApplicationStatus,
    LeaseContractStatus? ContractStatus,
    Guid? AuditEventId,
    DateTimeOffset OccurredAtUtc);

public interface IPilotOperationsService
{
    Task<IReadOnlyList<PilotPaymentQueueItem>> ListPaymentsAsync(
        PilotPaymentQueueQuery query,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PilotCaseQueueItem>> ListCasesAsync(
        PilotCaseQueueQuery query,
        CancellationToken cancellationToken = default);

    Task<PilotCaseDetail?> GetCaseAsync(
        Guid applicationId,
        CancellationToken cancellationToken = default);

    Task<PilotReconcileResult> ReconcileAsync(
        Guid applicationId,
        PilotReconcileOperation operation,
        string operatorSubject,
        string reason,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default);
}
