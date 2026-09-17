using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Charkhoone.Infrastructure.Tests.Persistence;

public sealed class LostFundReturnPersistenceModelTests
{
    [Fact]
    public void LostFundReturn_IsUniquePerCoveragePaymentAndLinkedToContract()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(LostFundReturnRow));

        Assert.NotNull(entity);
        Assert.Equal("lost_fund_returns", entity!.GetTableName());
        Assert.Contains(entity.GetIndexes(), index =>
            index.IsUnique
            && index.Properties.Count == 1
            && index.Properties[0].Name == nameof(LostFundReturnRow.CoveragePaymentId));
        Assert.Contains(entity.GetForeignKeys(), fk =>
            fk.PrincipalEntityType.ClrType == typeof(CoveragePaymentRow)
            && fk.Properties.Single().Name == nameof(LostFundReturnRow.CoveragePaymentId));
        Assert.Contains(entity.GetForeignKeys(), fk =>
            fk.PrincipalEntityType.ClrType == typeof(LeaseContractRow)
            && fk.Properties.Single().Name == nameof(LostFundReturnRow.ContractId));
    }

    [Fact]
    public void LostFundReturn_StoresRawExposureAndDeferredCalculationFields()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(LostFundReturnRow));

        Assert.NotNull(entity);
        var withdrawn = entity!.FindProperty(nameof(LostFundReturnRow.WithdrawnAmountRial));
        var rate = entity.FindProperty(nameof(LostFundReturnRow.MonthlyRate));
        var calculated = entity.FindProperty(nameof(LostFundReturnRow.CalculatedReturnRial));

        Assert.Equal(38, withdrawn!.GetPrecision());
        Assert.Equal(18, withdrawn.GetScale());
        Assert.Equal(10, rate!.GetPrecision());
        Assert.Equal(8, rate.GetScale());
        Assert.Equal(38, calculated!.GetPrecision());
        Assert.Equal(18, calculated.GetScale());
        Assert.True(calculated.IsNullable);
        Assert.True(entity.FindProperty(nameof(LostFundReturnRow.ReplacedAtUtc))!.IsNullable);
        Assert.True(entity.FindProperty(nameof(LostFundReturnRow.CalculationPeriodEndUtc))!.IsNullable);
        Assert.True(entity.FindProperty(nameof(LostFundReturnRow.CalculationPolicyVersion))!.IsNullable);
    }

    [Fact]
    public void LostFundReturn_DoesNotCoupleToFrozenPrincipalOrJournalBeforePolicyExists()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(LostFundReturnRow));

        Assert.NotNull(entity);
        Assert.DoesNotContain(entity!.GetProperties(), property =>
            property.Name.Contains("FrozenPrincipal", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(entity.GetProperties(), property =>
            property.Name.Contains("JournalEntry", StringComparison.OrdinalIgnoreCase));
    }

    private static CharkhooneDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql("Host=localhost;Database=charkhoone_model_test;Username=test;Password=test")
            .Options;

        return new CharkhooneDbContext(options);
    }
}
