using Charkhoone.Domain.Payments;
using Xunit;

namespace Charkhoone.Domain.Tests.Payments;

public sealed class LostFundReturnTermsTests
{
    [Fact]
    public void OpenExposure_UsesFixedThreePercentMonthlyRate()
    {
        var contractId = Guid.NewGuid();
        var coveragePaymentId = Guid.NewGuid();
        var withdrawnAt = DateTimeOffset.Parse("2026-09-01T00:00:00+00:00");

        var exposure = LostFundReturnTerms.OpenExposure(
            contractId,
            coveragePaymentId,
            100_000_000m,
            withdrawnAt);

        Assert.Equal(contractId, exposure.ContractId);
        Assert.Equal(coveragePaymentId, exposure.CoveragePaymentId);
        Assert.Equal(100_000_000m, exposure.WithdrawnAmount.Rial);
        Assert.Equal(0.03m, exposure.MonthlyRate);
        Assert.Equal(withdrawnAt, exposure.WithdrawnAtUtc);
    }

    [Fact]
    public void FortyDays_UsesSimpleThreePercentMonthlyRate_On365DayBasis()
    {
        var withdrawnAt = DateTimeOffset.Parse("2026-09-01T00:00:00+00:00");
        var exposure = LostFundReturnTerms.OpenExposure(
            Guid.NewGuid(),
            Guid.NewGuid(),
            100_000_000m,
            withdrawnAt);

        var accrual = LostFundReturnTerms.CalculateAccruedReturn(
            exposure,
            withdrawnAt.AddDays(40));

        Assert.Equal(40m, accrual.ElapsedDays);
        Assert.Equal(
            100_000_000m * 0.03m * 12m * 40m / 365m,
            accrual.ExactReturnRial);
        Assert.Equal(3_945_205m, accrual.PayableReturn.Rial);
        Assert.Equal(103_945_205m, accrual.TotalRepayment.Rial);
        Assert.Equal(
            LostFundReturnTerms.CalculationPolicyVersion,
            accrual.CalculationPolicyVersion);
    }

    [Fact]
    public void Return_IsSimpleAndDoesNotCompound()
    {
        var withdrawnAt = DateTimeOffset.Parse("2026-09-01T00:00:00+00:00");
        var exposure = LostFundReturnTerms.OpenExposure(
            Guid.NewGuid(),
            Guid.NewGuid(),
            100_000_000m,
            withdrawnAt);

        var fortyDays = LostFundReturnTerms.CalculateAccruedReturn(
            exposure,
            withdrawnAt.AddDays(40));
        var eightyDays = LostFundReturnTerms.CalculateAccruedReturn(
            exposure,
            withdrawnAt.AddDays(80));

        Assert.Equal(fortyDays.ExactReturnRial * 2m, eightyDays.ExactReturnRial);
        Assert.Equal(
            exposure.WithdrawnAmount.Rial + eightyDays.PayableReturn.Rial,
            eightyDays.TotalRepayment.Rial);
    }

    [Fact]
    public void SameInstant_HasZeroLostReturn()
    {
        var withdrawnAt = DateTimeOffset.Parse("2026-09-01T00:00:00+00:00");
        var exposure = LostFundReturnTerms.OpenExposure(
            Guid.NewGuid(),
            Guid.NewGuid(),
            100_000_000m,
            withdrawnAt);

        var accrual = LostFundReturnTerms.CalculateAccruedReturn(exposure, withdrawnAt);

        Assert.Equal(0m, accrual.ElapsedDays);
        Assert.Equal(0m, accrual.PayableReturn.Rial);
        Assert.Equal(100_000_000m, accrual.TotalRepayment.Rial);
    }

    [Fact]
    public void IntradayDuration_IsCalculatedPreciselyBeforeWholeRialFloor()
    {
        var withdrawnAt = DateTimeOffset.Parse("2026-09-01T00:00:00+00:00");
        var exposure = LostFundReturnTerms.OpenExposure(
            Guid.NewGuid(),
            Guid.NewGuid(),
            100_000_000m,
            withdrawnAt);

        var accrual = LostFundReturnTerms.CalculateAccruedReturn(
            exposure,
            withdrawnAt.AddHours(12));

        Assert.Equal(0.5m, accrual.ElapsedDays);
        Assert.Equal(
            100_000_000m * 0.03m * 12m * 0.5m / 365m,
            accrual.ExactReturnRial);
        Assert.Equal(decimal.Floor(accrual.ExactReturnRial), accrual.PayableReturn.Rial);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void OpenExposure_RequiresPositiveWithdrawnAmount(decimal amountRial)
    {
        Assert.ThrowsAny<ArgumentException>(() =>
            LostFundReturnTerms.OpenExposure(
                Guid.NewGuid(),
                Guid.NewGuid(),
                amountRial,
                DateTimeOffset.UtcNow));
    }

    [Fact]
    public void OpenExposure_RejectsFractionalRialPrincipal()
    {
        Assert.Throws<ArgumentException>(() =>
            LostFundReturnTerms.OpenExposure(
                Guid.NewGuid(),
                Guid.NewGuid(),
                100_000_000.5m,
                DateTimeOffset.UtcNow));
    }

    [Fact]
    public void RepaymentCannotPrecedeWithdrawal()
    {
        var withdrawnAt = DateTimeOffset.Parse("2026-09-01T00:00:00+00:00");
        var exposure = LostFundReturnTerms.OpenExposure(
            Guid.NewGuid(),
            Guid.NewGuid(),
            100_000_000m,
            withdrawnAt);

        Assert.Throws<ArgumentOutOfRangeException>(() =>
            LostFundReturnTerms.CalculateAccruedReturn(
                exposure,
                withdrawnAt.AddTicks(-1)));
    }
}
