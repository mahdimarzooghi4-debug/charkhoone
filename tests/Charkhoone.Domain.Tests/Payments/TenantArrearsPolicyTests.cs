using Charkhoone.Domain.Payments;
using Xunit;

namespace Charkhoone.Domain.Tests.Payments;

public sealed class TenantArrearsPolicyTests
{
    [Fact]
    public void OutstandingDebt_AppliesPriorReplenishmentOldestFirst()
    {
        var monthOneOwner = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var monthOneBank = Guid.Parse("00000000-0000-0000-0000-000000000002");
        var monthTwoOwner = Guid.Parse("00000000-0000-0000-0000-000000000003");

        var snapshot = TenantArrearsPolicy.CalculateOutstanding(
        [
            new TenantArrearsItem(monthTwoOwner, 2, 0, 200m),
            new TenantArrearsItem(monthOneBank, 1, 1, 20m),
            new TenantArrearsItem(monthOneOwner, 1, 0, 100m),
        ],
        previouslyReplenishedRial: 50m);

        Assert.Equal(320m, snapshot.TotalCoveredRial);
        Assert.Equal(50m, snapshot.PreviouslyReplenishedRial);
        Assert.Equal(270m, snapshot.OutstandingRial);
        Assert.Collection(
            snapshot.OutstandingOldestFirst,
            first =>
            {
                Assert.Equal(monthOneOwner, first.ReferenceId);
                Assert.Equal(1, first.ContractMonthNumber);
                Assert.Equal(50m, first.AmountRial);
            },
            second =>
            {
                Assert.Equal(monthOneBank, second.ReferenceId);
                Assert.Equal(1, second.ContractMonthNumber);
                Assert.Equal(20m, second.AmountRial);
            },
            third =>
            {
                Assert.Equal(monthTwoOwner, third.ReferenceId);
                Assert.Equal(2, third.ContractMonthNumber);
                Assert.Equal(200m, third.AmountRial);
            });
    }

    [Fact]
    public void FullPaymentPlan_RequiresExactEntireOutstandingDebt()
    {
        var items = new[]
        {
            new TenantArrearsItem(Guid.NewGuid(), 1, 0, 100m),
            new TenantArrearsItem(Guid.NewGuid(), 2, 0, 200m),
        };

        var plan = TenantArrearsPolicy.CreateFullPaymentPlan(
            items,
            previouslyReplenishedRial: 50m,
            accruedLostFundReturnRial: 25m,
            tenderedRial: 275m);

        Assert.Equal(275m, plan.TenderedRial);
        Assert.Equal(250m, plan.PrincipalRial);
        Assert.Equal(25m, plan.LostFundReturnRial);
        Assert.Equal(275m, plan.RequiredTotalRial);
        Assert.Equal(250m, plan.BeforePayment.OutstandingRial);

        Assert.Throws<InvalidOperationException>(() =>
            TenantArrearsPolicy.CreateFullPaymentPlan(items, 50m, 25m, 274m));
        Assert.Throws<InvalidOperationException>(() =>
            TenantArrearsPolicy.CreateFullPaymentPlan(items, 50m, 25m, 276m));
    }

    [Fact]
    public void FullPaymentPlan_RejectsPaymentWhenNoDebtRemains()
    {
        var items = new[]
        {
            new TenantArrearsItem(Guid.NewGuid(), 1, 0, 100m),
        };

        Assert.Throws<InvalidOperationException>(() =>
            TenantArrearsPolicy.CreateFullPaymentPlan(items, 100m, 0m, 0m));
    }

    [Fact]
    public void OutstandingDebt_RejectsReplenishmentBeyondConfirmedCoverage()
    {
        Assert.Throws<InvalidOperationException>(() =>
            TenantArrearsPolicy.CalculateOutstanding(
            [
                new TenantArrearsItem(Guid.NewGuid(), 1, 0, 100m),
            ],
            previouslyReplenishedRial: 101m));
    }

    [Fact]
    public void ArrearsAmounts_MustUseWholeRials()
    {
        Assert.Throws<ArgumentException>(() =>
            TenantArrearsPolicy.CalculateOutstanding(
            [
                new TenantArrearsItem(Guid.NewGuid(), 1, 0, 100.5m),
            ],
            previouslyReplenishedRial: 0m));

        Assert.Throws<ArgumentException>(() =>
            TenantArrearsPolicy.CreateFullPaymentPlan(
            [
                new TenantArrearsItem(Guid.NewGuid(), 1, 0, 100m),
            ],
            previouslyReplenishedRial: 0m,
            accruedLostFundReturnRial: 0m,
            tenderedRial: 100.5m));
    }
}
