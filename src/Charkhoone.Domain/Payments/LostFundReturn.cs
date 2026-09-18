using Charkhoone.Domain.Finance;

namespace Charkhoone.Domain.Payments;

/// <summary>
/// Contractual compensation for the fund return lost while tenant contribution principal is
/// withdrawn to cover an unpaid contractual obligation.
///
/// The tenant rate is fixed at 3% per month, annualized over a 365-day basis, and is simple
/// (non-compounding). Actual fund performance never changes the tenant's contractual rate.
/// Decimal precision is retained during calculation and only the final payable return is floored
/// to a whole rial.
/// </summary>
public static class LostFundReturnTerms
{
    public const decimal MonthlyRate = 0.03m;
    public const decimal MonthsPerYear = 12m;
    public const decimal DayCountBasis = 365m;
    public const string CalculationPolicyVersion = "lost-fund-return-simple-3pct-365-v1";

    public static LostFundReturnExposure OpenExposure(
        Guid contractId,
        Guid coveragePaymentId,
        decimal withdrawnAmountRial,
        DateTimeOffset withdrawnAtUtc)
    {
        if (contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract id is required.", nameof(contractId));
        }

        if (coveragePaymentId == Guid.Empty)
        {
            throw new ArgumentException("Coverage payment id is required.", nameof(coveragePaymentId));
        }

        RialAmountPolicy.RequireWholeNonNegative(withdrawnAmountRial, nameof(withdrawnAmountRial));
        if (withdrawnAmountRial == 0m)
        {
            throw new ArgumentOutOfRangeException(
                nameof(withdrawnAmountRial),
                withdrawnAmountRial,
                "Lost fund return exposure requires a positive withdrawn amount.");
        }

        return new LostFundReturnExposure(
            contractId,
            coveragePaymentId,
            Money.NonNegative(withdrawnAmountRial),
            MonthlyRate,
            withdrawnAtUtc);
    }

    public static LostFundReturnAccrual CalculateAccruedReturn(
        LostFundReturnExposure exposure,
        DateTimeOffset repaidAtUtc)
    {
        ArgumentNullException.ThrowIfNull(exposure);

        if (exposure.MonthlyRate != MonthlyRate)
        {
            throw new InvalidOperationException(
                "Lost fund return exposure does not match the approved 3% monthly policy.");
        }

        RialAmountPolicy.RequireWholeNonNegative(
            exposure.WithdrawnAmount.Rial,
            nameof(exposure));

        var elapsedTicks = repaidAtUtc.UtcDateTime.Ticks - exposure.WithdrawnAtUtc.UtcDateTime.Ticks;
        if (elapsedTicks < 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(repaidAtUtc),
                repaidAtUtc,
                "Repayment cannot precede the fund withdrawal.");
        }

        var elapsedDays = elapsedTicks / (decimal)TimeSpan.TicksPerDay;
        var exactReturnRial =
            exposure.WithdrawnAmount.Rial
            * MonthlyRate
            * MonthsPerYear
            * elapsedDays
            / DayCountBasis;
        var payableReturnRial = RialAmountPolicy.FloorToWholeRial(exactReturnRial);

        return new LostFundReturnAccrual(
            exposure.ContractId,
            exposure.CoveragePaymentId,
            exposure.WithdrawnAmount,
            exposure.WithdrawnAtUtc,
            repaidAtUtc,
            elapsedDays,
            exactReturnRial,
            Money.NonNegative(payableReturnRial),
            Money.NonNegative(exposure.WithdrawnAmount.Rial + payableReturnRial),
            CalculationPolicyVersion);
    }
}

public sealed record LostFundReturnExposure(
    Guid ContractId,
    Guid CoveragePaymentId,
    Money WithdrawnAmount,
    decimal MonthlyRate,
    DateTimeOffset WithdrawnAtUtc);

public sealed record LostFundReturnAccrual(
    Guid ContractId,
    Guid CoveragePaymentId,
    Money WithdrawnPrincipal,
    DateTimeOffset WithdrawnAtUtc,
    DateTimeOffset RepaidAtUtc,
    decimal ElapsedDays,
    decimal ExactReturnRial,
    Money PayableReturn,
    Money TotalRepayment,
    string CalculationPolicyVersion);
