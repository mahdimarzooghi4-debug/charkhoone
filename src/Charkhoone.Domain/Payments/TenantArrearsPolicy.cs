using Charkhoone.Domain.Finance;

namespace Charkhoone.Domain.Payments;

public sealed record TenantArrearsItem(
    Guid ReferenceId,
    int ContractMonthNumber,
    int ComponentOrder,
    decimal AmountRial);

public sealed record TenantArrearsAllocation(
    Guid ReferenceId,
    int ContractMonthNumber,
    int ComponentOrder,
    decimal AmountRial);

public sealed record TenantArrearsSnapshot(
    decimal TotalCoveredRial,
    decimal PreviouslyReplenishedRial,
    decimal OutstandingRial,
    IReadOnlyList<TenantArrearsAllocation> OutstandingOldestFirst);

public sealed record TenantArrearsPaymentPlan(
    decimal TenderedRial,
    decimal PrincipalRial,
    decimal LostFundReturnRial,
    decimal RequiredTotalRial,
    TenantArrearsSnapshot BeforePayment,
    IReadOnlyList<TenantArrearsAllocation> AllocationsOldestFirst);

/// <summary>
/// Tenant debt created when Charkhoone covers missed obligations from the tenant contribution.
/// Confirmed replenishments are applied to covered items oldest contractual month first.
/// A new replenishment is accepted only when it clears the entire remaining debt; partial and
/// over-payments are rejected.
/// </summary>
public static class TenantArrearsPolicy
{
    public static TenantArrearsSnapshot CalculateOutstanding(
        IEnumerable<TenantArrearsItem> coveredItems,
        decimal previouslyReplenishedRial)
    {
        ArgumentNullException.ThrowIfNull(coveredItems);
        RialAmountPolicy.RequireWholeNonNegative(
            previouslyReplenishedRial,
            nameof(previouslyReplenishedRial));

        var ordered = coveredItems
            .Select(Validate)
            .OrderBy(x => x.ContractMonthNumber)
            .ThenBy(x => x.ComponentOrder)
            .ThenBy(x => x.ReferenceId)
            .ToArray();

        if (ordered.Select(x => x.ReferenceId).Distinct().Count() != ordered.Length)
        {
            throw new ArgumentException("Covered arrears references must be unique.", nameof(coveredItems));
        }

        var totalCovered = ordered.Sum(x => x.AmountRial);
        if (previouslyReplenishedRial > totalCovered)
        {
            throw new InvalidOperationException(
                "Confirmed replenishments cannot exceed confirmed tenant-contribution coverage.");
        }

        var priorRemaining = previouslyReplenishedRial;
        var outstanding = new List<TenantArrearsAllocation>();

        foreach (var item in ordered)
        {
            var priorApplied = Math.Min(priorRemaining, item.AmountRial);
            priorRemaining -= priorApplied;
            var remaining = item.AmountRial - priorApplied;

            if (remaining > 0m)
            {
                outstanding.Add(new TenantArrearsAllocation(
                    item.ReferenceId,
                    item.ContractMonthNumber,
                    item.ComponentOrder,
                    remaining));
            }
        }

        var outstandingTotal = outstanding.Sum(x => x.AmountRial);
        return new TenantArrearsSnapshot(
            totalCovered,
            previouslyReplenishedRial,
            outstandingTotal,
            outstanding);
    }

    public static TenantArrearsPaymentPlan CreateFullPaymentPlan(
        IEnumerable<TenantArrearsItem> coveredItems,
        decimal previouslyReplenishedRial,
        decimal accruedLostFundReturnRial,
        decimal tenderedRial)
    {
        RialAmountPolicy.RequireWholeNonNegative(
            accruedLostFundReturnRial,
            nameof(accruedLostFundReturnRial));
        RialAmountPolicy.RequireWholeNonNegative(tenderedRial, nameof(tenderedRial));

        var beforePayment = CalculateOutstanding(coveredItems, previouslyReplenishedRial);
        if (beforePayment.OutstandingRial <= 0m)
        {
            throw new InvalidOperationException("There is no outstanding tenant arrears to replenish.");
        }

        var requiredTotalRial = checked(beforePayment.OutstandingRial + accruedLostFundReturnRial);
        if (tenderedRial != requiredTotalRial)
        {
            throw new InvalidOperationException(
                "Tenant arrears payment must clear all outstanding principal plus the full accrued lost fund return; partial and over-payments are not allowed.");
        }

        return new TenantArrearsPaymentPlan(
            tenderedRial,
            beforePayment.OutstandingRial,
            accruedLostFundReturnRial,
            requiredTotalRial,
            beforePayment,
            beforePayment.OutstandingOldestFirst);
    }

    private static TenantArrearsItem Validate(TenantArrearsItem item)
    {
        if (item.ReferenceId == Guid.Empty)
        {
            throw new ArgumentException("Arrears reference id is required.", nameof(item));
        }

        if (item.ContractMonthNumber < 1)
        {
            throw new ArgumentOutOfRangeException(nameof(item), "Contract month number must be positive.");
        }

        if (item.ComponentOrder < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(item), "Component order cannot be negative.");
        }

        RialAmountPolicy.RequireWholeNonNegative(item.AmountRial, nameof(item.AmountRial));
        if (item.AmountRial == 0m)
        {
            throw new ArgumentOutOfRangeException(nameof(item), "Covered arrears amount must be positive.");
        }

        return item;
    }
}
