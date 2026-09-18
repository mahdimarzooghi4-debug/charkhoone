namespace Charkhoone.Domain.Finance;

public sealed record JournalLineDraft(Guid LedgerAccountId, Money Debit, Money Credit)
{
    public static JournalLineDraft Create(Guid ledgerAccountId, decimal debitRial, decimal creditRial)
    {
        if (ledgerAccountId == Guid.Empty)
        {
            throw new ArgumentException("Ledger account id is required.", nameof(ledgerAccountId));
        }

        RialAmountPolicy.RequireWholeNonNegative(debitRial, nameof(debitRial));
        RialAmountPolicy.RequireWholeNonNegative(creditRial, nameof(creditRial));

        var hasDebit = debitRial > 0m;
        var hasCredit = creditRial > 0m;
        if (hasDebit == hasCredit)
        {
            throw new ArgumentException("A journal line must have exactly one positive side.");
        }

        return new JournalLineDraft(
            ledgerAccountId,
            Money.NonNegative(debitRial, nameof(debitRial)),
            Money.NonNegative(creditRial, nameof(creditRial)));
    }
}

public sealed class JournalEntryDraft
{
    private JournalEntryDraft(IReadOnlyList<JournalLineDraft> lines, Money totalDebit, Money totalCredit)
    {
        Lines = lines;
        TotalDebit = totalDebit;
        TotalCredit = totalCredit;
    }

    public IReadOnlyList<JournalLineDraft> Lines { get; }
    public Money TotalDebit { get; }
    public Money TotalCredit { get; }

    public static JournalEntryDraft Create(IEnumerable<JournalLineDraft> lines)
    {
        ArgumentNullException.ThrowIfNull(lines);

        var materialized = lines.ToArray();
        if (materialized.Length < 2)
        {
            throw new ArgumentException("A posted journal entry requires at least two lines.", nameof(lines));
        }

        var totalDebit = materialized.Sum(x => x.Debit.Rial);
        var totalCredit = materialized.Sum(x => x.Credit.Rial);

        if (totalDebit <= 0m || totalCredit <= 0m)
        {
            throw new InvalidOperationException("A posted journal entry must have a positive value on both sides.");
        }

        if (totalDebit != totalCredit)
        {
            throw new InvalidOperationException("Journal entry debits and credits must be equal.");
        }

        return new JournalEntryDraft(
            materialized,
            Money.NonNegative(totalDebit),
            Money.NonNegative(totalCredit));
    }
}
