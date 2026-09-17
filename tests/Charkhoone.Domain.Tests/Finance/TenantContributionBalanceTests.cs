using Charkhoone.Domain.Finance;
using Xunit;

namespace Charkhoone.Domain.Tests.Finance;

public sealed class TenantContributionBalanceTests
{
    [Fact]
    public void Balance_UsesOnlyContributionReplenishmentCoverageAndReservations()
    {
        var balance = TenantContributionBalanceSnapshot.Calculate(
            initialContributionRial: 1_000m,
            confirmedReplenishmentsRial: 200m,
            confirmedCoverageRial: 300m,
            reservedCoverageRial: 150m);

        Assert.Equal(900m, balance.PostedBalance.Rial);
        Assert.Equal(750m, balance.AvailableForCoverage.Rial);
    }

    [Fact]
    public void Balance_DoesNotRoundFractionalRialValues()
    {
        var balance = TenantContributionBalanceSnapshot.Calculate(
            100.125m,
            10.005m,
            20.001m,
            5.0005m);

        Assert.Equal(90.129m, balance.PostedBalance.Rial);
        Assert.Equal(85.1285m, balance.AvailableForCoverage.Rial);
    }

    [Fact]
    public void Balance_RejectsConfirmedCoverageBeyondContributionAndReplenishments()
    {
        Assert.Throws<InvalidOperationException>(() =>
            TenantContributionBalanceSnapshot.Calculate(100m, 0m, 101m));
    }

    [Fact]
    public void Balance_RejectsReservationsBeyondPostedBalance()
    {
        Assert.Throws<InvalidOperationException>(() =>
            TenantContributionBalanceSnapshot.Calculate(100m, 0m, 20m, 81m));
    }
}
