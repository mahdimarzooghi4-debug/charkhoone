namespace Charkhoone.Domain.Finance;

public static class FullDepositCalculator
{
    public const decimal MonthlyRentToFullDepositRatio = 0.03m;

    public static decimal Calculate(decimal cashDepositRial, decimal monthlyRentRial)
    {
        RialAmountPolicy.RequireWholeNonNegative(cashDepositRial, nameof(cashDepositRial));
        RialAmountPolicy.RequireWholeNonNegative(monthlyRentRial, nameof(monthlyRentRial));

        var exact = cashDepositRial + (monthlyRentRial / MonthlyRentToFullDepositRatio);
        return RialAmountPolicy.FloorToWholeRial(exact);
    }

    public static decimal CalculateFullDepositFromMonthlyRent(decimal monthlyRentRial)
    {
        RialAmountPolicy.RequireWholeNonNegative(monthlyRentRial, nameof(monthlyRentRial));
        return RialAmountPolicy.FloorToWholeRial(
            monthlyRentRial / MonthlyRentToFullDepositRatio);
    }

    public static decimal CalculateMonthlyRentFromFullDeposit(decimal fullDepositRial)
    {
        RialAmountPolicy.RequireWholeNonNegative(fullDepositRial, nameof(fullDepositRial));
        return RialAmountPolicy.FloorToWholeRial(
            fullDepositRial * MonthlyRentToFullDepositRatio);
    }
}
