namespace Charkhoone.Domain.Payments;

public enum MonthlyObligationChronologyOutcome
{
    Allowed,
    EarlierMonthStillOpen,
    LaterMonthAlreadyClosed,
}

public sealed record MonthlyObligationChronologyItem(
    int ContractMonthNumber,
    MonthlyObligationStatus Status);

public static class MonthlyObligationChronology
{
    public static MonthlyObligationChronologyOutcome Evaluate(
        int targetMonthNumber,
        IReadOnlyCollection<MonthlyObligationChronologyItem> obligations)
    {
        if (targetMonthNumber <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(targetMonthNumber));
        }

        ArgumentNullException.ThrowIfNull(obligations);

        if (obligations.Any(x =>
                x.ContractMonthNumber < targetMonthNumber
                && x.Status == MonthlyObligationStatus.Open))
        {
            return MonthlyObligationChronologyOutcome.EarlierMonthStillOpen;
        }

        if (obligations.Any(x =>
                x.ContractMonthNumber > targetMonthNumber
                && x.Status != MonthlyObligationStatus.Open))
        {
            return MonthlyObligationChronologyOutcome.LaterMonthAlreadyClosed;
        }

        return MonthlyObligationChronologyOutcome.Allowed;
    }
}
