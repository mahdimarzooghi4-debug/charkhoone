using Charkhoone.Domain.Payments;
using Xunit;

namespace Charkhoone.Domain.Tests.Workflows;

public sealed class MonthlyObligationChronologyTests
{
    [Fact]
    public void Evaluate_BlocksWhenEarlierMonthIsStillOpen()
    {
        var result = MonthlyObligationChronology.Evaluate(
            3,
            [
                new MonthlyObligationChronologyItem(1, MonthlyObligationStatus.Missed),
                new MonthlyObligationChronologyItem(2, MonthlyObligationStatus.Open),
            ]);

        Assert.Equal(MonthlyObligationChronologyOutcome.EarlierMonthStillOpen, result);
    }

    [Fact]
    public void Evaluate_AllowsForwardClosureWhenEarlierMonthsAreClosed()
    {
        var result = MonthlyObligationChronology.Evaluate(
            3,
            [
                new MonthlyObligationChronologyItem(1, MonthlyObligationStatus.Missed),
                new MonthlyObligationChronologyItem(2, MonthlyObligationStatus.Covered),
                new MonthlyObligationChronologyItem(4, MonthlyObligationStatus.Open),
            ]);

        Assert.Equal(MonthlyObligationChronologyOutcome.Allowed, result);
    }

    [Fact]
    public void Evaluate_BlocksRepairUnsafeHistoryWhenLaterMonthAlreadyClosed()
    {
        var result = MonthlyObligationChronology.Evaluate(
            2,
            [
                new MonthlyObligationChronologyItem(1, MonthlyObligationStatus.Paid),
                new MonthlyObligationChronologyItem(3, MonthlyObligationStatus.Missed),
            ]);

        Assert.Equal(MonthlyObligationChronologyOutcome.LaterMonthAlreadyClosed, result);
    }

    [Fact]
    public void Evaluate_TreatsCoveredAsClosedTenantMissHistory()
    {
        var result = MonthlyObligationChronology.Evaluate(
            3,
            [
                new MonthlyObligationChronologyItem(1, MonthlyObligationStatus.Missed),
                new MonthlyObligationChronologyItem(2, MonthlyObligationStatus.Covered),
            ]);

        Assert.Equal(MonthlyObligationChronologyOutcome.Allowed, result);
    }
}
