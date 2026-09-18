using System.Globalization;

namespace Charkhoone.Domain.Finance;

public sealed record PersianRentCharge(
    int PersianYear,
    int PersianMonth,
    int StartDayInclusive,
    int EndDayInclusive,
    int ChargeableDays,
    bool IsFullMonth,
    decimal ExactCalculatedRial,
    decimal PayableRial);

/// <summary>
/// Monthly rent policy for the Persian (Jalali) calendar.
/// A complete Persian month is charged as the contractual monthly rent.
/// Any partial Persian month is day-counted inclusively at monthly-rent * 12 / 365.
/// The exact decimal result is retained for audit; the payable boundary floors only
/// the fractional rial because one rial is the smallest platform money unit.
/// </summary>
public static class PersianRentCalculator
{
    private const decimal MonthsPerYear = 12m;
    private const decimal DayCountBasis = 365m;
    private static readonly PersianCalendar Calendar = new();

    public static PersianRentCharge CalculateMonthCharge(
        decimal monthlyRentRial,
        int persianYear,
        int persianMonth,
        int startDayInclusive,
        int? endDayInclusive = null)
    {
        RialAmountPolicy.RequireWholeNonNegative(monthlyRentRial, nameof(monthlyRentRial));

        if (persianYear < 1 || persianYear > Calendar.GetYear(Calendar.MaxSupportedDateTime))
        {
            throw new ArgumentOutOfRangeException(nameof(persianYear));
        }

        if (persianMonth is < 1 or > 12)
        {
            throw new ArgumentOutOfRangeException(nameof(persianMonth));
        }

        var daysInMonth = Calendar.GetDaysInMonth(persianYear, persianMonth);
        var resolvedEndDay = endDayInclusive ?? daysInMonth;

        if (startDayInclusive < 1 || startDayInclusive > daysInMonth)
        {
            throw new ArgumentOutOfRangeException(nameof(startDayInclusive));
        }

        if (resolvedEndDay < startDayInclusive || resolvedEndDay > daysInMonth)
        {
            throw new ArgumentOutOfRangeException(nameof(endDayInclusive));
        }

        var chargeableDays = resolvedEndDay - startDayInclusive + 1;
        var isFullMonth = startDayInclusive == 1 && resolvedEndDay == daysInMonth;
        var exactCalculatedRial = isFullMonth
            ? monthlyRentRial
            : monthlyRentRial * MonthsPerYear * chargeableDays / DayCountBasis;

        return new PersianRentCharge(
            persianYear,
            persianMonth,
            startDayInclusive,
            resolvedEndDay,
            chargeableDays,
            isFullMonth,
            exactCalculatedRial,
            RialAmountPolicy.FloorToWholeRial(exactCalculatedRial));
    }
}
