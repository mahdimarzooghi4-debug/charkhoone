namespace Charkhoone.Domain.Payments;

/// <summary>
/// Calculates the current consecutive tenant-miss streak from already closed contractual months.
/// Input must be ordered newest to oldest. Platform coverage still represents a tenant miss;
/// a fully paid month breaks the chain. Open months are not valid inputs.
/// </summary>
public static class DelinquencySequence
{
    public static int CalculateCurrentStreak(IEnumerable<MonthlyObligationStatus> newestToOldest)
    {
        ArgumentNullException.ThrowIfNull(newestToOldest);

        var count = 0;
        foreach (var status in newestToOldest)
        {
            switch (status)
            {
                case MonthlyObligationStatus.Paid:
                    return count;
                case MonthlyObligationStatus.Missed:
                case MonthlyObligationStatus.Covered:
                    count = checked(count + 1);
                    break;
                case MonthlyObligationStatus.Open:
                    throw new ArgumentException(
                        "Open monthly obligations cannot be used to calculate a closed-month delinquency streak.",
                        nameof(newestToOldest));
                default:
                    throw new ArgumentOutOfRangeException(nameof(newestToOldest), status, "Unknown monthly obligation status.");
            }
        }

        return count;
    }
}
