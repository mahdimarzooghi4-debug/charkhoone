using System.Text.Json;
using Charkhoone.Application.CreditEligibility;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Finance;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Infrastructure.CreditEligibility;

public sealed class EfCreditEligibilityService(
    CharkhooneDbContext dbContext,
    IExternalCreditGradeAdapter adapter) : ICreditEligibilityService
{
    private const string AggregateType = "CreditApplication";

    public async Task<EvaluateCreditEligibilityResult> EvaluateAsync(
        Guid applicationId,
        decimal fullDepositEquivalentRial,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default)
    {
        if (applicationId == Guid.Empty)
        {
            throw new ArgumentException("Credit application id is required.", nameof(applicationId));
        }

        ArgumentOutOfRangeException.ThrowIfNegative(fullDepositEquivalentRial);

        CreditEligibilityAssessmentRow assessment;
        Guid applicantUserId;

        await using (var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken))
        {
            var application = await dbContext.CreditApplications
                .FromSqlInterpolated($"SELECT * FROM credit_applications WHERE \"Id\" = {applicationId} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);

            if (application is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new EvaluateCreditEligibilityResult(
                    EvaluateCreditEligibilityOutcome.NotFound,
                    null);
            }

            assessment = await dbContext.CreditEligibilityAssessments
                .SingleOrDefaultAsync(x => x.CreditApplicationId == applicationId, cancellationToken)
                ?? new CreditEligibilityAssessmentRow
                {
                    Id = Guid.NewGuid(),
                    CreditApplicationId = applicationId,
                    Provider = adapter.Provider,
                    Status = ExternalCreditResultStatus.Unknown.ToString(),
                    FullDepositEquivalentRial = fullDepositEquivalentRial,
                    IdempotencyKey = $"credit-grade:{applicationId:D}:v1",
                    CreatedAtUtc = occurredAtUtc,
                    UpdatedAtUtc = occurredAtUtc,
                };

            if (IsCompleted(assessment))
            {
                await transaction.RollbackAsync(cancellationToken);
                return new EvaluateCreditEligibilityResult(
                    EvaluateCreditEligibilityOutcome.AlreadyEvaluated,
                    ToView(application.Status, assessment));
            }

            if (!IsEvaluatableState(application.Status))
            {
                await transaction.RollbackAsync(cancellationToken);
                return new EvaluateCreditEligibilityResult(
                    EvaluateCreditEligibilityOutcome.InvalidState,
                    ToView(application.Status, assessment));
            }

            assessment.FullDepositEquivalentRial = fullDepositEquivalentRial;
            assessment.UpdatedAtUtc = occurredAtUtc;

            if (dbContext.Entry(assessment).State == EntityState.Detached)
            {
                dbContext.CreditEligibilityAssessments.Add(assessment);
            }

            applicantUserId = application.ApplicantUserId;
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }

        var response = await adapter.CheckAsync(
            new ExternalCreditGradeRequest(
                assessment.Id,
                applicationId,
                applicantUserId),
            cancellationToken);

        await using var resultTransaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var lockedApplication = await dbContext.CreditApplications
            .FromSqlInterpolated($"SELECT * FROM credit_applications WHERE \"Id\" = {applicationId} FOR UPDATE")
            .SingleAsync(cancellationToken);

        var lockedAssessment = await dbContext.CreditEligibilityAssessments
            .FromSqlInterpolated($"SELECT * FROM credit_eligibility_assessments WHERE \"Id\" = {assessment.Id} FOR UPDATE")
            .SingleAsync(cancellationToken);

        if (IsCompleted(lockedAssessment))
        {
            await resultTransaction.RollbackAsync(cancellationToken);
            return new EvaluateCreditEligibilityResult(
                EvaluateCreditEligibilityOutcome.AlreadyEvaluated,
                ToView(lockedApplication.Status, lockedAssessment));
        }

        lockedAssessment.Provider = string.IsNullOrWhiteSpace(response.Provider)
            ? adapter.Provider
            : response.Provider.Trim();
        lockedAssessment.Status = response.Status.ToString();
        lockedAssessment.ExternalSubGrade = string.IsNullOrWhiteSpace(response.ExternalSubGrade)
            ? null
            : response.ExternalSubGrade.Trim();
        lockedAssessment.ExternalReference = response.ExternalReference;
        lockedAssessment.ReasonCode = response.ReasonCode;
        lockedAssessment.AttemptCount += 1;
        lockedAssessment.UpdatedAtUtc = occurredAtUtc;
        lockedAssessment.LoanRatio = null;
        lockedAssessment.MaximumEligibleLoanRial = null;

        if (!IsEvaluatableState(lockedApplication.Status))
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            await resultTransaction.CommitAsync(cancellationToken);
            return new EvaluateCreditEligibilityResult(
                EvaluateCreditEligibilityOutcome.InvalidState,
                ToView(lockedApplication.Status, lockedAssessment));
        }

        if (response.Status != ExternalCreditResultStatus.Valid)
        {
            MarkIndeterminate(
                lockedApplication,
                lockedAssessment,
                occurredAtUtc,
                "External credit-grade result is not usable for an eligibility decision.");

            await dbContext.SaveChangesAsync(cancellationToken);
            await resultTransaction.CommitAsync(cancellationToken);

            return new EvaluateCreditEligibilityResult(
                EvaluateCreditEligibilityOutcome.Indeterminate,
                ToView(lockedApplication.Status, lockedAssessment));
        }

        if (lockedAssessment.ExternalSubGrade is null)
        {
            lockedAssessment.Status = ExternalCreditResultStatus.Invalid.ToString();
            lockedAssessment.ReasonCode ??= "external_credit_grade_missing";
            MarkIndeterminate(
                lockedApplication,
                lockedAssessment,
                occurredAtUtc,
                "External credit-grade response did not contain a usable sub-grade.");

            await dbContext.SaveChangesAsync(cancellationToken);
            await resultTransaction.CommitAsync(cancellationToken);

            return new EvaluateCreditEligibilityResult(
                EvaluateCreditEligibilityOutcome.Indeterminate,
                ToView(lockedApplication.Status, lockedAssessment));
        }

        decimal loanRatio;
        try
        {
            loanRatio = CreditGradePolicy.GetLoanRatio(lockedAssessment.ExternalSubGrade);
        }
        catch (ArgumentOutOfRangeException)
        {
            lockedAssessment.Status = ExternalCreditResultStatus.Invalid.ToString();
            lockedAssessment.ReasonCode ??= "external_credit_grade_unsupported";
            MarkIndeterminate(
                lockedApplication,
                lockedAssessment,
                occurredAtUtc,
                "External credit sub-grade is not mapped by the authoritative loan-ratio policy.");

            await dbContext.SaveChangesAsync(cancellationToken);
            await resultTransaction.CommitAsync(cancellationToken);

            return new EvaluateCreditEligibilityResult(
                EvaluateCreditEligibilityOutcome.Indeterminate,
                ToView(lockedApplication.Status, lockedAssessment));
        }

        var maximumEligibleLoanRial = CreditAllocationCalculator.CalculateMaximumLoan(
            lockedAssessment.FullDepositEquivalentRial,
            lockedAssessment.ExternalSubGrade);

        lockedAssessment.LoanRatio = loanRatio;
        lockedAssessment.MaximumEligibleLoanRial = maximumEligibleLoanRial;

        var actorId = $"credit-grade:{lockedAssessment.Provider}";
        const string reason = "External credit grade was evaluated against the authoritative loan-ratio policy.";
        var workflow = CreditApplicationWorkflow.Restore(lockedApplication.Status);
        var transition = workflow.MoveTo(
            CreditApplicationStatus.DecisionReady,
            actorId,
            reason,
            occurredAtUtc);

        lockedApplication.Status = transition.To;
        lockedApplication.UpdatedAtUtc = occurredAtUtc;

        dbContext.WorkflowTransitions.Add(new WorkflowTransitionRow
        {
            Id = Guid.NewGuid(),
            AggregateType = AggregateType,
            AggregateId = applicationId,
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
            AggregateId = applicationId,
            ActorId = actorId,
            Action = "credit_eligibility_evaluated",
            Reason = reason,
            OccurredAtUtc = occurredAtUtc,
        });

        dbContext.OutboxMessages.Add(new OutboxMessageRow
        {
            Id = Guid.NewGuid(),
            OccurredAtUtc = occurredAtUtc,
            Type = "credit-application.credit-eligibility-evaluated.v1",
            PayloadJson = JsonSerializer.Serialize(new
            {
                applicationId,
                assessmentId = lockedAssessment.Id,
                provider = lockedAssessment.Provider,
                externalSubGrade = lockedAssessment.ExternalSubGrade,
                loanRatio,
                maximumEligibleLoanRial,
                fromStatus = transition.From.ToString(),
                toStatus = transition.To.ToString(),
                occurredAtUtc,
            }),
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        await resultTransaction.CommitAsync(cancellationToken);

        return new EvaluateCreditEligibilityResult(
            EvaluateCreditEligibilityOutcome.Applied,
            ToView(lockedApplication.Status, lockedAssessment));
    }

    private void MarkIndeterminate(
        CreditApplicationRow application,
        CreditEligibilityAssessmentRow assessment,
        DateTimeOffset occurredAtUtc,
        string reason)
    {
        var actorId = $"credit-grade:{assessment.Provider}";

        if (application.Status == CreditApplicationStatus.ExternalChecksPending)
        {
            var workflow = CreditApplicationWorkflow.Restore(application.Status);
            var transition = workflow.MoveTo(
                CreditApplicationStatus.ExternalCheckIndeterminate,
                actorId,
                reason,
                occurredAtUtc);

            application.Status = transition.To;
            application.UpdatedAtUtc = occurredAtUtc;

            dbContext.WorkflowTransitions.Add(new WorkflowTransitionRow
            {
                Id = Guid.NewGuid(),
                AggregateType = AggregateType,
                AggregateId = application.Id,
                FromStatus = transition.From.ToString(),
                ToStatus = transition.To.ToString(),
                ActorId = transition.ActorId,
                Reason = transition.Reason,
                OccurredAtUtc = transition.OccurredAtUtc,
            });
        }

        dbContext.AuditEvents.Add(new AuditEventRow
        {
            Id = Guid.NewGuid(),
            AggregateType = AggregateType,
            AggregateId = application.Id,
            ActorId = actorId,
            Action = "credit_eligibility_indeterminate",
            Reason = reason,
            OccurredAtUtc = occurredAtUtc,
        });
    }

    private static bool IsEvaluatableState(CreditApplicationStatus status) =>
        status is CreditApplicationStatus.ExternalChecksPending
            or CreditApplicationStatus.ExternalCheckIndeterminate;

    private static bool IsCompleted(CreditEligibilityAssessmentRow assessment) =>
        assessment.Status == nameof(ExternalCreditResultStatus.Valid)
            && assessment.LoanRatio is not null
            && assessment.MaximumEligibleLoanRial is not null;

    private static CreditEligibilityView ToView(
        CreditApplicationStatus applicationStatus,
        CreditEligibilityAssessmentRow assessment)
    {
        var externalStatus = Enum.TryParse<ExternalCreditResultStatus>(assessment.Status, out var parsed)
            ? parsed
            : ExternalCreditResultStatus.Unknown;

        return new CreditEligibilityView(
            assessment.CreditApplicationId,
            applicationStatus,
            externalStatus,
            assessment.Provider,
            assessment.ExternalSubGrade,
            assessment.FullDepositEquivalentRial,
            assessment.LoanRatio,
            assessment.MaximumEligibleLoanRial,
            assessment.UpdatedAtUtc);
    }
}
