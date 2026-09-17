using Charkhoone.Application.Payments;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Observability;
using Charkhoone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Worker;

public sealed class FinancialReconciliationWorker(
    IServiceScopeFactory scopeFactory,
    FinancialReconciliationWorkerOptions options,
    TimeProvider timeProvider,
    ILogger<FinancialReconciliationWorker> logger) : BackgroundService
{
    private const string PaymentReconciliationOperationType = "payment_reconciliation";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!options.Enabled)
        {
            logger.LogInformation("Financial reconciliation worker is disabled.");
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var result = await ReconcileOnceAsync(stoppingToken);
                logger.LogInformation(
                    "Financial reconciliation batch completed: {Payments} payments, {Coverage} coverage obligations, {Cancellations} cancellation settlements, {NormalSettlements} normal settlements.",
                    result.PaymentCandidates,
                    result.CoverageCandidates,
                    result.CancellationCandidates,
                    result.NormalSettlementCandidates);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Financial reconciliation batch failed; polling will continue.");
            }

            try
            {
                await Task.Delay(options.PollInterval, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }

    public async Task<FinancialReconciliationBatchResult> ReconcileOnceAsync(
        CancellationToken cancellationToken = default)
    {
        using var activity = CharkhooneTelemetry.StartWorkerActivity("financial-reconciliation.batch");
        await using var scope = scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
        var occurredAtUtc = timeProvider.GetUtcNow();

        var paymentCandidates = await (
                from payment in dbContext.PaymentInstructions.AsNoTracking()
                join obligation in dbContext.MonthlyObligations.AsNoTracking()
                    on payment.ObligationId equals obligation.Id
                join contract in dbContext.LeaseContracts.AsNoTracking()
                    on obligation.ContractId equals contract.Id
                join external in dbContext.ExternalTransactions.AsNoTracking()
                    on payment.Id equals external.AggregateId
                where external.AggregateType == "PaymentInstruction"
                    && external.OperationType == PaymentReconciliationOperationType
                    && (external.Status == ExternalTransactionStatus.Pending
                        || external.Status == ExternalTransactionStatus.Unknown)
                    && (payment.Status == PaymentInstructionStatus.Pending
                        || payment.Status == PaymentInstructionStatus.Unknown
                        || payment.Status == PaymentInstructionStatus.ReconciliationRequired)
                orderby external.UpdatedAtUtc, external.Id
                select new PaymentCandidate(payment.Id, contract.TenantUserId))
            .Take(options.BatchSize)
            .ToListAsync(cancellationToken);

        var coverageCandidates = await dbContext.MonthlyObligations
            .AsNoTracking()
            .Where(x => x.Status == MonthlyObligationStatus.Missed)
            .Where(x => !dbContext.CoveragePayments.Any(coverage =>
                coverage.MonthlyObligationId == x.Id
                && coverage.Status == CoveragePaymentStatus.Failed))
            .OrderBy(x => x.DueAtUtc)
            .ThenBy(x => x.Id)
            .Select(x => x.Id)
            .Take(options.BatchSize)
            .ToListAsync(cancellationToken);

        var cancellationCandidates = await dbContext.LeaseContracts
            .AsNoTracking()
            .Where(x => x.Status == LeaseContractStatus.CancellationPending)
            .Where(x => !dbContext.CancellationSettlements.Any(settlement =>
                settlement.ContractId == x.Id
                && settlement.Status == CancellationSettlementStatus.Failed))
            .OrderBy(x => x.UpdatedAtUtc)
            .ThenBy(x => x.Id)
            .Select(x => x.Id)
            .Take(options.BatchSize)
            .ToListAsync(cancellationToken);

        var normalSettlementCandidates = await dbContext.LeaseContracts
            .AsNoTracking()
            .Where(x => x.Status == LeaseContractStatus.SettlementPending)
            .Where(x => !dbContext.NormalSettlements.Any(settlement =>
                settlement.ContractId == x.Id
                && (settlement.BankPrincipalStatus == NormalSettlementTransferStatus.Failed
                    || settlement.TenantResidualStatus == NormalSettlementTransferStatus.Failed)))
            .OrderBy(x => x.UpdatedAtUtc)
            .ThenBy(x => x.Id)
            .Select(x => x.Id)
            .Take(options.BatchSize)
            .ToListAsync(cancellationToken);

        var paymentService = scope.ServiceProvider.GetRequiredService<IPaymentReconciliationService>();
        foreach (var candidate in paymentCandidates)
        {
            await RunCandidateAsync(
                "payment",
                candidate.PaymentInstructionId,
                () => paymentService.ReconcileAsync(
                    candidate.PaymentInstructionId,
                    candidate.TenantUserId,
                    occurredAtUtc,
                    cancellationToken));
        }

        var coverageService = scope.ServiceProvider.GetRequiredService<ITenantContributionCoverageService>();
        foreach (var obligationId in coverageCandidates)
        {
            await RunCandidateAsync(
                "coverage",
                obligationId,
                () => coverageService.CoverAsync(obligationId, occurredAtUtc, cancellationToken));
        }

        var cancellationService = scope.ServiceProvider.GetRequiredService<ICancellationSettlementService>();
        foreach (var contractId in cancellationCandidates)
        {
            await RunCandidateAsync(
                "cancellation-settlement",
                contractId,
                () => cancellationService.SettleAsync(contractId, occurredAtUtc, cancellationToken));
        }

        var normalSettlementService = scope.ServiceProvider.GetRequiredService<INormalSettlementService>();
        foreach (var contractId in normalSettlementCandidates)
        {
            await RunCandidateAsync(
                "normal-settlement",
                contractId,
                () => normalSettlementService.SettleAsync(contractId, occurredAtUtc, cancellationToken));
        }

        activity?.SetTag("charkhoone.reconciliation.payment_candidates", paymentCandidates.Count);
        activity?.SetTag("charkhoone.reconciliation.coverage_candidates", coverageCandidates.Count);
        activity?.SetTag("charkhoone.reconciliation.cancellation_candidates", cancellationCandidates.Count);
        activity?.SetTag("charkhoone.reconciliation.normal_settlement_candidates", normalSettlementCandidates.Count);

        return new FinancialReconciliationBatchResult(
            paymentCandidates.Count,
            coverageCandidates.Count,
            cancellationCandidates.Count,
            normalSettlementCandidates.Count);
    }

    private async Task RunCandidateAsync<T>(
        string operation,
        Guid aggregateId,
        Func<Task<T>> action)
    {
        using var activity = CharkhooneTelemetry.StartWorkerActivity($"financial-reconciliation.{operation}");
        activity?.SetTag("charkhoone.aggregate_id", aggregateId.ToString("D"));

        try
        {
            _ = await action();
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception exception)
        {
            activity?.SetStatus(System.Diagnostics.ActivityStatusCode.Error, "reconciliation_candidate_failed");
            logger.LogWarning(
                exception,
                "Financial reconciliation candidate {Operation} {AggregateId} failed; it remains queryable for a later pass.",
                operation,
                aggregateId);
        }
    }

    private sealed record PaymentCandidate(Guid PaymentInstructionId, Guid TenantUserId);
}

public sealed record FinancialReconciliationBatchResult(
    int PaymentCandidates,
    int CoverageCandidates,
    int CancellationCandidates,
    int NormalSettlementCandidates);
