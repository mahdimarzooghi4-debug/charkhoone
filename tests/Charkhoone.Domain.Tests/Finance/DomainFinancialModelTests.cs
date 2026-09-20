using Charkhoone.Domain.Finance;
using Xunit;

namespace Charkhoone.Domain.Tests.Finance;

public sealed class DomainFinancialModelTests
{
    [Fact]
    public void IntermediateMoneyArithmetic_PreservesDecimalPrecision()
    {
        var cashDeposit = Money.NonNegative(500_000_000m);
        var monthlyRent = Money.NonNegative(10_000_000m);

        var exactCalculation = cashDeposit + (monthlyRent / 0.03m);

        Assert.Equal(500_000_000m + (10_000_000m / 0.03m), exactCalculation.Rial);
        Assert.Equal(833_333_333m, RialAmountPolicy.FloorToWholeRial(exactCalculation.Rial));
    }

    [Fact]
    public void FundingAllocation_UsesWholeRialBankApprovedLoanForTenantContribution()
    {
        var fullDeposit = Money.NonNegative(833_333_333m);
        var approvedLoan = Money.NonNegative(458_333_333m);

        var allocation = FundingAllocation.Create(fullDeposit, approvedLoan);

        Assert.Equal(375_000_000m, allocation.TenantContribution.Rial);
    }

    [Fact]
    public void FundingAllocation_RejectsFractionalRialResources()
    {
        Assert.Throws<ArgumentException>(() => FundingAllocation.Create(
            Money.NonNegative(833_333_333.5m),
            Money.NonNegative(458_333_333m)));
    }

    [Fact]
    public void BankLoanPlanVersion_EnforcesOneYearTerm()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new BankLoanPlanVersion(
            Guid.NewGuid(),
            "plan-v1",
            "bank-1",
            "Public plan",
            "Defined by bank; no PMT assumption in Charkhoone",
            BankLoanPlanScope.Public,
            null,
            BankLoanPlanStatus.Published,
            termMonths: 24));
    }

    [Fact]
    public void GradePolicyVersion_HasNoDefaultForUnknownExternalGrade()
    {
        var policy = new CreditGradePolicyVersion(
            "grade-policy-v1",
            DateTimeOffset.UtcNow,
            new Dictionary<string, decimal>
            {
                ["A1"] = 0.55m,
                ["A2"] = 0.55m,
                ["A3"] = 0.55m,
                ["B1"] = 0.45m,
                ["B2"] = 0.45m,
                ["B3"] = 0.45m,
                ["C1"] = 0.40m,
                ["C2"] = 0.40m,
                ["C3"] = 0.30m,
                ["D1"] = 0.35m,
                ["D2"] = 0.35m,
                ["D3"] = 0.35m,
                ["E1"] = 0.30m,
                ["E2"] = 0.30m,
                ["E3"] = 0.30m,
            });

        Assert.Equal(0.55m, policy.GetLoanRatio("A3"));
        Assert.Equal(0.30m, policy.GetLoanRatio("C3"));
        Assert.Throws<ArgumentOutOfRangeException>(() => policy.GetLoanRatio("F1"));
    }

    [Fact]
    public void FrozenPrincipal_IsStoredAsSeparateImmutableResource()
    {
        var principal = new FrozenPrincipal(
            Guid.NewGuid(),
            "bank-1",
            Money.NonNegative(458_333_333m),
            "fund-ref-1");

        Assert.Equal(458_333_333m, principal.Amount.Rial);
    }
}
