using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class LedgerDatabaseIntegrityIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;

    public Task InitializeAsync() => _factory.MigrateAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task JournalLine_CheckConstraint_RejectsTwoSidedEntry()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
        var now = DateTimeOffset.UtcNow;
        var journalEntryId = Guid.NewGuid();
        var ledgerAccountId = Guid.NewGuid();

        dbContext.LedgerAccounts.Add(new LedgerAccountRow
        {
            Id = ledgerAccountId,
            Code = $"integration:{ledgerAccountId:D}",
            Name = "Ledger integrity integration account",
            Currency = "IRR",
            CreatedAtUtc = now,
        });
        dbContext.JournalEntries.Add(new JournalEntryRow
        {
            Id = journalEntryId,
            ReferenceType = "IntegrationTest",
            ReferenceId = Guid.NewGuid(),
            IdempotencyKey = $"integration-ledger:{journalEntryId:D}",
            Description = "Valid journal header for database check-constraint verification.",
            OccurredAtUtc = now,
            PostedAtUtc = now,
        });
        await dbContext.SaveChangesAsync();

        var exception = await Assert.ThrowsAsync<PostgresException>(async () =>
            await dbContext.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO journal_lines
                    ("Id", "JournalEntryId", "LedgerAccountId", "DebitRial", "CreditRial")
                VALUES
                    ({Guid.NewGuid()}, {journalEntryId}, {ledgerAccountId}, {100m}, {100m})
                """));

        Assert.Equal(PostgresErrorCodes.CheckViolation, exception.SqlState);
        Assert.Equal("CK_journal_lines_one_sided_positive_amount", exception.ConstraintName);
    }

    [Fact]
    public async Task JournalEntry_CheckConstraint_RejectsPostingBeforeOccurrence()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
        var occurredAtUtc = DateTimeOffset.UtcNow;
        var postedAtUtc = occurredAtUtc.AddMinutes(-1);
        var id = Guid.NewGuid();

        var exception = await Assert.ThrowsAsync<PostgresException>(async () =>
            await dbContext.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO journal_entries
                    ("Id", "ReferenceType", "ReferenceId", "IdempotencyKey", "Description", "OccurredAtUtc", "PostedAtUtc", "ReversalOfJournalEntryId")
                VALUES
                    ({id}, {"IntegrationTest"}, {Guid.NewGuid()}, {$"invalid-post-time:{id:D}"}, {"invalid posting chronology"}, {occurredAtUtc}, {postedAtUtc}, {null})
                """));

        Assert.Equal(PostgresErrorCodes.CheckViolation, exception.SqlState);
        Assert.Equal("CK_journal_entries_posted_at_or_after_occurred_at", exception.ConstraintName);
    }
}
