using System.Text.Json;
using Charkhoone.Application.Payments;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.Finance;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Infrastructure.Payments;

public sealed class EfCancellationSettlementService(
    CharkhooneDbContext dbContext,
    IExternalOwnerResidualTransferAdapter transferAdapter)
    : ICancellationSettlementService
{
    private const string OperationType = "cancellation_owner_residual_transfer";

    public async Task<SettleCancellationResult> SettleAsync(
        Guid contractId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default)
    {
        if (contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract id is required.", nameof(contractId));
        }

        Guid settlementId;
        Guid externalTransactionId;
        Guid ownerUserId;
        decimal expectedAmountRial;
        string idempotencyKey;

        await using (var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken))
        {
            var contract = await dbContext.LeaseContracts
                .FromSqlInterpolated($"SELECT * FROM lease_contracts WHERE \"Id\" = {contractId} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);

            if (contract is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new SettleCancellationResult(SettleCancellationOutcome.NotFound, null);
            }

            var existing = await dbContext.CancellationSettlements
                .SingleOrDefaultAsync(x => x.ContractId == contract.Id, cancellationToken);

            if (existing is not null && existing.Status == CancellationSettlementStatus.Completed)
            {
                var view = ToView(existing);
                await transaction.RollbackAsync(cancellationToken);
                return new SettleCancellationResult(SettleCancellationOutcome.AlreadyCompleted, view);
            }

            if (existing is not null && existing.Status == CancellationSettlementStatus.Failed)
            {
                var view = ToView(existing);
                await transaction.RollbackAsync(cancellationToken);
                return new SettleCancellationResult(SettleCancellationOutcome.Failed, view);
            }

            if (contract.Status != LeaseContractStatus.CancellationPending)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new SettleCancellationResult(
                    SettleCancellationOutcome.InvalidState,
                    existing is null ? null : ToView(existing));
            }

            var delinquency = await dbContext.ContractDelinquencies
                .SingleOrDefaultAsync(x => x.ContractId == contract.Id, cancellationToken);
            if (delinquency is null || !delinquency.CancellationRequired)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new SettleCancellationResult(
                    SettleCancellationOutcome.InvalidState,
                    existing is null ? null : ToView(existing));
            }

            if (await HasUnsettledCoveragePrerequisitesAsync(contract.Id, cancellationToken))
            {
                await transaction.RollbackAsync(cancellationToken);
                return new SettleCancellationResult(
                    SettleCancellationOutcome.InvalidState,
                    existing is null ? null : ToView(existing));
            }

            var contribution = await dbContext.TenantContributions
                .FromSqlInterpolated($"SELECT * FROM tenant_contributions WHERE \"ContractId\" = {contract.Id} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);
            if (contribution is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new SettleCancellationResult(
                    SettleCancellationOutcome.InvalidState,
                    existing is null ? null : ToView(existing));
            }

            var postedBalance = await CalculatePostedBalanceAsync(contribution, cancellationToken);
            if (postedBalance < 0m)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new SettleCancellationResult(
                    SettleCancellationOutcome.InvalidState,
                    existing is null ? null : ToView(existing));
            }

            var settlement = existing ?? new CancellationSettlementRow
            {
                Id = Guid.NewGuid(),
                ContractId = contract.Id,
                OwnerUserId = contract.OwnerUserId,
                AmountRial = postedBalance,
                Status = CancellationSettlementStatus.Pending,
                CreatedAtUtc = occurredAtUtc,
                UpdatedAtUtc = occurredAtUtc,
            };

            if (existing is null)
            {
                dbContext.CancellationSettlements.Add(settlement);
            }
            else if (settlement.OwnerUserId != contract.OwnerUserId || settlement.AmountRial != postedBalance)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new SettleCancellationResult(SettleCancellationOutcome.InvalidState, ToView(settlement));
            }

            if (postedBalance == 0m)
            {
                settlement.Status = CancellationSettlementStateMachine.Transition(
                    settlement.Status,
                    CancellationSettlementStatus.Completed);
                settlement.RemainingTenantContributionRial = 0m;
                settlement.UpdatedAtUtc = occurredAtUtc;
                settlement.CompletedAtUtc = occurredAtUtc;

                FinalizeContractCancellation(
                    contract,
                    settlement,
                    "system:cancellation-settlement",
                    "Cancellation completed with no tenant-contribution residual remaining for transfer to the owner.",
                    occurredAtUtc);

                await dbContext.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return new SettleCancellationResult(SettleCancellationOutcome.Completed, ToView(settlement));
            }

            idempotencyKey = ExternalTransferIdempotencyKey(contract.Id);
            var externalTransaction = settlement.ExternalTransactionId is null
                ? await dbContext.ExternalTransactions
                    .SingleOrDefaultAsync(x => x.IdempotencyKey == idempotencyKey, cancellationToken)
                : await dbContext.ExternalTransactions
                    .SingleOrDefaultAsync(x => x.Id == settlement.ExternalTransactionId.Value, cancellationToken);

            if (externalTransaction is null)
            {
                externalTransaction = new ExternalTransactionRow
                {
                    Id = Guid.NewGuid(),
                    Provider = transferAdapter.Provider,
                    OperationType = OperationType,
                    AggregateType = "LeaseContract",
                    AggregateId = contract.Id,
                    Status = ExternalTransactionStatus.Pending,
                    AmountRial = settlement.AmountRial,
                    Currency = "IRR",
                    IdempotencyKey = idempotencyKey,
                    CreatedAtUtc = occurredAtUtc,
                    UpdatedAtUtc = occurredAtUtc,
                };
                dbContext.ExternalTransactions.Add(externalTransaction);
                settlement.ExternalTransactionId = externalTransaction.Id;
            }
            else if (externalTransaction.OperationType != OperationType
                || externalTransaction.AggregateType != "LeaseContract"
                || externalTransaction.AggregateId != contract.Id
                || externalTransaction.AmountRial != settlement.AmountRial
                || externalTransaction.Currency != "IRR"
                || externalTransaction.IdempotencyKey != idempotencyKey)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new SettleCancellationResult(SettleCancellationOutcome.InvalidState, ToView(settlement));
            }

            settlementId = settlement.Id;
            externalTransactionId = externalTransaction.Id;
            ownerUserId = settlement.OwnerUserId;
            expectedAmountRial = settlement.AmountRial;
            settlement.UpdatedAtUtc = occurredAtUtc;

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }

        var response = await transferAdapter.EnsureOrQueryAsync(
            new ExternalOwnerResidualTransferRequest(
                settlementId,
                contractId,
                ownerUserId,
                expectedAmountRial,
                idempotencyKey),
            cancellationToken);

        dbContext.ChangeTracker.Clear();
        await using var resultTransaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var settlementRow = await dbContext.CancellationSettlements
            .FromSqlInterpolated($"SELECT * FROM cancellation_settlements WHERE \"Id\" = {settlementId} FOR UPDATE")
            .SingleAsync(cancellationToken);
        var contractRow = await dbContext.LeaseContracts
            .FromSqlInterpolated($"SELECT * FROM lease_contracts WHERE \"Id\" = {contractId} FOR UPDATE")
            .SingleAsync(cancellationToken);
        var contributionRow = await dbContext.TenantContributions
            .FromSqlInterpolated($"SELECT * FROM tenant_contributions WHERE \"ContractId\" = {contractId} FOR UPDATE")
            .SingleAsync(cancellationToken);
        var externalRow = await dbContext.ExternalTransactions
            .FromSqlInterpolated($"SELECT * FROM external_transactions WHERE \"Id\" = {externalTransactionId} FOR UPDATE")
            .SingleAsync(cancellationToken);

        if (settlementRow.Status == CancellationSettlementStatus.Completed)
        {
            var view = ToView(settlementRow);
            await resultTransaction.RollbackAsync(cancellationToken);
            return new SettleCancellationResult(SettleCancellationOutcome.AlreadyCompleted, view);
        }

        if (settlementRow.Status == CancellationSettlementStatus.Failed)
        {
            var view = ToView(settlementRow);
            await resultTransaction.RollbackAsync(cancellationToken);
            return new SettleCancellationResult(SettleCancellationOutcome.Failed, view);
        }

        if (contractRow.Status != LeaseContractStatus.CancellationPending
            || await HasUnsettledCoveragePrerequisitesAsync(contractRow.Id, cancellationToken))
        {
            await resultTransaction.RollbackAsync(cancellationToken);
            return new SettleCancellationResult(SettleCancellationOutcome.InvalidState, ToView(settlementRow));
        }

        externalRow.Provider = string.IsNullOrWhiteSpace(response.Provider)
            ? transferAdapter.Provider
            : response.Provider.Trim();
        externalRow.ExternalReference = response.ExternalReference;
        externalRow.ReasonCode = response.ReasonCode;
        externalRow.UpdatedAtUtc = occurredAtUtc;
        settlementRow.UpdatedAtUtc = occurredAtUtc;

        if (response.Status == ExternalOwnerResidualTransferStatus.Failed)
        {
            settlementRow.Status = CancellationSettlementStateMachine.Transition(
                settlementRow.Status,
                CancellationSettlementStatus.Failed);
            externalRow.Status = ExternalTransactionStatus.Failed;

            AddAudit(
                contractRow.Id,
                $"cancellation-settlement:{externalRow.Provider}",
                "owner_residual_transfer_failed",
                "The owner residual transfer returned a definitive failure; no ledger settlement was posted and it was not automatically retried.",
                occurredAtUtc);

            await dbContext.SaveChangesAsync(cancellationToken);
            await resultTransaction.CommitAsync(cancellationToken);
            return new SettleCancellationResult(SettleCancellationOutcome.Failed, ToView(settlementRow));
        }

        var exactConfirmation = response.Status == ExternalOwnerResidualTransferStatus.Confirmed
            && response.ConfirmedAmountRial == settlementRow.AmountRial
            && !string.IsNullOrWhiteSpace(response.ExternalReference);

        if (!exactConfirmation)
        {
            settlementRow.Status = CancellationSettlementStateMachine.Transition(
                settlementRow.Status,
                CancellationSettlementStatus.Unknown);
            externalRow.Status = ExternalTransactionStatus.Unknown;
            externalRow.ReasonCode ??= response.Status == ExternalOwnerResidualTransferStatus.Confirmed
                ? "owner_residual_transfer_confirmation_mismatch"
                : "owner_residual_transfer_indeterminate";

            AddAudit(
                contractRow.Id,
                $"cancellation-settlement:{externalRow.Provider}",
                "owner_residual_transfer_indeterminate",
                "The owner residual transfer was not confirmed with the exact expected amount and a valid external reference; no cancellation ledger settlement was posted.",
                occurredAtUtc);

            await dbContext.SaveChangesAsync(cancellationToken);
            await resultTransaction.CommitAsync(cancellationToken);
            return new SettleCancellationResult(SettleCancellationOutcome.Indeterminate, ToView(settlementRow));
        }

        var currentBalance = await CalculatePostedBalanceAsync(contributionRow, cancellationToken);
        var accounts = await GetContributionLedgerAccountsAsync(contractRow.Id, cancellationToken);
        if (currentBalance != settlementRow.AmountRial || accounts is null)
        {
            settlementRow.Status = CancellationSettlementStateMachine.Transition(
                settlementRow.Status,
                CancellationSettlementStatus.Unknown);
            externalRow.Status = ExternalTransactionStatus.Unknown;
            externalRow.ReasonCode = accounts is null
                ? "tenant_contribution_ledger_accounts_missing"
                : "tenant_contribution_balance_changed_after_transfer_confirmation";

            AddAudit(
                contractRow.Id,
                "system:cancellation-settlement",
                "owner_residual_transfer_requires_manual_reconciliation",
                "The provider reported confirmation but the local tenant-contribution ledger could not safely post the exact cancellation residual.",
                occurredAtUtc);

            await dbContext.SaveChangesAsync(cancellationToken);
            await resultTransaction.CommitAsync(cancellationToken);
            return new SettleCancellationResult(SettleCancellationOutcome.Indeterminate, ToView(settlementRow));
        }

        var journalKey = JournalIdempotencyKey(contractRow.Id);
        if (await dbContext.JournalEntries.AnyAsync(x => x.IdempotencyKey == journalKey, cancellationToken))
        {
            settlementRow.Status = CancellationSettlementStateMachine.Transition(
                settlementRow.Status,
                CancellationSettlementStatus.Unknown);
            externalRow.Status = ExternalTransactionStatus.Unknown;
            externalRow.ReasonCode = "cancellation_settlement_journal_state_inconsistent";
            await dbContext.SaveChangesAsync(cancellationToken);
            await resultTransaction.CommitAsync(cancellationToken);
            return new SettleCancellationResult(SettleCancellationOutcome.Indeterminate, ToView(settlementRow));
        }

        var journalDraft = JournalEntryDraft.Create(
        [
            JournalLineDraft.Create(accounts.TenantBalance.Id, settlementRow.AmountRial, 0m),
            JournalLineDraft.Create(accounts.FundAsset.Id, 0m, settlementRow.AmountRial),
        ]);

        var journalEntry = new JournalEntryRow
        {
            Id = Guid.NewGuid(),
            ReferenceType = "CancellationSettlement",
            ReferenceId = settlementRow.Id,
            IdempotencyKey = journalKey,
            Description = "Cancellation residual tenant contribution transferred to the owner without using frozen bank principal.",
            OccurredAtUtc = occurredAtUtc,
            PostedAtUtc = occurredAtUtc,
        };
        dbContext.JournalEntries.Add(journalEntry);
        AddJournalLines(journalEntry.Id, journalDraft);

        settlementRow.Status = CancellationSettlementStateMachine.Transition(
            settlementRow.Status,
            CancellationSettlementStatus.Completed);
        settlementRow.ExternalReference = response.ExternalReference!.Trim();
        settlementRow.JournalEntryId = journalEntry.Id;
        settlementRow.RemainingTenantContributionRial = 0m;
        settlementRow.CompletedAtUtc = occurredAtUtc;
        settlementRow.UpdatedAtUtc = occurredAtUtc;
        externalRow.Status = ExternalTransactionStatus.Succeeded;

        FinalizeContractCancellation(
            contractRow,
            settlementRow,
            $"cancellation-settlement:{externalRow.Provider}",
            "Cancellation residual tenant contribution was confirmed transferred to the owner and posted to the ledger.",
            occurredAtUtc);

        await dbContext.SaveChangesAsync(cancellationToken);
        await resultTransaction.CommitAsync(cancellationToken);

        return new SettleCancellationResult(SettleCancellationOutcome.Completed, ToView(settlementRow));
    }

    public async Task<CancellationSettlementView?> GetAsync(
        Guid contractId,
        CancellationToken cancellationToken = default)
    {
        if (contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract id is required.", nameof(contractId));
        }

        var row = await dbContext.CancellationSettlements
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.ContractId == contractId, cancellationToken);
        return row is null ? null : ToView(row);
    }

    private async Task<bool> HasUnsettledCoveragePrerequisitesAsync(
        Guid contractId,
        CancellationToken cancellationToken)
    {
        var hasMissedObligation = await dbContext.MonthlyObligations
            .AnyAsync(x => x.ContractId == contractId && x.Status == MonthlyObligationStatus.Missed, cancellationToken);
        if (hasMissedObligation)
        {
            return true;
        }

        return await dbContext.CoveragePayments.AnyAsync(
            x => x.ContractId == contractId
                && (x.Status == CoveragePaymentStatus.Pending || x.Status == CoveragePaymentStatus.Unknown),
            cancellationToken);
    }

    private async Task<decimal> CalculatePostedBalanceAsync(
        TenantContributionRow contribution,
        CancellationToken cancellationToken)
    {
        var replenishments = await dbContext.TenantContributionReplenishments
            .Where(x => x.ContractId == contribution.ContractId)
            .SumAsync(x => (decimal?)x.AmountRial, cancellationToken) ?? 0m;
        var confirmedCoverage = await dbContext.CoveragePayments
            .Where(x => x.ContractId == contribution.ContractId && x.Status == CoveragePaymentStatus.Succeeded)
            .SumAsync(x => (decimal?)x.AmountRial, cancellationToken) ?? 0m;

        return contribution.InitialAmountRial + replenishments - confirmedCoverage;
    }

    private async Task<ContributionLedgerAccounts?> GetContributionLedgerAccountsAsync(
        Guid contractId,
        CancellationToken cancellationToken)
    {
        var fundAssetCode = $"contract:{contractId:D}:fund-held-tenant-contribution";
        var tenantBalanceCode = $"contract:{contractId:D}:tenant-contribution-balance";

        var fundAsset = await dbContext.LedgerAccounts
            .SingleOrDefaultAsync(x => x.Code == fundAssetCode, cancellationToken);
        var tenantBalance = await dbContext.LedgerAccounts
            .SingleOrDefaultAsync(x => x.Code == tenantBalanceCode, cancellationToken);

        return fundAsset is null || tenantBalance is null
            ? null
            : new ContributionLedgerAccounts(fundAsset, tenantBalance);
    }

    private void FinalizeContractCancellation(
        LeaseContractRow contract,
        CancellationSettlementRow settlement,
        string actorId,
        string reason,
        DateTimeOffset occurredAtUtc)
    {
        var previousStatus = contract.Status;
        contract.Status = LeaseContractStatus.Cancelled;
        contract.UpdatedAtUtc = occurredAtUtc;

        dbContext.WorkflowTransitions.Add(new WorkflowTransitionRow
        {
            Id = Guid.NewGuid(),
            AggregateType = "LeaseContract",
            AggregateId = contract.Id,
            FromStatus = previousStatus.ToString(),
            ToStatus = contract.Status.ToString(),
            ActorId = actorId,
            Reason = reason,
            OccurredAtUtc = occurredAtUtc,
        });

        AddAudit(
            contract.Id,
            actorId,
            "contract_cancelled_after_owner_residual_settlement",
            reason,
            occurredAtUtc);
        AddOutbox("lease-contract.cancelled.v1", occurredAtUtc, new
        {
            contractId = contract.Id,
            cancellationSettlementId = settlement.Id,
            ownerUserId = settlement.OwnerUserId,
            ownerResidualAmountRial = settlement.AmountRial,
            externalTransactionId = settlement.ExternalTransactionId,
            journalEntryId = settlement.JournalEntryId,
            occurredAtUtc,
        });
        AddOutbox("lease-contract.cancelled-owner-notification-requested.v1", occurredAtUtc, new
        {
            contractId = contract.Id,
            ownerUserId = settlement.OwnerUserId,
            cancellationSettlementId = settlement.Id,
            amountRial = settlement.AmountRial,
            occurredAtUtc,
        });
    }

    private void AddJournalLines(Guid journalEntryId, JournalEntryDraft draft)
    {
        foreach (var line in draft.Lines)
        {
            dbContext.JournalLines.Add(new JournalLineRow
            {
                Id = Guid.NewGuid(),
                JournalEntryId = journalEntryId,
                LedgerAccountId = line.LedgerAccountId,
                DebitRial = line.Debit.Rial,
                CreditRial = line.Credit.Rial,
            });
        }
    }

    private void AddAudit(
        Guid contractId,
        string actorId,
        string action,
        string reason,
        DateTimeOffset occurredAtUtc) =>
        dbContext.AuditEvents.Add(new AuditEventRow
        {
            Id = Guid.NewGuid(),
            AggregateType = "LeaseContract",
            AggregateId = contractId,
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

    private static string ExternalTransferIdempotencyKey(Guid contractId) =>
        $"cancellation-owner-residual:{contractId:D}:v1";

    private static string JournalIdempotencyKey(Guid contractId) =>
        $"journal:cancellation-owner-residual:{contractId:D}:v1";

    private static CancellationSettlementView ToView(CancellationSettlementRow row) =>
        new(
            row.Id,
            row.ContractId,
            row.OwnerUserId,
            row.AmountRial,
            row.Status,
            row.ExternalTransactionId,
            row.ExternalReference,
            row.JournalEntryId,
            row.RemainingTenantContributionRial,
            row.UpdatedAtUtc,
            row.CompletedAtUtc);

    private sealed record ContributionLedgerAccounts(
        LedgerAccountRow FundAsset,
        LedgerAccountRow TenantBalance);
}
