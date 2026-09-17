using System.Text.Json;
using Charkhoone.Application.BankFunding;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Finance;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Infrastructure.BankFunding;

public sealed class EfBankFundingService(
    CharkhooneDbContext dbContext,
    IExternalBankApprovalAdapter bankAdapter,
    IExternalFundAdapter fundAdapter) : IBankFundingService
{
    private const string AggregateType = "CreditApplication";

    public async Task<ProcessBankFundingResult> ProcessAsync(
        Guid applicationId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default)
    {
        if (applicationId == Guid.Empty)
        {
            throw new ArgumentException("Credit application id is required.", nameof(applicationId));
        }

        CreditApplicationRow application;
        CreditEligibilityAssessmentRow eligibility;
        LeaseContractRow contract;
        BankLoanPlanVersionRow plan;
        BankApprovalRow approval;
        FundingAllocationRow? allocation;

        await using (var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken))
        {
            application = await dbContext.CreditApplications
                .FromSqlInterpolated($"SELECT * FROM credit_applications WHERE \"Id\" = {applicationId} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken)
                ?? null!;

            if (application is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new ProcessBankFundingResult(ProcessBankFundingOutcome.NotFound, null);
            }

            contract = await dbContext.LeaseContracts
                .SingleOrDefaultAsync(x => x.CreditApplicationId == applicationId, cancellationToken)
                ?? null!;

            allocation = await dbContext.FundingAllocations
                .SingleOrDefaultAsync(x => x.CreditApplicationId == applicationId, cancellationToken);

            if (application.Status == CreditApplicationStatus.ApprovedFunded)
            {
                var principal = contract is null
                    ? null
                    : await dbContext.FrozenPrincipals
                        .SingleOrDefaultAsync(x => x.ContractId == contract.Id, cancellationToken);

                await transaction.RollbackAsync(cancellationToken);
                return new ProcessBankFundingResult(
                    principal is not null && allocation is not null
                        ? ProcessBankFundingOutcome.AlreadyFunded
                        : ProcessBankFundingOutcome.InvalidState,
                    ToView(application, contract, allocation, principal));
            }

            if (!IsProcessableState(application.Status))
            {
                await transaction.RollbackAsync(cancellationToken);
                return new ProcessBankFundingResult(
                    ProcessBankFundingOutcome.InvalidState,
                    ToView(application, contract, allocation, null));
            }

            eligibility = await dbContext.CreditEligibilityAssessments
                .SingleOrDefaultAsync(x => x.CreditApplicationId == applicationId, cancellationToken)
                ?? null!;

            if (!IsUsableEligibility(eligibility) || contract is null
                || application.BankLoanPlanId is null
                || string.IsNullOrWhiteSpace(application.BankLoanPlanVersion))
            {
                await transaction.RollbackAsync(cancellationToken);
                return new ProcessBankFundingResult(
                    ProcessBankFundingOutcome.InvalidState,
                    ToView(application, contract, allocation, null));
            }

            plan = await dbContext.BankLoanPlanVersions
                .SingleOrDefaultAsync(
                    x => x.PlanId == application.BankLoanPlanId.Value
                         && x.Version == application.BankLoanPlanVersion,
                    cancellationToken)
                ?? null!;

            if (plan is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new ProcessBankFundingResult(
                    ProcessBankFundingOutcome.InvalidState,
                    ToView(application, contract, allocation, null));
            }

            approval = await dbContext.BankApprovals
                .SingleOrDefaultAsync(x => x.CreditApplicationId == applicationId, cancellationToken)
                ?? new BankApprovalRow
                {
                    Id = Guid.NewGuid(),
                    CreditApplicationId = applicationId,
                    Provider = bankAdapter.Provider,
                    Status = BankApprovalDecisionStatus.Indeterminate.ToString(),
                    MaximumEligibleLoanRial = eligibility.MaximumEligibleLoanRial!.Value,
                    IdempotencyKey = $"bank-approval:{applicationId:D}:v1",
                    CreatedAtUtc = occurredAtUtc,
                    UpdatedAtUtc = occurredAtUtc,
                };

            if (dbContext.Entry(approval).State == EntityState.Detached)
            {
                dbContext.BankApprovals.Add(approval);
            }

            if (application.Status == CreditApplicationStatus.DecisionReady)
            {
                ApplyTransition(
                    application,
                    CreditApplicationStatus.BankApprovalPending,
                    $"bank:{plan.BankId}",
                    "Bank approval was requested for the selected loan-plan version.",
                    occurredAtUtc);
            }
            else if (application.Status == CreditApplicationStatus.ExternalCheckIndeterminate)
            {
                ApplyTransition(
                    application,
                    allocation is null
                        ? CreditApplicationStatus.BankApprovalPending
                        : CreditApplicationStatus.FundingPending,
                    "system:reconciliation",
                    allocation is null
                        ? "Bank approval reconciliation is being resumed."
                        : "Fund principal-freeze reconciliation is being resumed.",
                    occurredAtUtc);
            }

            if (application.Status == CreditApplicationStatus.FundingPending && allocation is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new ProcessBankFundingResult(
                    ProcessBankFundingOutcome.InvalidState,
                    ToView(application, contract, null, null));
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }

        if (allocation is null)
        {
            var response = await bankAdapter.CheckAsync(
                new BankApprovalRequest(
                    approval.Id,
                    applicationId,
                    application.ApplicantUserId,
                    plan.PlanId,
                    plan.Version,
                    plan.BankId,
                    eligibility.MaximumEligibleLoanRial!.Value),
                cancellationToken);

            var bankResult = await ApplyBankResultAsync(
                applicationId,
                approval.Id,
                contract.Id,
                plan,
                eligibility,
                response,
                occurredAtUtc,
                cancellationToken);

            if (bankResult.Outcome != ProcessBankFundingOutcome.Funded)
            {
                return bankResult;
            }

            allocation = await dbContext.FundingAllocations
                .AsNoTracking()
                .SingleAsync(x => x.CreditApplicationId == applicationId, cancellationToken);
        }

        return await FreezePrincipalAsync(
            applicationId,
            contract.Id,
            allocation,
            occurredAtUtc,
            cancellationToken);
    }

    private async Task<ProcessBankFundingResult> ApplyBankResultAsync(
        Guid applicationId,
        Guid approvalId,
        Guid contractId,
        BankLoanPlanVersionRow plan,
        CreditEligibilityAssessmentRow eligibility,
        BankApprovalResponse response,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var application = await dbContext.CreditApplications
            .FromSqlInterpolated($"SELECT * FROM credit_applications WHERE \"Id\" = {applicationId} FOR UPDATE")
            .SingleAsync(cancellationToken);
        var approval = await dbContext.BankApprovals
            .FromSqlInterpolated($"SELECT * FROM bank_approvals WHERE \"Id\" = {approvalId} FOR UPDATE")
            .SingleAsync(cancellationToken);
        var contract = await dbContext.LeaseContracts
            .SingleAsync(x => x.Id == contractId, cancellationToken);

        if (application.Status != CreditApplicationStatus.BankApprovalPending)
        {
            await transaction.RollbackAsync(cancellationToken);
            return new ProcessBankFundingResult(
                ProcessBankFundingOutcome.InvalidState,
                ToView(application, contract, null, null));
        }

        approval.Provider = string.IsNullOrWhiteSpace(response.Provider)
            ? bankAdapter.Provider
            : response.Provider.Trim();
        approval.Status = response.Status.ToString();
        approval.ApprovedLoanRial = response.ApprovedLoanRial;
        approval.ExternalReference = response.ExternalReference;
        approval.ReasonCode = response.ReasonCode;
        approval.AttemptCount += 1;
        approval.UpdatedAtUtc = occurredAtUtc;

        if (response.Status == BankApprovalDecisionStatus.Declined)
        {
            ApplyTransition(
                application,
                CreditApplicationStatus.Rejected,
                $"bank:{plan.BankId}",
                "The selected bank declined the credit application.",
                occurredAtUtc);

            AddAudit(applicationId, $"bank:{plan.BankId}", "bank_approval_declined", "The selected bank declined the credit application.", occurredAtUtc);
            AddOutbox("credit-application.bank-declined.v1", occurredAtUtc, new
            {
                applicationId,
                approvalId,
                bankId = plan.BankId,
                externalReference = approval.ExternalReference,
                occurredAtUtc,
            });

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return new ProcessBankFundingResult(
                ProcessBankFundingOutcome.BankDeclined,
                ToView(application, contract, null, null));
        }

        var approvedLoanRial = response.ApprovedLoanRial;
        if (response.Status != BankApprovalDecisionStatus.Approved
            || approvedLoanRial is null
            || approvedLoanRial <= 0m
            || approvedLoanRial > eligibility.MaximumEligibleLoanRial
            || approvedLoanRial > eligibility.FullDepositEquivalentRial)
        {
            approval.Status = BankApprovalDecisionStatus.Indeterminate.ToString();
            approval.ApprovedLoanRial = null;
            approval.ReasonCode ??= response.Status == BankApprovalDecisionStatus.Approved
                ? "bank_approved_amount_invalid"
                : "bank_approval_indeterminate";

            MarkExternalIndeterminate(
                application,
                $"bank:{plan.BankId}",
                "Bank approval could not be reconciled to a valid approved loan amount.",
                occurredAtUtc);

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return new ProcessBankFundingResult(
                ProcessBankFundingOutcome.BankApprovalIndeterminate,
                ToView(application, contract, null, null));
        }

        var tenantContributionRial = CreditAllocationCalculator.CalculateTenantContribution(
            eligibility.FullDepositEquivalentRial,
            approvedLoanRial.Value);

        var allocation = new FundingAllocationRow
        {
            Id = Guid.NewGuid(),
            CreditApplicationId = applicationId,
            ContractId = contractId,
            BankLoanPlanId = plan.PlanId,
            BankLoanPlanVersion = plan.Version,
            BankId = plan.BankId,
            FullDepositEquivalentRial = eligibility.FullDepositEquivalentRial,
            MaximumEligibleLoanRial = eligibility.MaximumEligibleLoanRial!.Value,
            BankApprovedLoanRial = approvedLoanRial.Value,
            TenantContributionRial = tenantContributionRial,
            CreatedAtUtc = occurredAtUtc,
            UpdatedAtUtc = occurredAtUtc,
        };
        dbContext.FundingAllocations.Add(allocation);

        contract.BankLoanPlanId = plan.PlanId;
        contract.BankLoanPlanVersion = plan.Version;
        contract.UpdatedAtUtc = occurredAtUtc;

        ApplyTransition(
            application,
            CreditApplicationStatus.FundingPending,
            $"bank:{plan.BankId}",
            "The bank-approved loan amount was recorded and funding allocation was calculated.",
            occurredAtUtc);

        AddAudit(
            applicationId,
            $"bank:{plan.BankId}",
            "bank_approval_applied",
            "Funding allocation uses the bank-approved amount, not the theoretical eligibility ceiling.",
            occurredAtUtc);
        AddOutbox("credit-application.bank-approved.v1", occurredAtUtc, new
        {
            applicationId,
            approvalId,
            fundingAllocationId = allocation.Id,
            bankId = plan.BankId,
            fullDepositEquivalentRial = allocation.FullDepositEquivalentRial,
            maximumEligibleLoanRial = allocation.MaximumEligibleLoanRial,
            bankApprovedLoanRial = allocation.BankApprovedLoanRial,
            tenantContributionRial = allocation.TenantContributionRial,
            occurredAtUtc,
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return new ProcessBankFundingResult(
            ProcessBankFundingOutcome.Funded,
            ToView(application, contract, allocation, null));
    }

    private async Task<ProcessBankFundingResult> FreezePrincipalAsync(
        Guid applicationId,
        Guid contractId,
        FundingAllocationRow allocation,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken)
    {
        FundPrincipalFreezeRow request;

        await using (var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken))
        {
            var application = await dbContext.CreditApplications
                .FromSqlInterpolated($"SELECT * FROM credit_applications WHERE \"Id\" = {applicationId} FOR UPDATE")
                .SingleAsync(cancellationToken);
            var contract = await dbContext.LeaseContracts
                .SingleAsync(x => x.Id == contractId, cancellationToken);
            var initialPrincipal = await dbContext.FrozenPrincipals
                .SingleOrDefaultAsync(x => x.ContractId == contractId, cancellationToken);

            if (application.Status == CreditApplicationStatus.ApprovedFunded && initialPrincipal is not null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new ProcessBankFundingResult(
                    ProcessBankFundingOutcome.AlreadyFunded,
                    ToView(application, contract, allocation, initialPrincipal));
            }

            if (application.Status != CreditApplicationStatus.FundingPending)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new ProcessBankFundingResult(
                    ProcessBankFundingOutcome.InvalidState,
                    ToView(application, contract, allocation, initialPrincipal));
            }

            request = await dbContext.FundPrincipalFreezes
                .SingleOrDefaultAsync(x => x.FundingAllocationId == allocation.Id, cancellationToken)
                ?? new FundPrincipalFreezeRow
                {
                    Id = Guid.NewGuid(),
                    FundingAllocationId = allocation.Id,
                    Provider = fundAdapter.Provider,
                    Status = FundPrincipalFreezeStatus.Indeterminate.ToString(),
                    IdempotencyKey = $"fund-principal-freeze:{allocation.Id:D}:v1",
                    CreatedAtUtc = occurredAtUtc,
                    UpdatedAtUtc = occurredAtUtc,
                };

            if (dbContext.Entry(request).State == EntityState.Detached)
            {
                dbContext.FundPrincipalFreezes.Add(request);
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }

        var response = await fundAdapter.FreezePrincipalAsync(
            new FundPrincipalFreezeRequest(
                request.Id,
                allocation.Id,
                applicationId,
                contractId,
                allocation.BankId,
                allocation.BankApprovedLoanRial),
            cancellationToken);

        await using var resultTransaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var lockedApplication = await dbContext.CreditApplications
            .FromSqlInterpolated($"SELECT * FROM credit_applications WHERE \"Id\" = {applicationId} FOR UPDATE")
            .SingleAsync(cancellationToken);
        var lockedContract = await dbContext.LeaseContracts
            .SingleAsync(x => x.Id == contractId, cancellationToken);
        var lockedRequest = await dbContext.FundPrincipalFreezes
            .FromSqlInterpolated($"SELECT * FROM fund_principal_freezes WHERE \"Id\" = {request.Id} FOR UPDATE")
            .SingleAsync(cancellationToken);
        var existingPrincipal = await dbContext.FrozenPrincipals
            .SingleOrDefaultAsync(x => x.ContractId == contractId, cancellationToken);

        if (lockedApplication.Status != CreditApplicationStatus.FundingPending)
        {
            await resultTransaction.RollbackAsync(cancellationToken);
            return new ProcessBankFundingResult(
                ProcessBankFundingOutcome.InvalidState,
                ToView(lockedApplication, lockedContract, allocation, existingPrincipal));
        }

        lockedRequest.Provider = string.IsNullOrWhiteSpace(response.Provider)
            ? fundAdapter.Provider
            : response.Provider.Trim();
        lockedRequest.Status = response.Status.ToString();
        lockedRequest.FundReference = response.FundReference;
        lockedRequest.ExternalReference = response.ExternalReference;
        lockedRequest.ReasonCode = response.ReasonCode;
        lockedRequest.AttemptCount += 1;
        lockedRequest.UpdatedAtUtc = occurredAtUtc;

        if (response.Status != FundPrincipalFreezeStatus.Confirmed
            || string.IsNullOrWhiteSpace(response.FundReference))
        {
            lockedRequest.Status = FundPrincipalFreezeStatus.Indeterminate.ToString();
            lockedRequest.FundReference = null;
            lockedRequest.ReasonCode ??= "fund_principal_freeze_indeterminate";

            MarkExternalIndeterminate(
                lockedApplication,
                $"fund:{lockedRequest.Provider}",
                "The fund could not confirm that the bank principal is frozen.",
                occurredAtUtc);

            await dbContext.SaveChangesAsync(cancellationToken);
            await resultTransaction.CommitAsync(cancellationToken);
            return new ProcessBankFundingResult(
                ProcessBankFundingOutcome.FundingIndeterminate,
                ToView(lockedApplication, lockedContract, allocation, null));
        }

        var normalizedFundReference = response.FundReference.Trim();
        if (existingPrincipal is not null
            && (existingPrincipal.BankId != allocation.BankId
                || existingPrincipal.AmountRial != allocation.BankApprovedLoanRial
                || existingPrincipal.FundReference != normalizedFundReference))
        {
            await resultTransaction.RollbackAsync(cancellationToken);
            return new ProcessBankFundingResult(
                ProcessBankFundingOutcome.InvalidState,
                ToView(lockedApplication, lockedContract, allocation, existingPrincipal));
        }

        var frozenPrincipal = existingPrincipal ?? new FrozenPrincipalRow
        {
            ContractId = contractId,
            BankId = allocation.BankId,
            AmountRial = allocation.BankApprovedLoanRial,
            FundReference = normalizedFundReference,
            FrozenAtUtc = occurredAtUtc,
        };

        if (existingPrincipal is null)
        {
            dbContext.FrozenPrincipals.Add(frozenPrincipal);
        }

        ApplyTransition(
            lockedApplication,
            CreditApplicationStatus.ApprovedFunded,
            $"fund:{lockedRequest.Provider}",
            "The fund confirmed receipt and freeze of the bank principal.",
            occurredAtUtc);

        AddAudit(
            applicationId,
            $"fund:{lockedRequest.Provider}",
            "bank_principal_frozen",
            "Bank principal is recorded as a separate frozen resource and is not available for coverage spending.",
            occurredAtUtc);
        AddOutbox("credit-application.funding-completed.v1", occurredAtUtc, new
        {
            applicationId,
            fundingAllocationId = allocation.Id,
            contractId,
            bankId = allocation.BankId,
            bankApprovedLoanRial = allocation.BankApprovedLoanRial,
            tenantContributionRial = allocation.TenantContributionRial,
            fundReference = normalizedFundReference,
            occurredAtUtc,
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        await resultTransaction.CommitAsync(cancellationToken);

        return new ProcessBankFundingResult(
            ProcessBankFundingOutcome.Funded,
            ToView(lockedApplication, lockedContract, allocation, frozenPrincipal));
    }

    private void MarkExternalIndeterminate(
        CreditApplicationRow application,
        string actorId,
        string reason,
        DateTimeOffset occurredAtUtc)
    {
        ApplyTransition(
            application,
            CreditApplicationStatus.ExternalCheckIndeterminate,
            actorId,
            reason,
            occurredAtUtc);
        AddAudit(application.Id, actorId, "external_financial_result_indeterminate", reason, occurredAtUtc);
    }

    private void ApplyTransition(
        CreditApplicationRow application,
        CreditApplicationStatus next,
        string actorId,
        string reason,
        DateTimeOffset occurredAtUtc)
    {
        var workflow = CreditApplicationWorkflow.Restore(application.Status);
        var transition = workflow.MoveTo(next, actorId, reason, occurredAtUtc);
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

    private static bool IsProcessableState(CreditApplicationStatus status) =>
        status is CreditApplicationStatus.DecisionReady
            or CreditApplicationStatus.BankApprovalPending
            or CreditApplicationStatus.FundingPending
            or CreditApplicationStatus.ExternalCheckIndeterminate
            or CreditApplicationStatus.ApprovedFunded;

    private static bool IsUsableEligibility(CreditEligibilityAssessmentRow? eligibility) =>
        eligibility is not null
            && eligibility.Status == nameof(ExternalCreditResultStatus.Valid)
            && eligibility.MaximumEligibleLoanRial is > 0m
            && eligibility.FullDepositEquivalentRial > 0m;

    private static BankFundingView ToView(
        CreditApplicationRow application,
        LeaseContractRow? contract,
        FundingAllocationRow? allocation,
        FrozenPrincipalRow? principal) =>
        new(
            application.Id,
            application.Status,
            contract?.Id,
            allocation?.BankId,
            allocation?.FullDepositEquivalentRial,
            allocation?.MaximumEligibleLoanRial,
            allocation?.BankApprovedLoanRial,
            allocation?.TenantContributionRial,
            principal?.FundReference,
            application.UpdatedAtUtc);
}
