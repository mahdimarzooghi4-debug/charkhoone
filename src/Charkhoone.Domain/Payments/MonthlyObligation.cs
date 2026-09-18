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
    /// Registers a closed contractual month. A fully paid month may reset the consecutive chain only
    /// after the payment workflow has independently verified that all earlier tenant arrears are cleared.
    /// Any closed month without full payment extends the chain. Once three consecutive missed months are
    /// reached, cancellation remains required and this tracker no longer accepts later month results.
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
