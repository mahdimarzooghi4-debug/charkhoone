using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Charkhoone.Infrastructure.Tests.Persistence;

public sealed class PersistenceModelTests
{
    [Fact]
    public void PaymentInstruction_UsesLosslessDecimalStorageAndUniqueIdempotencyKey()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(PaymentInstructionRow));

        Assert.NotNull(entity);
        Assert.Equal("payment_instructions", entity!.GetTableName());

        var amount = entity.FindProperty(nameof(PaymentInstructionRow.AmountRial));
        Assert.NotNull(amount);
        Assert.Equal(38, amount!.GetPrecision());
        Assert.Equal(18, amount.GetScale());

        var idempotencyIndex = entity.GetIndexes().Single(index =>
            index.Properties.Count == 1 &&
            index.Properties[0].Name == nameof(PaymentInstructionRow.IdempotencyKey));

        Assert.True(idempotencyIndex.IsUnique);
    }

    [Fact]
    public void FrozenPrincipal_IsKeyedByContractAndHasNoDebitField()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(FrozenPrincipalRow));

        Assert.NotNull(entity);
        Assert.Equal("frozen_principals", entity!.GetTableName());
        Assert.Equal(
            nameof(FrozenPrincipalRow.ContractId),
            Assert.Single(entity.FindPrimaryKey()!.Properties).Name);
        Assert.DoesNotContain(entity.GetProperties(), property =>
            property.Name.Contains("Debit", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void WorkflowAndOutboxTables_AreRegisteredForAuditAndReliablePublishing()
    {
        using var context = CreateContext();

        Assert.Equal(
            "workflow_transitions",
            context.Model.FindEntityType(typeof(WorkflowTransitionRow))!.GetTableName());
        Assert.Equal(
            "outbox_messages",
            context.Model.FindEntityType(typeof(OutboxMessageRow))!.GetTableName());
    }

    private static CharkhooneDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql("Host=localhost;Database=charkhoone_model_test;Username=test;Password=test")
            .Options;

        return new CharkhooneDbContext(options);
    }
}
