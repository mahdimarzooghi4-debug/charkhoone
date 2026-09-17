using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Charkhoone.Infrastructure.Tests.Persistence;

public sealed class CoverageLedgerPersistenceModelTests
{
    [Fact]
    public void CoveragePayment_IsIdempotentPerPaymentInstructionAndExternalTransaction()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(CoveragePaymentRow));

        Assert.NotNull(entity);
        Assert.Equal("coverage_payments", entity!.GetTableName());
        Assert.Contains(entity.GetIndexes(), index =>
            index.IsUnique
            && index.Properties.Count == 1
            && index.Properties[0].Name == nameof(CoveragePaymentRow.PaymentInstructionId));
        Assert.Contains(entity.GetIndexes(), index =>
            index.IsUnique
            && index.Properties.Count == 1
            && index.Properties[0].Name == nameof(CoveragePaymentRow.ExternalTransactionId));
    }

    [Fact]
    public void CoveragePayment_StoresLosslessRialAndNeverReferencesFrozenPrincipal()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(CoveragePaymentRow));

        Assert.NotNull(entity);
        var amount = entity!.FindProperty(nameof(CoveragePaymentRow.AmountRial));
        var remaining = entity.FindProperty(nameof(CoveragePaymentRow.RemainingTenantContributionRial));
        AssertUnscaledNumeric(amount);
        AssertUnscaledNumeric(remaining);
        Assert.DoesNotContain(entity.GetProperties(), property =>
            property.Name.Contains("FrozenPrincipal", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void CoveragePayment_LinksToMonthlyInstructionExternalTransactionAndOptionalJournal()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(CoveragePaymentRow));

        Assert.NotNull(entity);
        Assert.Contains(entity!.GetForeignKeys(), fk =>
            fk.PrincipalEntityType.ClrType == typeof(PaymentInstructionRow)
            && fk.Properties.Single().Name == nameof(CoveragePaymentRow.PaymentInstructionId));
        Assert.Contains(entity.GetForeignKeys(), fk =>
            fk.PrincipalEntityType.ClrType == typeof(ExternalTransactionRow)
            && fk.Properties.Single().Name == nameof(CoveragePaymentRow.ExternalTransactionId));
        Assert.Contains(entity.GetForeignKeys(), fk =>
            fk.PrincipalEntityType.ClrType == typeof(JournalEntryRow)
            && fk.Properties.Single().Name == nameof(CoveragePaymentRow.JournalEntryId));
    }

    [Fact]
    public void Replenishment_IsIdempotentAndStoresRemainingContributionSnapshot()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(TenantContributionReplenishmentRow));

        Assert.NotNull(entity);
        Assert.Equal("tenant_contribution_replenishments", entity!.GetTableName());
        Assert.Contains(entity.GetIndexes(), index =>
            index.IsUnique
            && index.Properties.Count == 1
            && index.Properties[0].Name == nameof(TenantContributionReplenishmentRow.ExternalTransactionId));
        Assert.Contains(entity.GetIndexes(), index =>
            index.IsUnique
            && index.Properties.Count == 1
            && index.Properties[0].Name == nameof(TenantContributionReplenishmentRow.JournalEntryId));

        var amount = entity.FindProperty(nameof(TenantContributionReplenishmentRow.AmountRial));
        var remaining = entity.FindProperty(nameof(TenantContributionReplenishmentRow.RemainingTenantContributionRial));
        AssertUnscaledNumeric(amount);
        AssertUnscaledNumeric(remaining);
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
