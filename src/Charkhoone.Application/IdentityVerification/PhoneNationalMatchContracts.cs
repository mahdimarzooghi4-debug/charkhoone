namespace Charkhoone.Application.IdentityVerification;

// An OTP or authenticated session proves access, not legal ownership, of a phone number.
// This is a separate, charge-aware national-ID/phone ownership verification boundary.
public enum PhoneNationalMatchOutcome
{
    Matched,
    Mismatched,
    Indeterminate,
}

public sealed record PhoneNationalMatchRequest(
    Guid UserId,
    string NationalId,
    string VerifiedMobile,
    string IdempotencyKey);

public sealed record PhoneNationalMatchResponse(
    PhoneNationalMatchOutcome Outcome,
    string Provider,
    string? ExternalReference = null);

// A production adapter must guarantee that repeated requests with the same
// IdempotencyKey cannot create additional billable external inquiries.
public interface IPhoneNationalMatchAdapter
{
    string Provider { get; }
    bool GuaranteesProviderIdempotency { get; }

    Task<PhoneNationalMatchResponse> VerifyAsync(
        PhoneNationalMatchRequest request,
        CancellationToken cancellationToken = default);
}

public enum PhoneNationalMatchProcessStatus
{
    Verified,
    AlreadyVerified,
    Mismatch,
    Indeterminate,
    NotConfigured,
    InvalidInput,
    UserNotFound,
}

public sealed record PhoneNationalMatchResult(PhoneNationalMatchProcessStatus Status, bool Verified);

public interface IPhoneNationalMatchService
{
    Task<bool> IsVerifiedForPhoneAsync(
        Guid userId, string verifiedMobile, CancellationToken cancellationToken = default);

    Task<PhoneNationalMatchResult> VerifyAsync(
        Guid userId, string verifiedMobile, string nationalId, DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default);
}
