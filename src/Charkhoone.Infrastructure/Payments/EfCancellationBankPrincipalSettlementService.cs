using System.Text.Json;
using Charkhoone.Application.Payments;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.Finance;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Infrastructure.Payments;

public sealed class EfCancellationBankPrincipalSettlementService(
    CharkhooneDbContext dbContext,
    IExternalBankPrincipalReturnAdapter bankAdapter)
    : ICancellationBankPrincipalSettlementService
{
    private const string OperationType = "cancellation_bank_principal_return";

    public async Task<SettleCancellationBankPrincipalResult> SettleAsync(
        Guid contractId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default)
    {
        if (contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract id is required.", nameof(contractId));
        }

        Guid cancellationSettlementId;
        Guid externalTransactionId;
        string bankId;
        string fundReference;
        decimal amountRial;
        string idempotencyKey;

        await using (var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken))
        {
            var contract = await dbContext.LeaseContracts
                .FromSqlInterpolated($"SELECT * FROM lease_contracts WHERE \"Id\" = {contractId} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);

            if (contract is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new SettleCancellationBankPrincipalResult(
                    SettleCancellationBankPrincipalOutcome.NotFound,
                    null);
            }

            var cancellationSettlement = await dbContext.CancellationSettlements
                .SingleOrDefaultAsync(x => x.ContractId == contract.Id, cancellationToken);

            if (contract.Status != LeaseContractStatus.Cancelled
                || cancellationSettlement is null
                || cancellationSettlement.Status != CancellationSettlementStatus.Completed
                || cancellationSettlement.CompletedAtUtc is null
                || await dbContext.NormalSettlements.AnyAsync(x => x.ContractId == contract.Id, cancellationToken))
            {
                await transaction.RollbackAsync(cancellationToken);
                return new SettleCancellationBankPrincipalResult(
                    SettleCancellationBankPrincipalOutcome.InvalidState,
                    null);
            }

            var frozenPrincipal = await dbContext.FrozenPrincipals
                .FromSqlInterpolated($"SELECT * FROM frozen_principals WHERE \"ContractId\" = {contract.Id} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);

            if (frozenPrincipal is null
                || frozenPrincipal.AmountRial <= 0m
                || string.IsNullOrWhiteSpace(frozenPrincipal.BankId)
                || string.IsNullOrWhiteSpace(frozenPrincipal.FundReference))
            {
                await transaction.RollbackAsync(cancellationToken);
                return new SettleCancellationBankPrincipalResult(
                    SettleCancellationBankPrincipalOutcome.InvalidState,
                    null);
            }

            idempotencyKey = ExternalTransactionIdempotencyKey(contract.Id);
            var externalTransaction = await dbContext.ExternalTransactions
                .SingleOrDefaultAsync(x => x.IdempotencyKey == idempotencyKey, cancellationToken);

            if (externalTransaction is null)
            {
                externalTransaction = new ExternalTransactionRow
                {
                    Id = Guid.NewGuid(),
                    Provider = bankAdapter.Provider,
                    OperationType = OperationType,
                    AggregateType = "LeaseContract",
                    AggregateId = contract.Id,
                    Status = ExternalTransactionStatus.Pending,
                    AmountRial = frozenPrincipal.AmountRial,
                    Currency = "IRR",
                    IdempotencyKey = idempotencyKey,
                    CreatedAtUtc = occurredAtUtc,
                    UpdatedAtUtc = occurredAtUtc,
                };
                dbContext.ExternalTransactions.Add(externalTransaction);
            }
            else if (!MatchesExternalTransaction(
                externalTransaction,
                contract.Id,
                frozenPrincipal.AmountRial,
                idempotencyKey))
            {
                await transaction.RollbackAsync(cancellationToken);
                return new SettleCancellationBankPrincipalResult(
                    SettleCancellationBankPrincipalOutcome.InvalidState,
                    null);
            }

            if (externalTransaction.Status == ExternalTransactionStatus.Succeeded)
            {
                var completedView = await BuildCompletedViewAsync(
                    contract.Id,
                    cancellationSettlement.Id,
                    frozenPrincipal,
                    externalTransaction,
                    cancellationToken);
                await transaction.RollbackAsync(cancellationToken);

                return completedView is null
                    ? new SettleCancellationBankPrincipalResult(
                        SettleCancellationBankPrincipalOutcome.Indeterminate,
                        ToView(
                            contract.Id,
                            cancellationSettlement.Id,
                            frozenPrincipal,
                            externalTransaction,
                            null))
                    : new SettleCancellationBankPrincipalResult(
                        SettleCancellationBankPrincipalOutcome.AlreadyCompleted,
                        completedView);
            }

            if (externalTransaction.Status == ExternalTransactionStatus.Failed)
            {
                var failedView = await BuildCurrentViewAsync(
                    contract.Id,
                    cancellationSettlement.Id,
                    frozenPrincipal,
                    externalTransaction,
                    cancellationToken);
                await transaction.RollbackAsync(cancellationToken);
                return new SettleCancellationBankPrincipalResult(
                    SettleCancellationBankPrincipalOutcome.Failed,
                    failedView);
            }

            cancellationSettlementId = cancellationSettlement.Id;
            externalTransactionId = externalTransaction.Id;
            bankId = frozenPrincipal.BankId;
            fundReference = frozenPrincipal.FundReference;
            amountRial = frozenPrincipal.AmountRial;

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }

        var response = await bankAdapter.EnsureOrQueryAsync(
            new ExternalBankPrincipalReturnRequest(
                cancellationSettlementId,
                contractId,
                bankId,
                fundReference,
                amountRial,
                idempotencyKey),
            cancellationToken);

        dbContext.ChangeTracker.Clear();
        await using var resultTransaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var contractRow = await dbContext.LeaseContracts
            .FromSqlInterpolated($"SELECT * FROM lease_contracts WHERE \"Id\" = {contractId} FOR UPDATE")
            .SingleAsync(cancellationToken);
        var cancellationSettlementRow = await dbContext.CancellationSettlements
            .FromSqlInterpolated($"SELECT * FROM cancellation_settlements WHERE \"Id\" = {cancellationSettlementId} FOR UPDATE")
            .SingleAsync(cancellationToken);
        var frozenPrincipalRow = await dbContext.FrozenPrincipals
            .FromSqlInterpolated($"SELECT * FROM frozen_principals WHERE \"ContractId\" = {contractId} FOR UPDATE")
            .SingleAsync(cancellationToken);
        var externalRow = await dbContext.ExternalTransactions
            .FromSqlInterpolated($"SELECT * FROM external_transactions WHERE \"Id\" = {externalTransactionId} FOR UPDATE")
            .SingleAsync(cancellationToken);

        if (externalRow.Status == ExternalTransactionStatus.Succeeded)
        {
            var completedView = await BuildCompletedViewAsync(
                contractId,
                cancellationSettlementId,
                frozenPrincipalRow,
                externalRow,
                cancellationToken);
            await resultTransaction.RollbackAsync(cancellationToken);
            return completedView is null
                ? new SettleCancellationBankPrincipalResult(
                    SettleCancellationBankPrincipalOutcome.Indeterminate,
                    ToView(
                        contractId,
                        cancellationSettlementId,
                        frozenPrincipalRow,
                        externalRow,
                        null))
                : new SettleCancellationBankPrincipalResult(
                    SettleCancellationBankPrincipalOutcome.AlreadyCompleted,
                    completedView);
        }

        if (externalRow.Status == ExternalTransactionStatus.Failed)
        {
            var failedView = await BuildCurrentViewAsync(
                contractId,
                cancellationSettlementId,
                frozenPrincipalRow,
                externalRow,
                cancellationToken);
            await resultTransaction.RollbackAsync(cancellationToken);
            return new SettleCancellationBankPrincipalResult(
                SettleCancellationBankPrincipalOutcome.Failed,
                failedView);
        }

        if (contractRow.Status != LeaseContractStatus.Cancelled
            || cancellationSettlementRow.Status != CancellationSettlementStatus.Completed
            || cancellationSettlementRow.CompletedAtUtc is null
            || frozenPrincipalRow.BankId != bankId
            || frozenPrincipalRow.FundReference != fundReference
            || frozenPrincipalRow.AmountRial != amountRial
            || !MatchesExternalTransaction(externalRow, contractId, amountRial, idempotencyKey)
            || await dbContext.NormalSettlements.AnyAsync(x => x.ContractId == contractId, cancellationToken))
        {
            await resultTransaction.RollbackAsync(cancellationToken);
            return new SettleCancellationBankPrincipalResult(
                SettleCancellationBankPrincipalOutcome.InvalidState,
                ToView(
                    contractId,
                    cancellationSettlementId,
                    frozenPrincipalRow,
                    externalRow,
                    null));
        }

        externalRow.Provider = string.IsNullOrWhiteSpace(response.Provider)
            ? bankAdapter.Provider
            : response.Provider.Trim();
        externalRow.ExternalReference = response.ExternalReference;
        externalRow.ReasonCode = response.ReasonCode;
        externalRow.UpdatedAtUtc = occurredAtUtc;

        if (response.Status == ExternalNormalSettlementTransferStatus.Failed)
        {
            externalRow.Status = ExternalTransactionStatus.Failed;

            AddAudit(
                contractId,
                $"cancellation-bank-principal:{externalRow.Provider}",
                "cancellation_bank_principal_return_failed",
                "The early-cancellation bank-principal return reported a definitive external failure; no principal-return journal was posted.",
                occurredAtUtc);

            await dbContext.SaveChangesAsync(cancellationToken);
            await resultTransaction.CommitAsync(cancellationToken);
            return new SettleCancellationBankPrincipalResult(
                SettleCancellationBankPrincipalOutcome.Failed,
                ToView(
                    contractId,
                    cancellationSettlementId,
                    frozenPrincipalRow,
                    externalRow,
                    null));
        }

        var exactConfirmation = response.Status == ExternalNormalSettlementTransferStatus.Confirmed
            && response.ConfirmedAmountRial == frozenPrincipalRow.AmountRial
            && !string.IsNullOrWhiteSpace(response.ExternalReference);

        if (!exactConfirmation)
        {
            externalRow.Status = ExternalTransactionStatus.Unknown;
            externalRow.ReasonCode ??= response.Status == ExternalNormalSettlementTransferStatus.Confirmed
                ? "cancellation_bank_principal_confirmation_mismatch"
                : "cancellation_bank_principal_return_indeterminate";

            AddAudit(
                contractId,
                $"cancellation-bank-principal:{externalRow.Provider}",
                "cancellation_bank_principal_return_indeterminate",
                "The early-cancellation bank-principal return was not confirmed with the exact frozen amount and a valid external reference; no principal-return journal was posted.",
                occurredAtUtc);

            await dbContext.SaveChangesAsync(cancellationToken);
            await resultTransaction.CommitAsync(cancellationToken);
            return new SettleCancellationBankPrincipalResult(
                SettleCancellationBankPrincipalOutcome.Indeterminate,
                ToView(
                    contractId,
                    cancellationSettlementId,
                    frozenPrincipalRow,
                    externalRow,
                    null));
        }

        var accounts = await GetOrCreateFrozenPrincipalLedgerAccountsAsync(
            contractId,
            occurredAtUtc,
            cancellationToken);

        if (accounts is null
            || !await EnsureFrozenPrincipalRecognitionJournalAsync(
                frozenPrincipalRow,
                accounts,
                occurredAtUtc,
                cancellationToken))
        {
            externalRow.Status = ExternalTransactionStatus.Unknown;
            externalRow.ReasonCode = "frozen_principal_ledger_requires_manual_reconciliation";

            AddAudit(
                contractId,
                "system:cancellation-bank-principal-ledger",
                "cancellation_bank_principal_requires_manual_reconciliation",
                "The provider confirmed the early-cancellation principal return but the frozen-principal ledger could not be recognized safely.",
                occurredAtUtc);

            await dbContext.SaveChangesAsync(cancellationToken);
            await resultTransaction.CommitAsync(cancellationToken);
            return new SettleCancellationBankPrincipalResult(
                SettleCancellationBankPrincipalOutcome.Indeterminate,
                ToView(
                    contractId,
                    cancellationSettlementId,
                    frozenPrincipalRow,
                    externalRow,
                    null));
        }

        var returnJournalKey = ReturnJournalIdempotencyKey(contractId);
        if (await dbContext.JournalEntries.AnyAsync(
            x => x.IdempotencyKey == returnJournalKey,
            cancellationToken))
        {
            externalRow.Status = ExternalTransactionStatus.Unknown;
            externalRow.ReasonCode = "cancellation_bank_principal_return_journal_state_inconsistent";

            await dbContext.SaveChangesAsync(cancellationToken);
            await resultTransaction.CommitAsync(cancellationToken);
            return new SettleCancellationBankPrincipalResult(
                SettleCancellationBankPrincipalOutcome.Indeterminate,
                ToView(
                    contractId,
                    cancellationSettlementId,
                    frozenPrincipalRow,
                    externalRow,
                    null));
        }

        var returnDraft = JournalEntryDraft.Create(
        [
            JournalLineDraft.Create(accounts.BankPayable.Id, frozenPrincipalRow.AmountRial, 0m),
            JournalLineDraft.Create(accounts.FundFrozenAsset.Id, 0m, frozenPrincipalRow.AmountRial),
        ]);
        var returnJournal = new JournalEntryRow
        {
            Id = Guid.NewGuid(),
            ReferenceType = "CancellationBankPrincipalSettlement",
            ReferenceId = cancellationSettlementId,
            IdempotencyKey = returnJournalKey,
            Description = "Frozen bank principal returned from the fund to the bank after early cancellation.",
            OccurredAtUtc = occurredAtUtc,
            PostedAtUtc = occurredAtUtc,
        };
        dbContext.JournalEntries.Add(returnJournal);
        AddJournalLines(returnJournal.Id, returnDraft);

        externalRow.Status = ExternalTransactionStatus.Succeeded;
        externalRow.ExternalReference = response.ExternalReference!.Trim();

        AddAudit(
            contractId,
            $"cancellation-bank-principal:{externalRow.Provider}",
            "cancellation_bank_principal_returned",
            "Frozen bank principal was confirmed returned to the bank after cancellation; tenant contribution and owner residual were not used.",
            occurredAtUtc);
        AddOutbox("lease-contract.cancellation-bank-principal-returned.v1", occurredAtUtc, new
        {
            contractId,
            cancellationSettlementId,
            bankId = frozenPrincipalRow.BankId,
            amountRial = frozenPrincipalRow.AmountRial,
            externalTransactionId = externalRow.Id,
            journalEntryId = returnJournal.Id,
            occurredAtUtc,
        });
        AddOutbox("lease-contract.cancelled-bank-notification-requested.v1", occurredAtUtc, new
        {
            contractId,
            cancellationSettlementId,
            bankId = frozenPrincipalRow.BankId,
            amountRial = frozenPrincipalRow.AmountRial,
            externalTransactionId = externalRow.Id,
            occurredAtUtc,
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        await resultTransaction.CommitAsync(cancellationToken);

        return new SettleCancellationBankPrincipalResult(
            SettleCancellationBankPrincipalOutcome.Completed,
            ToView(
                contractId,
                cancellationSettlementId,
                frozenPrincipalRow,
                externalRow,
                returnJournal.Id));
    }

    public async Task<CancellationBankPrincipalReturnView?> GetAsync(
        Guid contractId,
        CancellationToken cancellationToken = default)
    {
        if (contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract id is required.", nameof(contractId));
        }

        var cancellationSettlement = await dbContext.CancellationSettlements
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.ContractId == contractId, cancellationToken);
        var frozenPrincipal = await dbContext.FrozenPrincipals
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.ContractId == contractId, cancellationToken);
        var externalTransaction = await dbContext.ExternalTransactions
            .AsNoTracking()
            .SingleOrDefaultAsync(
                x => x.IdempotencyKey == ExternalTransactionIdempotencyKey(contractId),
                cancellationToken);

        if (cancellationSettlement is null
            || frozenPrincipal is null
            || externalTransaction is null)
        {
            return null;
        }

        return await BuildCurrentViewAsync(
            contractId,
            cancellationSettlement.Id,
            frozenPrincipal,
            externalTransaction,
            cancellationToken);
    }

    private async Task<CancellationBankPrincipalReturnView> BuildCurrentViewAsync(
        Guid contractId,
        Guid cancellationSettlementId,
        FrozenPrincipalRow frozenPrincipal,
        ExternalTransactionRow externalTransaction,
        CancellationToken cancellationToken)
    {
        var journalId = await dbContext.JournalEntries
            .AsNoTracking()
            .Where(x => x.IdempotencyKey == ReturnJournalIdempotencyKey(contractId))
            .Select(x => (Guid?)x.Id)
            .SingleOrDefaultAsync(cancellationToken);

        return ToView(
            contractId,
            cancellationSettlementId,
            frozenPrincipal,
            externalTransaction,
            journalId);
    }

    private async Task<CancellationBankPrincipalReturnView?> BuildCompletedViewAsync(
        Guid contractId,
        Guid cancellationSettlementId,
        FrozenPrincipalRow frozenPrincipal,
        ExternalTransactionRow externalTransaction,
        CancellationToken cancellationToken)
    {
        if (externalTransaction.Status != ExternalTransactionStatus.Succeeded
            || string.IsNullOrWhiteSpace(externalTransaction.ExternalReference))
        {
            return null;
        }

        var accounts = await GetFrozenPrincipalLedgerAccountsAsync(contractId, cancellationToken);
        if (accounts is null
            || !await HasValidFrozenPrincipalRecognitionJournalAsync(
                frozenPrincipal,
                accounts,
                cancellationToken))
        {
            return null;
        }

        var journal = await dbContext.JournalEntries
            .AsNoTracking()
            .SingleOrDefaultAsync(
                x => x.IdempotencyKey == ReturnJournalIdempotencyKey(contractId),
                cancellationToken);
        if (journal is null
            || journal.ReferenceType != "CancellationBankPrincipalSettlement"
            || journal.ReferenceId != cancellationSettlementId)
        {
            return null;
        }

        var lines = await dbContext.JournalLines
            .AsNoTracking()
            .Where(x => x.JournalEntryId == journal.Id)
            .ToListAsync(cancellationToken);

        if (lines.Count != 2
            || !lines.Any(x => x.LedgerAccountId == accounts.BankPayable.Id
                && x.DebitRial == frozenPrincipal.AmountRial
                && x.CreditRial == 0m)
            || !lines.Any(x => x.LedgerAccountId == accounts.FundFrozenAsset.Id
                && x.DebitRial == 0m
                && x.CreditRial == frozenPrincipal.AmountRial))
        {
            return null;
        }

        return ToView(
            contractId,
            cancellationSettlementId,
            frozenPrincipal,
            externalTransaction,
            journal.Id);
    }

    private async Task<FrozenPrincipalLedgerAccounts?> GetFrozenPrincipalLedgerAccountsAsync(
        Guid contractId,
        CancellationToken cancellationToken)
    {
        var assetCode = $"contract:{contractId:D}:fund-held-frozen-bank-principal";
        var payableCode = $"contract:{contractId:D}:bank-principal-payable";

        var asset = await dbContext.LedgerAccounts
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Code == assetCode, cancellationToken);
        var payable = await dbContext.LedgerAccounts
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Code == payableCode, cancellationToken);

        return asset is null || payable is null
            ? null
            : new FrozenPrincipalLedgerAccounts(asset, payable);
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
        if (await HasValidFrozenPrincipalRecognitionJournalAsync(
            principal,
            accounts,
            cancellationToken))
        {
            return true;
        }

        var key = FrozenPrincipalRecognitionJournalIdempotencyKey(principal.ContractId);
        if (await dbContext.JournalEntries.AnyAsync(x => x.IdempotencyKey == key, cancellationToken))
        {
            return false;
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

    private async Task<bool> HasValidFrozenPrincipalRecognitionJournalAsync(
        FrozenPrincipalRow principal,
        FrozenPrincipalLedgerAccounts accounts,
        CancellationToken cancellationToken)
    {
        var existing = await dbContext.JournalEntries
            .SingleOrDefaultAsync(
                x => x.IdempotencyKey == FrozenPrincipalRecognitionJournalIdempotencyKey(principal.ContractId),
                cancellationToken);

        if (existing is null)
        {
            return false;
        }

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
        Guid contractId,
        decimal amountRial,
        string idempotencyKey) =>
        row.OperationType == OperationType
        && row.AggregateType == "LeaseContract"
        && row.AggregateId == contractId
        && row.AmountRial == amountRial
        && row.Currency == "IRR"
        && row.IdempotencyKey == idempotencyKey;

    private static CancellationBankPrincipalReturnView ToView(
        Guid contractId,
        Guid cancellationSettlementId,
        FrozenPrincipalRow frozenPrincipal,
        ExternalTransactionRow externalTransaction,
        Guid? journalEntryId) =>
        new(
            contractId,
            cancellationSettlementId,
            frozenPrincipal.BankId,
            frozenPrincipal.AmountRial,
            externalTransaction.Status switch
            {
                ExternalTransactionStatus.Pending => CancellationBankPrincipalReturnStatus.Pending,
                ExternalTransactionStatus.Unknown => CancellationBankPrincipalReturnStatus.Unknown,
                ExternalTransactionStatus.Failed => CancellationBankPrincipalReturnStatus.Failed,
                ExternalTransactionStatus.Succeeded => CancellationBankPrincipalReturnStatus.Succeeded,
                _ => throw new InvalidOperationException(
                    $"Unsupported external transaction status {externalTransaction.Status}."),
            },
            externalTransaction.Id,
            externalTransaction.ExternalReference,
            journalEntryId,
            externalTransaction.UpdatedAtUtc);

    private static string ExternalTransactionIdempotencyKey(Guid contractId) =>
        $"cancellation-bank-principal:{contractId:D}:v1";

    private static string FrozenPrincipalRecognitionJournalIdempotencyKey(Guid contractId) =>
        $"journal:frozen-bank-principal-recognition:{contractId:D}:v1";

    private static string ReturnJournalIdempotencyKey(Guid contractId) =>
        $"journal:cancellation-bank-principal:{contractId:D}:v1";

    private sealed record FrozenPrincipalLedgerAccounts(
        LedgerAccountRow FundFrozenAsset,
        LedgerAccountRow BankPayable);
}
