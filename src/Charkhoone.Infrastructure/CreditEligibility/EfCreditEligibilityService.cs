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

        CreditEligibilityAssessmentRow assessment;

        await using (var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken))
        {
            var application = await dbContext.CreditApplications
                .FromSqlInterpolated($"SELECT * FROM credit_applications WHERE \"Id\" = {applicationId} AND \"ApplicantUserId\" = {applicantUserId} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);

            if (application is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new EvaluateCreditEligibilityResult(
                    EvaluateCreditEligibilityOutcome.NotFound,
                    null);
            }

            var trustedFullDepositEquivalentRial = await LoadTrustedFullDepositEquivalentAsync(
                application,
                cancellationToken);

            if (trustedFullDepositEquivalentRial is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new EvaluateCreditEligibilityResult(
                    EvaluateCreditEligibilityOutcome.InvalidState,
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
                    FullDepositEquivalentRial = trustedFullDepositEquivalentRial.Value,
                    IdempotencyKey = $"credit-grade:{applicationId:D}:v1",
                    CreatedAtUtc = occurredAtUtc,
                    UpdatedAtUtc = occurredAtUtc,
                };

            if (dbContext.Entry(assessment).State != EntityState.Detached
                && assessment.FullDepositEquivalentRial != trustedFullDepositEquivalentRial.Value)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new EvaluateCreditEligibilityResult(
                    EvaluateCreditEligibilityOutcome.Conflict,
                    ToView(application.Status, assessment));
            }

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

            assessment.UpdatedAtUtc = occurredAtUtc;

            if (dbContext.Entry(assessment).State == EntityState.Detached)
            {
                dbContext.CreditEligibilityAssessments.Add(assessment);
            }

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
            .FromSqlInterpolated($"SELECT * FROM credit_applications WHERE \"Id\" = {applicationId} AND \"ApplicantUserId\" = {applicantUserId} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);

        if (lockedApplication is null)
        {
            await resultTransaction.RollbackAsync(cancellationToken);
            return new EvaluateCreditEligibilityResult(
                EvaluateCreditEligibilityOutcome.NotFound,
                null);
        }

        var lockedAssessment = await dbContext.CreditEligibilityAssessments
            .FromSqlInterpolated($"SELECT * FROM credit_eligibility_assessments WHERE \"Id\" = {assessment.Id} FOR UPDATE")
            .SingleAsync(cancellationToken);

        var currentTrustedFullDepositEquivalentRial = await LoadTrustedFullDepositEquivalentAsync(
            lockedApplication,
            cancellationToken);

        if (currentTrustedFullDepositEquivalentRial is null)
        {
            await resultTransaction.RollbackAsync(cancellationToken);
            return new EvaluateCreditEligibilityResult(
                EvaluateCreditEligibilityOutcome.InvalidState,
                ToView(lockedApplication.Status, lockedAssessment));
        }

        if (lockedAssessment.FullDepositEquivalentRial != currentTrustedFullDepositEquivalentRial.Value)
        {
            await resultTransaction.RollbackAsync(cancellationToken);
            return new EvaluateCreditEligibilityResult(
                EvaluateCreditEligibilityOutcome.Conflict,
                ToView(lockedApplication.Status, lockedAssessment));
        }

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
        lockedAssessment.ExternalReference = string.IsNullOrWhiteSpace(response.ExternalReference)
            ? null
            : response.ExternalReference.Trim();
        lockedAssessment.ReasonCode = string.IsNullOrWhiteSpace(response.ReasonCode)
            ? null
            : response.ReasonCode.Trim();
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
        const string reason =
            "External credit grade was evaluated against the authoritative loan-ratio policy using the immutable trusted contract full-deposit equivalent.";
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
                fullDepositEquivalentRial = lockedAssessment.FullDepositEquivalentRial,
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

    private async Task<decimal?> LoadTrustedFullDepositEquivalentAsync(
        CreditApplicationRow application,
        CancellationToken cancellationToken)
    {
        if (application.BankLoanPlanId is null
            || string.IsNullOrWhiteSpace(application.BankLoanPlanVersion))
        {
            return null;
        }

        var planId = application.BankLoanPlanId.Value;
        var planVersion = application.BankLoanPlanVersion.Trim();

        var exactPlanExists = await dbContext.BankLoanPlanVersions
            .AsNoTracking()
            .AnyAsync(
                x => x.PlanId == planId
                    && x.Version == planVersion
                    && x.TermMonths == BankLoanPlanVersion.RequiredTermMonths,
                cancellationToken);

        if (!exactPlanExists)
        {
            return null;
        }

        var contract = await dbContext.LeaseContracts
            .AsNoTracking()
            .SingleOrDefaultAsync(
                x => x.CreditApplicationId == application.Id,
                cancellationToken);

        if (contract is null
            || contract.TenantUserId != application.ApplicantUserId
            || contract.BankLoanPlanId != planId
            || !string.Equals(contract.BankLoanPlanVersion, planVersion, StringComparison.Ordinal))
        {
            return null;
        }

        var terms = await dbContext.LeaseContractTerms
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.ContractId == contract.Id, cancellationToken);

        if (terms is null
            || terms.Calendar != "Persian"
            || terms.TermMonths != BankLoanPlanVersion.RequiredTermMonths
            || terms.CashDepositRial < 0m
            || terms.MonthlyRentRial < 0m
            || terms.FullDepositEquivalentRial <= 0m
            || terms.CashDepositRial != decimal.Truncate(terms.CashDepositRial)
            || terms.MonthlyRentRial != decimal.Truncate(terms.MonthlyRentRial)
            || terms.FullDepositEquivalentRial != decimal.Truncate(terms.FullDepositEquivalentRial)
            || string.IsNullOrWhiteSpace(terms.OwnerBeneficiaryId)
            || string.IsNullOrWhiteSpace(terms.BankBeneficiaryId)
            || string.IsNullOrWhiteSpace(terms.SourceReference))
        {
            return null;
        }

        decimal calculatedFullDeposit;
        try
        {
            calculatedFullDeposit = FullDepositCalculator.Calculate(
                terms.CashDepositRial,
                terms.MonthlyRentRial);
        }
        catch (ArgumentException)
        {
            return null;
        }

        if (calculatedFullDeposit != terms.FullDepositEquivalentRial)
        {
            return null;
        }

        var schedule = await dbContext.LeaseContractScheduleMonths
            .AsNoTracking()
            .Where(x => x.ContractId == contract.Id)
            .OrderBy(x => x.ContractMonthNumber)
            .ToListAsync(cancellationToken);

        if (schedule.Count != BankLoanPlanVersion.RequiredTermMonths)
        {
            return null;
        }

        for (var index = 0; index < schedule.Count; index++)
        {
            var month = schedule[index];
            if (month.ContractMonthNumber != index + 1
                || month.OwnerPaymentRial < 0m
                || month.BankInterestRial < 0m
                || month.OwnerPaymentRial != decimal.Truncate(month.OwnerPaymentRial)
                || month.BankInterestRial != decimal.Truncate(month.BankInterestRial)
                || (month.OwnerPaymentRial == 0m && month.BankInterestRial == 0m)
                || (index > 0 && schedule[index - 1].DueAtUtc >= month.DueAtUtc))
            {
                return null;
            }
        }

        return terms.FullDepositEquivalentRial;
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
