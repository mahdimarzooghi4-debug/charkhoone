using Charkhoone.Domain.CreditApplications;

namespace Charkhoone.Application.CreditApplications;

public sealed record CreditApplicationView(
    Guid Id,
    CreditApplicationStatus Status,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);

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
}
