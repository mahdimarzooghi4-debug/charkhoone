using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Charkhoone.Infrastructure.Tests.Persistence;

public sealed class CancellationSettlementPersistenceModelTests
{
    [Fact]
    public void Settlement_IsUniquePerContractAndOptionalExternalAndJournalLinksAreUnique()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(CancellationSettlementRow));

        Assert.NotNull(entity);
        Assert.Equal("cancellation_settlements", entity!.GetTableName());
        Assert.Contains(entity.GetIndexes(), index =>
            index.IsUnique
            && index.Properties.Count == 1
            && index.Properties[0].Name == nameof(CancellationSettlementRow.ContractId));
        Assert.Contains(entity.GetIndexes(), index =>
            index.IsUnique
            && index.Properties.Count == 1
            && index.Properties[0].Name == nameof(CancellationSettlementRow.ExternalTransactionId));
        Assert.Contains(entity.GetIndexes(), index =>
            index.IsUnique
            && index.Properties.Count == 1
            && index.Properties[0].Name == nameof(CancellationSettlementRow.JournalEntryId));
    }

    [Fact]
    public void Settlement_StoresOwnerResidualAndDoesNotReferenceFrozenPrincipal()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(CancellationSettlementRow));

        Assert.NotNull(entity);
        var amount = entity!.FindProperty(nameof(CancellationSettlementRow.AmountRial));
        var remaining = entity.FindProperty(nameof(CancellationSettlementRow.RemainingTenantContributionRial));
        Assert.Equal(38, amount!.GetPrecision());
        Assert.Equal(18, amount.GetScale());
        Assert.Equal(38, remaining!.GetPrecision());
        Assert.Equal(18, remaining.GetScale());
        Assert.DoesNotContain(entity.GetProperties(), property =>
            property.Name.Contains("FrozenPrincipal", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(entity.GetForeignKeys(), fk =>
            fk.PrincipalEntityType.ClrType == typeof(FrozenPrincipalRow));
    }

    [Fact]
    public void Settlement_LinksToContractOwnerExternalTransactionAndJournal()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(CancellationSettlementRow));

        Assert.NotNull(entity);
        Assert.Contains(entity!.GetForeignKeys(), fk =>
            fk.PrincipalEntityType.ClrType == typeof(LeaseContractRow)
            && fk.Properties.Single().Name == nameof(CancellationSettlementRow.ContractId));
        Assert.Contains(entity.GetForeignKeys(), fk =>
            fk.PrincipalEntityType.ClrType == typeof(UserRow)
            && fk.Properties.Single().Name == nameof(CancellationSettlementRow.OwnerUserId));
        Assert.Contains(entity.GetForeignKeys(), fk =>
            fk.PrincipalEntityType.ClrType == typeof(ExternalTransactionRow)
            && fk.Properties.Single().Name == nameof(CancellationSettlementRow.ExternalTransactionId));
        Assert.Contains(entity.GetForeignKeys(), fk =>
            fk.PrincipalEntityType.ClrType == typeof(JournalEntryRow)
            && fk.Properties.Single().Name == nameof(CancellationSettlementRow.JournalEntryId));
    }

    private static CharkhooneDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql("Host=localhost;Database=charkhoone_model_test;Username=test;Password=test")
            .Options;

        return new CharkhooneDbContext(options);
    }
}
