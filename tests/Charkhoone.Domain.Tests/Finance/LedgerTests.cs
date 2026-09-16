using Charkhoone.Domain.Finance;
using Xunit;

namespace Charkhoone.Domain.Tests.Finance;

public sealed class LedgerTests
{
    [Fact]
    public void BalancedJournalEntry_PreservesExactRialAmount()
    {
        var debitAccount = Guid.NewGuid();
        var creditAccount = Guid.NewGuid();
        const decimal amount = 123456789.123456789m;

        var entry = JournalEntryDraft.Create(
        [
            JournalLineDraft.Create(debitAccount, amount, 0m),
            JournalLineDraft.Create(creditAccount, 0m, amount),
        ]);

        Assert.Equal(amount, entry.TotalDebit.Rial);
        Assert.Equal(amount, entry.TotalCredit.Rial);
        Assert.Equal(2, entry.Lines.Count);
    }

    [Fact]
    public void UnbalancedJournalEntry_IsRejected()
    {
        Assert.Throws<InvalidOperationException>(() =>
            JournalEntryDraft.Create(
            [
                JournalLineDraft.Create(Guid.NewGuid(), 100m, 0m),
                JournalLineDraft.Create(Guid.NewGuid(), 0m, 99m),
            ]));
    }

    [Fact]
    public void JournalLine_RequiresExactlyOnePositiveSide()
    {
        Assert.Throws<ArgumentException>(() =>
            JournalLineDraft.Create(Guid.NewGuid(), 100m, 100m));

        Assert.Throws<ArgumentException>(() =>
            JournalLineDraft.Create(Guid.NewGuid(), 0m, 0m));
    }
}
