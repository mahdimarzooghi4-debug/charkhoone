using System.Text.Json;
using Charkhoone.Application.Payments;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.Finance;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Infrastructure.Payments;

public sealed class EfNormalSettlementService(
    CharkhooneDbContext dbContext,
    IExternalBankPrincipalReturnAdapter bankAdapter,
    IExternalTenantResidualReturnAdapter tenantAdapter)
    : INormalSettlementService
{
    private const string BankOperationType = "normal_settlement_bank_principal_return";
    private const string TenantOperationType = "normal_settlement_tenant_residual_return";

    public async Task<SettleNormalContractResult> SettleAsync(
        Guid contractId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default)
    {
        if (contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract id is required.", nameof(contractId));
        }

        NormalSettlementRow settlement;

        await using (var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken))
        {
            var contract = await dbContext.LeaseContracts
                .FromSqlInterpolated($"SELECT * FROM lease_contracts WHERE \"Id\" = {contractId} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);

            if (contract is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new SettleNormalContractResult(SettleNormalContractOutcome.NotFound, null);
            }

            var existing = await dbContext.NormalSettlements
                .SingleOrDefaultAsync(x => x.ContractId == contract.Id, cancellationToken);

            if (existing is not null
                && NormalSettlementTransferStateMachine.IsCompleted(existing.BankPrincipalStatus)
                && NormalSettlementTransferStateMachine.IsCompleted(existing.TenantResidualStatus)
                && contract.Status == LeaseContractStatus.Settled)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new SettleNormalContractResult(
                    SettleNormalContractOutcome.AlreadyCompleted,
                    ToView(existing));
            }

            if (existing is not null
                && (existing.BankPrincipalStatus == NormalSettlementTransferStatus.Failed
                    || existing.TenantResidualStatus == NormalSettlementTransferStatus.Failed))
            {
                await transaction.RollbackAsync(cancellationToken);
                return new SettleNormalContractResult(SettleNormalContractOutcome.Failed, ToView(existing));
            }

            if (contract.Status != LeaseContractStatus.SettlementPending)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new SettleNormalContractResult(
                    SettleNormalContractOutcome.InvalidState,
                    existing is null ? null : ToView(existing));
            }

            if (await HasUnsettledNormalSettlementPrerequisitesAsync(contract.Id, cancellationToken))
            {
                await transaction.RollbackAsync(cancellationToken);
                return new SettleNormalContractResult(
                    SettleNormalContractOutcome.InvalidState,
                    existing is null ? null : ToView(existing));
            }

            // The 3% lost-fund-return policy is not yet complete enough to calculate and collect a receivable.
            // Any such exposure therefore blocks normal residual release instead of guessing a payable amount.
            if (await dbContext.LostFundReturns.AnyAsync(x => x.ContractId == contract.Id, cancellationToken))
            {
                await transaction.RollbackAsync(cancellationToken);
                return new SettleNormalContractResult(
                    SettleNormalContractOutcome.InvalidState,
                    existing is null ? null : ToView(existing));
            }

            var frozenPrincipal = await dbContext.FrozenPrincipals
                .FromSqlInterpolated($"SELECT * FROM frozen_principals WHERE \"ContractId\" = {contract.Id} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);
            var contribution = await dbContext.TenantContributions
                .FromSqlInterpolated($"SELECT * FROM tenant_contributions WHERE \"ContractId\" = {contract.Id} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);

            if (frozenPrincipal is null
                || frozenPrincipal.AmountRial <= 0m
                || string.IsNullOrWhiteSpace(frozenPrincipal.BankId)
                || string.IsNullOrWhiteSpace(frozenPrincipal.FundReference)
                || contribution is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new SettleNormalContractResult(
                    SettleNormalContractOutcome.InvalidState,
                    existing is null ? null : ToView(existing));
            }

            var tenantResidualRial = await CalculatePostedTenantContributionBalanceAsync(
                contribution,
                cancellationToken);
            if (tenantResidualRial < 0m)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new SettleNormalContractResult(
                    SettleNormalContractOutcome.InvalidState,
                    existing is null ? null : ToView(existing));
            }

            settlement = existing ?? new NormalSettlementRow
            {
                Id = Guid.NewGuid(),
                ContractId = contract.Id,
                TenantUserId = contract.TenantUserId,
                BankId = frozenPrincipal.BankId,
                FundReference = frozenPrincipal.FundReference,
                BankPrincipalAmountRial = frozenPrincipal.AmountRial,
                BankPrincipalStatus = NormalSettlementTransferStatus.Pending,
                TenantResidualAmountRial = tenantResidualRial,
                TenantResidualStatus = tenantResidualRial == 0m
                    ? NormalSettlementTransferStatus.NotRequired
                    : NormalSettlementTransferStatus.Pending,
                CreatedAtUtc = occurredAtUtc,
                UpdatedAtUtc = occurredAtUtc,
            };

            if (existing is null)
            {
                dbContext.NormalSettlements.Add(settlement);
            }
            else if (settlement.TenantUserId != contract.TenantUserId
                || settlement.BankId != frozenPrincipal.BankId
                || settlement.FundReference != frozenPrincipal.FundReference
                || settlement.BankPrincipalAmountRial != frozenPrincipal.AmountRial
                || settlement.TenantResidualAmountRial != tenantResidualRial)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new SettleNormalContractResult(SettleNormalContractOutcome.InvalidState, ToView(settlement));
            }

            if (!await EnsureExternalTransactionsAsync(settlement, occurredAtUtc, cancellationToken))
            {
                await transaction.RollbackAsync(cancellationToken);
                return new SettleNormalContractResult(SettleNormalContractOutcome.InvalidState, ToView(settlement));
            }

            settlement.UpdatedAtUtc = occurredAtUtc;
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }

        var bankProgress = await ReconcileBankPrincipalAsync(
            settlement.Id,
            occurredAtUtc,
            cancellationToken);
        if (bankProgress != TransferProgress.Succeeded)
        {
            return new SettleNormalContractResult(
                MapProgress(bankProgress),
                await GetAsync(contractId, cancellationToken));
        }

        var tenantProgress = await ReconcileTenantResidualAsync(
            settlement.Id,
            occurredAtUtc,
            cancellationToken);
        if (tenantProgress != TransferProgress.Succeeded)
        {
            return new SettleNormalContractResult(
                MapProgress(tenantProgress),
                await GetAsync(contractId, cancellationToken));
        }

        return await FinalizeAsync(settlement.Id, occurredAtUtc, cancellationToken);
    }

    public async Task<NormalSettlementView?> GetAsync(
        Guid contractId,
        CancellationToken cancellationToken = default)
    {
        if (contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract id is required.", nameof(contractId));
        }

        var row = await dbContext.NormalSettlements
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.ContractId == contractId, cancellationToken);
        return row is null ? null : ToView(row);
    }

    private async Task<bool> EnsureExternalTransactionsAsync(
        NormalSettlementRow settlement,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken)
    {
        var bankKey = BankExternalTransactionIdempotencyKey(settlement.ContractId);
        var bankTransaction = settlement.BankExternalTransactionId is null
            ? await dbContext.ExternalTransactions
                .SingleOrDefaultAsync(x => x.IdempotencyKey == bankKey, cancellationToken)
            : await dbContext.ExternalTransactions
                .SingleOrDefaultAsync(x => x.Id == settlement.BankExternalTransactionId.Value, cancellationToken);

        if (bankTransaction is null)
        {
            bankTransaction = new ExternalTransactionRow
            {
                Id = Guid.NewGuid(),
                Provider = bankAdapter.Provider,
                OperationType = BankOperationType,
                AggregateType = "LeaseContract",
                AggregateId = settlement.ContractId,
                Status = ExternalTransactionStatus.Pending,
                AmountRial = settlement.BankPrincipalAmountRial,
                Currency = "IRR",
                IdempotencyKey = bankKey,
                CreatedAtUtc = occurredAtUtc,
                UpdatedAtUtc = occurredAtUtc,
            };
            dbContext.ExternalTransactions.Add(bankTransaction);
            settlement.BankExternalTransactionId = bankTransaction.Id;
        }
        else if (!MatchesExternalTransaction(
            bankTransaction,
            BankOperationType,
            settlement.ContractId,
            settlement.BankPrincipalAmountRial,
            bankKey))
        {
            return false;
        }

        if (settlement.TenantResidualStatus == NormalSettlementTransferStatus.NotRequired)
        {
            return settlement.TenantExternalTransactionId is null;
        }

        var tenantKey = TenantExternalTransactionIdempotencyKey(settlement.ContractId);
        var tenantTransaction = settlement.TenantExternalTransactionId is null
            ? await dbContext.ExternalTransactions
                .SingleOrDefaultAsync(x => x.IdempotencyKey == tenantKey, cancellationToken)
            : await dbContext.ExternalTransactions
                .SingleOrDefaultAsync(x => x.Id == settlement.TenantExternalTransactionId.Value, cancellationToken);

        if (tenantTransaction is null)
        {
            tenantTransaction = new ExternalTransactionRow
            {
                Id = Guid.NewGuid(),
                Provider = tenantAdapter.Provider,
                OperationType = TenantOperationType,
                AggregateType = "LeaseContract",
                AggregateId = settlement.ContractId,
                Status = ExternalTransactionStatus.Pending,
                AmountRial = settlement.TenantResidualAmountRial,
                Currency = "IRR",
                IdempotencyKey = tenantKey,
                CreatedAtUtc = occurredAtUtc,
                UpdatedAtUtc = occurredAtUtc,
            };
            dbContext.ExternalTransactions.Add(tenantTransaction);
            settlement.TenantExternalTransactionId = tenantTransaction.Id;
            return true;
        }

        return MatchesExternalTransaction(
            tenantTransaction,
            TenantOperationType,
            settlement.ContractId,
            settlement.TenantResidualAmountRial,
            tenantKey);
    }

    private async Task<TransferProgress> ReconcileBankPrincipalAsync(
        Guid settlementId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken)
    {
        var snapshot = await dbContext.NormalSettlements
            .AsNoTracking()
            .SingleAsync(x => x.Id == settlementId, cancellationToken);

        if (snapshot.BankPrincipalStatus == NormalSettlementTransferStatus.Succeeded)
        {
            return TransferProgress.Succeeded;
        }

        if (snapshot.BankPrincipalStatus == NormalSettlementTransferStatus.Failed
            || snapshot.BankExternalTransactionId is null)
        {
            return snapshot.BankPrincipalStatus == NormalSettlementTransferStatus.Failed
                ? TransferProgress.Failed
                : TransferProgress.InvalidState;
        }

        var external = await dbContext.ExternalTransactions
            .AsNoTracking()
            .SingleAsync(x => x.Id == snapshot.BankExternalTransactionId.Value, cancellationToken);

        var response = await bankAdapter.EnsureOrQueryAsync(
            new ExternalBankPrincipalReturnRequest(
                snapshot.Id,
                snapshot.ContractId,
                snapshot.BankId,
                snapshot.FundReference,
                snapshot.BankPrincipalAmountRial,
                external.IdempotencyKey),
            cancellationToken);

        dbContext.ChangeTracker.Clear();
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var settlement = await dbContext.NormalSettlements
            .FromSqlInterpolated($"SELECT * FROM normal_settlements WHERE \"Id\" = {settlementId} FOR UPDATE")
            .SingleAsync(cancellationToken);
        var contract = await dbContext.LeaseContracts
            .FromSqlInterpolated($"SELECT * FROM lease_contracts WHERE \"Id\" = {settlement.ContractId} FOR UPDATE")
            .SingleAsync(cancellationToken);
        var frozenPrincipal = await dbContext.FrozenPrincipals
            .FromSqlInterpolated($"SELECT * FROM frozen_principals WHERE \"ContractId\" = {settlement.ContractId} FOR UPDATE")
            .SingleAsync(cancellationToken);
        var externalTransaction = await dbContext.ExternalTransactions
            .FromSqlInterpolated($"SELECT * FROM external_transactions WHERE \"Id\" = {settlement.BankExternalTransactionId!.Value} FOR UPDATE")
            .SingleAsync(cancellationToken);

        if (settlement.BankPrincipalStatus == NormalSettlementTransferStatus.Succeeded)
        {
            await transaction.RollbackAsync(cancellationToken);
            return TransferProgress.Succeeded;
        }

        if (settlement.BankPrincipalStatus == NormalSettlementTransferStatus.Failed)
        {
            await transaction.RollbackAsync(cancellationToken);
            return TransferProgress.Failed;
        }

        if (contract.Status != LeaseContractStatus.SettlementPending
            || frozenPrincipal.BankId != settlement.BankId
            || frozenPrincipal.FundReference != settlement.FundReference
            || frozenPrincipal.AmountRial != settlement.BankPrincipalAmountRial)
        {
            await transaction.RollbackAsync(cancellationToken);
            return TransferProgress.InvalidState;
        }

        externalTransaction.Provider = string.IsNullOrWhiteSpace(response.Provider)
            ? bankAdapter.Provider
            : response.Provider.Trim();
        externalTransaction.ExternalReference = response.ExternalReference;
        externalTransaction.ReasonCode = response.ReasonCode;
        externalTransaction.UpdatedAtUtc = occurredAtUtc;
        settlement.UpdatedAtUtc = occurredAtUtc;

        if (response.Status == ExternalNormalSettlementTransferStatus.Failed)
        {
            settlement.BankPrincipalStatus = NormalSettlementTransferStateMachine.Transition(
                settlement.BankPrincipalStatus,
                NormalSettlementTransferStatus.Failed);
            externalTransaction.Status = ExternalTransactionStatus.Failed;

            AddAudit(
                contract.Id,
                $"normal-settlement-bank:{externalTransaction.Provider}",
                "normal_settlement_bank_principal_return_failed",
                "The bank-principal return reported a definitive external failure; it was not automatically retried.",
                occurredAtUtc);

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return TransferProgress.Failed;
        }

        var exactConfirmation = response.Status == ExternalNormalSettlementTransferStatus.Confirmed
            && response.ConfirmedAmountRial == settlement.BankPrincipalAmountRial
            && !string.IsNullOrWhiteSpace(response.ExternalReference);

        if (!exactConfirmation)
        {
            settlement.BankPrincipalStatus = NormalSettlementTransferStateMachine.Transition(
                settlement.BankPrincipalStatus,
                NormalSettlementTransferStatus.Unknown);
            externalTransaction.Status = ExternalTransactionStatus.Unknown;
            externalTransaction.ReasonCode ??= response.Status == ExternalNormalSettlementTransferStatus.Confirmed
                ? "bank_principal_return_confirmation_mismatch"
                : "bank_principal_return_indeterminate";

            AddAudit(
                contract.Id,
                $"normal-settlement-bank:{externalTransaction.Provider}",
                "normal_settlement_bank_principal_return_indeterminate",
                "The bank-principal return was not confirmed with the exact expected amount and a valid external reference; no settlement journal was posted.",
                occurredAtUtc);

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return TransferProgress.Indeterminate;
        }

        var accounts = await GetOrCreateFrozenPrincipalLedgerAccountsAsync(
            contract.Id,
            occurredAtUtc,
            cancellationToken);
        if (accounts is null
            || !await EnsureFrozenPrincipalRecognitionJournalAsync(
                frozenPrincipal,
                accounts,
                occurredAtUtc,
                cancellationToken))
        {
            settlement.BankPrincipalStatus = NormalSettlementTransferStateMachine.Transition(
                settlement.BankPrincipalStatus,
                NormalSettlementTransferStatus.Unknown);
            externalTransaction.Status = ExternalTransactionStatus.Unknown;
            externalTransaction.ReasonCode = "frozen_principal_ledger_requires_manual_reconciliation";

            AddAudit(
                contract.Id,
                "system:normal-settlement-ledger",
                "normal_settlement_bank_principal_requires_manual_reconciliation",
                "The provider confirmed the principal return but the frozen-principal ledger could not be recognized safely.",
                occurredAtUtc);

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return TransferProgress.Indeterminate;
        }

        var returnJournalKey = BankReturnJournalIdempotencyKey(contract.Id);
        if (await dbContext.JournalEntries.AnyAsync(x => x.IdempotencyKey == returnJournalKey, cancellationToken))
        {
            settlement.BankPrincipalStatus = NormalSettlementTransferStateMachine.Transition(
                settlement.BankPrincipalStatus,
                NormalSettlementTransferStatus.Unknown);
            externalTransaction.Status = ExternalTransactionStatus.Unknown;
            externalTransaction.ReasonCode = "bank_principal_return_journal_state_inconsistent";
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return TransferProgress.Indeterminate;
        }

        var returnDraft = JournalEntryDraft.Create(
        [
            JournalLineDraft.Create(accounts.BankPayable.Id, settlement.BankPrincipalAmountRial, 0m),
            JournalLineDraft.Create(accounts.FundFrozenAsset.Id, 0m, settlement.BankPrincipalAmountRial),
        ]);
        var returnJournal = new JournalEntryRow
        {
            Id = Guid.NewGuid(),
            ReferenceType = "NormalSettlement",
            ReferenceId = settlement.Id,
            IdempotencyKey = returnJournalKey,
            Description = "Normally matured frozen bank principal returned from the fund to the bank.",
            OccurredAtUtc = occurredAtUtc,
            PostedAtUtc = occurredAtUtc,
        };
        dbContext.JournalEntries.Add(returnJournal);
        AddJournalLines(returnJournal.Id, returnDraft);

        settlement.BankPrincipalStatus = NormalSettlementTransferStateMachine.Transition(
            settlement.BankPrincipalStatus,
            NormalSettlementTransferStatus.Succeeded);
        settlement.BankExternalReference = response.ExternalReference!.Trim();
        settlement.BankJournalEntryId = returnJournal.Id;
        settlement.BankPrincipalReturnedAtUtc = occurredAtUtc;
        externalTransaction.Status = ExternalTransactionStatus.Succeeded;

        AddAudit(
            contract.Id,
            $"normal-settlement-bank:{externalTransaction.Provider}",
            "normal_settlement_bank_principal_returned",
            "Frozen bank principal was confirmed returned to the bank as the normal-maturity settlement leg.",
            occurredAtUtc);
        AddOutbox("lease-contract.normal-settlement-bank-principal-returned.v1", occurredAtUtc, new
        {
            contractId = contract.Id,
            settlementId = settlement.Id,
            bankId = settlement.BankId,
            amountRial = settlement.BankPrincipalAmountRial,
            externalTransactionId = externalTransaction.Id,
            journalEntryId = returnJournal.Id,
            occurredAtUtc,
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return TransferProgress.Succeeded;
    }

    private async Task<TransferProgress> ReconcileTenantResidualAsync(
        Guid settlementId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken)
    {
        var snapshot = await dbContext.NormalSettlements
            .AsNoTracking()
            .SingleAsync(x => x.Id == settlementId, cancellationToken);

        if (snapshot.BankPrincipalStatus != NormalSettlementTransferStatus.Succeeded)
        {
            return TransferProgress.InvalidState;
        }

        if (snapshot.TenantResidualStatus == NormalSettlementTransferStatus.NotRequired
            || snapshot.TenantResidualStatus == NormalSettlementTransferStatus.Succeeded)
        {
            return TransferProgress.Succeeded;
        }

        if (snapshot.TenantResidualStatus == NormalSettlementTransferStatus.Failed
            || snapshot.TenantExternalTransactionId is null)
        {
            return snapshot.TenantResidualStatus == NormalSettlementTransferStatus.Failed
                ? TransferProgress.Failed
                : TransferProgress.InvalidState;
        }

        var external = await dbContext.ExternalTransactions
            .AsNoTracking()
            .SingleAsync(x => x.Id == snapshot.TenantExternalTransactionId.Value, cancellationToken);

        var response = await tenantAdapter.EnsureOrQueryAsync(
            new ExternalTenantResidualReturnRequest(
                snapshot.Id,
                snapshot.ContractId,
                snapshot.TenantUserId,
                snapshot.TenantResidualAmountRial,
                external.IdempotencyKey),
            cancellationToken);

        dbContext.ChangeTracker.Clear();
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var settlement = await dbContext.NormalSettlements
            .FromSqlInterpolated($"SELECT * FROM normal_settlements WHERE \"Id\" = {settlementId} FOR UPDATE")
            .SingleAsync(cancellationToken);
        var contract = await dbContext.LeaseContracts
            .FromSqlInterpolated($"SELECT * FROM lease_contracts WHERE \"Id\" = {settlement.ContractId} FOR UPDATE")
            .SingleAsync(cancellationToken);
        var contribution = await dbContext.TenantContributions
            .FromSqlInterpolated($"SELECT * FROM tenant_contributions WHERE \"ContractId\" = {settlement.ContractId} FOR UPDATE")
            .SingleAsync(cancellationToken);
        var externalTransaction = await dbContext.ExternalTransactions
            .FromSqlInterpolated($"SELECT * FROM external_transactions WHERE \"Id\" = {settlement.TenantExternalTransactionId!.Value} FOR UPDATE")
            .SingleAsync(cancellationToken);

        if (settlement.TenantResidualStatus == NormalSettlementTransferStatus.Succeeded)
        {
            await transaction.RollbackAsync(cancellationToken);
            return TransferProgress.Succeeded;
        }

        if (settlement.TenantResidualStatus == NormalSettlementTransferStatus.Failed)
        {
            await transaction.RollbackAsync(cancellationToken);
            return TransferProgress.Failed;
        }

        if (contract.Status != LeaseContractStatus.SettlementPending
            || settlement.BankPrincipalStatus != NormalSettlementTransferStatus.Succeeded)
        {
            await transaction.RollbackAsync(cancellationToken);
            return TransferProgress.InvalidState;
        }

        externalTransaction.Provider = string.IsNullOrWhiteSpace(response.Provider)
            ? tenantAdapter.Provider
            : response.Provider.Trim();
        externalTransaction.ExternalReference = response.ExternalReference;
        externalTransaction.ReasonCode = response.ReasonCode;
        externalTransaction.UpdatedAtUtc = occurredAtUtc;
        settlement.UpdatedAtUtc = occurredAtUtc;

        if (response.Status == ExternalNormalSettlementTransferStatus.Failed)
        {
            settlement.TenantResidualStatus = NormalSettlementTransferStateMachine.Transition(
                settlement.TenantResidualStatus,
                NormalSettlementTransferStatus.Failed);
            externalTransaction.Status = ExternalTransactionStatus.Failed;

            AddAudit(
                contract.Id,
                $"normal-settlement-tenant:{externalTransaction.Provider}",
                "normal_settlement_tenant_residual_return_failed",
                "The tenant-residual return reported a definitive external failure; it was not automatically retried.",
                occurredAtUtc);

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return TransferProgress.Failed;
        }

        var exactConfirmation = response.Status == ExternalNormalSettlementTransferStatus.Confirmed
            && response.ConfirmedAmountRial == settlement.TenantResidualAmountRial
            && !string.IsNullOrWhiteSpace(response.ExternalReference);

        if (!exactConfirmation)
        {
            settlement.TenantResidualStatus = NormalSettlementTransferStateMachine.Transition(
                settlement.TenantResidualStatus,
                NormalSettlementTransferStatus.Unknown);
            externalTransaction.Status = ExternalTransactionStatus.Unknown;
            externalTransaction.ReasonCode ??= response.Status == ExternalNormalSettlementTransferStatus.Confirmed
                ? "tenant_residual_return_confirmation_mismatch"
                : "tenant_residual_return_indeterminate";

            AddAudit(
                contract.Id,
                $"normal-settlement-tenant:{externalTransaction.Provider}",
                "normal_settlement_tenant_residual_return_indeterminate",
                "The tenant-residual return was not confirmed with the exact expected amount and a valid external reference; no tenant ledger settlement was posted.",
                occurredAtUtc);

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return TransferProgress.Indeterminate;
        }

        var currentBalance = await CalculatePostedTenantContributionBalanceAsync(contribution, cancellationToken);
        var accounts = await GetTenantContributionLedgerAccountsAsync(contract.Id, cancellationToken);
        if (currentBalance != settlement.TenantResidualAmountRial || accounts is null)
        {
            settlement.TenantResidualStatus = NormalSettlementTransferStateMachine.Transition(
                settlement.TenantResidualStatus,
                NormalSettlementTransferStatus.Unknown);
            externalTransaction.Status = ExternalTransactionStatus.Unknown;
            externalTransaction.ReasonCode = accounts is null
                ? "tenant_contribution_ledger_accounts_missing"
                : "tenant_contribution_balance_changed_after_transfer_confirmation";

            AddAudit(
                contract.Id,
                "system:normal-settlement-ledger",
                "normal_settlement_tenant_residual_requires_manual_reconciliation",
                "The provider confirmed the tenant residual return but the local tenant-contribution ledger could not safely post the exact amount.",
                occurredAtUtc);

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return TransferProgress.Indeterminate;
        }

        var journalKey = TenantReturnJournalIdempotencyKey(contract.Id);
        if (await dbContext.JournalEntries.AnyAsync(x => x.IdempotencyKey == journalKey, cancellationToken))
        {
            settlement.TenantResidualStatus = NormalSettlementTransferStateMachine.Transition(
                settlement.TenantResidualStatus,
                NormalSettlementTransferStatus.Unknown);
            externalTransaction.Status = ExternalTransactionStatus.Unknown;
            externalTransaction.ReasonCode = "tenant_residual_return_journal_state_inconsistent";
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return TransferProgress.Indeterminate;
        }

        var journalDraft = JournalEntryDraft.Create(
        [
            JournalLineDraft.Create(accounts.TenantBalance.Id, settlement.TenantResidualAmountRial, 0m),
            JournalLineDraft.Create(accounts.FundAsset.Id, 0m, settlement.TenantResidualAmountRial),
        ]);
        var journalEntry = new JournalEntryRow
        {
            Id = Guid.NewGuid(),
            ReferenceType = "NormalSettlement",
            ReferenceId = settlement.Id,
            IdempotencyKey = journalKey,
            Description = "Residual tenant contribution returned to the tenant after normal contract maturity.",
            OccurredAtUtc = occurredAtUtc,
            PostedAtUtc = occurredAtUtc,
        };
        dbContext.JournalEntries.Add(journalEntry);
        AddJournalLines(journalEntry.Id, journalDraft);

        settlement.TenantResidualStatus = NormalSettlementTransferStateMachine.Transition(
            settlement.TenantResidualStatus,
            NormalSettlementTransferStatus.Succeeded);
        settlement.TenantExternalReference = response.ExternalReference!.Trim();
        settlement.TenantJournalEntryId = journalEntry.Id;
        settlement.TenantResidualReturnedAtUtc = occurredAtUtc;
        externalTransaction.Status = ExternalTransactionStatus.Succeeded;

        AddAudit(
            contract.Id,
            $"normal-settlement-tenant:{externalTransaction.Provider}",
            "normal_settlement_tenant_residual_returned",
            "Residual tenant contribution was confirmed returned to the tenant and posted to the tenant-contribution ledger.",
            occurredAtUtc);
        AddOutbox("lease-contract.normal-settlement-tenant-residual-returned.v1", occurredAtUtc, new
        {
            contractId = contract.Id,
            settlementId = settlement.Id,
            tenantUserId = settlement.TenantUserId,
            amountRial = settlement.TenantResidualAmountRial,
            externalTransactionId = externalTransaction.Id,
            journalEntryId = journalEntry.Id,
            occurredAtUtc,
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return TransferProgress.Succeeded;
    }

    private async Task<SettleNormalContractResult> FinalizeAsync(
        Guid settlementId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var settlement = await dbContext.NormalSettlements
            .FromSqlInterpolated($"SELECT * FROM normal_settlements WHERE \"Id\" = {settlementId} FOR UPDATE")
            .SingleAsync(cancellationToken);
        var contract = await dbContext.LeaseContracts
            .FromSqlInterpolated($"SELECT * FROM lease_contracts WHERE \"Id\" = {settlement.ContractId} FOR UPDATE")
            .SingleAsync(cancellationToken);

        if (contract.Status == LeaseContractStatus.Settled
            && NormalSettlementTransferStateMachine.IsCompleted(settlement.BankPrincipalStatus)
            && NormalSettlementTransferStateMachine.IsCompleted(settlement.TenantResidualStatus))
        {
            await transaction.RollbackAsync(cancellationToken);
            return new SettleNormalContractResult(SettleNormalContractOutcome.AlreadyCompleted, ToView(settlement));
        }

        if (contract.Status != LeaseContractStatus.SettlementPending
            || !NormalSettlementTransferStateMachine.IsCompleted(settlement.BankPrincipalStatus)
            || !NormalSettlementTransferStateMachine.IsCompleted(settlement.TenantResidualStatus))
        {
            await transaction.RollbackAsync(cancellationToken);
            return new SettleNormalContractResult(SettleNormalContractOutcome.InvalidState, ToView(settlement));
        }

        var previousStatus = contract.Status;
        contract.Status = LeaseContractStatus.Settled;
        contract.UpdatedAtUtc = occurredAtUtc;
        settlement.CompletedAtUtc = occurredAtUtc;
        settlement.UpdatedAtUtc = occurredAtUtc;

        const string actorId = "system:normal-settlement";
        const string reason = "Normal contract maturity settlement completed after confirmed bank-principal return and tenant-residual return.";

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
        AddAudit(contract.Id, actorId, "contract_settled_after_normal_maturity", reason, occurredAtUtc);
        AddOutbox("lease-contract.settled.v1", occurredAtUtc, new
        {
            contractId = contract.Id,
            settlementId = settlement.Id,
            bankId = settlement.BankId,
            bankPrincipalAmountRial = settlement.BankPrincipalAmountRial,
            tenantUserId = settlement.TenantUserId,
            tenantResidualAmountRial = settlement.TenantResidualAmountRial,
            bankExternalTransactionId = settlement.BankExternalTransactionId,
            tenantExternalTransactionId = settlement.TenantExternalTransactionId,
            bankJournalEntryId = settlement.BankJournalEntryId,
            tenantJournalEntryId = settlement.TenantJournalEntryId,
            occurredAtUtc,
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return new SettleNormalContractResult(SettleNormalContractOutcome.Completed, ToView(settlement));
    }

    private async Task<bool> HasUnsettledNormalSettlementPrerequisitesAsync(
        Guid contractId,
        CancellationToken cancellationToken)
    {
        var hasUnsettledMonthlyObligation = await dbContext.MonthlyObligations.AnyAsync(
            x => x.ContractId == contractId
                && (x.Status == MonthlyObligationStatus.Open || x.Status == MonthlyObligationStatus.Missed),
            cancellationToken);
        if (hasUnsettledMonthlyObligation)
        {
            return true;
        }

        return await dbContext.CoveragePayments.AnyAsync(
            x => x.ContractId == contractId && x.Status != CoveragePaymentStatus.Succeeded,
            cancellationToken);
    }

    private async Task<decimal> CalculatePostedTenantContributionBalanceAsync(
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

    private async Task<FrozenPrincipalLedgerAccounts?> GetOrCreateFrozenPrincipalLedgerAccountsAsync(
        Guid contractId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken)
    {
        var assetCode = $"contract:{contractId:D}:fund-held-frozen-bank-principal";
        var payableCode = $"contract:{contractId:D}:bank-principal-payable";

        var asset = await dbContext.LedgerAccounts
            .SingleOrDefaultAsync(x => x.Code == assetCode, cancellationToken);
        var payable = await dbContext.LedgerAccounts
            .SingleOrDefaultAsync(x => x.Code == payableCode, cancellationToken);

        if (asset is not null && (asset.ContractId != contractId || asset.Currency != "IRR"))
        {
            return null;
        }

        if (payable is not null && (payable.ContractId != contractId || payable.Currency != "IRR"))
        {
            return null;
        }

        asset ??= new LedgerAccountRow
        {
            Id = Guid.NewGuid(),
            Code = assetCode,
            Name = "Fund-held frozen bank principal",
            Currency = "IRR",
            ContractId = contractId,
            CreatedAtUtc = occurredAtUtc,
        };
        payable ??= new LedgerAccountRow
        {
            Id = Guid.NewGuid(),
            Code = payableCode,
            Name = "Bank principal payable",
            Currency = "IRR",
            ContractId = contractId,
            CreatedAtUtc = occurredAtUtc,
        };

        if (dbContext.Entry(asset).State == EntityState.Detached)
        {
            dbContext.LedgerAccounts.Add(asset);
        }

        if (dbContext.Entry(payable).State == EntityState.Detached)
        {
            dbContext.LedgerAccounts.Add(payable);
        }

        return new FrozenPrincipalLedgerAccounts(asset, payable);
    }

    private async Task<bool> EnsureFrozenPrincipalRecognitionJournalAsync(
        FrozenPrincipalRow principal,
        FrozenPrincipalLedgerAccounts accounts,
        DateTimeOffset postedAtUtc,
        CancellationToken cancellationToken)
    {
        var key = FrozenPrincipalRecognitionJournalIdempotencyKey(principal.ContractId);
        var existing = await dbContext.JournalEntries
            .SingleOrDefaultAsync(x => x.IdempotencyKey == key, cancellationToken);

        if (existing is not null)
        {
            if (existing.ReferenceType != "FrozenPrincipal" || existing.ReferenceId != principal.ContractId)
            {
                return false;
            }

            var lines = await dbContext.JournalLines
                .Where(x => x.JournalEntryId == existing.Id)
                .ToListAsync(cancellationToken);

            return lines.Count == 2
                && lines.Any(x => x.LedgerAccountId == accounts.FundFrozenAsset.Id
                    && x.DebitRial == principal.AmountRial
                    && x.CreditRial == 0m)
                && lines.Any(x => x.LedgerAccountId == accounts.BankPayable.Id
                    && x.DebitRial == 0m
                    && x.CreditRial == principal.AmountRial);
        }

        var draft = JournalEntryDraft.Create(
        [
            JournalLineDraft.Create(accounts.FundFrozenAsset.Id, principal.AmountRial, 0m),
            JournalLineDraft.Create(accounts.BankPayable.Id, 0m, principal.AmountRial),
        ]);
        var journal = new JournalEntryRow
        {
            Id = Guid.NewGuid(),
            ReferenceType = "FrozenPrincipal",
            ReferenceId = principal.ContractId,
            IdempotencyKey = key,
            Description = "Ledger recognition of bank principal previously confirmed frozen in the fund.",
            OccurredAtUtc = principal.FrozenAtUtc,
            PostedAtUtc = postedAtUtc,
        };
        dbContext.JournalEntries.Add(journal);
        AddJournalLines(journal.Id, draft);
        return true;
    }

    private async Task<ContributionLedgerAccounts?> GetTenantContributionLedgerAccountsAsync(
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

    private static bool MatchesExternalTransaction(
        ExternalTransactionRow row,
        string operationType,
        Guid contractId,
        decimal amountRial,
        string idempotencyKey) =>
        row.OperationType == operationType
        && row.AggregateType == "LeaseContract"
        && row.AggregateId == contractId
        && row.AmountRial == amountRial
        && row.Currency == "IRR"
        && row.IdempotencyKey == idempotencyKey;

    private static SettleNormalContractOutcome MapProgress(TransferProgress progress) =>
        progress switch
        {
            TransferProgress.Failed => SettleNormalContractOutcome.Failed,
            TransferProgress.Indeterminate => SettleNormalContractOutcome.Indeterminate,
            _ => SettleNormalContractOutcome.InvalidState,
        };

    private static string BankExternalTransactionIdempotencyKey(Guid contractId) =>
        $"normal-settlement-bank-principal:{contractId:D}:v1";

    private static string TenantExternalTransactionIdempotencyKey(Guid contractId) =>
        $"normal-settlement-tenant-residual:{contractId:D}:v1";

    private static string FrozenPrincipalRecognitionJournalIdempotencyKey(Guid contractId) =>
        $"journal:frozen-bank-principal-recognition:{contractId:D}:v1";

    private static string BankReturnJournalIdempotencyKey(Guid contractId) =>
        $"journal:normal-settlement-bank-principal:{contractId:D}:v1";

    private static string TenantReturnJournalIdempotencyKey(Guid contractId) =>
        $"journal:normal-settlement-tenant-residual:{contractId:D}:v1";

    private static NormalSettlementView ToView(NormalSettlementRow row) =>
        new(
            row.Id,
            row.ContractId,
            row.TenantUserId,
            row.BankId,
            row.BankPrincipalAmountRial,
            row.BankPrincipalStatus,
            row.BankExternalTransactionId,
            row.BankExternalReference,
            row.BankJournalEntryId,
            row.TenantResidualAmountRial,
            row.TenantResidualStatus,
            row.TenantExternalTransactionId,
            row.TenantExternalReference,
            row.TenantJournalEntryId,
            row.UpdatedAtUtc,
            row.CompletedAtUtc);

    private enum TransferProgress
    {
        Succeeded,
        Failed,
        Indeterminate,
        InvalidState,
    }

    private sealed record FrozenPrincipalLedgerAccounts(
        LedgerAccountRow FundFrozenAsset,
        LedgerAccountRow BankPayable);

    private sealed record ContributionLedgerAccounts(
        LedgerAccountRow FundAsset,
        LedgerAccountRow TenantBalance);
}
