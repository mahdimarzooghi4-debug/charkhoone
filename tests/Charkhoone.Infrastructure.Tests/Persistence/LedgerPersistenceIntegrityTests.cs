using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Charkhoone.Infrastructure.Tests.Persistence;

public sealed class LedgerPersistenceIntegrityTests
{
    [Fact]
    public void PostedJournalEntryMutation_IsRejectedBeforeDatabaseWrite()
    {
        using var context = CreateContext();
        var row = new JournalEntryRow
        {
            Id = Guid.NewGuid(),
            ReferenceType = "Test",
            ReferenceId = Guid.NewGuid(),
            IdempotencyKey = $"test:{Guid.NewGuid():D}",
            Description = "posted",
            OccurredAtUtc = DateTimeOffset.UtcNow.AddMinutes(-1),
            PostedAtUtc = DateTimeOffset.UtcNow,
        };

        context.Attach(row);
        row.Description = "mutated";

        var exception = Assert.Throws<InvalidOperationException>(() => context.SaveChanges());
        Assert.Contains("immutable", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("reversal", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void PostedJournalLineDeletion_IsRejectedBeforeDatabaseWrite()
    {
        using var context = CreateContext();
        var row = new JournalLineRow
        {
            Id = Guid.NewGuid(),
            JournalEntryId = Guid.NewGuid(),
            LedgerAccountId = Guid.NewGuid(),
            DebitRial = 1m,
            CreditRial = 0m,
        };

        context.Attach(row);
        context.Remove(row);

        var exception = Assert.Throws<InvalidOperationException>(() => context.SaveChanges());
        Assert.Contains("immutable", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    private static CharkhooneDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql("Host=localhost;Database=charkhoone_model_test;Username=test;Password=test")
            .Options;

        return new CharkhooneDbContext(options);
    }
}
