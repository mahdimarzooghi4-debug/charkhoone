using System.Data;
using Npgsql;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class PostedLedgerProtectionTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    public Task InitializeAsync() => factory.MigrateAsync();
    public Task DisposeAsync() => Task.CompletedTask;
    private async Task<NpgsqlConnection> OpenAsync()
    {
        var c = new NpgsqlConnection(factory.ConnectionString);
        await c.OpenAsync();
        return c;
    }
    private static async Task Execute(NpgsqlConnection c, string sql)
    {
        await using var command = new NpgsqlCommand(sql, c) { CommandTimeout = 10 };
        await command.ExecuteNonQueryAsync();
    }
    private static string Header(Guid entry, Guid account, Guid? reversal = null) => $"""
        INSERT INTO ledger_accounts ("Id", "Code", "Name", "Currency", "CreatedAtUtc")
        VALUES ('{account}', 'protected-{account}', 'ledger test', 'IRR', now());
        INSERT INTO journal_entries ("Id", "ReferenceType", "ReferenceId", "IdempotencyKey", "Description", "OccurredAtUtc", "PostedAtUtc", "ReversalOfJournalEntryId")
        VALUES ('{entry}', 'LedgerProtectionTest', '{entry}', 'protected-{entry}', 'ledger test', now(), now(), {(reversal is null ? "NULL" : $"'{reversal}'")});
        """;
    private static string Line(Guid entry, Guid account, string debit, string credit) => $"""
        INSERT INTO journal_lines ("Id", "JournalEntryId", "LedgerAccountId", "DebitRial", "CreditRial")
        VALUES ('{Guid.NewGuid()}', '{entry}', '{account}', '{debit}'::numeric, '{credit}'::numeric);
        """;
    private static async Task<bool> Sealed(NpgsqlConnection c, Guid entry)
    {
        await using var cmd = new NpgsqlCommand($"SELECT \"IsSealed\" FROM journal_entries WHERE \"Id\" = '{entry}'", c);
        return (bool)(await cmd.ExecuteScalarAsync())!;
    }
    private async Task<(Guid Entry, Guid Account)> PostAsync()
    {
        await using var c = await OpenAsync();
        await using var tx = await c.BeginTransactionAsync();
        var entry = Guid.NewGuid(); var account = Guid.NewGuid();
        await Execute(c, Header(entry, account));
        Assert.False(await Sealed(c, entry));
        await Execute(c, Line(entry, account, "12.1234567890123456789", "0"));
        await Execute(c, Line(entry, account, "0", "12.1234567890123456789"));
        await tx.CommitAsync();
        Assert.True(await Sealed(c, entry));
        return (entry, account);
    }

    [Theory]
    [InlineData("0", "0")]
    [InlineData("-1", "0")]
    [InlineData("1", "1")]
    [InlineData("NaN", "0")]
    [InlineData("Infinity", "0")]
    [InlineData("0", "-Infinity")]
    public async Task InvalidLineSides_AreRejectedByPostgres(string debit, string credit)
    {
        await using var c = await OpenAsync();
        await using var tx = await c.BeginTransactionAsync();
        var entry = Guid.NewGuid(); var account = Guid.NewGuid();
        await Execute(c, Header(entry, account));
        var error = await Assert.ThrowsAsync<PostgresException>(() => Execute(c, Line(entry, account, debit, credit)));
        Assert.Equal(PostgresErrorCodes.CheckViolation, error.SqlState);
        Assert.Equal("CK_journal_lines_valid_sides", error.ConstraintName);
        await tx.RollbackAsync();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(2)]
    public async Task EmptyOneSidedOrUnbalancedJournal_FailsAtCommit(int lines)
    {
        await using var c = await OpenAsync();
        var entry = Guid.NewGuid(); var account = Guid.NewGuid();
        await using (var tx = await c.BeginTransactionAsync())
        {
            await Execute(c, Header(entry, account));
            if (lines > 0) await Execute(c, Line(entry, account, "10", "0"));
            if (lines > 1) await Execute(c, Line(entry, account, "0", "9"));
            var error = await Assert.ThrowsAsync<PostgresException>(() => tx.CommitAsync());
            Assert.Equal(PostgresErrorCodes.CheckViolation, error.SqlState);
            Assert.Contains("ledger_unbalanced_at_commit", error.MessageText);
        }
        await using var count = new NpgsqlCommand($"SELECT count(*) FROM journal_entries WHERE \"Id\" = '{entry}'", c);
        Assert.Equal(0L, await count.ExecuteScalarAsync());
    }

    [Theory]
    [InlineData("header_update")]
    [InlineData("header_delete")]
    [InlineData("unseal")]
    [InlineData("line_update")]
    [InlineData("line_delete")]
    [InlineData("balanced_append")]
    public async Task CommittedJournal_IsImmutableEvenThroughRawSql(string mutation)
    {
        var (entry, account) = await PostAsync();
        await using var c = await OpenAsync();
        await using var tx = await c.BeginTransactionAsync();
        var sql = mutation switch
        {
            "header_update" => $"UPDATE journal_entries SET \"Description\" = 'modified' WHERE \"Id\" = '{entry}'",
            "header_delete" => $"DELETE FROM journal_entries WHERE \"Id\" = '{entry}'",
            "unseal" => $"UPDATE journal_entries SET \"IsSealed\" = false WHERE \"Id\" = '{entry}'",
            "line_update" => $"UPDATE journal_lines SET \"DebitRial\" = \"DebitRial\" + 1 WHERE \"JournalEntryId\" = '{entry}'",
            "line_delete" => $"DELETE FROM journal_lines WHERE \"JournalEntryId\" = '{entry}'",
            "balanced_append" => Line(entry, account, "1", "0") + Line(entry, account, "0", "1"),
            _ => throw new ArgumentException(mutation),
        };
        var error = await Assert.ThrowsAsync<PostgresException>(() => Execute(c, sql));
        Assert.Equal(PostgresErrorCodes.CheckViolation, error.SqlState);
        Assert.Contains("posted_ledger_", error.MessageText);
        await tx.RollbackAsync();
        Assert.True(await Sealed(c, entry));
    }

    [Fact]
    public async Task ExplicitConstraintValidation_SealsJournalAndRejectsFurtherLines()
    {
        await using var c = await OpenAsync();
        await using var tx = await c.BeginTransactionAsync();
        var entry = Guid.NewGuid(); var account = Guid.NewGuid();
        await Execute(c, Header(entry, account));
        await Execute(c, "SAVEPOINT posting_lines");
        await Execute(c, Line(entry, account, "10", "0") + Line(entry, account, "0", "10"));
        await Execute(c, "RELEASE SAVEPOINT posting_lines; SET CONSTRAINTS ledger_seal IMMEDIATE");
        Assert.True(await Sealed(c, entry));
        var error = await Assert.ThrowsAsync<PostgresException>(() => Execute(c, Line(entry, account, "1", "0")));
        Assert.Contains("posted_ledger_append_forbidden", error.MessageText);
        await tx.RollbackAsync();
    }

    [Fact]
    public async Task ReversalPostsNewBalancedEntry_WithoutChangingOriginal()
    {
        var (original, account) = await PostAsync();
        await using var c = await OpenAsync();
        await using var tx = await c.BeginTransactionAsync();
        var reversal = Guid.NewGuid();
        // Same original account, opposite sides; no edit of the old journal.
        await Execute(c, $"""
            INSERT INTO journal_entries ("Id", "ReferenceType", "ReferenceId", "IdempotencyKey", "Description", "OccurredAtUtc", "PostedAtUtc", "ReversalOfJournalEntryId")
            VALUES ('{reversal}', 'Reversal', '{original}', 'reversal-{reversal}', 'correction', now(), now(), '{original}');
            """);
        await Execute(c, Line(reversal, account, "0", "12.1234567890123456789") + Line(reversal, account, "12.1234567890123456789", "0"));
        await tx.CommitAsync();
        Assert.True(await Sealed(c, original));
        Assert.True(await Sealed(c, reversal));
    }

    [Fact]
    public async Task ConcurrentAppendCannotChangeJournalWhileCreatorCommits()
    {
        await using var first = await OpenAsync();
        await using var second = await OpenAsync();
        await using var tx1 = await first.BeginTransactionAsync();
        var entry = Guid.NewGuid(); var account = Guid.NewGuid();
        await Execute(first, Header(entry, account));
        await Execute(first, Line(entry, account, "10", "0") + Line(entry, account, "0", "10"));
        await using (var tx2 = await second.BeginTransactionAsync())
        {
            // The second transaction cannot see/use the first transaction's unsealed header.
            var beforeCommit = await Assert.ThrowsAsync<PostgresException>(() => Execute(second, Line(entry, account, "1", "0")));
            Assert.Equal(PostgresErrorCodes.ForeignKeyViolation, beforeCommit.SqlState);
            await tx2.RollbackAsync();
        }
        await tx1.CommitAsync();
        await using var retry = await second.BeginTransactionAsync();
        var afterCommit = await Assert.ThrowsAsync<PostgresException>(() => Execute(second, Line(entry, account, "1", "0")));
        Assert.Contains("posted_ledger_append_forbidden", afterCommit.MessageText);
        await retry.RollbackAsync();
    }

    [Fact]
    public async Task BlankJournalKey_IsRejectedAtInsert()
    {
        await using var c = await OpenAsync();
        await using var tx = await c.BeginTransactionAsync();
        var entry = Guid.NewGuid(); var account = Guid.NewGuid();
        var error = await Assert.ThrowsAsync<PostgresException>(() => Execute(c,
            Header(entry, account).Replace($"protected-{entry}", "   ")));
        Assert.Equal("CK_journal_entries_idempotency", error.ConstraintName);
        await tx.RollbackAsync();
    }
}
