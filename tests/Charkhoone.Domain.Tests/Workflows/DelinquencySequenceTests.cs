using Charkhoone.Domain.Payments;
using Xunit;

namespace Charkhoone.Domain.Tests.Workflows;

public sealed class DelinquencySequenceTests
{
    [Fact]
    public void FullCurrentMonthPayment_BreaksTheConsecutiveMissChain()
    {
        var streak = DelinquencySequence.CalculateCurrentStreak([
            MonthlyObligationStatus.Paid,
            MonthlyObligationStatus.Missed,
            MonthlyObligationStatus.Missed,
        ]);

        Assert.Equal(0, streak);
    }

    [Fact]
    public void CoveredMonth_StillCountsAsTenantMiss()
    {
        var streak = DelinquencySequence.CalculateCurrentStreak([
            MonthlyObligationStatus.Missed,
            MonthlyObligationStatus.Covered,
            MonthlyObligationStatus.Missed,
        ]);

        Assert.Equal(3, streak);
    }

    [Fact]
    public void OlderPaidMonth_StopsTheBackwardScan()
    {
        var streak = DelinquencySequence.CalculateCurrentStreak([
            MonthlyObligationStatus.Covered,
            MonthlyObligationStatus.Missed,
            MonthlyObligationStatus.Paid,
            MonthlyObligationStatus.Missed,
        ]);

        Assert.Equal(2, streak);
    }

    [Fact]
    public void OpenMonth_IsRejectedFromClosedMonthCalculation()
    {
        Assert.Throws<ArgumentException>(() =>
            DelinquencySequence.CalculateCurrentStreak([
                MonthlyObligationStatus.Missed,
                MonthlyObligationStatus.Open,
            ]));
    }
}
