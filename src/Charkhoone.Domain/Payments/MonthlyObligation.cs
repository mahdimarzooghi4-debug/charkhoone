namespace Charkhoone.Domain.Payments;

public enum MonthlyObligationStatus
{
    Open,
    Paid,
    Missed,
    Covered,
}

public sealed class ConsecutiveMissedMonths
{
    public const int CancellationThreshold = 3;

    public int Count { get; private set; }
    public bool RequiresCancellation { get; private set; }

    /// <summary>
    /// Registers a closed contractual month. A full tenant payment resets the consecutive chain;
    /// any closed month without full payment extends it. Older debt is intentionally not changed here.
    /// Once three consecutive missed months are reached, cancellation remains required and this tracker
    /// no longer accepts later month results. Partial-payment allocation is deliberately not modeled here.
    /// </summary>
    public void RegisterClosedMonth(bool tenantPaidInFull)
    {
        if (RequiresCancellation)
        {
            throw new InvalidOperationException("Contract cancellation is already required after three consecutive missed months.");
        }

        Count = tenantPaidInFull ? 0 : checked(Count + 1);

        if (Count >= CancellationThreshold)
        {
            RequiresCancellation = true;
        }
    }
}
