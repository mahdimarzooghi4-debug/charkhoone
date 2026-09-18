namespace Charkhoone.Domain.Finance;

public static class CreditAllocationCalculator
{
    public static decimal CalculateMaximumLoan(decimal fullDepositRial, string externalSubGrade)
    {
        RialAmountPolicy.RequireWholeNonNegative(fullDepositRial, nameof(fullDepositRial));
        return RialAmountPolicy.FloorToWholeRial(
            fullDepositRial * CreditGradePolicy.GetLoanRatio(externalSubGrade));
    }

    public static decimal CalculateTenantContribution(decimal fullDepositRial, decimal bankApprovedLoanRial)
    {
        RialAmountPolicy.RequireWholeNonNegative(fullDepositRial, nameof(fullDepositRial));
        RialAmountPolicy.RequireWholeNonNegative(bankApprovedLoanRial, nameof(bankApprovedLoanRial));

        if (bankApprovedLoanRial > fullDepositRial)
        {
            throw new ArgumentOutOfRangeException(
                nameof(bankApprovedLoanRial),
                bankApprovedLoanRial,
                "Bank-approved loan cannot exceed the full-deposit amount.");
        }

        return fullDepositRial - bankApprovedLoanRial;
    }
}
