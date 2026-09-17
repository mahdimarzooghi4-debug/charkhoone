using Charkhoone.Application.Payments;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Infrastructure.Payments;

public sealed class ChronologicalMonthlyObligationService(
    CharkhooneDbContext dbContext,
    EfPaymentService inner) : IMonthlyObligationService
{
    public Task<EnsureMonthlyObligationResult> EnsureAsync(
        MonthlyObligationSetup setup,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default) =>
        inner.EnsureAsync(setup, occurredAtUtc, cancellationToken);

    public async Task<CloseMonthlyObligationResult> CloseAsync(
        Guid obligationId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default)
    {
        if (obligationId == Guid.Empty)
        {
            throw new ArgumentException("Monthly obligation id is required.", nameof(obligationId));
        }

        var target = await dbContext.MonthlyObligations
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == obligationId, cancellationToken);

        if (target is null || target.Status != MonthlyObligationStatus.Open)
        {
            return await inner.CloseAsync(obligationId, occurredAtUtc, cancellationToken);
        }

        var positions = await dbContext.MonthlyObligations
            .AsNoTracking()
            .Where(x => x.ContractId == target.ContractId && x.Id != target.Id)
            .Select(x => new MonthlyObligationChronologyItem(x.ContractMonthNumber, x.Status))
            .ToListAsync(cancellationToken);

        var chronology = MonthlyObligationChronology.Evaluate(
            target.ContractMonthNumber,
            positions);

        if (chronology == MonthlyObligationChronologyOutcome.Allowed)
        {
            return await inner.CloseAsync(obligationId, occurredAtUtc, cancellationToken);
        }

        var delinquency = await dbContext.ContractDelinquencies
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.ContractId == target.ContractId, cancellationToken);

        var view = new MonthlyObligationView(
            target.Id,
            target.ContractId,
            target.ContractMonthNumber,
            target.DueAtUtc,
            target.Status,
            delinquency?.ConsecutiveMissedMonths ?? 0,
            delinquency?.CancellationRequired ?? false,
            target.UpdatedAtUtc);

        return new CloseMonthlyObligationResult(
            CloseMonthlyObligationOutcome.InvalidState,
            view);
    }
}
