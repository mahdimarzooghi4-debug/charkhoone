using Charkhoone.Domain.CreditApplications;

namespace Charkhoone.Application.CreditApplications;

public sealed record CreditApplicationView(
    Guid Id,
    CreditApplicationStatus Status,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);

public enum SubmitCreditApplicationOutcome
{
    Submitted,
    AlreadySubmitted,
    NotFound,
    InvalidState,
}

public sealed record SubmitCreditApplicationResult(
    SubmitCreditApplicationOutcome Outcome,
    CreditApplicationView? Application);

public interface IUserIdentityLookup
{
    Task<Guid?> FindInternalUserIdAsync(
        string oidcSubject,
        CancellationToken cancellationToken = default);
}

public interface ICreditApplicationService
{
    Task<CreditApplicationView> CreateDraftAsync(
        Guid applicantUserId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default);

    Task<SubmitCreditApplicationResult> SubmitAsync(
        Guid applicationId,
        Guid applicantUserId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default);
}
