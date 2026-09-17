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

    [Theory]
    [InlineData("journal_balance", "delete_line")]
    [InlineData("journal_line_sides", "zero_sides")]
    [InlineData("journal_line_sides", "negative_side")]
    [InlineData("journal_line_sides", "two_positive_sides")]
    [InlineData("journal_line_sides", "nan_side")]
    [InlineData("canonical_currency", "currency")]
    [InlineData("blank_idempotency_key", "blank_key")]
    [InlineData("frozen_principal_orphan", "orphan")]
    public async Task AuditDetectsCorruptionThatCurrentDatabaseConstraintsAllow(string code, string mutation)
    {
        await using var connection = await OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync(System.Data.IsolationLevel.RepeatableRead);
        var entry = Guid.NewGuid(); var account = Guid.NewGuid();
        var debit = Guid.NewGuid(); var credit = Guid.NewGuid();
        await ExecuteAsync(connection, SeedJournal(entry, account, debit, credit));
        var before = await AuditAsync(connection);
        var sql = mutation switch
        {
            "delete_line" => $"DELETE FROM journal_lines WHERE \"Id\" = '{debit}'",
            "zero_sides" => $"UPDATE journal_lines SET \"DebitRial\" = 0 WHERE \"Id\" = '{debit}'",
            "negative_side" => $"UPDATE journal_lines SET \"DebitRial\" = -10 WHERE \"Id\" = '{debit}'",
            "two_positive_sides" => $"UPDATE journal_lines SET \"CreditRial\" = 10 WHERE \"Id\" = '{debit}'",
            "nan_side" => $"UPDATE journal_lines SET \"DebitRial\" = 'NaN'::numeric WHERE \"Id\" = '{debit}'",
            "currency" => $"UPDATE ledger_accounts SET \"Currency\" = 'TOMAN' WHERE \"Id\" = '{account}'",
            "blank_key" => $"UPDATE journal_entries SET \"IdempotencyKey\" = '   ' WHERE \"Id\" = '{entry}'",
            "orphan" => $"INSERT INTO frozen_principals (\"ContractId\", \"BankId\", \"AmountRial\", \"FundReference\", \"FrozenAtUtc\") VALUES ('{entry}', 'audit-bank', 10, 'audit', now())",
            _ => throw new ArgumentException(mutation),
        };
        await ExecuteAsync(connection, sql);
        var after = await AuditAsync(connection);
        Assert.Equal(before[code] + 1, after[code]);
        await transaction.RollbackAsync();
    }

    [Fact]
    public async Task PostedLedgerMutationAndCascadeDelete_AreDocumentedDatabaseProtectionGaps()
    {
        await using var connection = await OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync();
        var entry = Guid.NewGuid(); var account = Guid.NewGuid();
        await ExecuteAsync(connection, SeedJournal(entry, account, Guid.NewGuid(), Guid.NewGuid()));
        // Characterization of the audited baseline, NOT approval of this behavior.
        // A future enforcement migration must replace these assertions with rejection tests.
        await using var update = new NpgsqlCommand($"UPDATE journal_entries SET \"Description\" = 'changed' WHERE \"Id\" = '{entry}'", connection);
        Assert.Equal(1, await update.ExecuteNonQueryAsync());
        await ExecuteAsync(connection, $"DELETE FROM journal_entries WHERE \"Id\" = '{entry}'");
        await using var count = new NpgsqlCommand($"SELECT count(*) FROM journal_lines WHERE \"JournalEntryId\" = '{entry}'", connection);
        Assert.Equal(0L, await count.ExecuteScalarAsync());
        await transaction.RollbackAsync();
    }

    [Fact]
    public async Task ExistingForeignKeyAndIdempotencyConstraints_RejectInvalidWrites()
    {
        await using var connection = await OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync();
        var entry = Guid.NewGuid(); var account = Guid.NewGuid();
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
