using Charkhoone.Domain.CreditApplications;

namespace Charkhoone.Application.IdentityVerification;

public enum IdentityVerificationOutcome
{
    Verified,
    NeedsDocuments,
    Indeterminate,
}

public sealed record IdentityVerificationRequest(
    Guid VerificationRequestId,
    Guid CreditApplicationId,
    Guid ApplicantUserId);

public sealed record IdentityVerificationResponse(
    IdentityVerificationOutcome Outcome,
    string Provider,
    string? ExternalReference = null,
    string? ReasonCode = null);

public interface IIdentityVerificationAdapter
{
    Task<IdentityVerificationResponse> VerifyAsync(
        IdentityVerificationRequest request,
        CancellationToken cancellationToken = default);
}

public enum ProcessIdentityVerificationOutcome
{
    Applied,
    Indeterminate,
    NotFound,
    InvalidState,
}

public sealed record ProcessIdentityVerificationResult(
    ProcessIdentityVerificationOutcome Outcome,
    CreditApplicationStatus? ApplicationStatus,
    IdentityVerificationOutcome? VerificationOutcome);

public interface ICreditApplicationIdentityService
{
    Task<ProcessIdentityVerificationResult> ProcessAsync(
        Guid applicationId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default);
}
