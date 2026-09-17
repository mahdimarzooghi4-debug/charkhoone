using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Charkhoone.Infrastructure.Tests.Persistence;

public sealed class NormalSettlementPersistenceModelTests
{
    [Fact]
    public void Settlement_IsUniquePerContractAndTransferLinksAreUnique()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(NormalSettlementRow));

        Assert.NotNull(entity);
        Assert.Equal("normal_settlements", entity!.GetTableName());
        AssertUniqueIndex(entity, nameof(NormalSettlementRow.ContractId));
        AssertUniqueIndex(entity, nameof(NormalSettlementRow.BankExternalTransactionId));
        AssertUniqueIndex(entity, nameof(NormalSettlementRow.TenantExternalTransactionId));
        AssertUniqueIndex(entity, nameof(NormalSettlementRow.BankJournalEntryId));
        AssertUniqueIndex(entity, nameof(NormalSettlementRow.TenantJournalEntryId));
    }

    [Fact]
    public void Settlement_StoresRialAmountsWithoutAddingFrozenPrincipalMutationFields()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(NormalSettlementRow));

        Assert.NotNull(entity);
        var principal = entity!.FindProperty(nameof(NormalSettlementRow.BankPrincipalAmountRial));
        var residual = entity.FindProperty(nameof(NormalSettlementRow.TenantResidualAmountRial));
        AssertUnscaledNumeric(principal);
        AssertUnscaledNumeric(residual);
        Assert.DoesNotContain(entity.GetProperties(), property =>
            property.Name.Contains("ReleaseFrozenPrincipal", StringComparison.OrdinalIgnoreCase)
            || property.Name.Contains("EarlyCancellation", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(entity.GetForeignKeys(), fk =>
            fk.PrincipalEntityType.ClrType == typeof(FrozenPrincipalRow));
    }

    [Fact]
    public void Settlement_LinksToContractTenantExternalTransactionsAndJournals()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(NormalSettlementRow));

        Assert.NotNull(entity);
        Assert.Contains(entity!.GetForeignKeys(), fk =>
            fk.PrincipalEntityType.ClrType == typeof(LeaseContractRow)
            && fk.Properties.Single().Name == nameof(NormalSettlementRow.ContractId));
        Assert.Contains(entity.GetForeignKeys(), fk =>
            fk.PrincipalEntityType.ClrType == typeof(UserRow)
            && fk.Properties.Single().Name == nameof(NormalSettlementRow.TenantUserId));
        Assert.Equal(2, entity.GetForeignKeys().Count(fk =>
            fk.PrincipalEntityType.ClrType == typeof(ExternalTransactionRow)));
        Assert.Equal(2, entity.GetForeignKeys().Count(fk =>
            fk.PrincipalEntityType.ClrType == typeof(JournalEntryRow)));
    }

    private static void AssertUnscaledNumeric(Microsoft.EntityFrameworkCore.Metadata.IProperty? property)
    {
        Assert.NotNull(property);
        Assert.Equal("numeric", property!.GetColumnType());
        Assert.Null(property.GetPrecision());
        Assert.Null(property.GetScale());
    }

    private static void AssertUniqueIndex(Microsoft.EntityFrameworkCore.Metadata.IEntityType entity, string propertyName) =>
        Assert.Contains(entity.GetIndexes(), index =>
            index.IsUnique
            && index.Properties.Count == 1
            && index.Properties[0].Name == propertyName);

    private static CharkhooneDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql("Host=localhost;Database=charkhoone_model_test;Username=test;Password=test")
            .Options;

        return new CharkhooneDbContext(options);
    }
}
