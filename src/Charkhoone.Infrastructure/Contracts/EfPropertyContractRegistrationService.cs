using System.Globalization;
using System.Text.Json;
using Charkhoone.Application.Contracts;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Finance;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Infrastructure.Contracts;

public sealed class EfPropertyContractRegistrationService(
    CharkhooneDbContext dbContext,
    IExternalPropertyContractEvidenceAdapter evidenceAdapter,
    ILeaseContractTermsService termsService)
    : IPropertyContractRegistrationService
{
    private const string AggregateType = "CreditApplication";
    private const string VerificationType = "PropertyContract";
    private const string PendingStatus = "Pending";
    private const string PendingSnapshotStatus = "PendingSnapshot";
    private static readonly PersianCalendar PersianCalendar = new();

    public async Task<ReconcilePropertyContractResult> ReconcileAsync(
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

        var idempotencyKey = $"property-contract:{applicationId:D}:v1";
        VerificationRequestRow verificationRequest;
        Guid planId;
        string planVersion;

        await using (var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken))
        {
            var application = await dbContext.CreditApplications
                .FromSqlInterpolated($"SELECT * FROM credit_applications WHERE \"Id\" = {applicationId} AND \"ApplicantUserId\" = {applicantUserId} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);

            if (application is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Empty(ReconcilePropertyContractOutcome.NotFound);
            }

            verificationRequest = await dbContext.VerificationRequests
                .SingleOrDefaultAsync(x => x.IdempotencyKey == idempotencyKey, cancellationToken)
                ?? null!;

            var existingContract = await dbContext.LeaseContracts
                .AsNoTracking()
                .SingleOrDefaultAsync(x => x.CreditApplicationId == applicationId, cancellationToken);

            if (verificationRequest is not null
                && verificationRequest.Status == nameof(ExternalPropertyContractEvidenceStatus.Confirmed)
                && existingContract is not null)
            {
                if (!HasValidContractBinding(application, existingContract))
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return Empty(ReconcilePropertyContractOutcome.Conflict);
                }

                await transaction.RollbackAsync(cancellationToken);

                var snapshot = await termsService.GetAsync(existingContract.Id, cancellationToken);
                if (snapshot is null
                    || !string.Equals(
                        snapshot.SourceReference,
                        verificationRequest.ExternalReference?.Trim(),
                        StringComparison.Ordinal))
                {
                    return Empty(ReconcilePropertyContractOutcome.Conflict);
                }

                return application.Status == CreditApplicationStatus.PropertyContractPending
                    ? await FinalizeRegistrationAsync(
                        applicationId,
                        applicantUserId,
                        verificationRequest.Id,
                        existingContract.Id,
                        snapshot,
                        occurredAtUtc,
                        cancellationToken)
                    : new ReconcilePropertyContractResult(
                        ReconcilePropertyContractOutcome.AlreadyRegistered,
                        ToView(application, existingContract, snapshot));
            }

            if (verificationRequest is not null
                && verificationRequest.Status == nameof(ExternalPropertyContractEvidenceStatus.NeedsDocuments)
                && application.Status == CreditApplicationStatus.NeedsDocuments)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Empty(ReconcilePropertyContractOutcome.NeedsDocuments);
            }

            if (application.Status != CreditApplicationStatus.PropertyContractPending
                || application.BankLoanPlanId is null
                || string.IsNullOrWhiteSpace(application.BankLoanPlanVersion))
            {
                await transaction.RollbackAsync(cancellationToken);
                return Empty(ReconcilePropertyContractOutcome.InvalidState);
            }

            planId = application.BankLoanPlanId.Value;
            planVersion = application.BankLoanPlanVersion.Trim();

            var selectedPlanExists = await dbContext.BankLoanPlanVersions
                .AsNoTracking()
                .AnyAsync(
                    x => x.PlanId == planId
                        && x.Version == planVersion
                        && x.TermMonths == BankLoanPlanVersion.RequiredTermMonths,
                    cancellationToken);

            if (!selectedPlanExists)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Empty(ReconcilePropertyContractOutcome.InvalidState);
            }

            verificationRequest ??= new VerificationRequestRow
            {
                Id = Guid.NewGuid(),
                CreditApplicationId = applicationId,
                Type = VerificationType,
                Provider = evidenceAdapter.Provider,
                Status = PendingStatus,
                IdempotencyKey = idempotencyKey,
                CreatedAtUtc = occurredAtUtc,
                UpdatedAtUtc = occurredAtUtc,
            };

            if (dbContext.Entry(verificationRequest).State == EntityState.Detached)
            {
                dbContext.VerificationRequests.Add(verificationRequest);
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }

        var response = await evidenceAdapter.CheckAsync(
            new ExternalPropertyContractEvidenceRequest(
                verificationRequest.Id,
                applicationId,
                applicantUserId,
                planId,
                planVersion),
            cancellationToken);

        if (response.Status == ExternalPropertyContractEvidenceStatus.Indeterminate)
        {
            return await ApplyIndeterminateAsync(
                applicationId,
                applicantUserId,
                verificationRequest.Id,
                response,
                occurredAtUtc,
                cancellationToken);
        }

        if (response.Status == ExternalPropertyContractEvidenceStatus.NeedsDocuments)
        {
            return await ApplyNeedsDocumentsAsync(
                applicationId,
                applicantUserId,
                verificationRequest.Id,
                response,
                occurredAtUtc,
                cancellationToken);
        }

        if (!TryValidateConfirmedEvidence(response, out var evidence))
        {
            return await ApplyIndeterminateAsync(
                applicationId,
                applicantUserId,
                verificationRequest.Id,
                response with
                {
                    Status = ExternalPropertyContractEvidenceStatus.Indeterminate,
                    ReasonCode = "property_contract_evidence_invalid",
                },
                occurredAtUtc,
                cancellationToken);
        }

        Guid contractId;

        await using (var resultTransaction = await dbContext.Database.BeginTransactionAsync(cancellationToken))
        {
            var application = await dbContext.CreditApplications
                .FromSqlInterpolated($"SELECT * FROM credit_applications WHERE \"Id\" = {applicationId} AND \"ApplicantUserId\" = {applicantUserId} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);

            if (application is null)
            {
                await resultTransaction.RollbackAsync(cancellationToken);
                return Empty(ReconcilePropertyContractOutcome.NotFound);
            }

            if (application.Status != CreditApplicationStatus.PropertyContractPending
                || application.BankLoanPlanId != planId
                || !string.Equals(application.BankLoanPlanVersion, planVersion, StringComparison.Ordinal))
            {
                await resultTransaction.RollbackAsync(cancellationToken);
                return Empty(ReconcilePropertyContractOutcome.InvalidState);
            }

            var lockedRequest = await dbContext.VerificationRequests
                .FromSqlInterpolated($"SELECT * FROM verification_requests WHERE \"Id\" = {verificationRequest.Id} FOR UPDATE")
                .SingleAsync(cancellationToken);

            var ownerExists = await dbContext.Users
                .AsNoTracking()
                .AnyAsync(x => x.Id == evidence.OwnerUserId, cancellationToken);

            if (!ownerExists)
            {
                lockedRequest.Provider = NormalizeProvider(response.Provider);
                lockedRequest.Status = nameof(ExternalPropertyContractEvidenceStatus.Indeterminate);
                lockedRequest.ExternalReference = NormalizeOptional(response.ExternalReference);
                lockedRequest.ReasonCode = "property_contract_owner_not_mapped";
                lockedRequest.AttemptCount += 1;
                lockedRequest.UpdatedAtUtc = occurredAtUtc;

                AddAudit(
                    applicationId,
                    $"property-contract:{lockedRequest.Provider}",
                    "property_contract_evidence_indeterminate",
                    "Trusted property-contract evidence referenced an owner who is not mapped to a Charkhoone user.",
                    occurredAtUtc);

                await dbContext.SaveChangesAsync(cancellationToken);
                await resultTransaction.CommitAsync(cancellationToken);
                return Empty(ReconcilePropertyContractOutcome.Indeterminate);
            }

            var contract = await dbContext.LeaseContracts
                .SingleOrDefaultAsync(x => x.CreditApplicationId == applicationId, cancellationToken);

            if (contract is not null)
            {
                if (contract.Status != LeaseContractStatus.Draft
                    || contract.TenantUserId != applicantUserId
                    || contract.OwnerUserId != evidence.OwnerUserId
                    || contract.PropertyId != evidence.PropertyId
                    || contract.BankLoanPlanId != planId
                    || !string.Equals(contract.BankLoanPlanVersion, planVersion, StringComparison.Ordinal))
                {
                    await resultTransaction.RollbackAsync(cancellationToken);
                    return Empty(ReconcilePropertyContractOutcome.Conflict);
                }
            }
            else
            {
                contract = new LeaseContractRow
                {
                    Id = Guid.NewGuid(),
                    TenantUserId = applicantUserId,
                    OwnerUserId = evidence.OwnerUserId,
                    PropertyId = evidence.PropertyId,
                    CreditApplicationId = applicationId,
                    Status = LeaseContractStatus.Draft,
                    BankLoanPlanId = planId,
                    BankLoanPlanVersion = planVersion,
                    CreatedAtUtc = occurredAtUtc,
                    UpdatedAtUtc = occurredAtUtc,
                };
                dbContext.LeaseContracts.Add(contract);
            }

            lockedRequest.Provider = NormalizeProvider(response.Provider);
            lockedRequest.Status = PendingSnapshotStatus;
            lockedRequest.ExternalReference = evidence.ExternalReference;
            lockedRequest.ReasonCode = null;
            lockedRequest.AttemptCount += 1;
            lockedRequest.UpdatedAtUtc = occurredAtUtc;

            await dbContext.SaveChangesAsync(cancellationToken);
            await resultTransaction.CommitAsync(cancellationToken);
            contractId = contract.Id;
        }

        var capture = await termsService.CaptureAsync(
            new CaptureLeaseContractTermsCommand(
                contractId,
                evidence.PersianStartYear,
                evidence.PersianStartMonth,
                evidence.PersianStartDay,
                evidence.CashDepositRial,
                evidence.MonthlyRentRial,
                evidence.OwnerBeneficiaryId,
                evidence.BankBeneficiaryId,
                evidence.ExternalReference,
                evidence.ScheduleMonths),
            occurredAtUtc,
            cancellationToken);

        if (capture.Outcome == CaptureLeaseContractTermsOutcome.Conflict)
        {
            return Empty(ReconcilePropertyContractOutcome.Conflict);
        }

        if (capture.Outcome is not (
            CaptureLeaseContractTermsOutcome.Captured
            or CaptureLeaseContractTermsOutcome.Existing)
            || capture.Snapshot is null)
        {
            return Empty(ReconcilePropertyContractOutcome.InvalidState);
        }

        return await FinalizeRegistrationAsync(
            applicationId,
            applicantUserId,
            verificationRequest.Id,
            contractId,
            capture.Snapshot,
            occurredAtUtc,
            cancellationToken);
    }

    private async Task<ReconcilePropertyContractResult> ApplyIndeterminateAsync(
        Guid applicationId,
        Guid applicantUserId,
        Guid requestId,
        ExternalPropertyContractEvidenceResponse response,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var application = await dbContext.CreditApplications
            .FromSqlInterpolated($"SELECT * FROM credit_applications WHERE \"Id\" = {applicationId} AND \"ApplicantUserId\" = {applicantUserId} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);

        if (application is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Empty(ReconcilePropertyContractOutcome.NotFound);
        }

        if (application.Status != CreditApplicationStatus.PropertyContractPending)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Empty(ReconcilePropertyContractOutcome.InvalidState);
        }

        var request = await dbContext.VerificationRequests
            .FromSqlInterpolated($"SELECT * FROM verification_requests WHERE \"Id\" = {requestId} FOR UPDATE")
            .SingleAsync(cancellationToken);

        request.Provider = NormalizeProvider(response.Provider);
        request.Status = nameof(ExternalPropertyContractEvidenceStatus.Indeterminate);
        request.ExternalReference = NormalizeOptional(response.ExternalReference);
        request.ReasonCode = NormalizeOptional(response.ReasonCode) ?? "property_contract_evidence_indeterminate";
        request.AttemptCount += 1;
        request.UpdatedAtUtc = occurredAtUtc;

        AddAudit(
            applicationId,
            $"property-contract:{request.Provider}",
            "property_contract_evidence_indeterminate",
            "Trusted property-contract evidence could not be confirmed; no contract or terms were accepted.",
            occurredAtUtc);

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return Empty(ReconcilePropertyContractOutcome.Indeterminate);
    }

    private async Task<ReconcilePropertyContractResult> ApplyNeedsDocumentsAsync(
        Guid applicationId,
        Guid applicantUserId,
        Guid requestId,
        ExternalPropertyContractEvidenceResponse response,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var application = await dbContext.CreditApplications
            .FromSqlInterpolated($"SELECT * FROM credit_applications WHERE \"Id\" = {applicationId} AND \"ApplicantUserId\" = {applicantUserId} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);

        if (application is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Empty(ReconcilePropertyContractOutcome.NotFound);
        }

        if (application.Status != CreditApplicationStatus.PropertyContractPending)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Empty(ReconcilePropertyContractOutcome.InvalidState);
        }

        var request = await dbContext.VerificationRequests
            .FromSqlInterpolated($"SELECT * FROM verification_requests WHERE \"Id\" = {requestId} FOR UPDATE")
            .SingleAsync(cancellationToken);

        request.Provider = NormalizeProvider(response.Provider);
        request.Status = nameof(ExternalPropertyContractEvidenceStatus.NeedsDocuments);
        request.ExternalReference = NormalizeOptional(response.ExternalReference);
        request.ReasonCode = NormalizeOptional(response.ReasonCode) ?? "property_contract_documents_required";
        request.AttemptCount += 1;
        request.UpdatedAtUtc = occurredAtUtc;

        var actorId = $"property-contract:{request.Provider}";
        const string reason =
            "Trusted property-contract verification requires additional documents.";
        var workflow = CreditApplicationWorkflow.Restore(application.Status);
        var transition = workflow.MoveTo(
            CreditApplicationStatus.NeedsDocuments,
            actorId,
            reason,
            occurredAtUtc);

        application.Status = transition.To;
        application.UpdatedAtUtc = occurredAtUtc;

        AddWorkflowTransition(application.Id, transition);
        AddAudit(application.Id, actorId, "property_contract_documents_required", reason, occurredAtUtc);
        AddOutbox("credit-application.property-contract-documents-required.v1", occurredAtUtc, new
        {
            applicationId = application.Id,
            verificationRequestId = request.Id,
            provider = request.Provider,
            externalReference = request.ExternalReference,
            fromStatus = transition.From.ToString(),
            toStatus = transition.To.ToString(),
            occurredAtUtc,
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return Empty(ReconcilePropertyContractOutcome.NeedsDocuments);
    }

    private async Task<ReconcilePropertyContractResult> FinalizeRegistrationAsync(
        Guid applicationId,
        Guid applicantUserId,
        Guid requestId,
        Guid contractId,
        LeaseContractTermsSnapshot snapshot,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var application = await dbContext.CreditApplications
            .FromSqlInterpolated($"SELECT * FROM credit_applications WHERE \"Id\" = {applicationId} AND \"ApplicantUserId\" = {applicantUserId} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);

        if (application is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Empty(ReconcilePropertyContractOutcome.NotFound);
        }

        var contract = await dbContext.LeaseContracts
            .SingleOrDefaultAsync(
                x => x.Id == contractId && x.CreditApplicationId == applicationId,
                cancellationToken);
        var request = await dbContext.VerificationRequests
            .FromSqlInterpolated($"SELECT * FROM verification_requests WHERE \"Id\" = {requestId} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);

        if (contract is null
            || request is null
            || request.CreditApplicationId != applicationId
            || request.Type != VerificationType
            || (request.Status != PendingSnapshotStatus
                && request.Status != nameof(ExternalPropertyContractEvidenceStatus.Confirmed))
            || contract.TenantUserId != applicantUserId
            || !HasValidContractBinding(application, contract)
            || snapshot.ContractId != contract.Id
            || string.IsNullOrWhiteSpace(snapshot.SourceReference)
            || !string.Equals(snapshot.SourceReference, request.ExternalReference?.Trim(), StringComparison.Ordinal))
        {
            await transaction.RollbackAsync(cancellationToken);
            return Empty(ReconcilePropertyContractOutcome.InvalidState);
        }

        if (application.Status != CreditApplicationStatus.PropertyContractPending)
        {
            if (request.Status != nameof(ExternalPropertyContractEvidenceStatus.Confirmed))
            {
                await transaction.RollbackAsync(cancellationToken);
                return Empty(ReconcilePropertyContractOutcome.InvalidState);
            }

            await transaction.RollbackAsync(cancellationToken);
            return new ReconcilePropertyContractResult(
                ReconcilePropertyContractOutcome.AlreadyRegistered,
                ToView(application, contract, snapshot));
        }

        var actorId = $"property-contract:{request.Provider}";
        const string reason =
            "Trusted property and lease-contract evidence was confirmed and its immutable contractual terms snapshot was captured.";
        var workflow = CreditApplicationWorkflow.Restore(application.Status);
        var transition = workflow.MoveTo(
            CreditApplicationStatus.ExternalChecksPending,
            actorId,
            reason,
            occurredAtUtc);

        application.Status = transition.To;
        application.UpdatedAtUtc = occurredAtUtc;
        request.Status = nameof(ExternalPropertyContractEvidenceStatus.Confirmed);
        request.ReasonCode = null;
        request.UpdatedAtUtc = occurredAtUtc;

        AddWorkflowTransition(application.Id, transition);
        AddAudit(application.Id, actorId, "property_contract_registered", reason, occurredAtUtc);
        AddOutbox("credit-application.property-contract-registered.v1", occurredAtUtc, new
        {
            applicationId = application.Id,
            verificationRequestId = request.Id,
            contractId = contract.Id,
            tenantUserId = contract.TenantUserId,
            ownerUserId = contract.OwnerUserId,
            propertyId = contract.PropertyId,
            bankLoanPlanId = contract.BankLoanPlanId,
            bankLoanPlanVersion = contract.BankLoanPlanVersion,
            fullDepositEquivalentRial = snapshot.FullDepositEquivalentRial,
            sourceReference = snapshot.SourceReference,
            fromStatus = transition.From.ToString(),
            toStatus = transition.To.ToString(),
            occurredAtUtc,
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return new ReconcilePropertyContractResult(
            ReconcilePropertyContractOutcome.Registered,
            ToView(application, contract, snapshot));
    }

    private static bool TryValidateConfirmedEvidence(
        ExternalPropertyContractEvidenceResponse response,
        out ValidatedEvidence evidence)
    {
        evidence = null!;

        try
        {
            if (response.Status != ExternalPropertyContractEvidenceStatus.Confirmed
                || response.OwnerUserId is null
                || response.OwnerUserId.Value == Guid.Empty
                || response.PropertyId is null
                || response.PropertyId.Value == Guid.Empty
                || response.PersianStartYear is null
                || response.PersianStartMonth is null
                || response.PersianStartDay is null
                || response.CashDepositRial is null
                || response.MonthlyRentRial is null
                || string.IsNullOrWhiteSpace(response.OwnerBeneficiaryId)
                || string.IsNullOrWhiteSpace(response.BankBeneficiaryId)
                || string.IsNullOrWhiteSpace(response.ExternalReference)
                || response.ScheduleMonths is null
                || response.ScheduleMonths.Count != BankLoanPlanVersion.RequiredTermMonths)
            {
                return false;
            }

            var cashDepositRial = response.CashDepositRial.Value;
            var monthlyRentRial = response.MonthlyRentRial.Value;
            RialAmountPolicy.RequireWholeNonNegative(cashDepositRial, nameof(response.CashDepositRial));
            RialAmountPolicy.RequireWholeNonNegative(monthlyRentRial, nameof(response.MonthlyRentRial));

            if (FullDepositCalculator.Calculate(cashDepositRial, monthlyRentRial) <= 0m)
            {
                return false;
            }

            var maximumPersianYear = PersianCalendar.GetYear(PersianCalendar.MaxSupportedDateTime);
            var year = response.PersianStartYear.Value;
            var month = response.PersianStartMonth.Value;
            var day = response.PersianStartDay.Value;
            if (year < 1 || year > maximumPersianYear || month is < 1 or > 12)
            {
                return false;
            }

            var daysInMonth = PersianCalendar.GetDaysInMonth(year, month);
            if (day < 1 || day > daysInMonth)
            {
                return false;
            }

            var schedule = response.ScheduleMonths
                .OrderBy(x => x.ContractMonthNumber)
                .Select(x => new LeaseContractScheduleMonthInput(
                    x.ContractMonthNumber,
                    x.DueAtUtc,
                    x.OwnerPaymentRial,
                    x.BankInterestRial))
                .ToArray();

            for (var index = 0; index < schedule.Length; index++)
            {
                var item = schedule[index];
                if (item.ContractMonthNumber != index + 1)
                {
                    return false;
                }

                RialAmountPolicy.RequireWholeNonNegative(item.OwnerPaymentRial, nameof(item.OwnerPaymentRial));
                RialAmountPolicy.RequireWholeNonNegative(item.BankInterestRial, nameof(item.BankInterestRial));

                if ((item.OwnerPaymentRial == 0m && item.BankInterestRial == 0m)
                    || (index > 0 && schedule[index - 1].DueAtUtc >= item.DueAtUtc))
                {
                    return false;
                }
            }

            evidence = new ValidatedEvidence(
                response.OwnerUserId.Value,
                response.PropertyId.Value,
                year,
                month,
                day,
                cashDepositRial,
                monthlyRentRial,
                response.OwnerBeneficiaryId.Trim(),
                response.BankBeneficiaryId.Trim(),
                response.ExternalReference.Trim(),
                schedule);
            return true;
        }
        catch (Exception exception) when (
            exception is ArgumentException
            or InvalidOperationException)
        {
            return false;
        }
    }

    private static bool HasValidContractBinding(
        CreditApplicationRow application,
        LeaseContractRow contract) =>
        application.BankLoanPlanId is not null
        && !string.IsNullOrWhiteSpace(application.BankLoanPlanVersion)
        && contract.CreditApplicationId == application.Id
        && contract.TenantUserId == application.ApplicantUserId
        && contract.BankLoanPlanId == application.BankLoanPlanId
        && string.Equals(
            contract.BankLoanPlanVersion,
            application.BankLoanPlanVersion,
            StringComparison.Ordinal);

    private void AddWorkflowTransition(
        Guid applicationId,
        Charkhoone.Domain.Workflows.WorkflowTransition<CreditApplicationStatus> transition) =>
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

    private void AddAudit(
        Guid applicationId,
        string actorId,
        string action,
        string reason,
        DateTimeOffset occurredAtUtc) =>
        dbContext.AuditEvents.Add(new AuditEventRow
        {
            Id = Guid.NewGuid(),
            AggregateType = AggregateType,
            AggregateId = applicationId,
            ActorId = actorId,
            Action = action,
            Reason = reason,
            OccurredAtUtc = occurredAtUtc,
        });

    private void AddOutbox(
        string type,
        DateTimeOffset occurredAtUtc,
        object payload) =>
        dbContext.OutboxMessages.Add(new OutboxMessageRow
        {
            Id = Guid.NewGuid(),
            OccurredAtUtc = occurredAtUtc,
            Type = type,
            PayloadJson = JsonSerializer.Serialize(payload),
        });

    private static PropertyContractRegistrationView ToView(
        CreditApplicationRow application,
        LeaseContractRow contract,
        LeaseContractTermsSnapshot snapshot) =>
        new(
            application.Id,
            application.Status,
            contract.Id,
            contract.Status,
            contract.TenantUserId,
            contract.OwnerUserId,
            contract.PropertyId,
            contract.BankLoanPlanId!.Value,
            contract.BankLoanPlanVersion!,
            snapshot.FullDepositEquivalentRial,
            snapshot.SourceReference,
            application.UpdatedAtUtc);

    private string NormalizeProvider(string? provider) =>
        string.IsNullOrWhiteSpace(provider)
            ? evidenceAdapter.Provider
            : provider.Trim();

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static ReconcilePropertyContractResult Empty(
        ReconcilePropertyContractOutcome outcome) =>
        new(outcome, null);

    private sealed record ValidatedEvidence(
        Guid OwnerUserId,
        Guid PropertyId,
        int PersianStartYear,
        int PersianStartMonth,
        int PersianStartDay,
        decimal CashDepositRial,
        decimal MonthlyRentRial,
        string OwnerBeneficiaryId,
        string BankBeneficiaryId,
        string ExternalReference,
        IReadOnlyList<LeaseContractScheduleMonthInput> ScheduleMonths);
}
