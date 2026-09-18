using System.Text.Json;
using Charkhoone.Application.Payments;
using Charkhoone.Domain.Finance;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Infrastructure.Payments;

public sealed class EfTenantContributionCoverageService(
    CharkhooneDbContext dbContext,
    IExternalCoverageTransferAdapter coverageAdapter)
    : ITenantContributionCoverageService
{
    private const string CoverageOperationType = "tenant_contribution_coverage";
    private const string ReplenishmentOperationType = "tenant_contribution_replenishment";

    public async Task<CoverMonthlyObligationResult> CoverAsync(
        Guid monthlyObligationId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default)
    {
        if (monthlyObligationId == Guid.Empty)
        {
            throw new ArgumentException("Monthly obligation id is required.", nameof(monthlyObligationId));
        }

        var coveragePaymentIdsToReconcile = new List<Guid>();

        await using (var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken))
        {
            var obligation = await dbContext.MonthlyObligations
                .FromSqlInterpolated($"SELECT * FROM monthly_obligations WHERE \"Id\" = {monthlyObligationId} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);

            if (obligation is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return EmptyResult(CoverMonthlyObligationOutcome.NotFound, null);
            }

            if (obligation.Status == MonthlyObligationStatus.Covered)
            {
                var result = await BuildCoverageResultAsync(
                    CoverMonthlyObligationOutcome.AlreadyCovered,
                    obligation.Id,
                    cancellationToken);
                await transaction.RollbackAsync(cancellationToken);
                return result;
            }

            if (obligation.Status != MonthlyObligationStatus.Missed)
            {
                var result = await BuildCoverageResultAsync(
                    CoverMonthlyObligationOutcome.InvalidState,
                    obligation.Id,
                    cancellationToken);
                await transaction.RollbackAsync(cancellationToken);
                return result;
            }

            var contribution = await dbContext.TenantContributions
                .FromSqlInterpolated($"SELECT * FROM tenant_contributions WHERE \"ContractId\" = {obligation.ContractId} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);

            if (contribution is null)
            {
                var result = await BuildCoverageResultAsync(
                    CoverMonthlyObligationOutcome.InvalidState,
                    obligation.Id,
                    cancellationToken);
                await transaction.RollbackAsync(cancellationToken);
                return result;
            }

            var targets = await LoadCoverageTargetsAsync(obligation.Id, cancellationToken);
            if (targets.Count == 0 || targets.Any(x => IsUnresolvedTenantPayment(x.PaymentStatus)))
            {
                var result = await BuildCoverageResultAsync(
                    CoverMonthlyObligationOutcome.InvalidState,
                    obligation.Id,
                    cancellationToken);
                await transaction.RollbackAsync(cancellationToken);
                return result;
            }

            var coverableTargets = targets
                .Where(x => x.PaymentStatus is PaymentInstructionStatus.Failed
                    or PaymentInstructionStatus.ArrearsBlocked
                    or PaymentInstructionStatus.Reversed)
                .ToArray();

            if (coverableTargets.Length == 0)
            {
                var result = await BuildCoverageResultAsync(
                    CoverMonthlyObligationOutcome.InvalidState,
                    obligation.Id,
                    cancellationToken);
                await transaction.RollbackAsync(cancellationToken);
                return result;
            }

            var targetInstructionIds = coverableTargets.Select(x => x.PaymentInstructionId).ToArray();
            var existingCoverage = await dbContext.CoveragePayments
                .Where(x => targetInstructionIds.Contains(x.PaymentInstructionId))
                .ToListAsync(cancellationToken);

            foreach (var row in existingCoverage)
            {
                var target = coverableTargets.SingleOrDefault(x => x.PaymentInstructionId == row.PaymentInstructionId);
                if (target is null
                    || row.ContractId != obligation.ContractId
                    || row.MonthlyObligationId != obligation.Id
                    || row.Kind != target.Kind
                    || row.AmountRial != target.AmountRial
                    || row.BeneficiaryId != target.BeneficiaryId)
                {
                    var result = await BuildCoverageResultAsync(
                        CoverMonthlyObligationOutcome.InvalidState,
                        obligation.Id,
                        cancellationToken);
                    await transaction.RollbackAsync(cancellationToken);
                    return result;
                }
            }

            if (existingCoverage.Any(x => x.Status == CoveragePaymentStatus.Failed))
            {
                var result = await BuildCoverageResultAsync(
                    CoverMonthlyObligationOutcome.TransferFailed,
                    obligation.Id,
                    cancellationToken);
                await transaction.RollbackAsync(cancellationToken);
                return result;
            }

            var balance = await CalculateBalanceSnapshotAsync(contribution, cancellationToken);
            var existingInstructionIds = existingCoverage.Select(x => x.PaymentInstructionId).ToHashSet();
            var newTargets = coverableTargets
                .Where(x => !existingInstructionIds.Contains(x.PaymentInstructionId))
                .ToArray();
            var amountToReserve = newTargets.Sum(x => x.AmountRial);

            if (balance.AvailableForCoverage.Rial < amountToReserve)
            {
                var result = await BuildCoverageResultAsync(
                    CoverMonthlyObligationOutcome.InsufficientTenantContribution,
                    obligation.Id,
                    cancellationToken);
                await transaction.RollbackAsync(cancellationToken);
                return result;
            }

            foreach (var target in newTargets)
            {
                var coveragePaymentId = Guid.NewGuid();
                var externalTransaction = new ExternalTransactionRow
                {
                    Id = Guid.NewGuid(),
                    Provider = coverageAdapter.Provider,
                    OperationType = CoverageOperationType,
                    AggregateType = "PaymentInstruction",
                    AggregateId = target.PaymentInstructionId,
                    Status = ExternalTransactionStatus.Pending,
                    AmountRial = target.AmountRial,
                    Currency = "IRR",
                    IdempotencyKey = CoverageExternalTransactionIdempotencyKey(target.PaymentInstructionId),
                    CreatedAtUtc = occurredAtUtc,
                    UpdatedAtUtc = occurredAtUtc,
                };

                var coverage = new CoveragePaymentRow
                {
                    Id = coveragePaymentId,
                    ContractId = obligation.ContractId,
                    MonthlyObligationId = obligation.Id,
                    PaymentInstructionId = target.PaymentInstructionId,
                    Kind = target.Kind,
                    AmountRial = target.AmountRial,
                    BeneficiaryId = target.BeneficiaryId,
                    Status = CoveragePaymentStatus.Pending,
                    ExternalTransactionId = externalTransaction.Id,
                    CreatedAtUtc = occurredAtUtc,
                    UpdatedAtUtc = occurredAtUtc,
                };

                dbContext.ExternalTransactions.Add(externalTransaction);
                dbContext.CoveragePayments.Add(coverage);
                coveragePaymentIdsToReconcile.Add(coverage.Id);
            }

            coveragePaymentIdsToReconcile.AddRange(
                existingCoverage
                    .Where(x => x.Status is CoveragePaymentStatus.Pending or CoveragePaymentStatus.Unknown)
                    .Select(x => x.Id));

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }

        foreach (var coveragePaymentId in coveragePaymentIdsToReconcile.Distinct())
        {
            await ReconcileCoveragePaymentAsync(coveragePaymentId, occurredAtUtc, cancellationToken);
        }

        return await FinalizeCoverageAsync(monthlyObligationId, occurredAtUtc, cancellationToken);
    }

    public async Task<TenantContributionBalanceView?> GetBalanceAsync(
        Guid contractId,
        CancellationToken cancellationToken = default)
    {
        if (contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract id is required.", nameof(contractId));
        }

        var contribution = await dbContext.TenantContributions
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.ContractId == contractId, cancellationToken);
        if (contribution is null)
        {
            return null;
        }

        var balance = await CalculateBalanceSnapshotAsync(contribution, cancellationToken);
        return ToBalanceView(contractId, balance);
    }

    public async Task<PostConfirmedReplenishmentResult> PostConfirmedReplenishmentAsync(
        Guid externalTransactionId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default)
    {
        if (externalTransactionId == Guid.Empty)
        {
            throw new ArgumentException("External transaction id is required.", nameof(externalTransactionId));
        }

        TenantContributionReplenishmentRow? postedRow = null;

        await using (var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken))
        {
            var externalTransaction = await dbContext.ExternalTransactions
                .FromSqlInterpolated($"SELECT * FROM external_transactions WHERE \"Id\" = {externalTransactionId} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);

            if (externalTransaction is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new PostConfirmedReplenishmentResult(
                    PostConfirmedReplenishmentOutcome.NotFound,
                    null,
                    null);
            }

            var existing = await dbContext.TenantContributionReplenishments
                .SingleOrDefaultAsync(x => x.ExternalTransactionId == externalTransaction.Id, cancellationToken);
            if (existing is not null)
            {
                var balance = await GetBalanceAsync(existing.ContractId, cancellationToken);
                await transaction.RollbackAsync(cancellationToken);
                return new PostConfirmedReplenishmentResult(
                    PostConfirmedReplenishmentOutcome.AlreadyPosted,
                    ToReplenishmentView(existing),
                    balance);
            }

            if (externalTransaction.OperationType != ReplenishmentOperationType
                || externalTransaction.AggregateType != "LeaseContract"
                || externalTransaction.Status != ExternalTransactionStatus.Succeeded
                || externalTransaction.AmountRial <= 0m
                || externalTransaction.Currency != "IRR"
                || string.IsNullOrWhiteSpace(externalTransaction.ExternalReference))
            {
                await transaction.RollbackAsync(cancellationToken);
                return new PostConfirmedReplenishmentResult(
                    PostConfirmedReplenishmentOutcome.InvalidState,
                    null,
                    null);
            }

            var contract = await dbContext.LeaseContracts
                .FromSqlInterpolated($"SELECT * FROM lease_contracts WHERE \"Id\" = {externalTransaction.AggregateId} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);
            var delinquency = contract is null
                ? null
                : await dbContext.ContractDelinquencies
                    .SingleOrDefaultAsync(x => x.ContractId == contract.Id, cancellationToken);

            if (contract is null
                || contract.Status != Charkhoone.Domain.Contracts.LeaseContractStatus.Active
                || delinquency?.CancellationRequired == true)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new PostConfirmedReplenishmentResult(
                    PostConfirmedReplenishmentOutcome.InvalidState,
                    null,
                    null);
            }

            var contribution = await dbContext.TenantContributions
                .FromSqlInterpolated($"SELECT * FROM tenant_contributions WHERE \"ContractId\" = {externalTransaction.AggregateId} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);
            if (contribution is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new PostConfirmedReplenishmentResult(
                    PostConfirmedReplenishmentOutcome.InvalidState,
                    null,
                    null);
            }

            var paymentEffectiveAtUtc = externalTransaction.UpdatedAtUtc;
            if (paymentEffectiveAtUtc > occurredAtUtc)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new PostConfirmedReplenishmentResult(
                    PostConfirmedReplenishmentOutcome.InvalidState,
                    null,
                    null);
            }

            var confirmedArrears = await LoadConfirmedArrearsItemsAsync(
                contribution.ContractId,
                cancellationToken);
            var previouslyReplenishedRial = await dbContext.TenantContributionReplenishments
                .Where(x => x.ContractId == contribution.ContractId)
                .SumAsync(x => (decimal?)x.AmountRial, cancellationToken) ?? 0m;

            TenantArrearsSnapshot arrearsSnapshot;
            List<LostFundReturnAccrualBinding> lostReturnBindings;
            decimal accruedLostFundReturnRial;

            try
            {
                arrearsSnapshot = TenantArrearsPolicy.CalculateOutstanding(
                    confirmedArrears,
                    previouslyReplenishedRial);

                lostReturnBindings = await CalculateLostFundReturnBindingsAsync(
                    contribution.ContractId,
                    confirmedArrears,
                    arrearsSnapshot,
                    paymentEffectiveAtUtc,
                    cancellationToken);
                accruedLostFundReturnRial = lostReturnBindings.Sum(x => x.Accrual.PayableReturn.Rial);
            }
            catch (Exception exception) when (exception is ArgumentException or InvalidOperationException)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new PostConfirmedReplenishmentResult(
                    PostConfirmedReplenishmentOutcome.InvalidState,
                    null,
                    null);
            }

            TenantArrearsPaymentPlan arrearsPaymentPlan;
            try
            {
                arrearsPaymentPlan = TenantArrearsPolicy.CreateFullPaymentPlan(
                    confirmedArrears,
                    previouslyReplenishedRial,
                    accruedLostFundReturnRial,
                    externalTransaction.AmountRial);
            }
            catch (Exception exception) when (exception is ArgumentException or InvalidOperationException)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new PostConfirmedReplenishmentResult(
                    PostConfirmedReplenishmentOutcome.InvalidState,
                    null,
                    null);
            }

            var accounts = await GetContributionLedgerAccountsAsync(contribution.ContractId, cancellationToken);
            if (accounts is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new PostConfirmedReplenishmentResult(
                    PostConfirmedReplenishmentOutcome.InvalidState,
                    null,
                    null);
            }

            var balanceBefore = await CalculateBalanceSnapshotAsync(contribution, cancellationToken);
            var journalKey = ReplenishmentJournalIdempotencyKey(externalTransaction.Id);
            if (await dbContext.JournalEntries.AnyAsync(x => x.IdempotencyKey == journalKey, cancellationToken))
            {
                await transaction.RollbackAsync(cancellationToken);
                return new PostConfirmedReplenishmentResult(
                    PostConfirmedReplenishmentOutcome.InvalidState,
                    null,
                    null);
            }

            LedgerAccountRow? lostReturnIncomeAccount = null;
            if (arrearsPaymentPlan.LostFundReturnRial > 0m)
            {
                lostReturnIncomeAccount = await GetOrCreateLostFundReturnIncomeAccountAsync(
                    contribution.ContractId,
                    occurredAtUtc,
                    cancellationToken);
            }

            var journalLines = new List<JournalLineDraft>
            {
                JournalLineDraft.Create(accounts.FundAsset.Id, arrearsPaymentPlan.RequiredTotalRial, 0m),
                JournalLineDraft.Create(accounts.TenantBalance.Id, 0m, arrearsPaymentPlan.PrincipalRial),
            };
            if (arrearsPaymentPlan.LostFundReturnRial > 0m)
            {
                journalLines.Add(JournalLineDraft.Create(
                    lostReturnIncomeAccount!.Id,
                    0m,
                    arrearsPaymentPlan.LostFundReturnRial));
            }

            var journalDraft = JournalEntryDraft.Create(journalLines);

            var journalEntry = new JournalEntryRow
            {
                Id = Guid.NewGuid(),
                ReferenceType = "ExternalTransaction",
                ReferenceId = externalTransaction.Id,
                IdempotencyKey = journalKey,
                Description = "Confirmed tenant arrears payment restored principal and separately recognized simple lost-fund-return income.",
                OccurredAtUtc = paymentEffectiveAtUtc,
                PostedAtUtc = occurredAtUtc,
            };
            dbContext.JournalEntries.Add(journalEntry);
            AddJournalLines(journalEntry.Id, journalDraft);

            foreach (var binding in lostReturnBindings)
            {
                binding.Row.ReplacedAtUtc = paymentEffectiveAtUtc;
                binding.Row.CalculationPeriodEndUtc = paymentEffectiveAtUtc;
                binding.Row.CalculationPolicyVersion = binding.Accrual.CalculationPolicyVersion;
                binding.Row.CalculatedReturnRial = binding.Accrual.PayableReturn.Rial;
                binding.Row.UpdatedAtUtc = occurredAtUtc;
            }

            postedRow = new TenantContributionReplenishmentRow
            {
                Id = Guid.NewGuid(),
                ContractId = contribution.ContractId,
                ExternalTransactionId = externalTransaction.Id,
                JournalEntryId = journalEntry.Id,
                AmountRial = arrearsPaymentPlan.PrincipalRial,
                RemainingTenantContributionRial = balanceBefore.PostedBalance.Rial + arrearsPaymentPlan.PrincipalRial,
                ExternalReference = externalTransaction.ExternalReference.Trim(),
                ReplenishedAtUtc = paymentEffectiveAtUtc,
            };
            dbContext.TenantContributionReplenishments.Add(postedRow);

            AddAudit(
                "LeaseContract",
                contribution.ContractId,
                $"payment:{externalTransaction.Provider}",
                "tenant_contribution_replenished",
                "The exact full outstanding tenant principal plus simple 3% lost fund return was paid; principal was restored oldest-first and fund return was recognized separately.",
                occurredAtUtc);
            AddOutbox("tenant-contribution.replenished.v1", occurredAtUtc, new
            {
                contractId = contribution.ContractId,
                replenishmentId = postedRow.Id,
                externalTransactionId = externalTransaction.Id,
                journalEntryId = journalEntry.Id,
                totalPaymentRial = arrearsPaymentPlan.RequiredTotalRial,
                principalReplenishmentRial = postedRow.AmountRial,
                lostFundReturnRial = arrearsPaymentPlan.LostFundReturnRial,
                remainingTenantContributionRial = postedRow.RemainingTenantContributionRial,
                arrearsBeforePaymentRial = arrearsPaymentPlan.BeforePayment.OutstandingRial,
                lostFundReturnPolicy = LostFundReturnTerms.CalculationPolicyVersion,
                paymentEffectiveAtUtc,
                allocationPolicy = "oldest-contract-month-first",
                allocations = arrearsPaymentPlan.AllocationsOldestFirst.Select(x => new
                {
                    referenceId = x.ReferenceId,
                    contractMonthNumber = x.ContractMonthNumber,
                    componentOrder = x.ComponentOrder,
                    principalRial = x.AmountRial,
                }),
                lostFundReturnExposures = lostReturnBindings.Select(x => new
                {
                    coveragePaymentId = x.Row.CoveragePaymentId,
                    withdrawnPrincipalRial = x.Accrual.WithdrawnPrincipal.Rial,
                    withdrawnAtUtc = x.Accrual.WithdrawnAtUtc,
                    repaidAtUtc = x.Accrual.RepaidAtUtc,
                    elapsedDays = x.Accrual.ElapsedDays,
                    lostFundReturnRial = x.Accrual.PayableReturn.Rial,
                }),
                occurredAtUtc,
            });

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }

        var resultingBalance = await GetBalanceAsync(postedRow!.ContractId, cancellationToken);
        return new PostConfirmedReplenishmentResult(
            PostConfirmedReplenishmentOutcome.Posted,
            ToReplenishmentView(postedRow),
            resultingBalance);
    }

    private async Task ReconcileCoveragePaymentAsync(
        Guid coveragePaymentId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken)
    {
        var snapshot = await (
            from coverageRow in dbContext.CoveragePayments.AsNoTracking()
            join externalRow in dbContext.ExternalTransactions.AsNoTracking()
                on coverageRow.ExternalTransactionId equals externalRow.Id
            where coverageRow.Id == coveragePaymentId
            select new
            {
                Coverage = coverageRow,
                externalRow.IdempotencyKey,
            })
            .SingleAsync(cancellationToken);

        if (snapshot.Coverage.Status is CoveragePaymentStatus.Succeeded or CoveragePaymentStatus.Failed)
        {
            return;
        }

        var response = await coverageAdapter.EnsureOrQueryAsync(
            new ExternalCoverageTransferRequest(
                snapshot.Coverage.Id,
                snapshot.Coverage.MonthlyObligationId,
                snapshot.Coverage.PaymentInstructionId,
                snapshot.Coverage.ContractId,
                snapshot.Coverage.Kind,
                snapshot.Coverage.BeneficiaryId,
                snapshot.Coverage.AmountRial,
                snapshot.IdempotencyKey),
            cancellationToken);

        dbContext.ChangeTracker.Clear();
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var coverage = await dbContext.CoveragePayments
            .FromSqlInterpolated($"SELECT * FROM coverage_payments WHERE \"Id\" = {coveragePaymentId} FOR UPDATE")
            .SingleAsync(cancellationToken);

        if (coverage.Status is CoveragePaymentStatus.Succeeded or CoveragePaymentStatus.Failed)
        {
            await transaction.RollbackAsync(cancellationToken);
            return;
        }

        var contribution = await dbContext.TenantContributions
            .FromSqlInterpolated($"SELECT * FROM tenant_contributions WHERE \"ContractId\" = {coverage.ContractId} FOR UPDATE")
            .SingleAsync(cancellationToken);
        var externalTransaction = await dbContext.ExternalTransactions
            .FromSqlInterpolated($"SELECT * FROM external_transactions WHERE \"Id\" = {coverage.ExternalTransactionId} FOR UPDATE")
            .SingleAsync(cancellationToken);

        externalTransaction.Provider = string.IsNullOrWhiteSpace(response.Provider)
            ? coverageAdapter.Provider
            : response.Provider.Trim();
        externalTransaction.ExternalReference = response.ExternalReference;
        externalTransaction.ReasonCode = response.ReasonCode;
        externalTransaction.UpdatedAtUtc = occurredAtUtc;
        coverage.UpdatedAtUtc = occurredAtUtc;

        if (response.Status == ExternalCoverageTransferStatus.Failed)
        {
            coverage.Status = CoveragePaymentStateMachine.Transition(
                coverage.Status,
                CoveragePaymentStatus.Failed);
            externalTransaction.Status = ExternalTransactionStatus.Failed;

            AddAudit(
                "PaymentInstruction",
                coverage.PaymentInstructionId,
                $"coverage:{externalTransaction.Provider}",
                "tenant_contribution_coverage_failed",
                "The external coverage transfer returned a definitive failure; it was not automatically retried.",
                occurredAtUtc);

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return;
        }

        var exactConfirmation = response.Status == ExternalCoverageTransferStatus.Confirmed
            && response.ConfirmedAmountRial == coverage.AmountRial
            && !string.IsNullOrWhiteSpace(response.ExternalReference);

        if (!exactConfirmation)
        {
            coverage.Status = CoveragePaymentStateMachine.Transition(
                coverage.Status,
                CoveragePaymentStatus.Unknown);
            externalTransaction.Status = ExternalTransactionStatus.Unknown;
            externalTransaction.ReasonCode ??= response.Status == ExternalCoverageTransferStatus.Confirmed
                ? "coverage_confirmation_mismatch"
                : "coverage_transfer_indeterminate";

            AddAudit(
                "PaymentInstruction",
                coverage.PaymentInstructionId,
                $"coverage:{externalTransaction.Provider}",
                "tenant_contribution_coverage_indeterminate",
                "Coverage was not confirmed with the exact expected amount and a valid external reference; no ledger debit was posted.",
                occurredAtUtc);

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return;
        }

        var balanceBefore = await CalculateBalanceSnapshotAsync(contribution, cancellationToken);
        var accounts = await GetContributionLedgerAccountsAsync(coverage.ContractId, cancellationToken);
        if (accounts is null || balanceBefore.PostedBalance.Rial < coverage.AmountRial)
        {
            coverage.Status = CoveragePaymentStateMachine.Transition(
                coverage.Status,
                CoveragePaymentStatus.Unknown);
            externalTransaction.Status = ExternalTransactionStatus.Unknown;
            externalTransaction.ReasonCode = accounts is null
                ? "tenant_contribution_ledger_accounts_missing"
                : "tenant_contribution_balance_invariant_violation";

            AddAudit(
                "PaymentInstruction",
                coverage.PaymentInstructionId,
                "system:coverage-ledger",
                "tenant_contribution_coverage_requires_manual_reconciliation",
                "The provider reported confirmation but the local tenant-contribution ledger could not safely post the debit.",
                occurredAtUtc);

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return;
        }

        var journalKey = CoverageJournalIdempotencyKey(coverage.PaymentInstructionId);
        if (await dbContext.JournalEntries.AnyAsync(x => x.IdempotencyKey == journalKey, cancellationToken))
        {
            coverage.Status = CoveragePaymentStateMachine.Transition(
                coverage.Status,
                CoveragePaymentStatus.Unknown);
            externalTransaction.Status = ExternalTransactionStatus.Unknown;
            externalTransaction.ReasonCode = "coverage_journal_state_inconsistent";
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return;
        }

        var journalDraft = JournalEntryDraft.Create(
        [
            JournalLineDraft.Create(accounts.TenantBalance.Id, coverage.AmountRial, 0m),
            JournalLineDraft.Create(accounts.FundAsset.Id, 0m, coverage.AmountRial),
        ]);

        var journalEntry = new JournalEntryRow
        {
            Id = Guid.NewGuid(),
            ReferenceType = "CoveragePayment",
            ReferenceId = coverage.Id,
            IdempotencyKey = journalKey,
            Description = "Monthly contractual obligation covered from the tenant contribution held in the fund.",
            OccurredAtUtc = occurredAtUtc,
            PostedAtUtc = occurredAtUtc,
        };
        dbContext.JournalEntries.Add(journalEntry);
        AddJournalLines(journalEntry.Id, journalDraft);

        coverage.Status = CoveragePaymentStateMachine.Transition(
            coverage.Status,
            CoveragePaymentStatus.Succeeded);
        coverage.JournalEntryId = journalEntry.Id;
        coverage.RemainingTenantContributionRial = balanceBefore.PostedBalance.Rial - coverage.AmountRial;
        coverage.CoveredAtUtc = occurredAtUtc;
        externalTransaction.Status = ExternalTransactionStatus.Succeeded;

        AddAudit(
            "PaymentInstruction",
            coverage.PaymentInstructionId,
            $"coverage:{externalTransaction.Provider}",
            "tenant_contribution_coverage_posted",
            "The unpaid monthly component was covered from tenant contribution and posted without touching frozen bank principal.",
            occurredAtUtc);
        AddOutbox("payment-instruction.covered-from-tenant-contribution.v1", occurredAtUtc, new
        {
            coveragePaymentId = coverage.Id,
            paymentInstructionId = coverage.PaymentInstructionId,
            monthlyObligationId = coverage.MonthlyObligationId,
            contractId = coverage.ContractId,
            kind = coverage.Kind.ToString(),
            amountRial = coverage.AmountRial,
            remainingTenantContributionRial = coverage.RemainingTenantContributionRial,
            externalTransactionId = externalTransaction.Id,
            journalEntryId = journalEntry.Id,
            occurredAtUtc,
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }

    private async Task<CoverMonthlyObligationResult> FinalizeCoverageAsync(
        Guid monthlyObligationId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken)
    {
        CoverMonthlyObligationOutcome outcome;

        await using (var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken))
        {
            var obligation = await dbContext.MonthlyObligations
                .FromSqlInterpolated($"SELECT * FROM monthly_obligations WHERE \"Id\" = {monthlyObligationId} FOR UPDATE")
                .SingleAsync(cancellationToken);
            var targets = await LoadCoverageTargetsAsync(obligation.Id, cancellationToken);
            var coverableIds = targets
                .Where(x => x.PaymentStatus is PaymentInstructionStatus.Failed
                    or PaymentInstructionStatus.ArrearsBlocked
                    or PaymentInstructionStatus.Reversed)
                .Select(x => x.PaymentInstructionId)
                .ToArray();
            var coverageRows = await dbContext.CoveragePayments
                .Where(x => coverableIds.Contains(x.PaymentInstructionId))
                .ToListAsync(cancellationToken);

            if (coverageRows.Any(x => x.Status == CoveragePaymentStatus.Failed))
            {
                outcome = CoverMonthlyObligationOutcome.TransferFailed;
            }
            else if (coverageRows.Count != coverableIds.Length
                || coverageRows.Any(x => x.Status is CoveragePaymentStatus.Pending or CoveragePaymentStatus.Unknown))
            {
                outcome = CoverMonthlyObligationOutcome.Indeterminate;
            }
            else if (coverableIds.Length > 0
                && coverageRows.All(x => x.Status == CoveragePaymentStatus.Succeeded))
            {
                if (obligation.Status == MonthlyObligationStatus.Missed)
                {
                    obligation.Status = MonthlyObligationStatus.Covered;
                    obligation.UpdatedAtUtc = occurredAtUtc;

                    AddAudit(
                        "LeaseContract",
                        obligation.ContractId,
                        "system:tenant-contribution-coverage",
                        "monthly_obligation_covered",
                        $"Contract month {obligation.ContractMonthNumber} unpaid components were covered from tenant contribution. Delinquency history was not reset.",
                        occurredAtUtc);
                    AddOutbox("monthly-obligation.covered.v1", occurredAtUtc, new
                    {
                        monthlyObligationId = obligation.Id,
                        contractId = obligation.ContractId,
                        contractMonthNumber = obligation.ContractMonthNumber,
                        occurredAtUtc,
                    });
                }
                else if (obligation.Status != MonthlyObligationStatus.Covered)
                {
                    outcome = CoverMonthlyObligationOutcome.InvalidState;
                    await transaction.RollbackAsync(cancellationToken);
                    return await BuildCoverageResultAsync(outcome, obligation.Id, cancellationToken);
                }

                outcome = CoverMonthlyObligationOutcome.Covered;
            }
            else
            {
                outcome = CoverMonthlyObligationOutcome.InvalidState;
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }

        return await BuildCoverageResultAsync(outcome, monthlyObligationId, cancellationToken);
    }

    private async Task<CoverMonthlyObligationResult> BuildCoverageResultAsync(
        CoverMonthlyObligationOutcome outcome,
        Guid monthlyObligationId,
        CancellationToken cancellationToken)
    {
        var obligation = await dbContext.MonthlyObligations
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == monthlyObligationId, cancellationToken);
        if (obligation is null)
        {
            return EmptyResult(outcome, monthlyObligationId);
        }

        var contribution = await dbContext.TenantContributions
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.ContractId == obligation.ContractId, cancellationToken);
        TenantContributionBalanceView? balanceView = null;
        if (contribution is not null)
        {
            var balance = await CalculateBalanceSnapshotAsync(contribution, cancellationToken);
            balanceView = ToBalanceView(obligation.ContractId, balance);
        }

        var coveragePayments = await dbContext.CoveragePayments
            .AsNoTracking()
            .Where(x => x.MonthlyObligationId == monthlyObligationId)
            .OrderBy(x => x.Kind)
            .ThenBy(x => x.Id)
            .ToListAsync(cancellationToken);

        var transactionIds = coveragePayments.Select(x => x.ExternalTransactionId).ToArray();
        var externalReferences = await dbContext.ExternalTransactions
            .AsNoTracking()
            .Where(x => transactionIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x.ExternalReference, cancellationToken);

        return new CoverMonthlyObligationResult(
            outcome,
            obligation.Id,
            balanceView,
            coveragePayments.Select(x => ToCoverageView(
                x,
                externalReferences.GetValueOrDefault(x.ExternalTransactionId))).ToArray());
    }

    private async Task<IReadOnlyList<TenantArrearsItem>> LoadConfirmedArrearsItemsAsync(
        Guid contractId,
        CancellationToken cancellationToken)
    {
        var rows = await (
            from coverage in dbContext.CoveragePayments.AsNoTracking()
            join obligation in dbContext.MonthlyObligations.AsNoTracking()
                on coverage.MonthlyObligationId equals obligation.Id
            where coverage.ContractId == contractId
                && coverage.Status == CoveragePaymentStatus.Succeeded
            orderby obligation.ContractMonthNumber, coverage.Kind, coverage.Id
            select new
            {
                coverage.Id,
                obligation.ContractMonthNumber,
                coverage.Kind,
                coverage.AmountRial,
            })
            .ToListAsync(cancellationToken);

        return rows
            .Select(x => new TenantArrearsItem(
                x.Id,
                x.ContractMonthNumber,
                (int)x.Kind,
                x.AmountRial))
            .ToArray();
    }

    private async Task<List<LostFundReturnAccrualBinding>> CalculateLostFundReturnBindingsAsync(
        Guid contractId,
        IReadOnlyList<TenantArrearsItem> confirmedArrears,
        TenantArrearsSnapshot arrearsSnapshot,
        DateTimeOffset repaidAtUtc,
        CancellationToken cancellationToken)
    {
        if (arrearsSnapshot.OutstandingRial <= 0m)
        {
            throw new InvalidOperationException("There is no outstanding principal to accrue lost fund return.");
        }

        var coverageIds = confirmedArrears.Select(x => x.ReferenceId).ToArray();
        var rows = await dbContext.LostFundReturns
            .Where(x => x.ContractId == contractId && coverageIds.Contains(x.CoveragePaymentId))
            .ToListAsync(cancellationToken);

        if (rows.Count != coverageIds.Length)
        {
            throw new InvalidOperationException(
                "Every confirmed coverage payment must have exactly one lost fund return exposure.");
        }

        var arrearsById = confirmedArrears.ToDictionary(x => x.ReferenceId);
        var outstandingById = arrearsSnapshot.OutstandingOldestFirst
            .ToDictionary(x => x.ReferenceId);

        var bindings = new List<LostFundReturnAccrualBinding>();

        foreach (var row in rows)
        {
            if (!arrearsById.TryGetValue(row.CoveragePaymentId, out var arrearsItem)
                || row.WithdrawnAmountRial != arrearsItem.AmountRial
                || row.MonthlyRate != LostFundReturnTerms.MonthlyRate)
            {
                throw new InvalidOperationException(
                    "Lost fund return exposure does not match its confirmed coverage principal.");
            }

            if (!outstandingById.TryGetValue(row.CoveragePaymentId, out var outstanding))
            {
                if (row.CalculatedReturnRial is null
                    || row.CalculationPeriodEndUtc is null
                    || row.ReplacedAtUtc is null
                    || string.IsNullOrWhiteSpace(row.CalculationPolicyVersion))
                {
                    throw new InvalidOperationException(
                        "Historical replenishment exists without finalized lost fund return evidence.");
                }

                continue;
            }

            if (outstanding.AmountRial != row.WithdrawnAmountRial)
            {
                throw new InvalidOperationException(
                    "Legacy partial replenishment cannot be automatically repriced because its lost-return cutoff is not provable.");
            }

            if (row.CalculatedReturnRial is not null
                || row.CalculationPeriodEndUtc is not null
                || row.ReplacedAtUtc is not null)
            {
                throw new InvalidOperationException(
                    "Outstanding tenant principal cannot reference a finalized lost fund return exposure.");
            }

            var exposure = LostFundReturnTerms.OpenExposure(
                row.ContractId,
                row.CoveragePaymentId,
                row.WithdrawnAmountRial,
                row.WithdrawnAtUtc);
            var accrual = LostFundReturnTerms.CalculateAccruedReturn(exposure, repaidAtUtc);
            bindings.Add(new LostFundReturnAccrualBinding(row, accrual));
        }

        if (bindings.Count != arrearsSnapshot.OutstandingOldestFirst.Count)
        {
            throw new InvalidOperationException(
                "Outstanding tenant arrears and open lost fund return exposures are inconsistent.");
        }

        return bindings
            .OrderBy(x => arrearsById[x.Row.CoveragePaymentId].ContractMonthNumber)
            .ThenBy(x => arrearsById[x.Row.CoveragePaymentId].ComponentOrder)
            .ThenBy(x => x.Row.CoveragePaymentId)
            .ToList();
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

    private async Task<TenantContributionBalanceSnapshot> CalculateBalanceSnapshotAsync(
        TenantContributionRow contribution,
        CancellationToken cancellationToken)
    {
        var confirmedCoverage = await dbContext.CoveragePayments
            .Where(x => x.ContractId == contribution.ContractId && x.Status == CoveragePaymentStatus.Succeeded)
            .SumAsync(x => (decimal?)x.AmountRial, cancellationToken) ?? 0m;
        var reservedCoverage = await dbContext.CoveragePayments
            .Where(x => x.ContractId == contribution.ContractId
                && (x.Status == CoveragePaymentStatus.Pending || x.Status == CoveragePaymentStatus.Unknown))
            .SumAsync(x => (decimal?)x.AmountRial, cancellationToken) ?? 0m;
        var replenishments = await dbContext.TenantContributionReplenishments
            .Where(x => x.ContractId == contribution.ContractId)
            .SumAsync(x => (decimal?)x.AmountRial, cancellationToken) ?? 0m;

        return TenantContributionBalanceSnapshot.Calculate(
            contribution.InitialAmountRial,
            replenishments,
            confirmedCoverage,
            reservedCoverage);
    }

    private async Task<IReadOnlyList<CoverageTarget>> LoadCoverageTargetsAsync(
        Guid monthlyObligationId,
        CancellationToken cancellationToken) =>
        await (
            from component in dbContext.MonthlyObligationComponents
            join payment in dbContext.PaymentInstructions on component.PaymentInstructionId equals payment.Id
            where component.MonthlyObligationId == monthlyObligationId
            orderby component.Kind
            select new CoverageTarget(
                payment.Id,
                component.Kind,
                payment.BeneficiaryId,
                payment.AmountRial,
                payment.Status))
            .ToListAsync(cancellationToken);

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
        string aggregateType,
        Guid aggregateId,
        string actorId,
        string action,
        string reason,
        DateTimeOffset occurredAtUtc) =>
        dbContext.AuditEvents.Add(new AuditEventRow
        {
            Id = Guid.NewGuid(),
            AggregateType = aggregateType,
            AggregateId = aggregateId,
            ActorId = actorId,
            Action = action,
            Reason = reason,
            OccurredAtUtc = occurredAtUtc,
        });

    private void AddOutbox(string type, DateTimeOffset occurredAtUtc, object payload) =>
        dbContext.OutboxMessages.Add(new OutboxMessageRow
        {
            Id = Guid.NewGuid(),
            OccurredAtUtc = occurredAtUtc,
            Type = type,
            PayloadJson = JsonSerializer.Serialize(payload),
        });

    private static bool IsUnresolvedTenantPayment(PaymentInstructionStatus status) =>
        status is PaymentInstructionStatus.Created
            or PaymentInstructionStatus.Pending
            or PaymentInstructionStatus.Unknown
            or PaymentInstructionStatus.ReconciliationRequired;

    private static CoverMonthlyObligationResult EmptyResult(
        CoverMonthlyObligationOutcome outcome,
        Guid? monthlyObligationId) =>
        new(outcome, monthlyObligationId, null, Array.Empty<CoveragePaymentView>());

    private static TenantContributionBalanceView ToBalanceView(
        Guid contractId,
        TenantContributionBalanceSnapshot balance) =>
        new(
            contractId,
            balance.InitialContribution.Rial,
            balance.ConfirmedReplenishments.Rial,
            balance.ConfirmedCoverage.Rial,
            balance.ReservedCoverage.Rial,
            balance.PostedBalance.Rial,
            balance.AvailableForCoverage.Rial);

    private static CoveragePaymentView ToCoverageView(
        CoveragePaymentRow row,
        string? externalReference) =>
        new(
            row.Id,
            row.MonthlyObligationId,
            row.PaymentInstructionId,
            row.Kind,
            row.AmountRial,
            row.BeneficiaryId,
            row.Status,
            externalReference,
            row.JournalEntryId,
            row.RemainingTenantContributionRial,
            row.UpdatedAtUtc);

    private static TenantContributionReplenishmentView ToReplenishmentView(
        TenantContributionReplenishmentRow row) =>
        new(
            row.Id,
            row.ContractId,
            row.ExternalTransactionId,
            row.JournalEntryId,
            row.AmountRial,
            row.RemainingTenantContributionRial,
            row.ExternalReference,
            row.ReplenishedAtUtc);

    private static string CoverageExternalTransactionIdempotencyKey(Guid paymentInstructionId) =>
        $"tenant-contribution-coverage:{paymentInstructionId:D}:v1";

    private static string CoverageJournalIdempotencyKey(Guid paymentInstructionId) =>
        $"journal:tenant-contribution-coverage:{paymentInstructionId:D}:v1";

    private static string ReplenishmentJournalIdempotencyKey(Guid externalTransactionId) =>
        $"journal:tenant-contribution-replenishment:{externalTransactionId:D}:v1";

    private sealed record CoverageTarget(
        Guid PaymentInstructionId,
        MonthlyObligationComponentKind Kind,
        string BeneficiaryId,
        decimal AmountRial,
        PaymentInstructionStatus PaymentStatus);

    private sealed record LostFundReturnAccrualBinding(
        LostFundReturnRow Row,
        LostFundReturnAccrual Accrual);

    private sealed record ContributionLedgerAccounts(
        LedgerAccountRow FundAsset,
        LedgerAccountRow TenantBalance);
}
