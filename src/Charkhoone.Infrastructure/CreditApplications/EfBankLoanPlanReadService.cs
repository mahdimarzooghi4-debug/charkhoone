using Charkhoone.Application.CreditApplications;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Finance;
using Charkhoone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Infrastructure.CreditApplications;

public sealed class EfBankLoanPlanReadService(CharkhooneDbContext dbContext)
    : IBankLoanPlanReadService
{
    private const int PlanLimit = 100;

    public async Task<ListBankLoanPlansResult> ListAvailableAsync(
        Guid applicationId,
        Guid applicantUserId,
        CancellationToken cancellationToken = default)
    {
        if (applicationId == Guid.Empty)
        {
            throw new ArgumentException("Credit application id is required.", nameof(applicationId));
        }

        if (applicantUserId == Guid.Empty)
        {
            throw new ArgumentException("Applicant user id is required.", nameof(applicantUserId));
        }

        var application = await dbContext.CreditApplications
            .AsNoTracking()
            .Where(x => x.Id == applicationId && x.ApplicantUserId == applicantUserId)
            .Select(x => new { x.Id, x.Status })
            .SingleOrDefaultAsync(cancellationToken);

        if (application is null)
        {
            return new ListBankLoanPlansResult(
                ListBankLoanPlansOutcome.NotFound,
                applicationId,
                null,
                []);
        }

        if (application.Status != CreditApplicationStatus.PlanSelectionPending)
        {
            return new ListBankLoanPlansResult(
                ListBankLoanPlansOutcome.InvalidState,
                application.Id,
                application.Status,
                []);
        }

        var plans = await dbContext.BankLoanPlanVersions
            .AsNoTracking()
            .Where(x =>
                x.Status == BankLoanPlanStatus.Published
                && x.Scope == BankLoanPlanScope.Public
                && x.TermMonths == BankLoanPlanVersion.RequiredTermMonths)
            .OrderBy(x => x.Title)
            .ThenBy(x => x.BankId)
            .ThenBy(x => x.PlanId)
            .ThenBy(x => x.Version)
            .Take(PlanLimit)
            .Select(x => new BankLoanPlanListItem(
                x.PlanId,
                x.Version,
                x.BankId,
                x.Title,
                x.InterestTerms,
                x.TermMonths))
            .ToListAsync(cancellationToken);

        return new ListBankLoanPlansResult(
            ListBankLoanPlansOutcome.Available,
            application.Id,
            application.Status,
            plans);
    }
}
