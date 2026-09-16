using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Charkhoone.Infrastructure.Tests.Persistence;

public sealed class PaymentPersistenceModelTests
{
    [Fact]
    public void MonthlyObligation_IsUniquePerContractMonth()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(MonthlyObligationRow));

        Assert.NotNull(entity);
        Assert.Equal("monthly_obligations", entity!.GetTableName());
        Assert.Contains(entity.GetIndexes(), index =>
            index.IsUnique
            && index.Properties.Select(x => x.Name).SequenceEqual(
                [nameof(MonthlyObligationRow.ContractId), nameof(MonthlyObligationRow.ContractMonthNumber)]));
    }

    [Fact]
    public void MonthlyObligationComponent_IsUniquePerKindAndInstruction()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(MonthlyObligationComponentRow));

        Assert.NotNull(entity);
        Assert.Equal("monthly_obligation_components", entity!.GetTableName());
        Assert.Equal(nameof(MonthlyObligationComponentRow.PaymentInstructionId), entity.FindPrimaryKey()!.Properties.Single().Name);
        Assert.Contains(entity.GetIndexes(), index =>
            index.IsUnique
            && index.Properties.Select(x => x.Name).SequenceEqual(
                [nameof(MonthlyObligationComponentRow.MonthlyObligationId), nameof(MonthlyObligationComponentRow.Kind)]));
    }

    [Fact]
    public void ContractDelinquency_DoesNotReferenceFrozenPrincipal()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(ContractDelinquencyRow));

        Assert.NotNull(entity);
        Assert.Equal("contract_delinquencies", entity!.GetTableName());
        Assert.DoesNotContain(entity.GetProperties(), property =>
            property.Name.Contains("FrozenPrincipal", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void PaymentInstruction_RemainsLosslessRialAndBelongsToMonthlyObligation()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(PaymentInstructionRow));

        Assert.NotNull(entity);
        var amount = entity!.FindProperty(nameof(PaymentInstructionRow.AmountRial));
        Assert.Equal(38, amount!.GetPrecision());
        Assert.Equal(18, amount.GetScale());
        Assert.Contains(entity.GetForeignKeys(), fk =>
            fk.PrincipalEntityType.ClrType == typeof(MonthlyObligationRow)
            && fk.Properties.Single().Name == nameof(PaymentInstructionRow.ObligationId));
    }

    private static CharkhooneDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql("Host=localhost;Database=charkhoone_model_test;Username=test;Password=test")
            .Options;

        return new CharkhooneDbContext(options);
    }
}
