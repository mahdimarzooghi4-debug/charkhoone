namespace Charkhoone.Domain.Finance;

/// <summary>
/// Monetary value in the platform reference unit (rial). This type deliberately does not round;
/// the approved rounding points are still an open P0 decision.
/// </summary>
public readonly record struct Money(decimal Rial)
{
    public static Money Zero => new(0m);

    public static Money NonNegative(decimal rial, string? paramName = null)
    {
        if (rial < 0m)
        {
            throw new ArgumentOutOfRangeException(paramName ?? nameof(rial), rial, "Money amount cannot be negative here.");
        }

        return new Money(rial);
    }

    public static Money operator +(Money left, Money right) => new(left.Rial + right.Rial);
    public static Money operator -(Money left, Money right) => new(left.Rial - right.Rial);
    public static Money operator *(Money value, decimal multiplier) => new(value.Rial * multiplier);
    public static Money operator /(Money value, decimal divisor) => new(value.Rial / divisor);
}
