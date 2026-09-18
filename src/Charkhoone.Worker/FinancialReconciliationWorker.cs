using Charkhoone.Application.Contracts;
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
    private const string TenantContributionReplenishmentOperationType = "tenant_contribution_replenishment";
    private const string CancellationBankPrincipalOperationType = "cancellation_bank_principal_return";

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
                    "Financial reconciliation batch completed: {LeaseFunding} lease funding lifecycles, {ScheduleProvisioning} monthly schedule provisions, {Payments} payment reconciliations, {DueLifecycle} due monthly lifecycles, {Coverage} coverage obligations, {ArrearsRepayments} tenant arrears repayment reconciliations, {Replenishments} confirmed tenant arrears repayments, {Cancellations} cancellation settlements, {CancellationBankPrincipals} cancellation bank-principal returns, {NormalMaturities} normal maturities, {NormalSettlements} normal settlements.",
                    result.LeaseFundingCandidates,
                    result.ScheduleProvisioningCandidates,
                    result.PaymentCandidates,
                    result.DueLifecycleCandidates,
                    result.CoverageCandidates,
                    result.ArrearsRepaymentCandidates,
                    result.ReplenishmentCandidates,
                    result.CancellationCandidates,
                    result.CancellationBankPrincipalCandidates,
                    result.NormalMaturityCandidates,
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

        var leaseFundingCandidates = await dbContext.LeaseContracts
            .AsNoTracking()
            .Where(x => x.Status == LeaseContractStatus.Draft
                || x.Status == LeaseContractStatus.AwaitingFunding
                || x.Status == LeaseContractStatus.AwaitingCompletion)
            .Where(x => dbContext.FundingAllocations.Any(allocation =>
                allocation.ContractId == x.Id))
            .OrderBy(x => x.UpdatedAtUtc)
            .ThenBy(x => x.Id)
            .Select(x => x.Id)
            .Take(options.BatchSize)
            .ToListAsync(cancellationToken);

        var leaseFundingService = scope.ServiceProvider.GetRequiredService<ILeaseFundingLifecycleService>();
        foreach (var contractId in leaseFundingCandidates)
        {
            await RunCandidateAsync(
                "lease-funding-lifecycle",
                contractId,
                () => leaseFundingService.AdvanceAsync(contractId, occurredAtUtc, cancellationToken));
        }

        var scheduleProvisioningCandidates = await dbContext.LeaseContracts
            .AsNoTracking()
            .Where(x => x.Status == LeaseContractStatus.Active)
            .Where(x => dbContext.LeaseContractTerms.Any(terms =>
                terms.ContractId == x.Id))
            .Where(x => !dbContext.AuditEvents.Any(audit =>
                audit.AggregateType == "LeaseContract"
                && audit.AggregateId == x.Id
                && (audit.Action == "monthly_schedule_provisioned"
                    || audit.Action == "monthly_schedule_provisioning_conflict")))
            .OrderBy(x => x.UpdatedAtUtc)
            .ThenBy(x => x.Id)
            .Select(x => x.Id)
            .Take(options.BatchSize)
            .ToListAsync(cancellationToken);

        var scheduleProvisioningService = scope.ServiceProvider
            .GetRequiredService<IMonthlyScheduleProvisioningService>();
        foreach (var contractId in scheduleProvisioningCandidates)
        {
            await RunCandidateAsync(
                "monthly-schedule-provisioning",
                contractId,
                () => scheduleProvisioningService.ProvisionAsync(
                    contractId,
                    occurredAtUtc,
                    cancellationToken));
        }

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

        var dueLifecycleCandidates = await (
                from obligation in dbContext.MonthlyObligations.AsNoTracking()
                join contract in dbContext.LeaseContracts.AsNoTracking()
                    on obligation.ContractId equals contract.Id
                where obligation.Status == MonthlyObligationStatus.Open
                    && obligation.DueAtUtc <= occurredAtUtc
                    && contract.Status == LeaseContractStatus.Active
                orderby obligation.DueAtUtc, obligation.ContractMonthNumber, obligation.Id
                select obligation.Id)
            .Take(options.BatchSize)
            .ToListAsync(cancellationToken);

        var dueLifecycleService = scope.ServiceProvider.GetRequiredService<IMonthlyDueLifecycleService>();
        foreach (var obligationId in dueLifecycleCandidates)
        {
            await RunCandidateAsync(
                "monthly-due-lifecycle",
                obligationId,
                () => dueLifecycleService.ProcessAsync(
                    obligationId,
                    occurredAtUtc,
                    cancellationToken));
        }

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

        var coverageService = scope.ServiceProvider.GetRequiredService<ITenantContributionCoverageService>();
        foreach (var obligationId in coverageCandidates)
        {
            await RunCandidateAsync(
                "coverage",
                obligationId,
                () => coverageService.CoverAsync(obligationId, occurredAtUtc, cancellationToken));
        }

        var arrearsRepaymentCandidates = await (
                from external in dbContext.ExternalTransactions.AsNoTracking()
                join contract in dbContext.LeaseContracts.AsNoTracking()
                    on external.AggregateId equals contract.Id
                where external.AggregateType == "LeaseContract"
                    && external.OperationType == TenantContributionReplenishmentOperationType
                    && (external.Status == ExternalTransactionStatus.Pending
                        || external.Status == ExternalTransactionStatus.Unknown)
                    && contract.Status == LeaseContractStatus.Active
                    && !dbContext.ContractDelinquencies.Any(delinquency =>
                        delinquency.ContractId == contract.Id
                        && delinquency.CancellationRequired)
                orderby external.UpdatedAtUtc, external.Id
                select new ArrearsRepaymentCandidate(contract.Id, contract.TenantUserId))
            .Take(options.BatchSize)
            .ToListAsync(cancellationToken);

        if (arrearsRepaymentCandidates.Count > 0)
        {
            var arrearsRepaymentService = scope.ServiceProvider
                .GetRequiredService<ITenantArrearsRepaymentService>();
            foreach (var candidate in arrearsRepaymentCandidates)
            {
                await RunCandidateAsync(
                    "tenant-arrears-repayment-reconciliation",
                    candidate.ContractId,
                    () => arrearsRepaymentService.ReconcileAsync(
                        candidate.ContractId,
                        candidate.TenantUserId,
                        occurredAtUtc,
                        cancellationToken));
            }
        }

        var replenishmentCandidates = await dbContext.ExternalTransactions
            .AsNoTracking()
            .Where(x => x.AggregateType == "LeaseContract"
                && x.OperationType == TenantContributionReplenishmentOperationType
                && x.Status == ExternalTransactionStatus.Succeeded
                && x.AmountRial > 0m
                && x.Currency == "IRR"
                && x.ExternalReference != null
                && x.ExternalReference != "")
            .Where(x => dbContext.LeaseContracts.Any(contract =>
                contract.Id == x.AggregateId
                && contract.Status == LeaseContractStatus.Active))
            .Where(x => !dbContext.ContractDelinquencies.Any(delinquency =>
                delinquency.ContractId == x.AggregateId
                && delinquency.CancellationRequired))
            .Where(x => !dbContext.TenantContributionReplenishments.Any(replenishment =>
                replenishment.ExternalTransactionId == x.Id))
            .OrderBy(x => x.UpdatedAtUtc)
            .ThenBy(x => x.Id)
            .Select(x => x.Id)
            .Take(options.BatchSize)
            .ToListAsync(cancellationToken);

        foreach (var externalTransactionId in replenishmentCandidates)
        {
            await RunCandidateAsync(
                "tenant-arrears-repayment",
                externalTransactionId,
                () => coverageService.PostConfirmedReplenishmentAsync(
                    externalTransactionId,
                    occurredAtUtc,
                    cancellationToken));
        }

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

        var cancellationService = scope.ServiceProvider.GetRequiredService<ICancellationSettlementService>();
        foreach (var contractId in cancellationCandidates)
        {
            await RunCandidateAsync(
                "cancellation-settlement",
                contractId,
                () => cancellationService.SettleAsync(contractId, occurredAtUtc, cancellationToken));
        }

        var cancellationBankPrincipalCandidates = await dbContext.LeaseContracts
            .AsNoTracking()
            .Where(x => x.Status == LeaseContractStatus.Cancelled)
            .Where(x => dbContext.CancellationSettlements.Any(settlement =>
                settlement.ContractId == x.Id
                && settlement.Status == CancellationSettlementStatus.Completed
                && settlement.CompletedAtUtc != null))
            .Where(x => dbContext.FrozenPrincipals.Any(principal =>
                principal.ContractId == x.Id
                && principal.AmountRial > 0m))
            .Where(x => !dbContext.NormalSettlements.Any(settlement =>
                settlement.ContractId == x.Id))
            .Where(x => !dbContext.ExternalTransactions.Any(external =>
                external.AggregateType == "LeaseContract"
                && external.AggregateId == x.Id
                && external.OperationType == CancellationBankPrincipalOperationType
                && (external.Status == ExternalTransactionStatus.Succeeded
                    || external.Status == ExternalTransactionStatus.Failed)))
            .OrderBy(x => x.UpdatedAtUtc)
            .ThenBy(x => x.Id)
            .Select(x => x.Id)
            .Take(options.BatchSize)
            .ToListAsync(cancellationToken);

        var cancellationBankPrincipalService = scope.ServiceProvider
            .GetRequiredService<ICancellationBankPrincipalSettlementService>();
        foreach (var contractId in cancellationBankPrincipalCandidates)
        {
            await RunCandidateAsync(
                "cancellation-bank-principal",
                contractId,
                () => cancellationBankPrincipalService.SettleAsync(
                    contractId,
                    occurredAtUtc,
                    cancellationToken));
        }

        var normalMaturityCandidates = await dbContext.LeaseContracts
            .AsNoTracking()
            .Where(x => x.Status == LeaseContractStatus.Active)
            .Where(x => dbContext.MonthlyObligations.Any(obligation =>
                obligation.ContractId == x.Id
                && obligation.ContractMonthNumber == 12
                && obligation.ClosedAtUtc != null
                && obligation.DueAtUtc <= occurredAtUtc))
            .OrderBy(x => x.UpdatedAtUtc)
            .ThenBy(x => x.Id)
            .Select(x => x.Id)
            .Take(options.BatchSize)
            .ToListAsync(cancellationToken);

        var normalMaturityService = scope.ServiceProvider.GetRequiredService<INormalMaturityService>();
        foreach (var contractId in normalMaturityCandidates)
        {
            await RunCandidateAsync(
                "normal-maturity",
                contractId,
                () => normalMaturityService.PrepareAsync(contractId, occurredAtUtc, cancellationToken));
        }

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

        var normalSettlementService = scope.ServiceProvider.GetRequiredService<INormalSettlementService>();
        foreach (var contractId in normalSettlementCandidates)
        {
            await RunCandidateAsync(
                "normal-settlement",
                contractId,
                () => normalSettlementService.SettleAsync(contractId, occurredAtUtc, cancellationToken));
        }

        activity?.SetTag("charkhoone.reconciliation.lease_funding_candidates", leaseFundingCandidates.Count);
        activity?.SetTag(
            "charkhoone.reconciliation.schedule_provisioning_candidates",
            scheduleProvisioningCandidates.Count);
        activity?.SetTag("charkhoone.reconciliation.payment_candidates", paymentCandidates.Count);
        activity?.SetTag("charkhoone.reconciliation.due_lifecycle_candidates", dueLifecycleCandidates.Count);
        activity?.SetTag("charkhoone.reconciliation.coverage_candidates", coverageCandidates.Count);
        activity?.SetTag("charkhoone.reconciliation.arrears_repayment_candidates", arrearsRepaymentCandidates.Count);
        activity?.SetTag("charkhoone.reconciliation.replenishment_candidates", replenishmentCandidates.Count);
        activity?.SetTag("charkhoone.reconciliation.cancellation_candidates", cancellationCandidates.Count);
        activity?.SetTag(
            "charkhoone.reconciliation.cancellation_bank_principal_candidates",
            cancellationBankPrincipalCandidates.Count);
        activity?.SetTag("charkhoone.reconciliation.normal_maturity_candidates", normalMaturityCandidates.Count);
        activity?.SetTag("charkhoone.reconciliation.normal_settlement_candidates", normalSettlementCandidates.Count);

        return new FinancialReconciliationBatchResult(
            leaseFundingCandidates.Count,
            paymentCandidates.Count,
            coverageCandidates.Count,
            cancellationCandidates.Count,
            cancellationBankPrincipalCandidates.Count,
            normalMaturityCandidates.Count,
            normalSettlementCandidates.Count)
        {
            ScheduleProvisioningCandidates = scheduleProvisioningCandidates.Count,
            DueLifecycleCandidates = dueLifecycleCandidates.Count,
            ArrearsRepaymentCandidates = arrearsRepaymentCandidates.Count,
            ReplenishmentCandidates = replenishmentCandidates.Count,
        };
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
    private sealed record ArrearsRepaymentCandidate(Guid ContractId, Guid TenantUserId);
}

public sealed record FinancialReconciliationBatchResult(
    int LeaseFundingCandidates,
    int PaymentCandidates,
    int CoverageCandidates,
    int CancellationCandidates,
    int CancellationBankPrincipalCandidates,
    int NormalMaturityCandidates,
    int NormalSettlementCandidates)
{
    public int ScheduleProvisioningCandidates { get; init; }
    public int DueLifecycleCandidates { get; init; }
    public int ArrearsRepaymentCandidates { get; init; }
    public int ReplenishmentCandidates { get; init; }
}
