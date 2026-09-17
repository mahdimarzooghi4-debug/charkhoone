namespace Charkhoone.Domain.Finance;

/// <summary>
/// Computes the tenant-contribution position only from the confirmed tenant contribution,
/// confirmed replenishments, confirmed coverage debits, and coverage reservations.
/// Frozen bank principal is deliberately not part of this calculation.
/// </summary>
public sealed record TenantContributionBalanceSnapshot(
    Money InitialContribution,
    Money ConfirmedReplenishments,
    Money ConfirmedCoverage,
    Money ReservedCoverage,
    Money PostedBalance,
    Money AvailableForCoverage)
{
    public static TenantContributionBalanceSnapshot Calculate(
        decimal initialContributionRial,
        decimal confirmedReplenishmentsRial,
        decimal confirmedCoverageRial,
        decimal reservedCoverageRial = 0m)
    {
        var initial = Money.NonNegative(initialContributionRial, nameof(initialContributionRial));
        var replenishments = Money.NonNegative(confirmedReplenishmentsRial, nameof(confirmedReplenishmentsRial));
        var coverage = Money.NonNegative(confirmedCoverageRial, nameof(confirmedCoverageRial));
        var reserved = Money.NonNegative(reservedCoverageRial, nameof(reservedCoverageRial));

        var postedBalanceRial = initial.Rial + replenishments.Rial - coverage.Rial;
        if (postedBalanceRial < 0m)
        {
            throw new InvalidOperationException("Confirmed tenant-contribution coverage cannot exceed funded contribution plus confirmed replenishments.");
        }

        var availableForCoverageRial = postedBalanceRial - reserved.Rial;
        if (availableForCoverageRial < 0m)
        {
            throw new InvalidOperationException("Coverage reservations cannot exceed the posted tenant-contribution balance.");
        }

        return new TenantContributionBalanceSnapshot(
            initial,
            replenishments,
            coverage,
            reserved,
            Money.NonNegative(postedBalanceRial),
            Money.NonNegative(availableForCoverageRial));
    }
}
