namespace Charkhoone.Domain.Finance;

public enum ExternalCreditResultStatus
{
    Valid,
    Unknown,
    Invalid,
}

public sealed record ExternalCreditResult(
    string Provider,
    ExternalCreditResultStatus Status,
    string? Grade,
    string RawReference,
    DateTimeOffset VerifiedAt);

public sealed record FundingAllocation(
    Money FullDepositEquivalent,
    Money BankApprovedLoan,
    Money TenantContribution)
{
    public static FundingAllocation Create(Money fullDepositEquivalent, Money bankApprovedLoan)
    {
        RialAmountPolicy.RequireWholeNonNegative(fullDepositEquivalent.Rial, nameof(fullDepositEquivalent));
        RialAmountPolicy.RequireWholeNonNegative(bankApprovedLoan.Rial, nameof(bankApprovedLoan));

        if (bankApprovedLoan.Rial > fullDepositEquivalent.Rial)
        {
            throw new ArgumentOutOfRangeException(nameof(bankApprovedLoan));
        }

        return new FundingAllocation(
            fullDepositEquivalent,
            bankApprovedLoan,
            fullDepositEquivalent - bankApprovedLoan);
    }
}

/// <summary>
/// Immutable representation of the bank principal frozen in the fund. There is deliberately no debit operation.
/// Coverage and landlord-transfer flows must use tenant contribution, never this principal.
/// </summary>
public sealed record FrozenPrincipal
{
    public FrozenPrincipal(Guid contractId, string bankId, Money amount, string fundReference)
    {
        if (contractId == Guid.Empty) throw new ArgumentException("Contract id is required.", nameof(contractId));
        ArgumentException.ThrowIfNullOrWhiteSpace(bankId);
        ArgumentException.ThrowIfNullOrWhiteSpace(fundReference);
        RialAmountPolicy.RequireWholeNonNegative(amount.Rial, nameof(amount));

        ContractId = contractId;
        BankId = bankId.Trim();
        Amount = amount;
        FundReference = fundReference.Trim();
    }

    public Guid ContractId { get; }
    public string BankId { get; }
    public Money Amount { get; }
    public string FundReference { get; }
}
