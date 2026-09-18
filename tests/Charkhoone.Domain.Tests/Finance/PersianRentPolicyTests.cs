using Charkhoone.Domain.Finance;
using Xunit;

namespace Charkhoone.Domain.Tests.Finance;

public sealed class PersianRentPolicyTests
{
    [Fact]
    public void PartialPersianMonth_IsInclusive_Uses365DayBasis_AndFloorsFractionalRial()
    {
        // 1402/12 has 29 days. Starting on day 25 therefore charges days 25..29 = 5 days.
        const decimal monthlyRentRial = 90_000_000m;

        var charge = PersianRentCalculator.CalculateMonthCharge(
            monthlyRentRial,
            persianYear: 1402,
            persianMonth: 12,
            startDayInclusive: 25);

        Assert.Equal(5, charge.ChargeableDays);
        Assert.False(charge.IsFullMonth);
        Assert.Equal(14_794_520m, charge.PayableRial);
        Assert.True(charge.ExactCalculatedRial > charge.PayableRial);
        Assert.True(charge.ExactCalculatedRial < charge.PayableRial + 1m);
    }

    [Fact]
    public void CompletePersianMonth_UsesContractualMonthlyRent_NotCalendarDayProration()
    {
        const decimal monthlyRentRial = 103_205_500m;

        var charge = PersianRentCalculator.CalculateMonthCharge(
            monthlyRentRial,
            persianYear: 1403,
            persianMonth: 1,
            startDayInclusive: 1,
            endDayInclusive: 31);

        Assert.True(charge.IsFullMonth);
        Assert.Equal(31, charge.ChargeableDays);
        Assert.Equal(monthlyRentRial, charge.ExactCalculatedRial);
        Assert.Equal(monthlyRentRial, charge.PayableRial);
    }

    [Fact]
    public void ExplicitPartialRange_CountsBothStartAndEndDays()
    {
        const decimal monthlyRentRial = 90_000_000m;

        var charge = PersianRentCalculator.CalculateMonthCharge(
            monthlyRentRial,
            persianYear: 1403,
            persianMonth: 7,
            startDayInclusive: 25,
            endDayInclusive: 27);

        Assert.Equal(3, charge.ChargeableDays);
        Assert.Equal(8_876_712m, charge.PayableRial);
    }

    [Fact]
    public void WholeRialBoundary_FloorsTowardLowerRial()
    {
        Assert.Equal(103_205_500m, RialAmountPolicy.FloorToWholeRial(103_205_500.73m));
    }

    [Fact]
    public void InvalidPersianDay_IsRejected()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            PersianRentCalculator.CalculateMonthCharge(
                90_000_000m,
                persianYear: 1402,
                persianMonth: 12,
                startDayInclusive: 30));
    }
}
