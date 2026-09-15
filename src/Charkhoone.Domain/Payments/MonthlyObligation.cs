namespace Charkhoone.Domain.Payments;

public enum MonthlyObligationStatus
{
    Open,
    PartiallyPaid,
    Paid,
    Missed,
    Covered,
}

public sealed class ConsecutiveMissedMonths
{
    public const int CancellationThreshold = 3;

    public int Count { get; private set; }
    public bool RequiresCancellation => Count >= CancellationThreshold;

    /// <summary>
    /// Registers a closed contractual month. A full tenant payment resets the consecutive chain;
    /// any closed month without full payment extends it. Older debt is intentionally not changed here.
    /// </summary>
    public void RegisterClosedMonth(bool tenantPaidInFull)
    {
        Count = tenantPaidInFull ? 0 : checked(Count + 1);
    }
}
