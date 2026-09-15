namespace Charkhoone.Domain.Finance;

public static class FullDepositCalculator
{
    public const decimal MonthlyRentToFullDepositRatio = 0.03m;

    public static decimal Calculate(decimal cashDeposit, decimal monthlyRent)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(cashDeposit);
        ArgumentOutOfRangeException.ThrowIfNegative(monthlyRent);

        return cashDeposit + (monthlyRent / MonthlyRentToFullDepositRatio);
    }
}
