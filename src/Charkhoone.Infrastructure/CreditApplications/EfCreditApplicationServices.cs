using System.Text.Json;
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
    private const string AggregateType = "CreditApplication";
    private const string SubmissionReason = "Applicant submitted credit application.";

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

        return ToView(row);
    }

    public async Task<SubmitCreditApplicationResult> SubmitAsync(
        Guid applicationId,
        Guid applicantUserId,
        DateTimeOffset occurredAtUtc,
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

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var row = await dbContext.CreditApplications
            .FromSqlInterpolated($"SELECT * FROM credit_applications WHERE \"Id\" = {applicationId} AND \"ApplicantUserId\" = {applicantUserId} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);

        if (row is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return new SubmitCreditApplicationResult(SubmitCreditApplicationOutcome.NotFound, null);
        }

        if (row.Status == CreditApplicationStatus.IdentityPending)
        {
            await transaction.RollbackAsync(cancellationToken);
            return new SubmitCreditApplicationResult(
                SubmitCreditApplicationOutcome.AlreadySubmitted,
                ToView(row));
        }

        if (row.Status != CreditApplicationStatus.Draft)
        {
            await transaction.RollbackAsync(cancellationToken);
            return new SubmitCreditApplicationResult(
                SubmitCreditApplicationOutcome.InvalidState,
                ToView(row));
        }

        var workflow = new CreditApplicationWorkflow();
        var actorId = applicantUserId.ToString("D");
        var transition = workflow.MoveTo(
            CreditApplicationStatus.IdentityPending,
            actorId,
            SubmissionReason,
            occurredAtUtc);

        row.Status = transition.To;
        row.UpdatedAtUtc = occurredAtUtc;

        dbContext.WorkflowTransitions.Add(new WorkflowTransitionRow
        {
            Id = Guid.NewGuid(),
            AggregateType = AggregateType,
            AggregateId = row.Id,
            FromStatus = transition.From.ToString(),
            ToStatus = transition.To.ToString(),
            ActorId = transition.ActorId,
            Reason = transition.Reason,
            OccurredAtUtc = transition.OccurredAtUtc,
        });

        dbContext.AuditEvents.Add(new AuditEventRow
        {
            Id = Guid.NewGuid(),
            AggregateType = AggregateType,
            AggregateId = row.Id,
            ActorId = actorId,
            Action = "credit_application_submitted",
            Reason = SubmissionReason,
            OccurredAtUtc = occurredAtUtc,
        });

        dbContext.OutboxMessages.Add(new OutboxMessageRow
        {
            Id = Guid.NewGuid(),
            OccurredAtUtc = occurredAtUtc,
            Type = "credit-application.submitted.v1",
            PayloadJson = JsonSerializer.Serialize(new
            {
                applicationId = row.Id,
                applicantUserId = row.ApplicantUserId,
                fromStatus = transition.From.ToString(),
                toStatus = transition.To.ToString(),
                occurredAtUtc,
            }),
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return new SubmitCreditApplicationResult(
            SubmitCreditApplicationOutcome.Submitted,
            ToView(row));
    }

    private static CreditApplicationView ToView(CreditApplicationRow row) =>
        new(row.Id, row.Status, row.CreatedAtUtc, row.UpdatedAtUtc);
}
