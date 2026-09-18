using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Charkhoone.Application.Payments;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Infrastructure.Payments;

public sealed class EfTenantArrearsRepaymentService(
    CharkhooneDbContext dbContext,
    IExternalTenantArrearsRepaymentAdapter repaymentAdapter,
    ITenantContributionCoverageService coverageService)
    : ITenantArrearsRepaymentService
{
    private const string AggregateType = "LeaseContract";
    private const string OperationType = "tenant_contribution_replenishment";

    public async Task<ReconcileTenantArrearsRepaymentResult> ReconcileAsync(
        Guid contractId,
        Guid requestingUserId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default)
    {
        if (contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract id is required.", nameof(contractId));
        }

        if (requestingUserId == Guid.Empty)
        {
            throw new ArgumentException("Requesting user id is required.", nameof(requestingUserId));
        }

        ExternalTransactionRow externalTransaction;
        ArrearsQuote quote;

        await using (var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken))
        {
            var contract = await dbContext.LeaseContracts
                .FromSqlInterpolated($"SELECT * FROM lease_contracts WHERE \"Id\" = {contractId} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);

            if (contract is null || contract.TenantUserId != requestingUserId)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Empty(ReconcileTenantArrearsRepaymentOutcome.NotFound);
            }

            var delinquency = await dbContext.ContractDelinquencies
                .SingleOrDefaultAsync(x => x.ContractId == contract.Id, cancellationToken);
            var hasContribution = await dbContext.TenantContributions
                .AnyAsync(x => x.ContractId == contract.Id, cancellationToken);

            if (contract.Status != LeaseContractStatus.Active
                || delinquency?.CancellationRequired == true
                || !hasContribution)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Empty(ReconcileTenantArrearsRepaymentOutcome.InvalidState);
            }

            var quoteResult = await BuildQuoteAsync(contract.Id, occurredAtUtc, cancellationToken);
            if (!quoteResult.IsValid)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Empty(ReconcileTenantArrearsRepaymentOutcome.InvalidState);
            }

            if (quoteResult.Quote is null)
            {
                var lastPosted = await (
                    from replenishment in dbContext.TenantContributionReplenishments.AsNoTracking()
                    join external in dbContext.ExternalTransactions.AsNoTracking()
                        on replenishment.ExternalTransactionId equals external.Id
                    where replenishment.ContractId == contract.Id
                        && external.AggregateType == AggregateType
                        && external.AggregateId == contract.Id
                        && external.OperationType == OperationType
                        && external.Status == ExternalTransactionStatus.Succeeded
                    orderby replenishment.ReplenishedAtUtc descending, replenishment.Id descending
                    select new { replenishment, external })
                    .FirstOrDefaultAsync(cancellationToken);

                await transaction.RollbackAsync(cancellationToken);

                if (lastPosted is null)
                {
                    return Empty(ReconcileTenantArrearsRepaymentOutcome.NoArrears);
                }

                return new ReconcileTenantArrearsRepaymentResult(
                    ReconcileTenantArrearsRepaymentOutcome.AlreadyReconciled,
                    ToSucceededView(lastPosted.external, lastPosted.replenishment),
                    ToReplenishmentView(lastPosted.replenishment));
            }

            quote = quoteResult.Quote;

            var unposted = await dbContext.ExternalTransactions
                .Where(x => x.AggregateType == AggregateType
                    && x.AggregateId == contract.Id
                    && x.OperationType == OperationType
                    && (x.Status == ExternalTransactionStatus.Pending
                        || x.Status == ExternalTransactionStatus.Unknown
                        || x.Status == ExternalTransactionStatus.Succeeded))
                .Where(x => !dbContext.TenantContributionReplenishments.Any(replenishment =>
                    replenishment.ExternalTransactionId == x.Id))
                .OrderByDescending(x => x.CreatedAtUtc)
                .ThenByDescending(x => x.Id)
                .Take(2)
                .ToListAsync(cancellationToken);

            if (unposted.Count > 1)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Empty(ReconcileTenantArrearsRepaymentOutcome.InvalidState);
            }

            externalTransaction = unposted.SingleOrDefault()!;
            if (externalTransaction is not null)
            {
                if (externalTransaction.Currency != "IRR"
                    || externalTransaction.AmountRial <= 0m
                    || string.IsNullOrWhiteSpace(externalTransaction.IdempotencyKey))
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return Empty(ReconcileTenantArrearsRepaymentOutcome.InvalidState);
                }

                if (externalTransaction.Status == ExternalTransactionStatus.Succeeded)
                {
                    var externalId = externalTransaction.Id;
                    await transaction.RollbackAsync(cancellationToken);
                    return await FinalizeSucceededAsync(externalId, occurredAtUtc, cancellationToken);
                }

                externalTransaction.AmountRial = quote.TotalRial;
                externalTransaction.Status = ExternalTransactionStatus.Pending;
                externalTransaction.UpdatedAtUtc = occurredAtUtc;
            }
            else
            {
                var idempotencyKey = BuildIdempotencyKey(contract.Id, quote.Fingerprint);
                externalTransaction = await dbContext.ExternalTransactions
                    .SingleOrDefaultAsync(x => x.IdempotencyKey == idempotencyKey, cancellationToken)
                    ?? null!;

                if (externalTransaction is not null)
                {
                    if (externalTransaction.AggregateType != AggregateType
                        || externalTransaction.AggregateId != contract.Id
                        || externalTransaction.OperationType != OperationType
                        || externalTransaction.Currency != "IRR")
                    {
                        await transaction.RollbackAsync(cancellationToken);
                        return Empty(ReconcileTenantArrearsRepaymentOutcome.InvalidState);
                    }

                    if (externalTransaction.Status == ExternalTransactionStatus.Failed)
                    {
                        var failedView = ToView(externalTransaction, quote, occurredAtUtc);
                        await transaction.RollbackAsync(cancellationToken);
                        return new ReconcileTenantArrearsRepaymentResult(
                            ReconcileTenantArrearsRepaymentOutcome.Failed,
                            failedView,
                            null);
                    }

                    if (externalTransaction.Status == ExternalTransactionStatus.Succeeded)
                    {
                        var externalId = externalTransaction.Id;
                        await transaction.RollbackAsync(cancellationToken);
                        return await FinalizeSucceededAsync(externalId, occurredAtUtc, cancellationToken);
                    }

                    externalTransaction.AmountRial = quote.TotalRial;
                    externalTransaction.Status = ExternalTransactionStatus.Pending;
                    externalTransaction.UpdatedAtUtc = occurredAtUtc;
                }
                else
                {
                    externalTransaction = new ExternalTransactionRow
                    {
                        Id = Guid.NewGuid(),
                        Provider = repaymentAdapter.Provider,
                        OperationType = OperationType,
                        AggregateType = AggregateType,
                        AggregateId = contract.Id,
                        Status = ExternalTransactionStatus.Pending,
                        AmountRial = quote.TotalRial,
                        Currency = "IRR",
                        IdempotencyKey = idempotencyKey,
                        CreatedAtUtc = occurredAtUtc,
                        UpdatedAtUtc = occurredAtUtc,
                    };
                    dbContext.ExternalTransactions.Add(externalTransaction);

                    AddAudit(
                        contract.Id,
                        "system:tenant-arrears-repayment",
                        "tenant_arrears_repayment_started",
                        "A tenant arrears repayment attempt was opened for the full outstanding covered principal plus the current simple Lost Fund Return quote.",
                        occurredAtUtc);
                    AddOutbox("tenant-arrears-repayment.started.v1", occurredAtUtc, new
                    {
                        contractId = contract.Id,
                        externalTransactionId = externalTransaction.Id,
                        principalRial = quote.PrincipalRial,
                        quotedLostFundReturnRial = quote.LostFundReturnRial,
                        quotedTotalRial = quote.TotalRial,
                        quoteAtUtc = occurredAtUtc,
                        externalTransaction.IdempotencyKey,
                    });
                }
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }

        var response = await repaymentAdapter.EnsureOrQueryAsync(
            new ExternalTenantArrearsRepaymentRequest(
                externalTransaction.Id,
                contractId,
                requestingUserId,
                quote.PrincipalRial,
                quote.LostFundReturnRial,
                quote.TotalRial,
                occurredAtUtc,
                externalTransaction.IdempotencyKey),
            cancellationToken);

        ArrearsQuote? confirmedQuote = null;

        await using (var resultTransaction = await dbContext.Database.BeginTransactionAsync(cancellationToken))
        {
            var lockedExternal = await dbContext.ExternalTransactions
                .FromSqlInterpolated($"SELECT * FROM external_transactions WHERE \"Id\" = {externalTransaction.Id} FOR UPDATE")
                .SingleAsync(cancellationToken);
            var lockedContract = await dbContext.LeaseContracts
                .FromSqlInterpolated($"SELECT * FROM lease_contracts WHERE \"Id\" = {contractId} FOR UPDATE")
                .SingleAsync(cancellationToken);
            var delinquency = await dbContext.ContractDelinquencies
                .SingleOrDefaultAsync(x => x.ContractId == contractId, cancellationToken);

            if (lockedContract.TenantUserId != requestingUserId
                || lockedContract.Status != LeaseContractStatus.Active
                || delinquency?.CancellationRequired == true
                || lockedExternal.AggregateType != AggregateType
                || lockedExternal.AggregateId != contractId
                || lockedExternal.OperationType != OperationType
                || lockedExternal.Status is not (ExternalTransactionStatus.Pending or ExternalTransactionStatus.Unknown))
            {
                await resultTransaction.RollbackAsync(cancellationToken);
                return Empty(ReconcileTenantArrearsRepaymentOutcome.InvalidState);
            }

            lockedExternal.Provider = string.IsNullOrWhiteSpace(response.Provider)
                ? repaymentAdapter.Provider
                : response.Provider.Trim();
            lockedExternal.ExternalReference = response.ExternalReference;
            lockedExternal.ReasonCode = response.ReasonCode;

            if (response.Status == ExternalTenantArrearsRepaymentStatus.Failed)
            {
                lockedExternal.Status = ExternalTransactionStatus.Failed;
                lockedExternal.UpdatedAtUtc = occurredAtUtc;

                AddAudit(
                    contractId,
                    $"payment:{lockedExternal.Provider}",
                    "tenant_arrears_repayment_failed",
                    "The external repayment provider returned a definitive failure. No tenant contribution or Lost Fund Return was posted.",
                    occurredAtUtc);

                await dbContext.SaveChangesAsync(cancellationToken);
                await resultTransaction.CommitAsync(cancellationToken);

                return new ReconcileTenantArrearsRepaymentResult(
                    ReconcileTenantArrearsRepaymentOutcome.Failed,
                    ToView(lockedExternal, quote, occurredAtUtc),
                    null);
            }

            var succeededAtUtc = response.SucceededAtUtc;
            var hasBasicConfirmation =
                response.Status == ExternalTenantArrearsRepaymentStatus.Confirmed
                && response.ConfirmedAmountRial is > 0m
                && !string.IsNullOrWhiteSpace(response.ExternalReference)
                && succeededAtUtc is not null
                && succeededAtUtc.Value >= lockedExternal.CreatedAtUtc
                && succeededAtUtc.Value <= occurredAtUtc;

            if (hasBasicConfirmation)
            {
                var confirmedQuoteResult = await BuildQuoteAsync(
                    contractId,
                    succeededAtUtc!.Value,
                    cancellationToken);

                if (confirmedQuoteResult.IsValid)
                {
                    confirmedQuote = confirmedQuoteResult.Quote;
                }
            }

            var exactConfirmation = hasBasicConfirmation
                && confirmedQuote is not null
                && response.ConfirmedAmountRial == confirmedQuote.TotalRial;

            if (!exactConfirmation)
            {
                lockedExternal.Status = ExternalTransactionStatus.Unknown;
                lockedExternal.UpdatedAtUtc = occurredAtUtc;
                lockedExternal.ReasonCode ??=
                    response.Status == ExternalTenantArrearsRepaymentStatus.Confirmed
                        ? "tenant_arrears_repayment_confirmation_mismatch"
                        : "tenant_arrears_repayment_indeterminate";

                AddAudit(
                    contractId,
                    $"payment:{lockedExternal.Provider}",
                    "tenant_arrears_repayment_indeterminate",
                    "Repayment was not proven with an exact amount, nonblank external reference, and valid successful timestamp. No financial posting was made.",
                    occurredAtUtc);

                await dbContext.SaveChangesAsync(cancellationToken);
                await resultTransaction.CommitAsync(cancellationToken);

                return new ReconcileTenantArrearsRepaymentResult(
                    ReconcileTenantArrearsRepaymentOutcome.Indeterminate,
                    ToView(lockedExternal, quote, occurredAtUtc),
                    null);
            }

            lockedExternal.Status = ExternalTransactionStatus.Succeeded;
            lockedExternal.AmountRial = confirmedQuote!.TotalRial;
            lockedExternal.ExternalReference = response.ExternalReference!.Trim();
            lockedExternal.ReasonCode = null;
            lockedExternal.UpdatedAtUtc = succeededAtUtc!.Value;

            AddAudit(
                contractId,
                $"payment:{lockedExternal.Provider}",
                "tenant_arrears_repayment_confirmed",
                "The external repayment was confirmed for the exact full outstanding principal plus simple Lost Fund Return at the provider-reported successful timestamp.",
                occurredAtUtc);
            AddOutbox("tenant-arrears-repayment.confirmed.v1", occurredAtUtc, new
            {
                contractId,
                externalTransactionId = lockedExternal.Id,
                principalRial = confirmedQuote.PrincipalRial,
                lostFundReturnRial = confirmedQuote.LostFundReturnRial,
                totalRepaymentRial = confirmedQuote.TotalRial,
                externalReference = lockedExternal.ExternalReference,
                succeededAtUtc = lockedExternal.UpdatedAtUtc,
                lostFundReturnPolicy = LostFundReturnTerms.CalculationPolicyVersion,
                occurredAtUtc,
            });

            await dbContext.SaveChangesAsync(cancellationToken);
            await resultTransaction.CommitAsync(cancellationToken);
        }

        return await FinalizeSucceededAsync(
            externalTransaction.Id,
            occurredAtUtc,
            cancellationToken);
    }

    private async Task<ReconcileTenantArrearsRepaymentResult> FinalizeSucceededAsync(
        Guid externalTransactionId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken)
    {
        var posting = await coverageService.PostConfirmedReplenishmentAsync(
            externalTransactionId,
            occurredAtUtc,
            cancellationToken);

        if (posting.Outcome is not (
            PostConfirmedReplenishmentOutcome.Posted
            or PostConfirmedReplenishmentOutcome.AlreadyPosted))
        {
            return Empty(ReconcileTenantArrearsRepaymentOutcome.InvalidState);
        }

        var external = await dbContext.ExternalTransactions
            .AsNoTracking()
            .SingleAsync(x => x.Id == externalTransactionId, cancellationToken);
        var replenishment = posting.Replenishment!;

        return new ReconcileTenantArrearsRepaymentResult(
            posting.Outcome == PostConfirmedReplenishmentOutcome.Posted
                ? ReconcileTenantArrearsRepaymentOutcome.Reconciled
                : ReconcileTenantArrearsRepaymentOutcome.AlreadyReconciled,
            ToSucceededView(external, new TenantContributionReplenishmentRow
            {
                Id = replenishment.Id,
                ContractId = replenishment.ContractId,
                ExternalTransactionId = replenishment.ExternalTransactionId,
                JournalEntryId = replenishment.JournalEntryId,
                AmountRial = replenishment.AmountRial,
                RemainingTenantContributionRial = replenishment.RemainingTenantContributionRial,
                ExternalReference = replenishment.ExternalReference,
                ReplenishedAtUtc = replenishment.ReplenishedAtUtc,
            }),
            replenishment);
    }

    private async Task<QuoteBuildResult> BuildQuoteAsync(
        Guid contractId,
        DateTimeOffset quoteAtUtc,
        CancellationToken cancellationToken)
    {
        var coveredItems = await (
            from coverage in dbContext.CoveragePayments.AsNoTracking()
            join obligation in dbContext.MonthlyObligations.AsNoTracking()
                on coverage.MonthlyObligationId equals obligation.Id
            where coverage.ContractId == contractId
                && coverage.Status == CoveragePaymentStatus.Succeeded
            orderby obligation.ContractMonthNumber, coverage.Kind, coverage.Id
            select new TenantArrearsItem(
                coverage.Id,
                obligation.ContractMonthNumber,
                (int)coverage.Kind,
                coverage.AmountRial))
            .ToListAsync(cancellationToken);

        var previouslyReplenishedRial = await dbContext.TenantContributionReplenishments
            .AsNoTracking()
            .Where(x => x.ContractId == contractId)
            .SumAsync(x => (decimal?)x.AmountRial, cancellationToken) ?? 0m;

        TenantArrearsSnapshot snapshot;
        try
        {
            snapshot = TenantArrearsPolicy.CalculateOutstanding(
                coveredItems,
                previouslyReplenishedRial);
        }
        catch (Exception exception) when (exception is ArgumentException or InvalidOperationException)
        {
            return QuoteBuildResult.Invalid;
        }

        if (snapshot.OutstandingRial <= 0m)
        {
            return new QuoteBuildResult(true, null);
        }

        var outstandingIds = snapshot.OutstandingOldestFirst
            .Select(x => x.ReferenceId)
            .ToArray();
        var exposures = await dbContext.LostFundReturns
            .AsNoTracking()
            .Where(x => x.ContractId == contractId
                && outstandingIds.Contains(x.CoveragePaymentId))
            .ToListAsync(cancellationToken);

        if (exposures.Count != outstandingIds.Length)
        {
            return QuoteBuildResult.Invalid;
        }

        var byId = exposures.ToDictionary(x => x.CoveragePaymentId);
        decimal lostFundReturnRial = 0m;

        foreach (var outstanding in snapshot.OutstandingOldestFirst)
        {
            if (!byId.TryGetValue(outstanding.ReferenceId, out var row)
                || row.WithdrawnAmountRial != outstanding.AmountRial
                || row.MonthlyRate != LostFundReturnTerms.MonthlyRate
                || row.CalculatedReturnRial is not null
                || row.CalculationPeriodEndUtc is not null
                || row.ReplacedAtUtc is not null)
            {
                return QuoteBuildResult.Invalid;
            }

            try
            {
                var exposure = LostFundReturnTerms.OpenExposure(
                    contractId,
                    row.CoveragePaymentId,
                    row.WithdrawnAmountRial,
                    row.WithdrawnAtUtc);
                lostFundReturnRial += LostFundReturnTerms
                    .CalculateAccruedReturn(exposure, quoteAtUtc)
                    .PayableReturn
                    .Rial;
            }
            catch (Exception exception) when (exception is ArgumentException or InvalidOperationException)
            {
                return QuoteBuildResult.Invalid;
            }
        }

        var fingerprintSource = string.Join(
            "|",
            snapshot.OutstandingOldestFirst.Select(x =>
                $"{x.ContractMonthNumber}:{x.ComponentOrder}:{x.ReferenceId:D}:{x.AmountRial}"));
        var fingerprint = Convert.ToHexString(
                SHA256.HashData(Encoding.UTF8.GetBytes(fingerprintSource)))
            .ToLowerInvariant();

        return new QuoteBuildResult(
            true,
            new ArrearsQuote(
                snapshot.OutstandingRial,
                lostFundReturnRial,
                checked(snapshot.OutstandingRial + lostFundReturnRial),
                fingerprint));
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
            AggregateType = AggregateType,
            AggregateId = contractId,
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

    private static TenantArrearsRepaymentView ToView(
        ExternalTransactionRow external,
        ArrearsQuote quote,
        DateTimeOffset quoteAtUtc) =>
        new(
            external.AggregateId,
            external.Id,
            external.Status,
            quote.PrincipalRial,
            quote.LostFundReturnRial,
            quote.TotalRial,
            external.Provider,
            external.ExternalReference,
            quoteAtUtc,
            external.Status == ExternalTransactionStatus.Succeeded
                ? external.UpdatedAtUtc
                : null);

    private static TenantArrearsRepaymentView ToSucceededView(
        ExternalTransactionRow external,
        TenantContributionReplenishmentRow replenishment) =>
        new(
            external.AggregateId,
            external.Id,
            external.Status,
            replenishment.AmountRial,
            external.AmountRial - replenishment.AmountRial,
            external.AmountRial,
            external.Provider,
            external.ExternalReference,
            external.UpdatedAtUtc,
            external.UpdatedAtUtc);

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

    private static ReconcileTenantArrearsRepaymentResult Empty(
        ReconcileTenantArrearsRepaymentOutcome outcome) =>
        new(outcome, null, null);

    private static string BuildIdempotencyKey(Guid contractId, string fingerprint) =>
        $"tenant-arrears-repayment:{contractId:D}:{fingerprint}:v1";

    private sealed record ArrearsQuote(
        decimal PrincipalRial,
        decimal LostFundReturnRial,
        decimal TotalRial,
        string Fingerprint);

    private sealed record QuoteBuildResult(bool IsValid, ArrearsQuote? Quote)
    {
        public static QuoteBuildResult Invalid { get; } = new(false, null);
    }
}
