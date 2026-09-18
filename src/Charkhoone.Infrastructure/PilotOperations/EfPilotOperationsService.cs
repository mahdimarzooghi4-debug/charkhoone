using Charkhoone.Application.BankFunding;
using Charkhoone.Application.Contracts;
using Charkhoone.Application.CreditEligibility;
using Charkhoone.Application.IdentityVerification;
using Charkhoone.Application.PilotOperations;
using Charkhoone.Application.TenantContributionFunding;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Infrastructure.PilotOperations;

public sealed class EfPilotOperationsService(
    CharkhooneDbContext dbContext,
    ICreditApplicationIdentityService identityService,
    IPropertyContractRegistrationService propertyContractRegistrationService,
    ICreditEligibilityService creditEligibilityService,
    IBankFundingService bankFundingService,
    ITenantContributionFundingService tenantContributionFundingService)
    : IPilotOperationsService
{
    private const string AggregateType = "CreditApplication";
    private const string OperatorAuditAction = "pilot_operator_reconcile_requested";

    public async Task<IReadOnlyList<PilotCaseQueueItem>> ListCasesAsync(
        PilotCaseQueueQuery query,
        CancellationToken cancellationToken = default)
    {
        if (query.Page < 1)
        {
            throw new ArgumentOutOfRangeException(nameof(query), "Page must be at least 1.");
        }

        if (query.PageSize is < 1 or > 200)
        {
            throw new ArgumentOutOfRangeException(nameof(query), "Page size must be between 1 and 200.");
        }

        var applicationsQuery = dbContext.CreditApplications.AsNoTracking();
        if (query.Status is not null)
        {
            applicationsQuery = applicationsQuery.Where(x => x.Status == query.Status.Value);
        }

        var applications = await applicationsQuery
            .OrderByDescending(x => x.UpdatedAtUtc)
            .ThenBy(x => x.Id)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        if (applications.Count == 0)
        {
            return Array.Empty<PilotCaseQueueItem>();
        }

        var applicationIds = applications.Select(x => x.Id).ToArray();
        var contracts = await dbContext.LeaseContracts
            .AsNoTracking()
            .Where(x => x.CreditApplicationId != null && applicationIds.Contains(x.CreditApplicationId.Value))
            .ToListAsync(cancellationToken);
        var verifications = await dbContext.VerificationRequests
            .AsNoTracking()
            .Where(x => applicationIds.Contains(x.CreditApplicationId))
            .OrderByDescending(x => x.UpdatedAtUtc)
            .ThenByDescending(x => x.Id)
            .ToListAsync(cancellationToken);
        var eligibility = await dbContext.CreditEligibilityAssessments
            .AsNoTracking()
            .Where(x => applicationIds.Contains(x.CreditApplicationId))
            .ToListAsync(cancellationToken);
        var approvals = await dbContext.BankApprovals
            .AsNoTracking()
            .Where(x => applicationIds.Contains(x.CreditApplicationId))
            .ToListAsync(cancellationToken);
        var allocations = await dbContext.FundingAllocations
            .AsNoTracking()
            .Where(x => applicationIds.Contains(x.CreditApplicationId))
            .ToListAsync(cancellationToken);

        var allocationIds = allocations.Select(x => x.Id).ToArray();
        var freezes = allocationIds.Length == 0
            ? []
            : await dbContext.FundPrincipalFreezes
                .AsNoTracking()
                .Where(x => allocationIds.Contains(x.FundingAllocationId))
                .ToListAsync(cancellationToken);
        var tenantFundings = allocationIds.Length == 0
            ? []
            : await dbContext.TenantContributionFundings
                .AsNoTracking()
                .Where(x => allocationIds.Contains(x.FundingAllocationId))
                .ToListAsync(cancellationToken);
        var externalIds = tenantFundings.Select(x => x.ExternalTransactionId).ToArray();
        var externalTransactions = externalIds.Length == 0
            ? []
            : await dbContext.ExternalTransactions
                .AsNoTracking()
                .Where(x => externalIds.Contains(x.Id))
                .ToListAsync(cancellationToken);

        var contractByApplication = contracts
            .Where(x => x.CreditApplicationId is not null)
            .GroupBy(x => x.CreditApplicationId!.Value)
            .ToDictionary(group => group.Key, group => group.Single());
        var verificationByApplication = verifications
            .GroupBy(x => x.CreditApplicationId)
            .ToDictionary(group => group.Key, group => group.First());
        var eligibilityByApplication = eligibility.ToDictionary(x => x.CreditApplicationId);
        var approvalByApplication = approvals.ToDictionary(x => x.CreditApplicationId);
        var allocationByApplication = allocations.ToDictionary(x => x.CreditApplicationId);
        var freezeByAllocation = freezes.ToDictionary(x => x.FundingAllocationId);
        var tenantFundingByAllocation = tenantFundings.ToDictionary(x => x.FundingAllocationId);
        var externalById = externalTransactions.ToDictionary(x => x.Id);

        return applications
            .Select(application =>
            {
                contractByApplication.TryGetValue(application.Id, out var contract);
                verificationByApplication.TryGetValue(application.Id, out var verification);
                eligibilityByApplication.TryGetValue(application.Id, out var assessment);
                approvalByApplication.TryGetValue(application.Id, out var approval);
                allocationByApplication.TryGetValue(application.Id, out var allocation);

                FundPrincipalFreezeRow? freeze = null;
                TenantContributionFundingRow? tenantFunding = null;
                ExternalTransactionRow? tenantExternal = null;
                if (allocation is not null)
                {
                    freezeByAllocation.TryGetValue(allocation.Id, out freeze);
                    tenantFundingByAllocation.TryGetValue(allocation.Id, out tenantFunding);
                    if (tenantFunding is not null)
                    {
                        externalById.TryGetValue(tenantFunding.ExternalTransactionId, out tenantExternal);
                    }
                }

                return new PilotCaseQueueItem(
                    application.Id,
                    application.ApplicantUserId,
                    application.Status,
                    contract?.Id,
                    contract?.Status,
                    verification?.Type,
                    verification?.Status,
                    assessment?.Status,
                    approval?.Status,
                    freeze?.Status,
                    tenantExternal?.Status.ToString(),
                    SuggestOperation(
                        application.Status,
                        approval,
                        allocation,
                        freeze,
                        tenantExternal),
                    application.UpdatedAtUtc);
            })
            .ToArray();
    }

    public async Task<PilotCaseDetail?> GetCaseAsync(
        Guid applicationId,
        CancellationToken cancellationToken = default)
    {
        if (applicationId == Guid.Empty)
        {
            throw new ArgumentException("Credit application id is required.", nameof(applicationId));
        }

        var application = await dbContext.CreditApplications
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == applicationId, cancellationToken);
        if (application is null)
        {
            return null;
        }

        var contract = await dbContext.LeaseContracts
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.CreditApplicationId == applicationId, cancellationToken);

        var verifications = await dbContext.VerificationRequests
            .AsNoTracking()
            .Where(x => x.CreditApplicationId == applicationId)
            .OrderByDescending(x => x.UpdatedAtUtc)
            .ThenByDescending(x => x.Id)
            .ToListAsync(cancellationToken);

        var assessment = await dbContext.CreditEligibilityAssessments
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.CreditApplicationId == applicationId, cancellationToken);
        var approval = await dbContext.BankApprovals
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.CreditApplicationId == applicationId, cancellationToken);
        var allocation = await dbContext.FundingAllocations
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.CreditApplicationId == applicationId, cancellationToken);

        FundPrincipalFreezeRow? freeze = null;
        TenantContributionFundingRow? tenantFunding = null;
        ExternalTransactionRow? tenantExternal = null;
        if (allocation is not null)
        {
            freeze = await dbContext.FundPrincipalFreezes
                .AsNoTracking()
                .SingleOrDefaultAsync(x => x.FundingAllocationId == allocation.Id, cancellationToken);
            tenantFunding = await dbContext.TenantContributionFundings
                .AsNoTracking()
                .SingleOrDefaultAsync(x => x.FundingAllocationId == allocation.Id, cancellationToken);
            if (tenantFunding is not null)
            {
                tenantExternal = await dbContext.ExternalTransactions
                    .AsNoTracking()
                    .SingleOrDefaultAsync(x => x.Id == tenantFunding.ExternalTransactionId, cancellationToken);
            }
        }

        var audits = await dbContext.AuditEvents
            .AsNoTracking()
            .Where(x => x.AggregateType == AggregateType && x.AggregateId == applicationId)
            .OrderByDescending(x => x.OccurredAtUtc)
            .ThenByDescending(x => x.Id)
            .Take(50)
            .ToListAsync(cancellationToken);

        return new PilotCaseDetail(
            application.Id,
            application.ApplicantUserId,
            application.Status,
            application.BankLoanPlanId,
            application.BankLoanPlanVersion,
            contract?.Id,
            contract?.Status,
            contract?.OwnerUserId,
            contract?.PropertyId,
            verifications
                .Select(x => new PilotVerificationView(
                    x.Id,
                    x.Type,
                    x.Provider,
                    x.Status,
                    x.ExternalReference,
                    x.ReasonCode,
                    x.AttemptCount,
                    x.UpdatedAtUtc))
                .ToArray(),
            assessment is null
                ? null
                : new PilotCreditEligibilityView(
                    assessment.Provider,
                    assessment.Status,
                    assessment.ExternalSubGrade,
                    assessment.FullDepositEquivalentRial,
                    assessment.LoanRatio,
                    assessment.MaximumEligibleLoanRial,
                    assessment.ExternalReference,
                    assessment.ReasonCode,
                    assessment.AttemptCount,
                    assessment.UpdatedAtUtc),
            approval is null
                ? null
                : new PilotBankApprovalView(
                    approval.Provider,
                    approval.Status,
                    approval.MaximumEligibleLoanRial,
                    approval.ApprovedLoanRial,
                    approval.ExternalReference,
                    approval.ReasonCode,
                    approval.AttemptCount,
                    approval.UpdatedAtUtc),
            allocation is null
                ? null
                : new PilotFundingAllocationView(
                    allocation.Id,
                    allocation.ContractId,
                    allocation.BankId,
                    allocation.FullDepositEquivalentRial,
                    allocation.MaximumEligibleLoanRial,
                    allocation.BankApprovedLoanRial,
                    allocation.TenantContributionRial,
                    allocation.UpdatedAtUtc),
            freeze is null
                ? null
                : new PilotFundFreezeView(
                    freeze.Provider,
                    freeze.Status,
                    freeze.FundReference,
                    freeze.ExternalReference,
                    freeze.ReasonCode,
                    freeze.AttemptCount,
                    freeze.UpdatedAtUtc),
            tenantFunding is null || tenantExternal is null
                ? null
                : new PilotTenantContributionFundingView(
                    tenantFunding.Id,
                    tenantFunding.ExternalTransactionId,
                    tenantExternal.Provider,
                    tenantExternal.Status.ToString(),
                    tenantExternal.AmountRial,
                    tenantExternal.Currency,
                    tenantFunding.FundReference,
                    tenantExternal.ExternalReference,
                    tenantExternal.ReasonCode,
                    tenantFunding.AttemptCount,
                    tenantFunding.UpdatedAtUtc),
            audits
                .Select(x => new PilotAuditEventView(
                    x.Id,
                    x.ActorId,
                    x.Action,
                    x.Reason,
                    x.OccurredAtUtc))
                .ToArray(),
            SuggestOperation(application.Status, approval, allocation, freeze, tenantExternal),
            application.UpdatedAtUtc);
    }

    public async Task<PilotReconcileResult> ReconcileAsync(
        Guid applicationId,
        PilotReconcileOperation operation,
        string operatorSubject,
        string reason,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default)
    {
        if (applicationId == Guid.Empty)
        {
            throw new ArgumentException("Credit application id is required.", nameof(applicationId));
        }

        ArgumentException.ThrowIfNullOrWhiteSpace(operatorSubject);
        ArgumentException.ThrowIfNullOrWhiteSpace(reason);

        var normalizedSubject = operatorSubject.Trim();
        var normalizedReason = reason.Trim();
        if (normalizedSubject.Length > 220)
        {
            throw new ArgumentException("Operator subject is too long.", nameof(operatorSubject));
        }

        if (normalizedReason.Length > 1000)
        {
            throw new ArgumentException("Reason must be 1000 characters or fewer.", nameof(reason));
        }

        var application = await dbContext.CreditApplications
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == applicationId, cancellationToken);
        if (application is null)
        {
            return new PilotReconcileResult(
                PilotReconcileOutcome.NotFound,
                operation,
                null,
                null,
                null,
                null,
                occurredAtUtc);
        }

        var auditEventId = Guid.NewGuid();
        dbContext.AuditEvents.Add(new AuditEventRow
        {
            Id = auditEventId,
            AggregateType = AggregateType,
            AggregateId = applicationId,
            ActorId = $"pilot:{normalizedSubject}",
            Action = OperatorAuditAction,
            Reason = $"{operation}: {normalizedReason}",
            OccurredAtUtc = occurredAtUtc,
        });
        await dbContext.SaveChangesAsync(cancellationToken);

        var execution = operation switch
        {
            PilotReconcileOperation.Identity
                => await ExecuteIdentityAsync(applicationId, occurredAtUtc, cancellationToken),
            PilotReconcileOperation.PropertyContract
                => await ExecutePropertyContractAsync(
                    applicationId,
                    application.ApplicantUserId,
                    occurredAtUtc,
                    cancellationToken),
            PilotReconcileOperation.CreditEligibility
                => await ExecuteCreditEligibilityAsync(
                    applicationId,
                    application.ApplicantUserId,
                    occurredAtUtc,
                    cancellationToken),
            PilotReconcileOperation.BankFunding
                => await ExecuteBankFundingAsync(
                    applicationId,
                    application.ApplicantUserId,
                    occurredAtUtc,
                    cancellationToken),
            PilotReconcileOperation.TenantContributionFunding
                => await ExecuteTenantContributionFundingAsync(
                    applicationId,
                    occurredAtUtc,
                    cancellationToken),
            _ => throw new InvalidOperationException("Unsupported pilot reconcile operation."),
        };

        var refreshedApplication = await dbContext.CreditApplications
            .AsNoTracking()
            .SingleAsync(x => x.Id == applicationId, cancellationToken);
        var contractStatus = await dbContext.LeaseContracts
            .AsNoTracking()
            .Where(x => x.CreditApplicationId == applicationId)
            .Select(x => (Charkhoone.Domain.Contracts.LeaseContractStatus?)x.Status)
            .SingleOrDefaultAsync(cancellationToken);

        return new PilotReconcileResult(
            execution.Outcome,
            operation,
            execution.OperationOutcome,
            refreshedApplication.Status,
            contractStatus,
            auditEventId,
            occurredAtUtc);
    }

    private async Task<(PilotReconcileOutcome Outcome, string OperationOutcome)> ExecuteIdentityAsync(
        Guid applicationId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken)
    {
        var result = await identityService.ProcessAsync(applicationId, occurredAtUtc, cancellationToken);
        return result.Outcome switch
        {
            ProcessIdentityVerificationOutcome.NotFound
                => (PilotReconcileOutcome.NotFound, result.Outcome.ToString()),
            ProcessIdentityVerificationOutcome.InvalidState
                => (PilotReconcileOutcome.InvalidState, result.Outcome.ToString()),
            _ => (PilotReconcileOutcome.Executed, result.Outcome.ToString()),
        };
    }

    private async Task<(PilotReconcileOutcome Outcome, string OperationOutcome)> ExecutePropertyContractAsync(
        Guid applicationId,
        Guid applicantUserId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken)
    {
        var result = await propertyContractRegistrationService.ReconcileAsync(
            applicationId,
            applicantUserId,
            occurredAtUtc,
            cancellationToken);

        return result.Outcome switch
        {
            ReconcilePropertyContractOutcome.NotFound
                => (PilotReconcileOutcome.NotFound, result.Outcome.ToString()),
            ReconcilePropertyContractOutcome.Conflict
                => (PilotReconcileOutcome.Conflict, result.Outcome.ToString()),
            ReconcilePropertyContractOutcome.InvalidState
                => (PilotReconcileOutcome.InvalidState, result.Outcome.ToString()),
            _ => (PilotReconcileOutcome.Executed, result.Outcome.ToString()),
        };
    }

    private async Task<(PilotReconcileOutcome Outcome, string OperationOutcome)> ExecuteCreditEligibilityAsync(
        Guid applicationId,
        Guid applicantUserId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken)
    {
        var result = await creditEligibilityService.EvaluateAsync(
            applicationId,
            applicantUserId,
            occurredAtUtc,
            cancellationToken);

        return result.Outcome switch
        {
            EvaluateCreditEligibilityOutcome.NotFound
                => (PilotReconcileOutcome.NotFound, result.Outcome.ToString()),
            EvaluateCreditEligibilityOutcome.Conflict
                => (PilotReconcileOutcome.Conflict, result.Outcome.ToString()),
            EvaluateCreditEligibilityOutcome.InvalidState
                => (PilotReconcileOutcome.InvalidState, result.Outcome.ToString()),
            _ => (PilotReconcileOutcome.Executed, result.Outcome.ToString()),
        };
    }

    private async Task<(PilotReconcileOutcome Outcome, string OperationOutcome)> ExecuteBankFundingAsync(
        Guid applicationId,
        Guid applicantUserId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken)
    {
        var result = await bankFundingService.ProcessAsync(
            applicationId,
            applicantUserId,
            occurredAtUtc,
            cancellationToken);

        return result.Outcome switch
        {
            ProcessBankFundingOutcome.NotFound
                => (PilotReconcileOutcome.NotFound, result.Outcome.ToString()),
            ProcessBankFundingOutcome.Conflict
                => (PilotReconcileOutcome.Conflict, result.Outcome.ToString()),
            ProcessBankFundingOutcome.InvalidState
                => (PilotReconcileOutcome.InvalidState, result.Outcome.ToString()),
            _ => (PilotReconcileOutcome.Executed, result.Outcome.ToString()),
        };
    }

    private async Task<(PilotReconcileOutcome Outcome, string OperationOutcome)> ExecuteTenantContributionFundingAsync(
        Guid applicationId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken)
    {
        var result = await tenantContributionFundingService.ReconcileAsync(
            applicationId,
            occurredAtUtc,
            cancellationToken);

        return result.Outcome switch
        {
            ReconcileTenantContributionOutcome.NotFound
                => (PilotReconcileOutcome.NotFound, result.Outcome.ToString()),
            ReconcileTenantContributionOutcome.InvalidState
                => (PilotReconcileOutcome.InvalidState, result.Outcome.ToString()),
            _ => (PilotReconcileOutcome.Executed, result.Outcome.ToString()),
        };
    }

    private static PilotReconcileOperation? SuggestOperation(
        CreditApplicationStatus applicationStatus,
        BankApprovalRow? approval,
        FundingAllocationRow? allocation,
        FundPrincipalFreezeRow? freeze,
        ExternalTransactionRow? tenantExternal)
    {
        return applicationStatus switch
        {
            CreditApplicationStatus.IdentityPending => PilotReconcileOperation.Identity,
            CreditApplicationStatus.PropertyContractPending => PilotReconcileOperation.PropertyContract,
            CreditApplicationStatus.ExternalChecksPending => PilotReconcileOperation.CreditEligibility,
            CreditApplicationStatus.DecisionReady => PilotReconcileOperation.BankFunding,
            CreditApplicationStatus.BankApprovalPending => PilotReconcileOperation.BankFunding,
            CreditApplicationStatus.FundingPending => PilotReconcileOperation.BankFunding,
            CreditApplicationStatus.ApprovedFunded
                when allocation is not null
                    && allocation.TenantContributionRial > 0m
                    && tenantExternal?.Status != Charkhoone.Domain.Payments.ExternalTransactionStatus.Succeeded
                => PilotReconcileOperation.TenantContributionFunding,
            CreditApplicationStatus.ExternalCheckIndeterminate
                when allocation is not null || approval is not null || freeze is not null
                => PilotReconcileOperation.BankFunding,
            CreditApplicationStatus.ExternalCheckIndeterminate
                => PilotReconcileOperation.CreditEligibility,
            _ => null,
        };
    }
}
