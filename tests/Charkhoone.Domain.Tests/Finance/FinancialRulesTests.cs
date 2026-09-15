using System.Globalization;
using Charkhoone.Domain.Finance;

namespace Charkhoone.Domain.Tests.Finance;

public sealed class FinancialRulesTests
{
    [Fact]
    public void FullDeposit_UsesAuthoritativeThreePercentEquivalence()
    {
        const decimal cashDeposit = 500_000_000m;
        const decimal monthlyRent = 10_000_000m;

        var result = FullDepositCalculator.Calculate(cashDeposit, monthlyRent);

        Assert.Equal(cashDeposit + (monthlyRent / 0.03m), result);
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
        var ratio = decimal.Parse(expectedRatio, CultureInfo.InvariantCulture);
        Assert.Equal(ratio, CreditGradePolicy.GetLoanRatio(subGrade));
    }

    [Fact]
    public void UnknownCreditGrade_HasNoDefaultRatio()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => CreditGradePolicy.GetLoanRatio("F1"));
    }

    [Fact]
    public void TenantContribution_UsesBankApprovedLoan()
    {
        const decimal fullDeposit = 833_333_333.33333333333333333333m;
        const decimal approvedLoan = 458_333_333.33333333333333333333m;

        var result = CreditAllocationCalculator.CalculateTenantContribution(fullDeposit, approvedLoan);

        Assert.Equal(375_000_000m, result);
    }
}
