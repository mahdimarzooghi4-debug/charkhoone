using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Finance;

namespace Charkhoone.Application.CreditEligibility;

public sealed record ExternalCreditGradeRequest(
    Guid AssessmentId,
    Guid CreditApplicationId,
    Guid ApplicantUserId);

public sealed record ExternalCreditGradeResponse(
    ExternalCreditResultStatus Status,
    string Provider,
    string? ExternalSubGrade,
    string? ExternalReference = null,
    string? ReasonCode = null);

public interface IExternalCreditGradeAdapter
{
    string Provider { get; }

    Task<ExternalCreditGradeResponse> CheckAsync(
        ExternalCreditGradeRequest request,
        CancellationToken cancellationToken = default);
}

public enum EvaluateCreditEligibilityOutcome
{
    Applied,
    AlreadyEvaluated,
    Indeterminate,
    NotFound,
    Conflict,
    InvalidState,
}

public sealed record CreditEligibilityView(
    Guid CreditApplicationId,
    CreditApplicationStatus ApplicationStatus,
    ExternalCreditResultStatus ExternalCreditStatus,
    string Provider,
    string? ExternalSubGrade,
    decimal FullDepositEquivalentRial,
    decimal? LoanRatio,
    decimal? MaximumEligibleLoanRial,
    DateTimeOffset UpdatedAtUtc);

public sealed record EvaluateCreditEligibilityResult(
    EvaluateCreditEligibilityOutcome Outcome,
    CreditEligibilityView? Eligibility);

public interface ICreditEligibilityService
{
    Task<EvaluateCreditEligibilityResult> EvaluateAsync(
        Guid applicationId,
        Guid applicantUserId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default);
}
