using Charkhoone.Domain.Finance;

namespace Charkhoone.Domain.Payments;

/// <summary>
/// Approved business terms for tracking fund return lost when Charkhoone covers an unpaid obligation
/// from the tenant contribution. This deliberately does not calculate an accrued return: day-count,
/// rounding, and partial-replenishment allocation remain undefined product policy.
/// </summary>
public static class LostFundReturnTerms
{
    public const decimal MonthlyRate = 0.03m;

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

        if (withdrawnAmountRial <= 0m)
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
}

public sealed record LostFundReturnExposure(
    Guid ContractId,
    Guid CoveragePaymentId,
    Money WithdrawnAmount,
    decimal MonthlyRate,
    DateTimeOffset WithdrawnAtUtc);
