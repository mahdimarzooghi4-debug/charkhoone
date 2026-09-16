using System.Text.Json;
using Charkhoone.Application.BankFunding;
using Charkhoone.Application.TenantContributionFunding;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Finance;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Infrastructure.TenantContributionFunding;

public sealed class EfTenantContributionFundingService(
    CharkhooneDbContext dbContext,
    IExternalFundAdapter fundAdapter) : ITenantContributionFundingService
{
    private const string AggregateType = "CreditApplication";
    private const string OperationType = "tenant_contribution_funding";

    public async Task<ReconcileTenantContributionResult> ReconcileAsync(
        Guid applicationId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default)
    {
        if (applicationId == Guid.Empty)
        {
            throw new ArgumentException("Credit application id is required.", nameof(applicationId));
        }

        FundingAllocationRow allocation;
        LeaseContractRow contract;
        TenantContributionFundingRow funding;
        ExternalTransactionRow externalTransaction;

        await using (var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken))
        {
            var application = await dbContext.CreditApplications
                .FromSqlInterpolated($"SELECT * FROM credit_applications WHERE \"Id\" = {applicationId} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);

            if (application is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new ReconcileTenantContributionResult(
                    ReconcileTenantContributionOutcome.NotFound,
                    null);
            }

            allocation = await dbContext.FundingAllocations
                .SingleOrDefaultAsync(x => x.CreditApplicationId == applicationId, cancellationToken)
                ?? null!;

            if (allocation is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new ReconcileTenantContributionResult(
                    ReconcileTenantContributionOutcome.InvalidState,
                    null);
            }

            contract = await dbContext.LeaseContracts
                .SingleOrDefaultAsync(x => x.Id == allocation.ContractId, cancellationToken)
                ?? null!;

            var frozenPrincipal = contract is null
                ? null
                : await dbContext.FrozenPrincipals
                    .SingleOrDefaultAsync(x => x.ContractId == contract.Id, cancellationToken);

            var contribution = contract is null
                ? null
                : await dbContext.TenantContributions
                    .SingleOrDefaultAsync(x => x.ContractId == contract.Id, cancellationToken);

            var existingJournal = await dbContext.JournalEntries
                .SingleOrDefaultAsync(
                    x => x.IdempotencyKey == JournalIdempotencyKey(allocation.Id),
                    cancellationToken);

            if (contribution is not null)
            {
                if (contract is null
                    || contribution.FundingAllocationId != allocation.Id
                    || contribution.InitialAmountRial != allocation.TenantContributionRial
                    || existingJournal is null)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return new ReconcileTenantContributionResult(
                        ReconcileTenantContributionOutcome.InvalidState,
                        null);
                }

                funding = await dbContext.TenantContributionFundings
                    .SingleAsync(x => x.FundingAllocationId == allocation.Id, cancellationToken);
                externalTransaction = await dbContext.ExternalTransactions
                    .SingleAsync(x => x.Id == funding.ExternalTransactionId, cancellationToken);

                await transaction.RollbackAsync(cancellationToken);
                return new ReconcileTenantContributionResult(
                    ReconcileTenantContributionOutcome.AlreadyReconciled,
                    ToView(application, contract, allocation, funding, externalTransaction, existingJournal));
            }

            if (application.Status != CreditApplicationStatus.ApprovedFunded
                || contract is null
                || frozenPrincipal is null
                || frozenPrincipal.BankId != allocation.BankId
                || frozenPrincipal.AmountRial != allocation.BankApprovedLoanRial
                || allocation.TenantContributionRial <= 0m)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new ReconcileTenantContributionResult(
                    ReconcileTenantContributionOutcome.InvalidState,
                    null);
            }

            funding = await dbContext.TenantContributionFundings
                .SingleOrDefaultAsync(x => x.FundingAllocationId == allocation.Id, cancellationToken)
                ?? null!;

            if (funding is null)
            {
                externalTransaction = new ExternalTransactionRow
                {
                    Id = Guid.NewGuid(),
                    Provider = fundAdapter.Provider,
                    OperationType = OperationType,
                    AggregateType = "LeaseContract",
                    AggregateId = contract.Id,
                    Status = ExternalTransactionStatus.Pending,
                    AmountRial = allocation.TenantContributionRial,
                    Currency = "IRR",
                    IdempotencyKey = ExternalTransactionIdempotencyKey(allocation.Id),
                    CreatedAtUtc = occurredAtUtc,
                    UpdatedAtUtc = occurredAtUtc,
                };

                funding = new TenantContributionFundingRow
                {
                    Id = Guid.NewGuid(),
                    FundingAllocationId = allocation.Id,
                    ExternalTransactionId = externalTransaction.Id,
                    CreatedAtUtc = occurredAtUtc,
                    UpdatedAtUtc = occurredAtUtc,
                };

                dbContext.ExternalTransactions.Add(externalTransaction);
                dbContext.TenantContributionFundings.Add(funding);
            }
            else
            {
                externalTransaction = await dbContext.ExternalTransactions
                    .SingleOrDefaultAsync(x => x.Id == funding.ExternalTransactionId, cancellationToken)
                    ?? null!;

                if (externalTransaction is null
                    || externalTransaction.AmountRial != allocation.TenantContributionRial
                    || externalTransaction.Currency != "IRR"
                    || externalTransaction.OperationType != OperationType
                    || externalTransaction.Status == ExternalTransactionStatus.Succeeded)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return new ReconcileTenantContributionResult(
                        ReconcileTenantContributionOutcome.InvalidState,
                        null);
                }

                externalTransaction.Status = ExternalTransactionStatus.Pending;
                externalTransaction.UpdatedAtUtc = occurredAtUtc;
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }

        var response = await fundAdapter.CheckTenantContributionAsync(
            new FundTenantContributionRequest(
                funding.Id,
                allocation.Id,
                applicationId,
                contract.Id,
                contract.TenantUserId,
                allocation.TenantContributionRial),
            cancellationToken);

        await using var resultTransaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var lockedApplication = await dbContext.CreditApplications
            .FromSqlInterpolated($"SELECT * FROM credit_applications WHERE \"Id\" = {applicationId} FOR UPDATE")
            .SingleAsync(cancellationToken);
        var lockedFunding = await dbContext.TenantContributionFundings
            .FromSqlInterpolated($"SELECT * FROM tenant_contribution_fundings WHERE \"Id\" = {funding.Id} FOR UPDATE")
            .SingleAsync(cancellationToken);
        var lockedExternalTransaction = await dbContext.ExternalTransactions
            .FromSqlInterpolated($"SELECT * FROM external_transactions WHERE \"Id\" = {externalTransaction.Id} FOR UPDATE")
            .SingleAsync(cancellationToken);
        var lockedAllocation = await dbContext.FundingAllocations
            .SingleAsync(x => x.Id == allocation.Id, cancellationToken);
        var lockedContract = await dbContext.LeaseContracts
            .SingleAsync(x => x.Id == contract.Id, cancellationToken);
        var lockedPrincipal = await dbContext.FrozenPrincipals
            .SingleOrDefaultAsync(x => x.ContractId == contract.Id, cancellationToken);
        var existingContribution = await dbContext.TenantContributions
            .SingleOrDefaultAsync(x => x.ContractId == contract.Id, cancellationToken);
        var existingJournal = await dbContext.JournalEntries
            .SingleOrDefaultAsync(
                x => x.IdempotencyKey == JournalIdempotencyKey(allocation.Id),
                cancellationToken);

        if (existingContribution is not null)
        {
            if (existingContribution.FundingAllocationId != lockedAllocation.Id
                || existingContribution.InitialAmountRial != lockedAllocation.TenantContributionRial
                || existingJournal is null)
            {
                await resultTransaction.RollbackAsync(cancellationToken);
                return new ReconcileTenantContributionResult(
                    ReconcileTenantContributionOutcome.InvalidState,
                    null);
            }

            await resultTransaction.RollbackAsync(cancellationToken);
            return new ReconcileTenantContributionResult(
                ReconcileTenantContributionOutcome.AlreadyReconciled,
                ToView(
                    lockedApplication,
                    lockedContract,
                    lockedAllocation,
                    lockedFunding,
                    lockedExternalTransaction,
                    existingJournal));
        }

        if (lockedApplication.Status != CreditApplicationStatus.ApprovedFunded
            || lockedPrincipal is null
            || lockedPrincipal.BankId != lockedAllocation.BankId
            || lockedPrincipal.AmountRial != lockedAllocation.BankApprovedLoanRial)
        {
            await resultTransaction.RollbackAsync(cancellationToken);
            return new ReconcileTenantContributionResult(
                ReconcileTenantContributionOutcome.InvalidState,
                null);
        }

        lockedFunding.AttemptCount += 1;
        lockedFunding.UpdatedAtUtc = occurredAtUtc;
        lockedExternalTransaction.Provider = string.IsNullOrWhiteSpace(response.Provider)
            ? fundAdapter.Provider
            : response.Provider.Trim();
        lockedExternalTransaction.ExternalReference = response.ExternalReference;
        lockedExternalTransaction.ReasonCode = response.ReasonCode;
        lockedExternalTransaction.UpdatedAtUtc = occurredAtUtc;

        if (response.Status == FundTenantContributionStatus.Failed)
        {
            lockedExternalTransaction.Status = ExternalTransactionStatus.Failed;
            AddAudit(
                applicationId,
                $"fund:{lockedExternalTransaction.Provider}",
                "tenant_contribution_funding_failed",
                "The fund reported a definitive failure for the tenant contribution funding check.",
                occurredAtUtc);

            await dbContext.SaveChangesAsync(cancellationToken);
            await resultTransaction.CommitAsync(cancellationToken);
            return new ReconcileTenantContributionResult(
                ReconcileTenantContributionOutcome.Failed,
                ToView(
                    lockedApplication,
                    lockedContract,
                    lockedAllocation,
                    lockedFunding,
                    lockedExternalTransaction,
                    null));
        }

        var hasValidConfirmation = response.Status == FundTenantContributionStatus.Confirmed
            && response.ConfirmedAmountRial == lockedAllocation.TenantContributionRial
            && !string.IsNullOrWhiteSpace(response.FundReference);

        if (!hasValidConfirmation)
        {
            lockedExternalTransaction.Status = ExternalTransactionStatus.Unknown;
            lockedExternalTransaction.ReasonCode ??= response.Status == FundTenantContributionStatus.Confirmed
                ? "tenant_contribution_confirmation_mismatch"
                : "tenant_contribution_funding_indeterminate";

            AddAudit(
                applicationId,
                $"fund:{lockedExternalTransaction.Provider}",
                "tenant_contribution_funding_indeterminate",
                "Tenant contribution funding was not confirmed with an exact amount and valid fund reference.",
                occurredAtUtc);

            await dbContext.SaveChangesAsync(cancellationToken);
            await resultTransaction.CommitAsync(cancellationToken);
            return new ReconcileTenantContributionResult(
                ReconcileTenantContributionOutcome.Indeterminate,
                ToView(
                    lockedApplication,
                    lockedContract,
                    lockedAllocation,
                    lockedFunding,
                    lockedExternalTransaction,
                    null));
        }

        var normalizedFundReference = response.FundReference!.Trim();
        lockedFunding.FundReference = normalizedFundReference;
        lockedExternalTransaction.Status = ExternalTransactionStatus.Succeeded;

        var fundAssetCode = $"contract:{lockedContract.Id:D}:fund-held-tenant-contribution";
        var tenantBalanceCode = $"contract:{lockedContract.Id:D}:tenant-contribution-balance";

        var fundAssetAccount = await dbContext.LedgerAccounts
            .SingleOrDefaultAsync(x => x.Code == fundAssetCode, cancellationToken)
            ?? new LedgerAccountRow
            {
                Id = Guid.NewGuid(),
                Code = fundAssetCode,
                Name = "Fund-held tenant contribution",
                Currency = "IRR",
                ContractId = lockedContract.Id,
                CreatedAtUtc = occurredAtUtc,
            };

        var tenantBalanceAccount = await dbContext.LedgerAccounts
            .SingleOrDefaultAsync(x => x.Code == tenantBalanceCode, cancellationToken)
            ?? new LedgerAccountRow
            {
                Id = Guid.NewGuid(),
                Code = tenantBalanceCode,
                Name = "Tenant contribution balance",
                Currency = "IRR",
                ContractId = lockedContract.Id,
                CreatedAtUtc = occurredAtUtc,
            };

        if (dbContext.Entry(fundAssetAccount).State == EntityState.Detached)
        {
            dbContext.LedgerAccounts.Add(fundAssetAccount);
        }

        if (dbContext.Entry(tenantBalanceAccount).State == EntityState.Detached)
        {
            dbContext.LedgerAccounts.Add(tenantBalanceAccount);
        }

        var journalDraft = JournalEntryDraft.Create(
        [
            JournalLineDraft.Create(
                fundAssetAccount.Id,
                lockedAllocation.TenantContributionRial,
                0m),
            JournalLineDraft.Create(
                tenantBalanceAccount.Id,
                0m,
                lockedAllocation.TenantContributionRial),
        ]);

        var journalEntry = new JournalEntryRow
        {
            Id = Guid.NewGuid(),
            ReferenceType = "ExternalTransaction",
            ReferenceId = lockedExternalTransaction.Id,
            IdempotencyKey = JournalIdempotencyKey(lockedAllocation.Id),
            Description = "Confirmed tenant contribution deposited into the fund.",
            OccurredAtUtc = occurredAtUtc,
            PostedAtUtc = occurredAtUtc,
        };

        dbContext.JournalEntries.Add(journalEntry);
        foreach (var line in journalDraft.Lines)
        {
            dbContext.JournalLines.Add(new JournalLineRow
            {
                Id = Guid.NewGuid(),
                JournalEntryId = journalEntry.Id,
                LedgerAccountId = line.LedgerAccountId,
                DebitRial = line.Debit.Rial,
                CreditRial = line.Credit.Rial,
            });
        }

        var tenantContribution = new TenantContributionRow
        {
            ContractId = lockedContract.Id,
            FundingAllocationId = lockedAllocation.Id,
            InitialAmountRial = lockedAllocation.TenantContributionRial,
            FundReference = normalizedFundReference,
            FundedAtUtc = occurredAtUtc,
        };
        dbContext.TenantContributions.Add(tenantContribution);

        AddAudit(
            applicationId,
            $"fund:{lockedExternalTransaction.Provider}",
            "tenant_contribution_funded",
            "Tenant contribution was confirmed in the fund and posted as a balanced double-entry journal entry.",
            occurredAtUtc);
        AddOutbox("credit-application.tenant-contribution-funded.v1", occurredAtUtc, new
        {
            applicationId,
            contractId = lockedContract.Id,
            fundingAllocationId = lockedAllocation.Id,
            tenantContributionRial = lockedAllocation.TenantContributionRial,
            fundReference = normalizedFundReference,
            externalTransactionId = lockedExternalTransaction.Id,
            journalEntryId = journalEntry.Id,
            occurredAtUtc,
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        await resultTransaction.CommitAsync(cancellationToken);

        return new ReconcileTenantContributionResult(
            ReconcileTenantContributionOutcome.Reconciled,
            ToView(
                lockedApplication,
                lockedContract,
                lockedAllocation,
                lockedFunding,
                lockedExternalTransaction,
                journalEntry));
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

    private static string ExternalTransactionIdempotencyKey(Guid fundingAllocationId) =>
        $"tenant-contribution-funding:{fundingAllocationId:D}:v1";

    private static string JournalIdempotencyKey(Guid fundingAllocationId) =>
        $"journal:tenant-contribution-funding:{fundingAllocationId:D}:v1";

    private static TenantContributionFundingView ToView(
        CreditApplicationRow application,
        LeaseContractRow contract,
        FundingAllocationRow allocation,
        TenantContributionFundingRow funding,
        ExternalTransactionRow externalTransaction,
        JournalEntryRow? journalEntry) =>
        new(
            application.Id,
            application.Status,
            contract.Id,
            allocation.Id,
            allocation.TenantContributionRial,
            funding.FundReference,
            externalTransaction.Id,
            journalEntry?.Id,
            funding.UpdatedAtUtc);
}
