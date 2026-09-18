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

            var initialCancellationEffectiveAtUtc = await GetCancellationEffectiveAtUtcAsync(
                contract.Id,
                cancellationToken);
            if (initialCancellationEffectiveAtUtc is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new SettleCancellationResult(
                    SettleCancellationOutcome.InvalidState,
                    existing is null ? null : ToView(existing));
            }

            var postedBalance = await CalculatePostedBalanceAsync(contribution, cancellationToken);
            CancellationFinancialSettlement initialFinancialSettlement;
            List<CancellationLostFundReturnBinding> initialLostReturnBindings;
            try
            {
                initialLostReturnBindings = await LoadOpenCancellationLostFundReturnsAsync(
                    contract.Id,
                    initialCancellationEffectiveAtUtc.Value,
                    cancellationToken);
                initialFinancialSettlement = CancellationFinancialSettlementCalculator.Calculate(
                    postedBalance,
                    initialLostReturnBindings.Select(x => x.Accrual));
            }
            catch (Exception exception) when (
                exception is ArgumentException
                    or InvalidOperationException
                    or OverflowException)
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
                AmountRial = initialFinancialSettlement.OwnerResidualRial,
                Status = CancellationSettlementStatus.Pending,
                CreatedAtUtc = occurredAtUtc,
                UpdatedAtUtc = occurredAtUtc,
            };

            if (existing is null)
            {
                dbContext.CancellationSettlements.Add(settlement);
            }
            else if (settlement.OwnerUserId != contract.OwnerUserId
                || settlement.AmountRial != initialFinancialSettlement.OwnerResidualRial)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new SettleCancellationResult(SettleCancellationOutcome.InvalidState, ToView(settlement));
            }

            if (initialFinancialSettlement.OwnerResidualRial == 0m)
            {
                JournalEntryRow? zeroResidualJournalEntry;
                try
                {
                    zeroResidualJournalEntry = await PostCancellationFinancialJournalAsync(
                        contract.Id,
                        settlement,
                        initialFinancialSettlement,
                        initialLostReturnBindings,
                        initialCancellationEffectiveAtUtc.Value,
                        occurredAtUtc,
                        cancellationToken);
                }
                catch (InvalidOperationException)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return new SettleCancellationResult(
                        SettleCancellationOutcome.InvalidState,
                        ToView(settlement));
                }

                settlement.Status = CancellationSettlementStateMachine.Transition(
                    settlement.Status,
                    CancellationSettlementStatus.Completed);
                settlement.JournalEntryId = zeroResidualJournalEntry?.Id;
                settlement.RemainingTenantContributionRial = 0m;
                settlement.UpdatedAtUtc = occurredAtUtc;
                settlement.CompletedAtUtc = occurredAtUtc;

                FinalizeContractCancellation(
                    contract,
                    settlement,
                    initialFinancialSettlement,
                    initialCancellationEffectiveAtUtc.Value,
                    "system:cancellation-settlement",
                    "Cancellation completed after settling open lost-fund-return obligations from tenant contribution; no owner residual transfer was required.",
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

        var cancellationEffectiveAtUtc = await GetCancellationEffectiveAtUtcAsync(
            contractRow.Id,
            cancellationToken);
        var currentBalance = await CalculatePostedBalanceAsync(contributionRow, cancellationToken);

        CancellationFinancialSettlement financialSettlement;
        List<CancellationLostFundReturnBinding> lostReturnBindings;
        try
        {
            if (cancellationEffectiveAtUtc is null)
            {
                throw new InvalidOperationException("Cancellation transition timestamp is missing.");
            }

            lostReturnBindings = await LoadOpenCancellationLostFundReturnsAsync(
                contractRow.Id,
                cancellationEffectiveAtUtc.Value,
                cancellationToken);
            financialSettlement = CancellationFinancialSettlementCalculator.Calculate(
                currentBalance,
                lostReturnBindings.Select(x => x.Accrual));
        }
        catch (Exception exception) when (
            exception is ArgumentException
                or InvalidOperationException
                or OverflowException)
        {
            settlementRow.Status = CancellationSettlementStateMachine.Transition(
                settlementRow.Status,
                CancellationSettlementStatus.Unknown);
            externalRow.Status = ExternalTransactionStatus.Unknown;
            externalRow.ReasonCode = "cancellation_financial_state_changed_after_transfer_confirmation";

            AddAudit(
                contractRow.Id,
                "system:cancellation-settlement",
                "owner_residual_transfer_requires_manual_reconciliation",
                "The provider reported confirmation but the cancellation financial split could not be reproduced from immutable contract history.",
                occurredAtUtc);

            await dbContext.SaveChangesAsync(cancellationToken);
            await resultTransaction.CommitAsync(cancellationToken);
            return new SettleCancellationResult(SettleCancellationOutcome.Indeterminate, ToView(settlementRow));
        }

        if (financialSettlement.OwnerResidualRial != settlementRow.AmountRial)
        {
            settlementRow.Status = CancellationSettlementStateMachine.Transition(
                settlementRow.Status,
                CancellationSettlementStatus.Unknown);
            externalRow.Status = ExternalTransactionStatus.Unknown;
            externalRow.ReasonCode = "tenant_contribution_balance_changed_after_transfer_confirmation";

            AddAudit(
                contractRow.Id,
                "system:cancellation-settlement",
                "owner_residual_transfer_requires_manual_reconciliation",
                "The provider reported confirmation but the current tenant contribution no longer matches the frozen cancellation owner residual.",
                occurredAtUtc);

            await dbContext.SaveChangesAsync(cancellationToken);
            await resultTransaction.CommitAsync(cancellationToken);
            return new SettleCancellationResult(SettleCancellationOutcome.Indeterminate, ToView(settlementRow));
        }

        JournalEntryRow? journalEntry;
        try
        {
            journalEntry = await PostCancellationFinancialJournalAsync(
                contractRow.Id,
                settlementRow,
                financialSettlement,
                lostReturnBindings,
                cancellationEffectiveAtUtc!.Value,
                occurredAtUtc,
                cancellationToken);
        }
        catch (InvalidOperationException)
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

        settlementRow.Status = CancellationSettlementStateMachine.Transition(
            settlementRow.Status,
            CancellationSettlementStatus.Completed);
        settlementRow.ExternalReference = response.ExternalReference!.Trim();
        settlementRow.JournalEntryId = journalEntry?.Id;
        settlementRow.RemainingTenantContributionRial = 0m;
        settlementRow.CompletedAtUtc = occurredAtUtc;
        settlementRow.UpdatedAtUtc = occurredAtUtc;
        externalRow.Status = ExternalTransactionStatus.Succeeded;

        FinalizeContractCancellation(
            contractRow,
            settlementRow,
            financialSettlement,
            cancellationEffectiveAtUtc.Value,
            $"cancellation-settlement:{externalRow.Provider}",
            "Cancellation owner residual was confirmed transferred after settling open lost-fund-return obligations from tenant contribution.",
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

    private async Task<DateTimeOffset?> GetCancellationEffectiveAtUtcAsync(
        Guid contractId,
        CancellationToken cancellationToken)
    {
        var transitions = await dbContext.WorkflowTransitions
            .AsNoTracking()
            .Where(x => x.AggregateType == "LeaseContract"
                && x.AggregateId == contractId
                && x.ToStatus == LeaseContractStatus.CancellationPending.ToString())
            .OrderBy(x => x.OccurredAtUtc)
            .ThenBy(x => x.Id)
            .Select(x => x.OccurredAtUtc)
            .ToListAsync(cancellationToken);

        return transitions.Count == 1 ? transitions[0] : null;
    }

    private async Task<List<CancellationLostFundReturnBinding>> LoadOpenCancellationLostFundReturnsAsync(
        Guid contractId,
        DateTimeOffset cancellationEffectiveAtUtc,
        CancellationToken cancellationToken)
    {
        var successfulCoverage = await dbContext.CoveragePayments
            .AsNoTracking()
            .Where(x => x.ContractId == contractId && x.Status == CoveragePaymentStatus.Succeeded)
            .Select(x => new
            {
                x.Id,
                x.AmountRial,
            })
            .ToListAsync(cancellationToken);

        var exposureRows = await dbContext.LostFundReturns
            .Where(x => x.ContractId == contractId)
            .OrderBy(x => x.WithdrawnAtUtc)
            .ThenBy(x => x.CoveragePaymentId)
            .ToListAsync(cancellationToken);

        if (successfulCoverage.Count != exposureRows.Count)
        {
            throw new InvalidOperationException(
                "Every successful coverage payment must have exactly one lost-fund-return exposure.");
        }

        var coverageById = successfulCoverage.ToDictionary(x => x.Id);
        var bindings = new List<CancellationLostFundReturnBinding>();

        foreach (var row in exposureRows)
        {
            if (!coverageById.TryGetValue(row.CoveragePaymentId, out var coverage)
                || coverage.AmountRial != row.WithdrawnAmountRial
                || row.MonthlyRate != LostFundReturnTerms.MonthlyRate
                || row.CalculationPeriodStartUtc != row.WithdrawnAtUtc
                || (row.CalculationPolicyVersion is not null
                    && row.CalculationPolicyVersion != LostFundReturnTerms.CalculationPolicyVersion))
            {
                throw new InvalidOperationException(
                    "Lost-fund-return exposure is inconsistent with its confirmed coverage payment.");
            }

            if (row.CalculatedReturnRial is not null)
            {
                if (row.CalculationPeriodEndUtc is null
                    || string.IsNullOrWhiteSpace(row.CalculationPolicyVersion))
                {
                    throw new InvalidOperationException(
                        "Finalized lost-fund-return exposure is missing calculation evidence.");
                }

                continue;
            }

            if (row.ReplacedAtUtc is not null || row.CalculationPeriodEndUtc is not null)
            {
                throw new InvalidOperationException(
                    "Open lost-fund-return exposure contains contradictory finalization evidence.");
            }

            var exposure = LostFundReturnTerms.OpenExposure(
                row.ContractId,
                row.CoveragePaymentId,
                row.WithdrawnAmountRial,
                row.WithdrawnAtUtc);
            var accrual = LostFundReturnTerms.CalculateAccruedReturn(
                exposure,
                cancellationEffectiveAtUtc);
            bindings.Add(new CancellationLostFundReturnBinding(row, accrual));
        }

        return bindings;
    }

    private async Task<LedgerAccountRow> GetOrCreateLostFundReturnIncomeAccountAsync(
        Guid contractId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken)
    {
        var code = $"contract:{contractId:D}:lost-fund-return-income";
        var existing = await dbContext.LedgerAccounts
            .SingleOrDefaultAsync(x => x.Code == code, cancellationToken);
        if (existing is not null)
        {
            if (existing.ContractId != contractId || existing.Currency != "IRR")
            {
                throw new InvalidOperationException(
                    "Lost-fund-return income account does not match the cancellation contract.");
            }

            return existing;
        }

        var account = new LedgerAccountRow
        {
            Id = Guid.NewGuid(),
            Code = code,
            Name = "Lost fund return income",
            Currency = "IRR",
            ContractId = contractId,
            CreatedAtUtc = occurredAtUtc,
        };
        dbContext.LedgerAccounts.Add(account);
        return account;
    }

    private async Task<JournalEntryRow?> PostCancellationFinancialJournalAsync(
        Guid contractId,
        CancellationSettlementRow settlement,
        CancellationFinancialSettlement financialSettlement,
        IReadOnlyList<CancellationLostFundReturnBinding> lostReturnBindings,
        DateTimeOffset cancellationEffectiveAtUtc,
        DateTimeOffset postedAtUtc,
        CancellationToken cancellationToken)
    {
        if (financialSettlement.TenantContributionBeforeSettlementRial == 0m)
        {
            if (financialSettlement.OwnerResidualRial != 0m
                || financialSettlement.LostFundReturnRial != 0m
                || lostReturnBindings.Any(x => x.Accrual.PayableReturn.Rial != 0m))
            {
                throw new InvalidOperationException(
                    "Zero cancellation balance cannot contain a positive owner residual or lost-fund-return settlement.");
            }

            foreach (var binding in lostReturnBindings)
            {
                binding.Row.CalculationPeriodEndUtc = cancellationEffectiveAtUtc;
                binding.Row.CalculationPolicyVersion = binding.Accrual.CalculationPolicyVersion;
                binding.Row.CalculatedReturnRial = 0m;
                binding.Row.UpdatedAtUtc = postedAtUtc;
            }

            return null;
        }

        var journalKey = JournalIdempotencyKey(contractId);
        if (await dbContext.JournalEntries.AnyAsync(
            x => x.IdempotencyKey == journalKey,
            cancellationToken))
        {
            throw new InvalidOperationException(
                "Cancellation financial journal already exists in a non-terminal settlement state.");
        }

        var accounts = await GetContributionLedgerAccountsAsync(contractId, cancellationToken)
            ?? throw new InvalidOperationException("Tenant contribution ledger accounts are missing.");

        LedgerAccountRow? lostReturnIncomeAccount = null;
        if (financialSettlement.LostFundReturnRial > 0m)
        {
            lostReturnIncomeAccount = await GetOrCreateLostFundReturnIncomeAccountAsync(
                contractId,
                postedAtUtc,
                cancellationToken);
        }

        var lines = new List<JournalLineDraft>
        {
            JournalLineDraft.Create(
                accounts.TenantBalance.Id,
                financialSettlement.TenantContributionBeforeSettlementRial,
                0m),
        };

        if (financialSettlement.OwnerResidualRial > 0m)
        {
            lines.Add(JournalLineDraft.Create(
                accounts.FundAsset.Id,
                0m,
                financialSettlement.OwnerResidualRial));
        }

        if (financialSettlement.LostFundReturnRial > 0m)
        {
            lines.Add(JournalLineDraft.Create(
                lostReturnIncomeAccount!.Id,
                0m,
                financialSettlement.LostFundReturnRial));
        }

        var journalDraft = JournalEntryDraft.Create(lines);
        var journalEntry = new JournalEntryRow
        {
            Id = Guid.NewGuid(),
            ReferenceType = "CancellationSettlement",
            ReferenceId = settlement.Id,
            IdempotencyKey = journalKey,
            Description = "Cancellation settled open lost-fund-return obligations from tenant contribution and transferred only the remaining residual to the owner.",
            OccurredAtUtc = cancellationEffectiveAtUtc,
            PostedAtUtc = postedAtUtc,
        };
        dbContext.JournalEntries.Add(journalEntry);
        AddJournalLines(journalEntry.Id, journalDraft);

        foreach (var binding in lostReturnBindings)
        {
            binding.Row.CalculationPeriodEndUtc = cancellationEffectiveAtUtc;
            binding.Row.CalculationPolicyVersion = binding.Accrual.CalculationPolicyVersion;
            binding.Row.CalculatedReturnRial = binding.Accrual.PayableReturn.Rial;
            binding.Row.UpdatedAtUtc = postedAtUtc;
        }

        if (financialSettlement.LostFundReturnRial > 0m)
        {
            AddAudit(
                contractId,
                "system:cancellation-settlement",
                "lost_fund_return_settled_from_tenant_contribution",
                "Open simple 3% lost-fund-return obligations were settled from tenant contribution at the immutable cancellation cutoff; frozen bank principal was not used.",
                postedAtUtc);
            AddOutbox("tenant-contribution.cancellation-lost-fund-return-settled.v1", postedAtUtc, new
            {
                contractId,
                cancellationSettlementId = settlement.Id,
                tenantContributionBeforeSettlementRial = financialSettlement.TenantContributionBeforeSettlementRial,
                lostFundReturnRial = financialSettlement.LostFundReturnRial,
                ownerResidualRial = financialSettlement.OwnerResidualRial,
                cancellationEffectiveAtUtc,
                calculationPolicyVersion = LostFundReturnTerms.CalculationPolicyVersion,
                exposures = lostReturnBindings.Select(x => new
                {
                    coveragePaymentId = x.Row.CoveragePaymentId,
                    withdrawnPrincipalRial = x.Accrual.WithdrawnPrincipal.Rial,
                    withdrawnAtUtc = x.Accrual.WithdrawnAtUtc,
                    elapsedDays = x.Accrual.ElapsedDays,
                    lostFundReturnRial = x.Accrual.PayableReturn.Rial,
                }),
                occurredAtUtc = postedAtUtc,
            });
        }

        return journalEntry;
    }

    private void FinalizeContractCancellation(
        LeaseContractRow contract,
        CancellationSettlementRow settlement,
        CancellationFinancialSettlement financialSettlement,
        DateTimeOffset cancellationEffectiveAtUtc,
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
            tenantContributionBeforeSettlementRial = financialSettlement.TenantContributionBeforeSettlementRial,
            lostFundReturnRial = financialSettlement.LostFundReturnRial,
            ownerResidualAmountRial = settlement.AmountRial,
            cancellationEffectiveAtUtc,
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
        AddOutbox("lease-contract.cancelled-tenant-notification-requested.v1", occurredAtUtc, new
        {
            contractId = contract.Id,
            tenantUserId = contract.TenantUserId,
            cancellationSettlementId = settlement.Id,
            tenantContributionBeforeSettlementRial = financialSettlement.TenantContributionBeforeSettlementRial,
            lostFundReturnRial = financialSettlement.LostFundReturnRial,
            ownerResidualAmountRial = settlement.AmountRial,
            cancellationEffectiveAtUtc,
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
        $"cancellation-owner-residual:{contractId:D}:v2";

    private static string JournalIdempotencyKey(Guid contractId) =>
        $"journal:cancellation-financial-settlement:{contractId:D}:v2";

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

    private sealed record CancellationLostFundReturnBinding(
        LostFundReturnRow Row,
        LostFundReturnAccrual Accrual);

    private sealed record ContributionLedgerAccounts(
        LedgerAccountRow FundAsset,
        LedgerAccountRow TenantBalance);
}
