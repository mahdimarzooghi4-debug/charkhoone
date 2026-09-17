using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Charkhoone.Infrastructure.Persistence.Interceptors;

/// <summary>
/// Captures the raw exposure needed for the future lost-fund-return calculation at the same
/// persistence boundary where a coverage payment becomes successful. It does not calculate
/// any return or allocate later replenishments to exposures.
/// </summary>
public sealed class LostFundReturnTrackingInterceptor : SaveChangesInterceptor
{
    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        CaptureNewExposures(eventData.Context);
        return result;
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        CaptureNewExposures(eventData.Context);
        return ValueTask.FromResult(result);
    }

    private static void CaptureNewExposures(DbContext? context)
    {
        if (context is not CharkhooneDbContext dbContext)
        {
            return;
        }

        var alreadyTrackedCoverageIds = dbContext.ChangeTracker
            .Entries<LostFundReturnRow>()
            .Select(entry => entry.Entity.CoveragePaymentId)
            .ToHashSet();

        var successfulCoverageEntries = dbContext.ChangeTracker
            .Entries<CoveragePaymentRow>()
            .Where(entry =>
                entry.State == EntityState.Modified
                && entry.Property(x => x.Status).IsModified
                && entry.Entity.Status == CoveragePaymentStatus.Succeeded
                && entry.Entity.CoveredAtUtc.HasValue)
            .Select(entry => entry.Entity)
            .ToArray();

        foreach (var coverage in successfulCoverageEntries)
        {
            if (!alreadyTrackedCoverageIds.Add(coverage.Id))
            {
                continue;
            }

            var exposure = LostFundReturnTerms.OpenExposure(
                coverage.ContractId,
                coverage.Id,
                coverage.AmountRial,
                coverage.CoveredAtUtc!.Value);

            dbContext.LostFundReturns.Add(new LostFundReturnRow
            {
                Id = Guid.NewGuid(),
                ContractId = exposure.ContractId,
                CoveragePaymentId = exposure.CoveragePaymentId,
                WithdrawnAmountRial = exposure.WithdrawnAmount.Rial,
                MonthlyRate = exposure.MonthlyRate,
                WithdrawnAtUtc = exposure.WithdrawnAtUtc,
                CalculationPeriodStartUtc = exposure.WithdrawnAtUtc,
                ReplacedAtUtc = null,
                CalculationPeriodEndUtc = null,
                CalculationPolicyVersion = null,
                CalculatedReturnRial = null,
                CreatedAtUtc = exposure.WithdrawnAtUtc,
                UpdatedAtUtc = exposure.WithdrawnAtUtc,
            });
        }
    }
}
