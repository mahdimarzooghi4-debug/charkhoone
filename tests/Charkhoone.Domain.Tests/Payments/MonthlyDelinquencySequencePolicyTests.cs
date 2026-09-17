using Charkhoone.Domain.Payments;
using Xunit;

namespace Charkhoone.Domain.Tests.Payments;

public sealed class MonthlyDelinquencySequencePolicyTests
{
    [Fact]
    public void PaidCurrentMonth_BreaksTheConsecutiveMissChain()
    {
        var prior = new[]
        {
            new ClosedMonthlyObligationSnapshot(1, MonthlyObligationStatus.Missed),
            new ClosedMonthlyObligationSnapshot(2, MonthlyObligationStatus.Covered),
        };

        var result = MonthlyDelinquencySequencePolicy.CalculateConsecutiveMissedMonths(
            3,
            MonthlyObligationStatus.Paid,
            prior);

        Assert.Equal(0, result);
    }

    [Fact]
    public void CoveredMonths_StillCountAsTenantMisses()
    {
        var prior = new[]
        {
            new ClosedMonthlyObligationSnapshot(1, MonthlyObligationStatus.Missed),
            new ClosedMonthlyObligationSnapshot(2, MonthlyObligationStatus.Covered),
        };

        var result = MonthlyDelinquencySequencePolicy.CalculateConsecutiveMissedMonths(
            3,
            MonthlyObligationStatus.Missed,
            prior);

        Assert.Equal(3, result);
    }

    [Fact]
    public void MissingEarlierContractMonth_BreaksTheConsecutiveChain()
    {
        var prior = new[]
        {
            new ClosedMonthlyObligationSnapshot(1, MonthlyObligationStatus.Missed),
        };

        var result = MonthlyDelinquencySequencePolicy.CalculateConsecutiveMissedMonths(
            3,
            MonthlyObligationStatus.Missed,
            prior);

        Assert.Equal(1, result);
    }

    [Fact]
    public void PaidEarlierMonth_BreaksTheConsecutiveChainWithoutRewritingOlderDebt()
    {
        var prior = new[]
        {
            new ClosedMonthlyObligationSnapshot(1, MonthlyObligationStatus.Missed),
            new ClosedMonthlyObligationSnapshot(2, MonthlyObligationStatus.Paid),
        };

        var result = MonthlyDelinquencySequencePolicy.CalculateConsecutiveMissedMonths(
            3,
            MonthlyObligationStatus.Missed,
            prior);

        Assert.Equal(1, result);
    }
}
