using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;

namespace Charkhoone.Application.Contracts;

public enum ExternalPropertyContractEvidenceStatus
{
    Confirmed,
    NeedsDocuments,
    Indeterminate,
}

public sealed record ExternalPropertyContractEvidenceRequest(
    Guid VerificationRequestId,
    Guid CreditApplicationId,
    Guid ApplicantUserId,
    Guid BankLoanPlanId,
    string BankLoanPlanVersion);

public sealed record ExternalPropertyContractEvidenceResponse(
    ExternalPropertyContractEvidenceStatus Status,
    string Provider,
    Guid? OwnerUserId = null,
    Guid? PropertyId = null,
    int? PersianStartYear = null,
    int? PersianStartMonth = null,
    int? PersianStartDay = null,
    decimal? CashDepositRial = null,
    decimal? MonthlyRentRial = null,
    string? OwnerBeneficiaryId = null,
    string? BankBeneficiaryId = null,
    IReadOnlyList<LeaseContractScheduleMonthInput>? ScheduleMonths = null,
    string? ExternalReference = null,
    string? ReasonCode = null);

public interface IExternalPropertyContractEvidenceAdapter
{
    string Provider { get; }

    Task<ExternalPropertyContractEvidenceResponse> CheckAsync(
        ExternalPropertyContractEvidenceRequest request,
        CancellationToken cancellationToken = default);
}

public enum ReconcilePropertyContractOutcome
{
    Registered,
    AlreadyRegistered,
    NeedsDocuments,
    Indeterminate,
    NotFound,
    Conflict,
    InvalidState,
}

public sealed record PropertyContractRegistrationView(
    Guid CreditApplicationId,
    CreditApplicationStatus ApplicationStatus,
    Guid ContractId,
    LeaseContractStatus ContractStatus,
    Guid TenantUserId,
    Guid OwnerUserId,
    Guid PropertyId,
    Guid BankLoanPlanId,
    string BankLoanPlanVersion,
    decimal FullDepositEquivalentRial,
    string SourceReference,
    DateTimeOffset UpdatedAtUtc);

public sealed record ReconcilePropertyContractResult(
    ReconcilePropertyContractOutcome Outcome,
    PropertyContractRegistrationView? Registration);

public interface IPropertyContractRegistrationService
{
    Task<ReconcilePropertyContractResult> ReconcileAsync(
        Guid applicationId,
        Guid applicantUserId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default);
}
