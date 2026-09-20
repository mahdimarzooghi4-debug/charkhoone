using Charkhoone.Domain.Finance;
using Xunit;

namespace Charkhoone.Domain.Tests.Finance;

public sealed class FinancialRulesTests
{
    [Fact]
    public void FullDeposit_UsesAuthoritativeThreePercentEquivalence_AndFloorsFractionalRial()
    {
        const decimal cashDepositRial = 500_000_000m;
        const decimal monthlyRentRial = 10_000_000m;

        var result = FullDepositCalculator.Calculate(cashDepositRial, monthlyRentRial);

        Assert.Equal(833_333_333m, result);
    }

    [Fact]
    public void FiveHundredMillionTomanDeposit_PlusEighteenMillionTomanRent_EqualsOnePointOneBillionTomanEquivalent()
    {
        // Authoritative backend stores whole Iranian rials, not toman.
        const decimal cashDepositRial = 5_000_000_000m;
        const decimal monthlyRentRial = 180_000_000m;

        var fullDeposit = FullDepositCalculator.Calculate(cashDepositRial, monthlyRentRial);

        Assert.Equal(11_000_000_000m, fullDeposit);
        Assert.Equal(3_300_000_000m, CreditAllocationCalculator.CalculateMaximumLoan(fullDeposit, "C3"));
        Assert.Equal(6_050_000_000m, CreditAllocationCalculator.CalculateMaximumLoan(fullDeposit, "A1"));
    }

    [Fact]
    public void FiveHundredMillionTomanCashAndTwentyMillionTomanRent_ApplyGradeAfterConversion()
    {
        // Toman screenshot: 500m cash + (20m rent / 0.03) ~= 1.166666667bn.
        // Backend is authoritative in whole rial; the screenshot rounds to toman.
        const decimal cashDepositRial = 5_000_000_000m;
        const decimal monthlyRentRial = 200_000_000m;

        var fullDepositRial = FullDepositCalculator.Calculate(cashDepositRial, monthlyRentRial);

        Assert.Equal(11_666_666_666m, fullDepositRial);
        Assert.Equal(3_499_999_999m,
            CreditAllocationCalculator.CalculateMaximumLoan(fullDepositRial, "C3"));
    }

    [Fact]
    public void NineMillionTomanMonthlyRent_EqualsThreeHundredMillionTomanFullDeposit()
    {
        const decimal monthlyRentRial = 90_000_000m;

        var fullDepositRial = FullDepositCalculator.CalculateFullDepositFromMonthlyRent(monthlyRentRial);
        var convertedBackMonthlyRentRial = FullDepositCalculator.CalculateMonthlyRentFromFullDeposit(fullDepositRial);

        Assert.Equal(3_000_000_000m, fullDepositRial);
        Assert.Equal(monthlyRentRial, convertedBackMonthlyRentRial);
    }

    [Theory]
    [InlineData("A1", "0.55")]
    [InlineData("A3", "0.55")]
    [InlineData("B2", "0.45")]
    [InlineData("C1", "0.40")]
    [InlineData("C2", "0.40")]
    [InlineData("C3", "0.30")]
    [InlineData("D1", "0.35")]
    [InlineData("E2", "0.30")]
    public void CreditGrade_UsesApprovedGroupRatio(string subGrade, string expectedRatio)
    {
        var ratio = decimal.Parse(expectedRatio, System.Globalization.CultureInfo.InvariantCulture);
        Assert.Equal(ratio, CreditGradePolicy.GetLoanRatio(subGrade));
    }

    [Fact]
    public void C3_HasThirtyPercentFinancing_AndNeverFallsBackToCGroupFortyPercent()
    {
        Assert.Equal(0.30m, CreditGradePolicy.GetLoanRatio("C3"));
        Assert.Equal(150_000_000m, CreditAllocationCalculator.CalculateMaximumLoan(500_000_000m, "C3"));
        Assert.Equal(0.40m, CreditGradePolicy.GetLoanRatio("C2"));
    }

    [Fact]
    public void UnknownCreditGrade_HasNoDefaultRatio()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => CreditGradePolicy.GetLoanRatio("F1"));
    }

    [Fact]
    public void MaximumLoan_FloorsOnlyAtFinalRialBoundary()
    {
        const decimal fullDepositRial = 833_333_333m;

        var result = CreditAllocationCalculator.CalculateMaximumLoan(fullDepositRial, "A1");

        Assert.Equal(458_333_333m, result);
    }

    [Fact]
    public void TenantContribution_SubtractsWholeRialBankApprovedLoanExactly()
    {
        const decimal fullDepositRial = 833_333_333m;
        const decimal approvedLoanRial = 458_333_333m;

        var result = CreditAllocationCalculator.CalculateTenantContribution(fullDepositRial, approvedLoanRial);

        Assert.Equal(375_000_000m, result);
    }

    [Fact]
    public void StoredMoneyInputs_RejectFractionalRials()
    {
        Assert.Throws<ArgumentException>(() =>
            FullDepositCalculator.CalculateFullDepositFromMonthlyRent(90_000_000.5m));

        Assert.Throws<ArgumentException>(() =>
            CreditAllocationCalculator.CalculateMaximumLoan(3_000_000_000.5m, "A1"));
    }
}
