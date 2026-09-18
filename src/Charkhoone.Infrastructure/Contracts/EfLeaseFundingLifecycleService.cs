using System.Text.Json;
using Charkhoone.Application.Contracts;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Infrastructure.Contracts;

public sealed class EfLeaseFundingLifecycleService(CharkhooneDbContext dbContext)
    : ILeaseFundingLifecycleService
{
    private const string ActorId = "system:lease-funding-lifecycle";
    private const string TenantFundingOperationType = "tenant_contribution_funding";

    public async Task<AdvanceLeaseFundingLifecycleResult> AdvanceAsync(
        Guid contractId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default)
    {
        if (contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract id is required.", nameof(contractId));
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var contract = await dbContext.LeaseContracts
            .FromSqlInterpolated($"SELECT * FROM lease_contracts WHERE \"Id\" = {contractId} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);

        if (contract is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return new AdvanceLeaseFundingLifecycleResult(
                AdvanceLeaseFundingLifecycleOutcome.NotFound,
                contractId,
                null,
                0);
        }

        var initialStatus = contract.Status;

        if (contract.Status is LeaseContractStatus.Active
            or LeaseContractStatus.SettlementPending
            or LeaseContractStatus.Settled
            or LeaseContractStatus.CancellationPending
            or LeaseContractStatus.Cancelled)
        {
            await transaction.RollbackAsync(cancellationToken);
            return new AdvanceLeaseFundingLifecycleResult(
                AdvanceLeaseFundingLifecycleOutcome.AlreadyActivated,
                contract.Id,
                contract.Status,
                0);
        }

        if (contract.Status is not (
            LeaseContractStatus.Draft
            or LeaseContractStatus.AwaitingFunding
            or LeaseContractStatus.AwaitingCompletion))
        {
            await transaction.RollbackAsync(cancellationToken);
            return Invalid(contract.Id, initialStatus);
        }

        if (contract.CreditApplicationId is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Invalid(contract.Id, initialStatus);
        }

        var application = await dbContext.CreditApplications
            .SingleOrDefaultAsync(x => x.Id == contract.CreditApplicationId.Value, cancellationToken);
        if (application is null || application.ApplicantUserId != contract.TenantUserId)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Invalid(contract.Id, initialStatus);
        }

        var allocation = await dbContext.FundingAllocations
            .SingleOrDefaultAsync(
                x => x.ContractId == contract.Id
                    && x.CreditApplicationId == application.Id,
                cancellationToken);

        if (allocation is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return contract.Status == LeaseContractStatus.Draft
                ? new AdvanceLeaseFundingLifecycleResult(
                    AdvanceLeaseFundingLifecycleOutcome.NotReady,
                    contract.Id,
                    contract.Status,
                    0)
                : Invalid(contract, 0);
        }

        if (!HasValidAllocationBinding(contract, allocation))
        {
            await transaction.RollbackAsync(cancellationToken);
            return Invalid(contract.Id, initialStatus);
        }

        var appliedTransitions = 0;

        if (contract.Status == LeaseContractStatus.Draft)
        {
            ApplyTransition(
                contract,
                LeaseContractStatus.AwaitingFunding,
                "A bank-approved funding allocation is persisted for this lease contract.",
                "contract_entered_awaiting_funding",
                "lease-contract.awaiting-funding.v1",
                occurredAtUtc,
                new
                {
                    contractId = contract.Id,
                    applicationId = application.Id,
                    fundingAllocationId = allocation.Id,
                    bankId = allocation.BankId,
                    bankApprovedLoanRial = allocation.BankApprovedLoanRial,
                    tenantContributionRial = allocation.TenantContributionRial,
                    occurredAtUtc,
                });
            appliedTransitions++;
        }

        if (contract.Status == LeaseContractStatus.AwaitingFunding)
        {
            if (application.Status != CreditApplicationStatus.ApprovedFunded)
            {
                await CommitAsync(cancellationToken);
                return AdvancedOrNotReady(contract, appliedTransitions);
            }

            var principal = await dbContext.FrozenPrincipals
                .SingleOrDefaultAsync(x => x.ContractId == contract.Id, cancellationToken);
            var freeze = await dbContext.FundPrincipalFreezes
                .SingleOrDefaultAsync(x => x.FundingAllocationId == allocation.Id, cancellationToken);

            if (principal is null || freeze is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Invalid(contract.Id, initialStatus);
            }

            if (!HasValidFrozenPrincipalEvidence(allocation, principal, freeze))
            {
                await transaction.RollbackAsync(cancellationToken);
                return Invalid(contract.Id, initialStatus);
            }

            ApplyTransition(
                contract,
                LeaseContractStatus.AwaitingCompletion,
                "The fund confirmed the exact frozen bank principal for the persisted funding allocation.",
                "contract_entered_awaiting_completion",
                "lease-contract.awaiting-completion.v1",
                occurredAtUtc,
                new
                {
                    contractId = contract.Id,
                    applicationId = application.Id,
                    fundingAllocationId = allocation.Id,
                    bankId = allocation.BankId,
                    bankApprovedLoanRial = allocation.BankApprovedLoanRial,
                    fundProvider = freeze.Provider.Trim(),
                    fundReference = freeze.FundReference!.Trim(),
                    occurredAtUtc,
                });
            appliedTransitions++;
        }

        if (contract.Status == LeaseContractStatus.AwaitingCompletion)
        {
            var tenantReady = allocation.TenantContributionRial == 0m
                ? await ValidateZeroContributionStateAsync(allocation, contract.Id, cancellationToken)
                : await ValidatePositiveContributionStateAsync(allocation, contract.Id, cancellationToken);

            if (tenantReady == FundingReadiness.Invalid)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Invalid(contract.Id, initialStatus);
            }

            if (tenantReady == FundingReadiness.NotReady)
            {
                await CommitAsync(cancellationToken);
                return AdvancedOrNotReady(contract, appliedTransitions);
            }

            ApplyTransition(
                contract,
                LeaseContractStatus.Active,
                allocation.TenantContributionRial == 0m
                    ? "Bank principal funding is complete and this allocation requires no tenant contribution."
                    : "Bank principal funding and the exact tenant contribution are both confirmed and posted.",
                "contract_activated",
                "lease-contract.activated.v1",
                occurredAtUtc,
                new
                {
                    contractId = contract.Id,
                    applicationId = application.Id,
                    fundingAllocationId = allocation.Id,
                    tenantUserId = contract.TenantUserId,
                    ownerUserId = contract.OwnerUserId,
                    propertyId = contract.PropertyId,
                    bankId = allocation.BankId,
                    bankApprovedLoanRial = allocation.BankApprovedLoanRial,
                    tenantContributionRial = allocation.TenantContributionRial,
                    tenantContributionRequired = allocation.TenantContributionRial > 0m,
                    occurredAtUtc,
                });
            appliedTransitions++;
        }

        await CommitAsync(cancellationToken);

        return new AdvanceLeaseFundingLifecycleResult(
            contract.Status == LeaseContractStatus.Active
                ? AdvanceLeaseFundingLifecycleOutcome.Activated
                : AdvanceLeaseFundingLifecycleOutcome.Advanced,
            contract.Id,
            contract.Status,
            appliedTransitions);

        async Task CommitAsync(CancellationToken token)
        {
            await dbContext.SaveChangesAsync(token);
            await transaction.CommitAsync(token);
        }
    }

    private async Task<FundingReadiness> ValidatePositiveContributionStateAsync(
        FundingAllocationRow allocation,
        Guid contractId,
        CancellationToken cancellationToken)
    {
        var contribution = await dbContext.TenantContributions
            .SingleOrDefaultAsync(x => x.ContractId == contractId, cancellationToken);
        var funding = await dbContext.TenantContributionFundings
            .SingleOrDefaultAsync(x => x.FundingAllocationId == allocation.Id, cancellationToken);

        if (contribution is null && funding is null)
        {
            return FundingReadiness.NotReady;
        }

        if (contribution is null || funding is null)
        {
            return FundingReadiness.Invalid;
        }

        var external = await dbContext.ExternalTransactions
            .SingleOrDefaultAsync(x => x.Id == funding.ExternalTransactionId, cancellationToken);
        var journal = await dbContext.JournalEntries
            .SingleOrDefaultAsync(
                x => x.IdempotencyKey == $"journal:tenant-contribution-funding:{allocation.Id:D}:v1",
                cancellationToken);

        if (external is null || journal is null)
        {
            return FundingReadiness.Invalid;
        }

        var expectedExternalKey = $"tenant-contribution-funding:{allocation.Id:D}:v1";
        var valid =
            contribution.FundingAllocationId == allocation.Id
            && contribution.InitialAmountRial == allocation.TenantContributionRial
            && !string.IsNullOrWhiteSpace(contribution.FundReference)
            && !string.IsNullOrWhiteSpace(funding.FundReference)
            && string.Equals(
                contribution.FundReference.Trim(),
                funding.FundReference.Trim(),
                StringComparison.Ordinal)
            && external.AggregateType == "LeaseContract"
            && external.AggregateId == contractId
            && external.OperationType == TenantFundingOperationType
            && external.Status == ExternalTransactionStatus.Succeeded
            && external.AmountRial == allocation.TenantContributionRial
            && external.Currency == "IRR"
            && external.IdempotencyKey == expectedExternalKey
            && journal.ReferenceType == "ExternalTransaction"
            && journal.ReferenceId == external.Id;

        return valid ? FundingReadiness.Ready : FundingReadiness.Invalid;
    }

    private async Task<FundingReadiness> ValidateZeroContributionStateAsync(
        FundingAllocationRow allocation,
        Guid contractId,
        CancellationToken cancellationToken)
    {
        var hasContribution = await dbContext.TenantContributions
            .AnyAsync(x => x.ContractId == contractId, cancellationToken);
        var hasFunding = await dbContext.TenantContributionFundings
            .AnyAsync(x => x.FundingAllocationId == allocation.Id, cancellationToken);
        var hasExternal = await dbContext.ExternalTransactions
            .AnyAsync(
                x => x.IdempotencyKey == $"tenant-contribution-funding:{allocation.Id:D}:v1",
                cancellationToken);

        return hasContribution || hasFunding || hasExternal
            ? FundingReadiness.Invalid
            : FundingReadiness.Ready;
    }

    private void ApplyTransition(
        LeaseContractRow contract,
        LeaseContractStatus next,
        string reason,
        string auditAction,
        string outboxType,
        DateTimeOffset occurredAtUtc,
        object payload)
    {
        var workflow = LeaseContractWorkflow.Restore(contract.Status);
        var transition = workflow.MoveTo(next, ActorId, reason, occurredAtUtc);

        contract.Status = transition.To;
        contract.UpdatedAtUtc = occurredAtUtc;

        dbContext.WorkflowTransitions.Add(new WorkflowTransitionRow
        {
            Id = Guid.NewGuid(),
            AggregateType = "LeaseContract",
            AggregateId = contract.Id,
            FromStatus = transition.From.ToString(),
            ToStatus = transition.To.ToString(),
            ActorId = transition.ActorId,
            Reason = transition.Reason,
            OccurredAtUtc = transition.OccurredAtUtc,
        });

        dbContext.AuditEvents.Add(new AuditEventRow
        {
            Id = Guid.NewGuid(),
            AggregateType = "LeaseContract",
            AggregateId = contract.Id,
            ActorId = ActorId,
            Action = auditAction,
            Reason = reason,
            OccurredAtUtc = occurredAtUtc,
        });

        dbContext.OutboxMessages.Add(new OutboxMessageRow
        {
            Id = Guid.NewGuid(),
            OccurredAtUtc = occurredAtUtc,
            Type = outboxType,
            PayloadJson = JsonSerializer.Serialize(payload),
            AttemptCount = 0,
        });
    }

    private static bool HasValidAllocationBinding(
        LeaseContractRow contract,
        FundingAllocationRow allocation) =>
        allocation.BankApprovedLoanRial > 0m
        && allocation.TenantContributionRial >= 0m
        && allocation.FullDepositEquivalentRial
            == allocation.BankApprovedLoanRial + allocation.TenantContributionRial
        && contract.BankLoanPlanId == allocation.BankLoanPlanId
        && string.Equals(
            contract.BankLoanPlanVersion,
            allocation.BankLoanPlanVersion,
            StringComparison.Ordinal)
        && !string.IsNullOrWhiteSpace(allocation.BankId);

    private static bool HasValidFrozenPrincipalEvidence(
        FundingAllocationRow allocation,
        FrozenPrincipalRow principal,
        FundPrincipalFreezeRow freeze) =>
        principal.BankId == allocation.BankId
        && principal.AmountRial == allocation.BankApprovedLoanRial
        && !string.IsNullOrWhiteSpace(principal.FundReference)
        && string.Equals(freeze.Status, "Confirmed", StringComparison.Ordinal)
        && !string.IsNullOrWhiteSpace(freeze.Provider)
        && !string.IsNullOrWhiteSpace(freeze.FundReference)
        && string.Equals(
            principal.FundReference.Trim(),
            freeze.FundReference.Trim(),
            StringComparison.Ordinal);

    private static AdvanceLeaseFundingLifecycleResult AdvancedOrNotReady(
        LeaseContractRow contract,
        int appliedTransitions) =>
        new(
            appliedTransitions > 0
                ? AdvanceLeaseFundingLifecycleOutcome.Advanced
                : AdvanceLeaseFundingLifecycleOutcome.NotReady,
            contract.Id,
            contract.Status,
            appliedTransitions);

    private static AdvanceLeaseFundingLifecycleResult Invalid(
        Guid contractId,
        LeaseContractStatus persistedStatus) =>
        new(
            AdvanceLeaseFundingLifecycleOutcome.InvalidState,
            contractId,
            persistedStatus,
            0);

    private enum FundingReadiness
    {
        NotReady,
        Ready,
        Invalid,
    }
}
