using Charkhoone.Application.Payments;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Observability;
using Charkhoone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Worker;

/// <summary>
/// Periodically queries financial operations that are already pending or unknown.
/// It never converts an indeterminate result into success, never retries terminal failures,
/// and never creates a new business obligation. All external interaction remains delegated
/// to the existing idempotent/query-capable application services.
/// </summary>
public sealed class FinancialReconciliationWorker(
    IServiceScopeFactory scopeFactory,
    FinancialReconciliationWorkerOptions options,
    ILogger<FinancialReconciliationWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!options.Enabled)
        {
            logger.LogInformation("Financial reconciliation worker is disabled.");
            return;
        }

        logger.LogInformation(
            "Financial reconciliation worker started with batch size {BatchSize}.",
            options.BatchSize);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var activity = CharkhooneTelemetry.StartWorkerActivity("financial-reconciliation.cycle");
                await RunCycleAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Financial reconciliation cycle failed; it will be retried later.");
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

    private async Task RunCycleAsync(CancellationToken cancellationToken)
    {
        ReconciliationBatch batch;
        await using (var discoveryScope = scopeFactory.CreateAsyncScope())
        {
            var dbContext = discoveryScope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
            batch = await DiscoverAsync(dbContext, cancellationToken);
        }

        foreach (var payment in batch.Payments)
        {
            await ReconcilePaymentAsync(payment, cancellationToken);
        }

        foreach (var monthlyObligationId in batch.CoverageObligations)
        {
            await ReconcileCoverageAsync(monthlyObligationId, cancellationToken);
        }

        foreach (var contractId in batch.CancellationContracts)
        {
            await ReconcileCancellationSettlementAsync(contractId, cancellationToken);
        }

        foreach (var contractId in batch.NormalSettlementContracts)
        {
            await ReconcileNormalSettlementAsync(contractId, cancellationToken);
        }
    }

    private async Task<ReconciliationBatch> DiscoverAsync(
        CharkhooneDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var payments = await (
                from instruction in dbContext.PaymentInstructions.AsNoTracking()
                join obligation in dbContext.MonthlyObligations.AsNoTracking()
                    on instruction.ObligationId equals obligation.Id
                join contract in dbContext.LeaseContracts.AsNoTracking()
                    on obligation.ContractId equals contract.Id
                where instruction.Status == PaymentInstructionStatus.Pending
                    || instruction.Status == PaymentInstructionStatus.Unknown
                    || instruction.Status == PaymentInstructionStatus.ReconciliationRequired
                orderby instruction.UpdatedAtUtc, instruction.Id
                select new PaymentCandidate(instruction.Id, contract.TenantUserId))
            .Take(options.BatchSize)
            .ToListAsync(cancellationToken);

        var coverageObligations = await dbContext.CoveragePayments
            .AsNoTracking()
            .Where(x => x.Status == CoveragePaymentStatus.Pending || x.Status == CoveragePaymentStatus.Unknown)
            .OrderBy(x => x.UpdatedAtUtc)
            .Select(x => x.MonthlyObligationId)
            .Distinct()
            .Take(options.BatchSize)
            .ToListAsync(cancellationToken);

        var cancellationContracts = await dbContext.CancellationSettlements
            .AsNoTracking()
            .Where(x => x.Status == CancellationSettlementStatus.Pending || x.Status == CancellationSettlementStatus.Unknown)
            .OrderBy(x => x.UpdatedAtUtc)
            .Select(x => x.ContractId)
            .Take(options.BatchSize)
            .ToListAsync(cancellationToken);

        var normalSettlementContracts = await dbContext.NormalSettlements
            .AsNoTracking()
            .Where(x =>
                x.BankPrincipalStatus == NormalSettlementTransferStatus.Pending
                || x.BankPrincipalStatus == NormalSettlementTransferStatus.Unknown
                || x.TenantResidualStatus == NormalSettlementTransferStatus.Pending
                || x.TenantResidualStatus == NormalSettlementTransferStatus.Unknown)
            .OrderBy(x => x.UpdatedAtUtc)
            .Select(x => x.ContractId)
            .Take(options.BatchSize)
            .ToListAsync(cancellationToken);

        return new ReconciliationBatch(
            payments,
            coverageObligations,
            cancellationContracts,
            normalSettlementContracts);
    }

    private async Task ReconcilePaymentAsync(
        PaymentCandidate candidate,
        CancellationToken cancellationToken)
    {
        try
        {
            using var activity = CharkhooneTelemetry.StartWorkerActivity("financial-reconciliation.payment");
            activity?.SetTag("reconciliation.kind", "payment");

            await using var scope = scopeFactory.CreateAsyncScope();
            var service = scope.ServiceProvider.GetRequiredService<IPaymentReconciliationService>();

            // The service requires the tenant id for its ownership boundary. The worker derives that id
            // from the persisted contract relationship; it is never supplied by an external caller.
            var result = await service.ReconcileAsync(
                candidate.PaymentInstructionId,
                candidate.TenantUserId,
                DateTimeOffset.UtcNow,
                cancellationToken);

            activity?.SetTag("reconciliation.outcome", result.Outcome.ToString());
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Payment reconciliation attempt failed; the item remains queryable.");
        }
    }

    private async Task ReconcileCoverageAsync(Guid monthlyObligationId, CancellationToken cancellationToken)
    {
        try
        {
            using var activity = CharkhooneTelemetry.StartWorkerActivity("financial-reconciliation.coverage");
            activity?.SetTag("reconciliation.kind", "coverage");

            await using var scope = scopeFactory.CreateAsyncScope();
            var service = scope.ServiceProvider.GetRequiredService<ITenantContributionCoverageService>();
            var result = await service.CoverAsync(monthlyObligationId, DateTimeOffset.UtcNow, cancellationToken);
            activity?.SetTag("reconciliation.outcome", result.Outcome.ToString());
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Coverage reconciliation attempt failed; the item remains queryable.");
        }
    }

    private async Task ReconcileCancellationSettlementAsync(Guid contractId, CancellationToken cancellationToken)
    {
        try
        {
            using var activity = CharkhooneTelemetry.StartWorkerActivity("financial-reconciliation.cancellation-settlement");
            activity?.SetTag("reconciliation.kind", "cancellation-settlement");

            await using var scope = scopeFactory.CreateAsyncScope();
            var service = scope.ServiceProvider.GetRequiredService<ICancellationSettlementService>();
            var result = await service.SettleAsync(contractId, DateTimeOffset.UtcNow, cancellationToken);
            activity?.SetTag("reconciliation.outcome", result.Outcome.ToString());
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Cancellation-settlement reconciliation failed; the item remains queryable.");
        }
    }

    private async Task ReconcileNormalSettlementAsync(Guid contractId, CancellationToken cancellationToken)
    {
        try
        {
            using var activity = CharkhooneTelemetry.StartWorkerActivity("financial-reconciliation.normal-settlement");
            activity?.SetTag("reconciliation.kind", "normal-settlement");

            await using var scope = scopeFactory.CreateAsyncScope();
            var service = scope.ServiceProvider.GetRequiredService<INormalSettlementService>();
            var result = await service.SettleAsync(contractId, DateTimeOffset.UtcNow, cancellationToken);
            activity?.SetTag("reconciliation.outcome", result.Outcome.ToString());
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Normal-settlement reconciliation failed; the item remains queryable.");
        }
    }

    private sealed record PaymentCandidate(Guid PaymentInstructionId, Guid TenantUserId);

    private sealed record ReconciliationBatch(
        IReadOnlyList<PaymentCandidate> Payments,
        IReadOnlyList<Guid> CoverageObligations,
        IReadOnlyList<Guid> CancellationContracts,
        IReadOnlyList<Guid> NormalSettlementContracts);
}
