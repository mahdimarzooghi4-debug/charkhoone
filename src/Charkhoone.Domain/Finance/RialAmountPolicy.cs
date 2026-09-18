namespace Charkhoone.Domain.Finance;

/// <summary>
/// Canonical money-boundary rules for IRR. Calculations may use decimal precision internally,
/// but any amount that becomes a contractual, payable, transferable, or posted amount must be
/// expressed as a whole rial. Fractional rials are always discarded toward negative infinity;
/// all supported business amounts here are non-negative, so this is equivalent to truncating
/// the fractional rial.
/// </summary>
public static class RialAmountPolicy
{
    public static decimal FloorToWholeRial(decimal calculatedRial, string? paramName = null)
    {
        if (calculatedRial < 0m)
        {
            throw new ArgumentOutOfRangeException(
                paramName ?? nameof(calculatedRial),
                calculatedRial,
                "Rial amount cannot be negative here.");
        }

        return decimal.Floor(calculatedRial);
    }

    public static decimal RequireWholeNonNegative(decimal rial, string? paramName = null)
    {
        if (rial < 0m)
        {
            throw new ArgumentOutOfRangeException(
                paramName ?? nameof(rial),
                rial,
                "Rial amount cannot be negative here.");
        }

        if (rial != decimal.Truncate(rial))
        {
            throw new ArgumentException(
                "Stored or supplied money must be expressed in whole rials.",
                paramName ?? nameof(rial));
        }

        return rial;
    }
}
