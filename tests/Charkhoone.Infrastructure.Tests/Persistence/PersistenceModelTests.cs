using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Charkhoone.Infrastructure.Tests.Persistence;

public sealed class PersistenceModelTests
{
    [Fact]
    public void User_UsesUniqueOidcSubjectAndOwnsCreditApplications()
    {
        using var context = CreateContext();
        var user = context.Model.FindEntityType(typeof(UserRow));
        var application = context.Model.FindEntityType(typeof(CreditApplicationRow));

        Assert.NotNull(user);
        Assert.Equal("users", user!.GetTableName());

        var subjectIndex = user.GetIndexes().Single(index =>
            index.Properties.Count == 1 &&
            index.Properties[0].Name == nameof(UserRow.OidcSubject));
        Assert.True(subjectIndex.IsUnique);

        var ownership = application!.GetForeignKeys().Single(foreignKey =>
            foreignKey.Properties.Count == 1 &&
            foreignKey.Properties[0].Name == nameof(CreditApplicationRow.ApplicantUserId));
        Assert.Equal(typeof(UserRow), ownership.PrincipalEntityType.ClrType);
    }

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
    public void WorkflowAuditAndOutboxTables_AreRegisteredForRecoverableTransitions()
    {
        using var context = CreateContext();

        var workflow = context.Model.FindEntityType(typeof(WorkflowTransitionRow));
        var audit = context.Model.FindEntityType(typeof(AuditEventRow));
        var outbox = context.Model.FindEntityType(typeof(OutboxMessageRow));

        Assert.Equal("workflow_transitions", workflow!.GetTableName());
        Assert.Equal("audit_events", audit!.GetTableName());
        Assert.Equal("outbox_messages", outbox!.GetTableName());

        Assert.NotNull(audit.FindProperty(nameof(AuditEventRow.ActorId)));
        Assert.NotNull(audit.FindProperty(nameof(AuditEventRow.Action)));
        Assert.NotNull(audit.FindProperty(nameof(AuditEventRow.Reason)));
        Assert.NotNull(audit.FindProperty(nameof(AuditEventRow.AggregateId)));
    }

    [Fact]
    public void InboxMessage_UsesMessageIdAsDeduplicationKey()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(InboxMessageRow));

        Assert.NotNull(entity);
        Assert.Equal("inbox_messages", entity!.GetTableName());
        Assert.Equal(
            nameof(InboxMessageRow.MessageId),
            Assert.Single(entity.FindPrimaryKey()!.Properties).Name);

        var processedIndex = entity.GetIndexes().Single(index =>
            index.Properties.Count == 1 &&
            index.Properties[0].Name == nameof(InboxMessageRow.ProcessedAtUtc));

        Assert.False(processedIndex.IsUnique);
    }

    private static CharkhooneDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql("Host=localhost;Database=charkhoone_model_test;Username=test;Password=test")
            .Options;

        return new CharkhooneDbContext(options);
    }
}
