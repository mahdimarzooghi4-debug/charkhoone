using Charkhoone.Application.Payments;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Infrastructure.Payments;

public sealed class EfMonthlyDueLifecycleService(
    CharkhooneDbContext dbContext,
    IPaymentReconciliationService paymentReconciliationService,
    IMonthlyObligationService monthlyObligationService)
    : IMonthlyDueLifecycleService
{
    public async Task<ProcessMonthlyDueResult> ProcessAsync(
        Guid monthlyObligationId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default)
    {
        if (monthlyObligationId == Guid.Empty)
        {
            throw new ArgumentException(
                "Monthly obligation id is required.",
                nameof(monthlyObligationId));
        }

        var obligation = await dbContext.MonthlyObligations
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == monthlyObligationId, cancellationToken);
        if (obligation is null)
        {
            return Empty(ProcessMonthlyDueOutcome.NotFound, monthlyObligationId);
        }

        if (obligation.Status != MonthlyObligationStatus.Open)
        {
            return new ProcessMonthlyDueResult(
                ProcessMonthlyDueOutcome.AlreadyClosed,
                obligation.Id,
                0,
                await LoadViewAsync(obligation, cancellationToken));
        }

        if (occurredAtUtc < obligation.DueAtUtc)
        {
            return new ProcessMonthlyDueResult(
                ProcessMonthlyDueOutcome.NotDue,
                obligation.Id,
                0,
                await LoadViewAsync(obligation, cancellationToken));
        }

        var contract = await dbContext.LeaseContracts
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == obligation.ContractId, cancellationToken);
        if (contract is null)
        {
            return Empty(ProcessMonthlyDueOutcome.InvalidState, obligation.Id);
        }

        if (contract.Status != LeaseContractStatus.Active)
        {
            return new ProcessMonthlyDueResult(
                ProcessMonthlyDueOutcome.InvalidState,
                obligation.Id,
                0,
                await LoadViewAsync(obligation, cancellationToken));
        }

        var instructions = await (
                from component in dbContext.MonthlyObligationComponents.AsNoTracking()
                join payment in dbContext.PaymentInstructions.AsNoTracking()
                    on component.PaymentInstructionId equals payment.Id
                where component.MonthlyObligationId == obligation.Id
                orderby component.Kind, payment.Id
                select new
                {
                    payment.Id,
                    payment.Status,
                })
            .ToListAsync(cancellationToken);

        if (instructions.Count == 0)
        {
            return new ProcessMonthlyDueResult(
                ProcessMonthlyDueOutcome.InvalidState,
                obligation.Id,
                0,
                await LoadViewAsync(obligation, cancellationToken));
        }

        var reconciliationAttempts = 0;
        foreach (var instruction in instructions)
        {
            if (instruction.Status is not (
                PaymentInstructionStatus.Created
                or PaymentInstructionStatus.Pending
                or PaymentInstructionStatus.Unknown
                or PaymentInstructionStatus.ReconciliationRequired))
            {
                continue;
            }

            var reconciliation = await paymentReconciliationService.ReconcileAsync(
                instruction.Id,
                contract.TenantUserId,
                occurredAtUtc,
                cancellationToken);
            reconciliationAttempts++;

            if (reconciliation.Outcome == ReconcilePaymentOutcome.ArrearsOutstanding)
            {
                break;
            }

            if (reconciliation.Outcome is
                ReconcilePaymentOutcome.NotFound
                or ReconcilePaymentOutcome.InvalidState)
            {
                return new ProcessMonthlyDueResult(
                    ProcessMonthlyDueOutcome.InvalidState,
                    obligation.Id,
                    reconciliationAttempts,
                    await ReloadViewAsync(obligation.Id, cancellationToken));
            }
        }

        var close = await monthlyObligationService.CloseAsync(
            obligation.Id,
            occurredAtUtc,
            cancellationToken);

        var outcome = close.Outcome switch
        {
            CloseMonthlyObligationOutcome.Paid => ProcessMonthlyDueOutcome.Paid,
            CloseMonthlyObligationOutcome.Missed => ProcessMonthlyDueOutcome.Missed,
            CloseMonthlyObligationOutcome.AlreadyClosed
                when close.Obligation?.Status == MonthlyObligationStatus.Paid
                => ProcessMonthlyDueOutcome.Paid,
            CloseMonthlyObligationOutcome.AlreadyClosed
                => ProcessMonthlyDueOutcome.AlreadyClosed,
            CloseMonthlyObligationOutcome.ReconciliationRequired
                => ProcessMonthlyDueOutcome.ReconciliationRequired,
            CloseMonthlyObligationOutcome.NotFound
                => ProcessMonthlyDueOutcome.NotFound,
            CloseMonthlyObligationOutcome.InvalidState
                => ProcessMonthlyDueOutcome.InvalidState,
            _ => throw new InvalidOperationException(
                "Unsupported monthly-obligation close outcome."),
        };

        return new ProcessMonthlyDueResult(
            outcome,
            obligation.Id,
            reconciliationAttempts,
            close.Obligation);
    }

    private async Task<MonthlyObligationView?> ReloadViewAsync(
        Guid obligationId,
        CancellationToken cancellationToken)
    {
        dbContext.ChangeTracker.Clear();
        var obligation = await dbContext.MonthlyObligations
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == obligationId, cancellationToken);
        return obligation is null
            ? null
            : await LoadViewAsync(obligation, cancellationToken);
    }

    private async Task<MonthlyObligationView> LoadViewAsync(
        Persistence.Models.MonthlyObligationRow obligation,
        CancellationToken cancellationToken)
    {
        var delinquency = await dbContext.ContractDelinquencies
            .AsNoTracking()
            .SingleOrDefaultAsync(
                x => x.ContractId == obligation.ContractId,
                cancellationToken);

        return new MonthlyObligationView(
            obligation.Id,
            obligation.ContractId,
            obligation.ContractMonthNumber,
            obligation.DueAtUtc,
            obligation.Status,
            delinquency?.ConsecutiveMissedMonths ?? 0,
            delinquency?.CancellationRequired ?? false,
            obligation.UpdatedAtUtc);
    }

    private static ProcessMonthlyDueResult Empty(
        ProcessMonthlyDueOutcome outcome,
        Guid obligationId) =>
        new(outcome, obligationId, 0, null);
}
