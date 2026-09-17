using System.Text.Json;
using Charkhoone.Application.IdentityVerification;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Infrastructure.IdentityVerification;

public sealed class EfCreditApplicationIdentityService(
    CharkhooneDbContext dbContext,
    IIdentityVerificationAdapter adapter) : ICreditApplicationIdentityService
{
    private const string VerificationType = "Identity";
    private const string AggregateType = "CreditApplication";
    private const string PendingStatus = "Pending";

    public async Task<ProcessIdentityVerificationResult> ProcessAsync(
        Guid applicationId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default)
    {
        if (applicationId == Guid.Empty)
        {
            throw new ArgumentException("Credit application id is required.", nameof(applicationId));
        }

        var idempotencyKey = $"identity:{applicationId:D}:v1";
        VerificationRequestRow verificationRequest;
        Guid applicantUserId;

        await using (var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken))
        {
            var application = await dbContext.CreditApplications
                .FromSqlInterpolated($"SELECT * FROM credit_applications WHERE \"Id\" = {applicationId} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);

            if (application is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new ProcessIdentityVerificationResult(
                    ProcessIdentityVerificationOutcome.NotFound,
                    null,
                    null);
            }

            verificationRequest = await dbContext.VerificationRequests
                .SingleOrDefaultAsync(x => x.IdempotencyKey == idempotencyKey, cancellationToken)
                ?? new VerificationRequestRow
                {
                    Id = Guid.NewGuid(),
                    CreditApplicationId = application.Id,
                    Type = VerificationType,
                    Provider = adapter.Provider,
                    Status = PendingStatus,
                    IdempotencyKey = idempotencyKey,
                    CreatedAtUtc = occurredAtUtc,
                    UpdatedAtUtc = occurredAtUtc,
                };

            if (application.Status != CreditApplicationStatus.IdentityPending)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new ProcessIdentityVerificationResult(
                    IsTerminal(verificationRequest.Status)
                        ? ProcessIdentityVerificationOutcome.AlreadyProcessed
                        : ProcessIdentityVerificationOutcome.InvalidState,
                    application.Status,
                    ParseOutcome(verificationRequest.Status));
            }

            if (IsTerminal(verificationRequest.Status))
            {
                await transaction.RollbackAsync(cancellationToken);
                return new ProcessIdentityVerificationResult(
                    ProcessIdentityVerificationOutcome.AlreadyProcessed,
                    application.Status,
                    ParseOutcome(verificationRequest.Status));
            }

            if (dbContext.Entry(verificationRequest).State == EntityState.Detached)
            {
                dbContext.VerificationRequests.Add(verificationRequest);
            }

            applicantUserId = application.ApplicantUserId;
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }

        var response = await adapter.VerifyAsync(
            new IdentityVerificationRequest(
                verificationRequest.Id,
                applicationId,
                applicantUserId),
            cancellationToken);

        await using var resultTransaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var lockedApplication = await dbContext.CreditApplications
            .FromSqlInterpolated($"SELECT * FROM credit_applications WHERE \"Id\" = {applicationId} FOR UPDATE")
            .SingleAsync(cancellationToken);

        var lockedRequest = await dbContext.VerificationRequests
            .FromSqlInterpolated($"SELECT * FROM verification_requests WHERE \"Id\" = {verificationRequest.Id} FOR UPDATE")
            .SingleAsync(cancellationToken);

        if (IsTerminal(lockedRequest.Status))
        {
            await resultTransaction.RollbackAsync(cancellationToken);
            return new ProcessIdentityVerificationResult(
                ProcessIdentityVerificationOutcome.AlreadyProcessed,
                lockedApplication.Status,
                ParseOutcome(lockedRequest.Status));
        }

        lockedRequest.Provider = string.IsNullOrWhiteSpace(response.Provider)
            ? adapter.Provider
            : response.Provider;
        lockedRequest.Status = response.Outcome.ToString();
        lockedRequest.ExternalReference = response.ExternalReference;
        lockedRequest.ReasonCode = response.ReasonCode;
        lockedRequest.AttemptCount += 1;
        lockedRequest.UpdatedAtUtc = occurredAtUtc;

        if (lockedApplication.Status != CreditApplicationStatus.IdentityPending)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            await resultTransaction.CommitAsync(cancellationToken);
            return new ProcessIdentityVerificationResult(
                ProcessIdentityVerificationOutcome.InvalidState,
                lockedApplication.Status,
                response.Outcome);
        }

        if (response.Outcome == IdentityVerificationOutcome.Indeterminate)
        {
            dbContext.AuditEvents.Add(new AuditEventRow
            {
                Id = Guid.NewGuid(),
                AggregateType = AggregateType,
                AggregateId = applicationId,
                ActorId = $"identity:{lockedRequest.Provider}",
                Action = "identity_verification_indeterminate",
                Reason = "Identity verification returned an indeterminate result; the application remains pending.",
                OccurredAtUtc = occurredAtUtc,
            });

            await dbContext.SaveChangesAsync(cancellationToken);
            await resultTransaction.CommitAsync(cancellationToken);

            return new ProcessIdentityVerificationResult(
                ProcessIdentityVerificationOutcome.Indeterminate,
                lockedApplication.Status,
                response.Outcome);
        }

        var targetStatus = response.Outcome switch
        {
            IdentityVerificationOutcome.Verified => CreditApplicationStatus.PlanSelectionPending,
            IdentityVerificationOutcome.NeedsDocuments => CreditApplicationStatus.NeedsDocuments,
            _ => throw new InvalidOperationException($"Unsupported identity outcome: {response.Outcome}."),
        };

        var actorId = $"identity:{lockedRequest.Provider}";
        var reason = response.Outcome == IdentityVerificationOutcome.Verified
            ? "Identity verification completed successfully."
            : "Identity verification requires additional documents.";

        var workflow = CreditApplicationWorkflow.Restore(lockedApplication.Status);
        var transition = workflow.MoveTo(targetStatus, actorId, reason, occurredAtUtc);

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
            Action = response.Outcome == IdentityVerificationOutcome.Verified
                ? "identity_verified"
                : "identity_documents_required",
            Reason = reason,
            OccurredAtUtc = occurredAtUtc,
        });

        dbContext.OutboxMessages.Add(new OutboxMessageRow
        {
            Id = Guid.NewGuid(),
            OccurredAtUtc = occurredAtUtc,
            Type = response.Outcome == IdentityVerificationOutcome.Verified
                ? "credit-application.identity-verified.v1"
                : "credit-application.identity-documents-required.v1",
            PayloadJson = JsonSerializer.Serialize(new
            {
                applicationId,
                verificationRequestId = lockedRequest.Id,
                provider = lockedRequest.Provider,
                fromStatus = transition.From.ToString(),
                toStatus = transition.To.ToString(),
                occurredAtUtc,
            }),
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        await resultTransaction.CommitAsync(cancellationToken);

        return new ProcessIdentityVerificationResult(
            ProcessIdentityVerificationOutcome.Applied,
            lockedApplication.Status,
            response.Outcome);
    }

    private static bool IsTerminal(string status) =>
        status is nameof(IdentityVerificationOutcome.Verified)
            or nameof(IdentityVerificationOutcome.NeedsDocuments);

    private static IdentityVerificationOutcome? ParseOutcome(string status) =>
        Enum.TryParse<IdentityVerificationOutcome>(status, out var parsed)
            ? parsed
            : null;
}
