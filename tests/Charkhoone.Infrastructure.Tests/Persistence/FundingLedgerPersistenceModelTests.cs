using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Charkhoone.Infrastructure.Tests.Persistence;

public sealed class FundingLedgerPersistenceModelTests
{
    [Fact]
    public void TenantContributionFunding_IsIdempotentPerFundingAllocation()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(TenantContributionFundingRow));

        Assert.NotNull(entity);
        Assert.Equal("tenant_contribution_fundings", entity!.GetTableName());
        Assert.Contains(entity.GetIndexes(), index =>
            index.IsUnique
            && index.Properties.Count == 1
            && index.Properties[0].Name == nameof(TenantContributionFundingRow.FundingAllocationId));
        Assert.Contains(entity.GetIndexes(), index =>
            index.IsUnique
            && index.Properties.Count == 1
            && index.Properties[0].Name == nameof(TenantContributionFundingRow.ExternalTransactionId));
    }

    [Fact]
    public void ExternalTransaction_UsesUniqueIdempotencyAndLosslessMoneyStorage()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(ExternalTransactionRow));

        Assert.NotNull(entity);
        Assert.Equal("external_transactions", entity!.GetTableName());
        Assert.Contains(entity.GetIndexes(), index =>
            index.IsUnique
            && index.Properties.Count == 1
            && index.Properties[0].Name == nameof(ExternalTransactionRow.IdempotencyKey));

        var amount = entity.FindProperty(nameof(ExternalTransactionRow.AmountRial));
        AssertUnscaledNumeric(amount);
    }

    [Fact]
    public void TenantContribution_StoresInitialFundedAmountWithoutInventingMutableBalanceTruth()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(TenantContributionRow));

        Assert.NotNull(entity);
        Assert.Equal("tenant_contributions", entity!.GetTableName());
        Assert.NotNull(entity.FindProperty(nameof(TenantContributionRow.InitialAmountRial)));
        Assert.DoesNotContain(entity.GetProperties(), property =>
            property.Name.Contains("Available", StringComparison.OrdinalIgnoreCase)
            || property.Name.Contains("CurrentBalance", StringComparison.OrdinalIgnoreCase)
            || property.Name.Contains("FrozenPrincipal", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void LedgerJournal_HasUniquePostingKeyAndRialPrecision()
    {
        using var context = CreateContext();
        var account = context.Model.FindEntityType(typeof(LedgerAccountRow));
        var entry = context.Model.FindEntityType(typeof(JournalEntryRow));
        var line = context.Model.FindEntityType(typeof(JournalLineRow));

        Assert.NotNull(account);
        Assert.Contains(account!.GetIndexes(), index =>
            index.IsUnique
            && index.Properties.Count == 1
            && index.Properties[0].Name == nameof(LedgerAccountRow.Code));

        Assert.NotNull(entry);
        Assert.Contains(entry!.GetIndexes(), index =>
            index.IsUnique
            && index.Properties.Count == 1
            && index.Properties[0].Name == nameof(JournalEntryRow.IdempotencyKey));
        Assert.NotNull(entry.FindProperty(nameof(JournalEntryRow.ReversalOfJournalEntryId)));

        Assert.NotNull(line);
        var debit = line!.FindProperty(nameof(JournalLineRow.DebitRial));
        var credit = line.FindProperty(nameof(JournalLineRow.CreditRial));
        AssertUnscaledNumeric(debit);
        AssertUnscaledNumeric(credit);
    }

    private static void AssertUnscaledNumeric(Microsoft.EntityFrameworkCore.Metadata.IProperty? property)
    {
        Assert.NotNull(property);
        Assert.Equal("numeric", property!.GetColumnType());
        Assert.Null(property.GetPrecision());
        Assert.Null(property.GetScale());
    }

    private static CharkhooneDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql("Host=localhost;Database=charkhoone_model_test;Username=test;Password=test")
            .Options;

        return new CharkhooneDbContext(options);
    }
}
