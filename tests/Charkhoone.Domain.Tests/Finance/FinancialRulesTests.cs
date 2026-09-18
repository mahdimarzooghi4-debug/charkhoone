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
    [InlineData("C3", "0.40")]
    [InlineData("D1", "0.35")]
    [InlineData("E2", "0.30")]
    public void CreditGrade_UsesApprovedGroupRatio(string subGrade, string expectedRatio)
    {
        var ratio = decimal.Parse(expectedRatio, System.Globalization.CultureInfo.InvariantCulture);
        Assert.Equal(ratio, CreditGradePolicy.GetLoanRatio(subGrade));
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
