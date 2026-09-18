using Charkhoone.Domain.CreditApplications;

namespace Charkhoone.Application.BankFunding;

public enum BankApprovalDecisionStatus
{
    Approved,
    Declined,
    Indeterminate,
}

public sealed record BankApprovalRequest(
    Guid ApprovalId,
    Guid CreditApplicationId,
    Guid ApplicantUserId,
    Guid BankLoanPlanId,
    string BankLoanPlanVersion,
    string BankId,
    decimal MaximumEligibleLoanRial);

public sealed record BankApprovalResponse(
    BankApprovalDecisionStatus Status,
    string Provider,
    decimal? ApprovedLoanRial = null,
    string? ExternalReference = null,
    string? ReasonCode = null);

public interface IExternalBankApprovalAdapter
{
    string Provider { get; }

    Task<BankApprovalResponse> CheckAsync(
        BankApprovalRequest request,
        CancellationToken cancellationToken = default);
}

public enum FundPrincipalFreezeStatus
{
    Confirmed,
    Indeterminate,
}

public sealed record FundPrincipalFreezeRequest(
    Guid RequestId,
    Guid FundingAllocationId,
    Guid CreditApplicationId,
    Guid ContractId,
    string BankId,
    decimal AmountRial);

public sealed record FundPrincipalFreezeResponse(
    FundPrincipalFreezeStatus Status,
    string Provider,
    string? FundReference = null,
    string? ExternalReference = null,
    string? ReasonCode = null);

public enum FundTenantContributionStatus
{
    Confirmed,
    Failed,
    Indeterminate,
}

public sealed record FundTenantContributionRequest(
    Guid RequestId,
    Guid FundingAllocationId,
    Guid CreditApplicationId,
    Guid ContractId,
    Guid TenantUserId,
    decimal ExpectedAmountRial);

public sealed record FundTenantContributionResponse(
    FundTenantContributionStatus Status,
    string Provider,
    decimal? ConfirmedAmountRial = null,
    string? FundReference = null,
    string? ExternalReference = null,
    string? ReasonCode = null);

public interface IExternalFundAdapter
{
    string Provider { get; }

    Task<FundPrincipalFreezeResponse> FreezePrincipalAsync(
        FundPrincipalFreezeRequest request,
        CancellationToken cancellationToken = default);

    Task<FundTenantContributionResponse> CheckTenantContributionAsync(
        FundTenantContributionRequest request,
        CancellationToken cancellationToken = default);
}

public enum ProcessBankFundingOutcome
{
    Funded,
    AlreadyFunded,
    BankApprovalIndeterminate,
    BankDeclined,
    FundingIndeterminate,
    NotFound,
    Conflict,
    InvalidState,
}

public sealed record BankFundingView(
    Guid CreditApplicationId,
    CreditApplicationStatus ApplicationStatus,
    Guid? ContractId,
    string? BankId,
    decimal? FullDepositEquivalentRial,
    decimal? MaximumEligibleLoanRial,
    decimal? BankApprovedLoanRial,
    decimal? TenantContributionRial,
    string? FundReference,
    DateTimeOffset UpdatedAtUtc);

public sealed record ProcessBankFundingResult(
    ProcessBankFundingOutcome Outcome,
    BankFundingView? Funding);

public interface IBankFundingService
{
    Task<ProcessBankFundingResult> ProcessAsync(
        Guid applicationId,
        Guid applicantUserId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default);
}
