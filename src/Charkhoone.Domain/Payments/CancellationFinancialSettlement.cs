using Charkhoone.Domain.Finance;

namespace Charkhoone.Domain.Payments;

public sealed record CancellationFinancialSettlement(
    decimal TenantContributionBeforeSettlementRial,
    decimal LostFundReturnRial,
    decimal OwnerResidualRial);

/// <summary>
/// Calculates the early-cancellation split of the remaining tenant contribution.
/// Coverage principal has already been removed from the tenant contribution when coverage succeeds.
/// Therefore cancellation deducts only still-open contractual lost-fund-return amounts and transfers
/// the remaining tenant contribution to the owner. Frozen bank principal is outside this calculation.
/// </summary>
public static class CancellationFinancialSettlementCalculator
{
    public static CancellationFinancialSettlement Calculate(
        decimal postedTenantContributionRial,
        IEnumerable<LostFundReturnAccrual> openLostFundReturnAccruals)
    {
        RialAmountPolicy.RequireWholeNonNegative(
            postedTenantContributionRial,
            nameof(postedTenantContributionRial));
        ArgumentNullException.ThrowIfNull(openLostFundReturnAccruals);

        var accruals = openLostFundReturnAccruals.ToArray();
        var lostFundReturnRial = 0m;

        foreach (var accrual in accruals)
        {
            if (accrual.CalculationPolicyVersion != LostFundReturnTerms.CalculationPolicyVersion)
            {
                throw new InvalidOperationException(
                    "Cancellation lost-fund-return accrual does not match the approved calculation policy.");
            }

            RialAmountPolicy.RequireWholeNonNegative(
                accrual.PayableReturn.Rial,
                nameof(openLostFundReturnAccruals));
            lostFundReturnRial = checked(lostFundReturnRial + accrual.PayableReturn.Rial);
        }

        if (lostFundReturnRial > postedTenantContributionRial)
        {
            throw new InvalidOperationException(
                "Tenant contribution is insufficient to settle cancellation lost-fund-return obligations.");
        }

        return new CancellationFinancialSettlement(
            postedTenantContributionRial,
            lostFundReturnRial,
            postedTenantContributionRial - lostFundReturnRial);
    }
}
