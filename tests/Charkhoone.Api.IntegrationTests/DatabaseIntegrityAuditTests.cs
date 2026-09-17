using Charkhoone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class DatabaseIntegrityAuditTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    public Task InitializeAsync() => factory.MigrateAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<NpgsqlConnection> OpenAsync()
    {
        var connection = new NpgsqlConnection(factory.ConnectionString);
        await connection.OpenAsync();
        return connection;
    }

    private static async Task ExecuteAsync(NpgsqlConnection connection, string sql)
    {
        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync();
    }

    private static async Task<Dictionary<string, long>> AuditAsync(NpgsqlConnection connection)
    {
        var sql = await File.ReadAllTextAsync(Path.Combine(AppContext.BaseDirectory, "audit-financial-integrity.sql"));
        await using var command = new NpgsqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync();
        var result = new Dictionary<string, long>();
        while (await reader.ReadAsync()) result.Add(reader.GetString(0), reader.GetInt64(1));
        Assert.Equal(14, result.Count);
        return result;
    }

    private static string SeedJournal(Guid entry, Guid account, Guid debit, Guid credit) => $"""
        INSERT INTO ledger_accounts ("Id", "Code", "Name", "Currency", "CreatedAtUtc")
        VALUES ('{account}', 'audit-{account}', 'synthetic audit', 'IRR', now());
        INSERT INTO journal_entries ("Id", "ReferenceType", "ReferenceId", "IdempotencyKey", "Description", "OccurredAtUtc", "PostedAtUtc")
        VALUES ('{entry}', 'AuditFixture', '{entry}', 'audit-{entry}', 'synthetic audit', now(), now());
        INSERT INTO journal_lines ("Id", "JournalEntryId", "LedgerAccountId", "DebitRial", "CreditRial") VALUES
        ('{debit}', '{entry}', '{account}', 10, 0), ('{credit}', '{entry}', '{account}', 0, 10);
        """;

    private static async Task<(Guid Entry, Guid Account, Guid Debit, Guid Credit)> SeedCommittedJournalAsync(
        NpgsqlConnection connection)
    {
        var entry = Guid.NewGuid();
        var account = Guid.NewGuid();
        var debit = Guid.NewGuid();
        var credit = Guid.NewGuid();
        await using var transaction = await connection.BeginTransactionAsync();
        await ExecuteAsync(connection, SeedJournal(entry, account, debit, credit));
        await transaction.CommitAsync();
        return (entry, account, debit, credit);
    }

    [Fact]
    public async Task BalancedJournal_CommitsAndIsSealed()
    {
        await using var connection = await OpenAsync();
        var journal = await SeedCommittedJournalAsync(connection);

        await using var command = new NpgsqlCommand(
            "SELECT count(*) FROM journal_entry_seals WHERE \"JournalEntryId\" = @id",
            connection);
        command.Parameters.AddWithValue("id", journal.Entry);
        Assert.Equal(1L, await command.ExecuteScalarAsync());
    }

    [Fact]
    public async Task UnbalancedJournal_IsRejectedAtTransactionCommit()
    {
        await using var connection = await OpenAsync();
        var entry = Guid.NewGuid();
        var account = Guid.NewGuid();
        await using var transaction = await connection.BeginTransactionAsync();
        await ExecuteAsync(connection, $"""
            INSERT INTO ledger_accounts ("Id", "Code", "Name", "Currency", "CreatedAtUtc")
            VALUES ('{account}', 'audit-unbalanced-{account}', 'synthetic audit', 'IRR', now());
            INSERT INTO journal_entries ("Id", "ReferenceType", "ReferenceId", "IdempotencyKey", "Description", "OccurredAtUtc", "PostedAtUtc")
            VALUES ('{entry}', 'AuditFixture', '{entry}', 'audit-unbalanced-{entry}', 'synthetic audit', now(), now());
            INSERT INTO journal_lines ("Id", "JournalEntryId", "LedgerAccountId", "DebitRial", "CreditRial") VALUES
            ('{Guid.NewGuid()}', '{entry}', '{account}', 10, 0),
            ('{Guid.NewGuid()}', '{entry}', '{account}', 0, 9);
            """);

        var exception = await Assert.ThrowsAsync<PostgresException>(() => transaction.CommitAsync());
        Assert.Equal(PostgresErrorCodes.CheckViolation, exception.SqlState);
    }

    [Theory]
    [InlineData("0", "0")]
    [InlineData("-10", "0")]
    [InlineData("10", "10")]
    [InlineData("'NaN'::numeric", "0")]
    public async Task JournalLineShapeCheck_RejectsInvalidSides(string debitSql, string creditSql)
    {
        await using var connection = await OpenAsync();
        var entry = Guid.NewGuid();
        var account = Guid.NewGuid();
        await using var transaction = await connection.BeginTransactionAsync();
        await ExecuteAsync(connection, $"""
            INSERT INTO ledger_accounts ("Id", "Code", "Name", "Currency", "CreatedAtUtc")
            VALUES ('{account}', 'audit-line-shape-{account}', 'synthetic audit', 'IRR', now());
            INSERT INTO journal_entries ("Id", "ReferenceType", "ReferenceId", "IdempotencyKey", "Description", "OccurredAtUtc", "PostedAtUtc")
            VALUES ('{entry}', 'AuditFixture', '{entry}', 'audit-line-shape-{entry}', 'synthetic audit', now(), now());
            """);

        var exception = await Assert.ThrowsAsync<PostgresException>(() => ExecuteAsync(connection, $"""
            INSERT INTO journal_lines ("Id", "JournalEntryId", "LedgerAccountId", "DebitRial", "CreditRial")
            VALUES ('{Guid.NewGuid()}', '{entry}', '{account}', {debitSql}, {creditSql})
            """));
        Assert.Equal(PostgresErrorCodes.CheckViolation, exception.SqlState);
        await transaction.RollbackAsync();
    }

    [Fact]
    public async Task CanonicalCurrencyBlankIdempotencyAndFrozenPrincipalForeignKey_AreDatabaseEnforced()
    {
        await using var connection = await OpenAsync();

        var currency = await Assert.ThrowsAsync<PostgresException>(() => ExecuteAsync(connection, $"""
            INSERT INTO ledger_accounts ("Id", "Code", "Name", "Currency", "CreatedAtUtc")
            VALUES ('{Guid.NewGuid()}', 'audit-bad-currency-{Guid.NewGuid()}', 'synthetic audit', 'TOMAN', now())
            """));
        Assert.Equal(PostgresErrorCodes.CheckViolation, currency.SqlState);

        var entry = Guid.NewGuid();
        var blankKey = await Assert.ThrowsAsync<PostgresException>(() => ExecuteAsync(connection, $"""
            INSERT INTO journal_entries ("Id", "ReferenceType", "ReferenceId", "IdempotencyKey", "Description", "OccurredAtUtc", "PostedAtUtc")
            VALUES ('{entry}', 'AuditFixture', '{entry}', '   ', 'synthetic audit', now(), now())
            """));
        Assert.Equal(PostgresErrorCodes.CheckViolation, blankKey.SqlState);

        var orphan = await Assert.ThrowsAsync<PostgresException>(() => ExecuteAsync(connection, $"""
            INSERT INTO frozen_principals ("ContractId", "BankId", "AmountRial", "FundReference", "FrozenAtUtc")
            VALUES ('{Guid.NewGuid()}', 'audit-bank', 10, 'audit', now())
            """));
        Assert.Equal(PostgresErrorCodes.ForeignKeyViolation, orphan.SqlState);
    }

    [Fact]
    public async Task PostedJournalEntry_RawSqlUpdateAndDeleteAreRejected()
    {
        await using var connection = await OpenAsync();
        var journal = await SeedCommittedJournalAsync(connection);

        var update = await Assert.ThrowsAsync<PostgresException>(() => ExecuteAsync(connection,
            $"UPDATE journal_entries SET \"Description\" = 'changed' WHERE \"Id\" = '{journal.Entry}'"));
        Assert.Equal("55000", update.SqlState);

        var delete = await Assert.ThrowsAsync<PostgresException>(() => ExecuteAsync(connection,
            $"DELETE FROM journal_entries WHERE \"Id\" = '{journal.Entry}'"));
        Assert.Equal("55000", delete.SqlState);
    }

    [Fact]
    public async Task PostedJournalLines_RawSqlUpdateDeleteAndAppendAreRejected()
    {
        await using var connection = await OpenAsync();
        var journal = await SeedCommittedJournalAsync(connection);

        var update = await Assert.ThrowsAsync<PostgresException>(() => ExecuteAsync(connection,
            $"UPDATE journal_lines SET \"DebitRial\" = 11 WHERE \"Id\" = '{journal.Debit}'"));
        Assert.Equal("55000", update.SqlState);

        var delete = await Assert.ThrowsAsync<PostgresException>(() => ExecuteAsync(connection,
            $"DELETE FROM journal_lines WHERE \"Id\" = '{journal.Debit}'"));
        Assert.Equal("55000", delete.SqlState);

        var append = await Assert.ThrowsAsync<PostgresException>(() => ExecuteAsync(connection, $"""
            INSERT INTO journal_lines ("Id", "JournalEntryId", "LedgerAccountId", "DebitRial", "CreditRial")
            VALUES ('{Guid.NewGuid()}', '{journal.Entry}', '{journal.Account}', 1, 0)
            """));
        Assert.Equal("55000", append.SqlState);
    }

    [Fact]
    public async Task LedgerProtectionTriggers_AreInstalledAndDeferredValidationIsDeferrable()
    {
        await using var connection = await OpenAsync();
        await using var command = new NpgsqlCommand("""
            SELECT tgname, tgdeferrable, tginitdeferred
            FROM pg_trigger g
            JOIN pg_class t ON t.oid = g.tgrelid
            WHERE t.relnamespace = 'public'::regnamespace
              AND NOT g.tgisinternal
              AND tgname IN (
                'trg_journal_entries_immutable',
                'trg_journal_lines_immutable',
                'trg_journal_lines_reject_after_seal',
                'trg_journal_entry_seals_immutable',
                'trg_journal_entry_balanced_deferred',
                'trg_journal_line_balanced_deferred')
            ORDER BY tgname
            """, connection);
        await using var reader = await command.ExecuteReaderAsync();
        var triggers = new Dictionary<string, (bool Deferrable, bool InitiallyDeferred)>();
        while (await reader.ReadAsync())
        {
            triggers.Add(reader.GetString(0), (reader.GetBoolean(1), reader.GetBoolean(2)));
        }

        Assert.Equal(6, triggers.Count);
        Assert.Equal((true, true), triggers["trg_journal_entry_balanced_deferred"]);
        Assert.Equal((true, true), triggers["trg_journal_line_balanced_deferred"]);
        Assert.False(triggers["trg_journal_entries_immutable"].Deferrable);
        Assert.False(triggers["trg_journal_lines_immutable"].Deferrable);
        Assert.False(triggers["trg_journal_lines_reject_after_seal"].Deferrable);
        Assert.False(triggers["trg_journal_entry_seals_immutable"].Deferrable);
    }

    [Fact]
    public async Task FinancialIntegrityAudit_RemainsCleanAfterEnforcement()
    {
        await using var connection = await OpenAsync();
        var audit = await AuditAsync(connection);
        Assert.All(audit, check => Assert.Equal(0L, check.Value));
    }

    [Fact]
    public async Task ExistingForeignKeyAndIdempotencyConstraints_RejectInvalidWrites()
    {
        await using var connection = await OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync();
        var entry = Guid.NewGuid();
        var account = Guid.NewGuid();
        await ExecuteAsync(connection, SeedJournal(entry, account, Guid.NewGuid(), Guid.NewGuid()));
        await ExecuteAsync(connection, "SAVEPOINT probe");
        var fk = await Assert.ThrowsAsync<PostgresException>(() => ExecuteAsync(connection,
            $"INSERT INTO journal_lines (\"Id\", \"JournalEntryId\", \"LedgerAccountId\", \"DebitRial\", \"CreditRial\") VALUES ('{Guid.NewGuid()}', '{Guid.NewGuid()}', '{account}', 1, 0)"));
        Assert.Equal(PostgresErrorCodes.ForeignKeyViolation, fk.SqlState);
        await ExecuteAsync(connection, "ROLLBACK TO SAVEPOINT probe");
        var unique = await Assert.ThrowsAsync<PostgresException>(() => ExecuteAsync(connection,
            $"INSERT INTO journal_entries SELECT (jsonb_populate_record(NULL::journal_entries, to_jsonb(t) || jsonb_build_object('Id', gen_random_uuid()))).* FROM journal_entries t WHERE \"Id\" = '{entry}'"));
        Assert.Equal(PostgresErrorCodes.UniqueViolation, unique.SqlState);
        await transaction.RollbackAsync();
    }

    [Fact]
    public async Task EveryModelForeignKeyAndUniqueIndex_ExistsInMigratedPostgres()
    {
        await using var connection = await OpenAsync();
        using var db = new CharkhooneDbContext(new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql(factory.ConnectionString).Options);
        var foreignKeys = db.Model.GetEntityTypes().SelectMany(e => e.GetForeignKeys()).ToList();
        Assert.NotEmpty(foreignKeys);
        foreach (var fk in foreignKeys)
        {
            await using var command = new NpgsqlCommand("""
                SELECT count(*) FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
                JOIN pg_class p ON p.oid = c.confrelid
                WHERE c.connamespace = 'public'::regnamespace AND c.contype = 'f'
                  AND c.convalidated AND t.relname = @table AND p.relname = @parent AND c.conname = @name
                """, connection);
            command.Parameters.AddWithValue("table", fk.DeclaringEntityType.GetTableName()!);
            command.Parameters.AddWithValue("parent", fk.PrincipalEntityType.GetTableName()!);
            command.Parameters.AddWithValue("name", fk.GetConstraintName()!);
            Assert.Equal(1L, await command.ExecuteScalarAsync());
        }
        foreach (var index in db.Model.GetEntityTypes().SelectMany(e => e.GetIndexes()).Where(i => i.IsUnique))
        {
            await using var command = new NpgsqlCommand("""
                SELECT count(*) FROM pg_index i JOIN pg_class x ON x.oid = i.indexrelid
                JOIN pg_class t ON t.oid = i.indrelid
                WHERE t.relnamespace = 'public'::regnamespace AND t.relname = @table AND x.relname = @name
                  AND i.indisunique AND i.indisvalid AND i.indisready
                """, connection);
            command.Parameters.AddWithValue("table", index.DeclaringEntityType.GetTableName()!);
            command.Parameters.AddWithValue("name", index.GetDatabaseName()!);
            Assert.Equal(1L, await command.ExecuteScalarAsync());
        }
    }
}
