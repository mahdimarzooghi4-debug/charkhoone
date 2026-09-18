using Charkhoone.Domain.Payments;
using Xunit;

namespace Charkhoone.Domain.Tests.Payments;

public sealed class CancellationFinancialSettlementTests
{
    [Fact]
    public void Cancellation_DeductsOnlyOpenLostReturnFromAlreadyReducedTenantContribution()
    {
        var cutoff = DateTimeOffset.Parse("2026-09-18T00:00:00+00:00");
        var first = LostFundReturnTerms.CalculateAccruedReturn(
            LostFundReturnTerms.OpenExposure(
                Guid.NewGuid(),
                Guid.NewGuid(),
                100_000_000m,
                cutoff.AddDays(-40)),
            cutoff);
        var second = LostFundReturnTerms.CalculateAccruedReturn(
            LostFundReturnTerms.OpenExposure(
                Guid.NewGuid(),
                Guid.NewGuid(),
                50_000_000m,
                cutoff.AddDays(-20)),
            cutoff);

        var result = CancellationFinancialSettlementCalculator.Calculate(
            postedTenantContributionRial: 500_000_000m,
            [first, second]);

        Assert.Equal(500_000_000m, result.TenantContributionBeforeSettlementRial);
        Assert.Equal(
            first.PayableReturn.Rial + second.PayableReturn.Rial,
            result.LostFundReturnRial);
        Assert.Equal(
            500_000_000m - result.LostFundReturnRial,
            result.OwnerResidualRial);
    }

    [Fact]
    public void Cancellation_WithNoOpenLostReturn_TransfersEntireResidualToOwner()
    {
        var result = CancellationFinancialSettlementCalculator.Calculate(
            500_000_000m,
            []);

        Assert.Equal(0m, result.LostFundReturnRial);
        Assert.Equal(500_000_000m, result.OwnerResidualRial);
    }

    [Fact]
    public void Cancellation_FailsClosedIfTenantContributionCannotCoverLostReturn()
    {
        var cutoff = DateTimeOffset.Parse("2026-09-18T00:00:00+00:00");
        var accrual = LostFundReturnTerms.CalculateAccruedReturn(
            LostFundReturnTerms.OpenExposure(
                Guid.NewGuid(),
                Guid.NewGuid(),
                100_000_000m,
                cutoff.AddDays(-365)),
            cutoff);

        Assert.Throws<InvalidOperationException>(() =>
            CancellationFinancialSettlementCalculator.Calculate(
                postedTenantContributionRial: 1m,
                [accrual]));
    }

    [Fact]
    public void Cancellation_NeverUsesFrozenBankPrincipalAsAnInput()
    {
        var parameters = typeof(CancellationFinancialSettlementCalculator)
            .GetMethod(nameof(CancellationFinancialSettlementCalculator.Calculate))!
            .GetParameters();

        Assert.DoesNotContain(
            parameters,
            parameter => parameter.Name!.Contains("bank", StringComparison.OrdinalIgnoreCase)
                || parameter.Name.Contains("frozen", StringComparison.OrdinalIgnoreCase)
                || parameter.Name.Contains("principal", StringComparison.OrdinalIgnoreCase));
    }
}
