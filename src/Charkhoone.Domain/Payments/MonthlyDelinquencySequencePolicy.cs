namespace Charkhoone.Domain.Payments;

public sealed record ClosedMonthlyObligationSnapshot(
    int ContractMonthNumber,
    MonthlyObligationStatus Status);

public static class MonthlyDelinquencySequencePolicy
{
    public static int CalculateConsecutiveMissedMonths(
        int currentContractMonthNumber,
        MonthlyObligationStatus currentStatus,
        IEnumerable<ClosedMonthlyObligationSnapshot> priorClosedObligations)
    {
        if (currentContractMonthNumber < 1)
        {
            throw new ArgumentOutOfRangeException(nameof(currentContractMonthNumber));
        }

        ArgumentNullException.ThrowIfNull(priorClosedObligations);

        if (currentStatus == MonthlyObligationStatus.Paid)
        {
            return 0;
        }

        if (!IsTenantMiss(currentStatus))
        {
            throw new ArgumentOutOfRangeException(
                nameof(currentStatus),
                "Only Paid, Missed, or Covered obligations can determine the closed-month delinquency streak.");
        }

        var byMonth = priorClosedObligations
            .Where(x => x.ContractMonthNumber < currentContractMonthNumber)
            .GroupBy(x => x.ContractMonthNumber)
            .ToDictionary(group => group.Key, group => group.Single().Status);

        var consecutiveMissedMonths = 1;
        for (var month = currentContractMonthNumber - 1; month >= 1; month--)
        {
            if (!byMonth.TryGetValue(month, out var status) || !IsTenantMiss(status))
            {
                break;
            }

            consecutiveMissedMonths = checked(consecutiveMissedMonths + 1);
        }

        return consecutiveMissedMonths;
    }

    public static bool IsTenantMiss(MonthlyObligationStatus status) =>
        status is MonthlyObligationStatus.Missed or MonthlyObligationStatus.Covered;
}
