using Charkhoone.Domain.Payments;
using Xunit;

namespace Charkhoone.Domain.Tests.Payments;

public sealed class LostFundReturnTermsTests
{
    [Fact]
    public void OpenExposure_UsesApprovedThreePercentMonthlyRateWithoutCalculatingReturn()
    {
        var contractId = Guid.NewGuid();
        var coveragePaymentId = Guid.NewGuid();
        var withdrawnAt = DateTimeOffset.Parse("2026-09-17T07:00:00+00:00");

        var exposure = LostFundReturnTerms.OpenExposure(
            contractId,
            coveragePaymentId,
            12_345_678.901234567890123456m,
            withdrawnAt);

        Assert.Equal(contractId, exposure.ContractId);
        Assert.Equal(coveragePaymentId, exposure.CoveragePaymentId);
        Assert.Equal(12_345_678.901234567890123456m, exposure.WithdrawnAmount.Rial);
        Assert.Equal(0.03m, exposure.MonthlyRate);
        Assert.Equal(withdrawnAt, exposure.WithdrawnAtUtc);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void OpenExposure_RequiresPositiveWithdrawnAmount(decimal amountRial)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            LostFundReturnTerms.OpenExposure(
                Guid.NewGuid(),
                Guid.NewGuid(),
                amountRial,
                DateTimeOffset.UtcNow));
    }
}
