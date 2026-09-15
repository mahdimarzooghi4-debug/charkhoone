namespace Charkhoone.Domain.Finance;

public static class CreditAllocationCalculator
{
    public static decimal CalculateMaximumLoan(decimal fullDeposit, string externalSubGrade)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(fullDeposit);
        return fullDeposit * CreditGradePolicy.GetLoanRatio(externalSubGrade);
    }

    public static decimal CalculateTenantContribution(decimal fullDeposit, decimal bankApprovedLoan)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(fullDeposit);
        ArgumentOutOfRangeException.ThrowIfNegative(bankApprovedLoan);

        if (bankApprovedLoan > fullDeposit)
        {
            throw new ArgumentOutOfRangeException(
                nameof(bankApprovedLoan),
                bankApprovedLoan,
                "Bank-approved loan cannot exceed the full-deposit amount.");
        }

        return fullDeposit - bankApprovedLoan;
    }
}
