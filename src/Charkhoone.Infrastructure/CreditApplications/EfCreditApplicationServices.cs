using Charkhoone.Application.CreditApplications;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Infrastructure.CreditApplications;

public sealed class EfUserIdentityLookup(CharkhooneDbContext dbContext) : IUserIdentityLookup
{
    public Task<Guid?> FindInternalUserIdAsync(
        string oidcSubject,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(oidcSubject);

        return dbContext.Users
            .AsNoTracking()
            .Where(x => x.OidcSubject == oidcSubject)
            .Select(x => (Guid?)x.Id)
            .SingleOrDefaultAsync(cancellationToken);
    }
}

public sealed class EfCreditApplicationService(CharkhooneDbContext dbContext) : ICreditApplicationService
{
    public async Task<CreditApplicationView> CreateDraftAsync(
        Guid applicantUserId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default)
    {
        if (applicantUserId == Guid.Empty)
        {
            throw new ArgumentException("Applicant user id is required.", nameof(applicantUserId));
        }

        var row = new CreditApplicationRow
        {
            Id = Guid.NewGuid(),
            ApplicantUserId = applicantUserId,
            Status = CreditApplicationStatus.Draft,
            CreatedAtUtc = occurredAtUtc,
            UpdatedAtUtc = occurredAtUtc,
        };

        dbContext.CreditApplications.Add(row);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new CreditApplicationView(
            row.Id,
            row.Status,
            row.CreatedAtUtc,
            row.UpdatedAtUtc);
    }
}
