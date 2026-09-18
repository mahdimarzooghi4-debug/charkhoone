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
    public void RialAmounts_UseUnscaledPostgresNumericStorage()
    {
        using var context = CreateContext();

        var rialProperties = context.Model.GetEntityTypes()
            .SelectMany(entity => entity.GetProperties())
            .Where(property =>
                (property.ClrType == typeof(decimal)
                    || Nullable.GetUnderlyingType(property.ClrType) == typeof(decimal))
                && property.Name.EndsWith("Rial", StringComparison.Ordinal))
            .ToList();

        Assert.NotEmpty(rialProperties);
        foreach (var property in rialProperties)
        {
            Assert.Equal("numeric", property.GetColumnType());
            Assert.Null(property.GetPrecision());
            Assert.Null(property.GetScale());
        }
    }

    [Fact]
    public void PaymentInstruction_UsesUniqueIdempotencyKey()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(PaymentInstructionRow));

        Assert.NotNull(entity);
        Assert.Equal("payment_instructions", entity!.GetTableName());

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

        Assert.NotNull(workflow);
        Assert.NotNull(audit);
        Assert.NotNull(outbox);

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

    [Fact]
    public void CreditEligibilityAssessment_PersistsTheoreticalCapWithoutApprovedLoanFields()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(CreditEligibilityAssessmentRow));

        Assert.NotNull(entity);
        Assert.Equal("credit_eligibility_assessments", entity!.GetTableName());

        var maximumLoan = entity.FindProperty(nameof(CreditEligibilityAssessmentRow.MaximumEligibleLoanRial));
        Assert.NotNull(maximumLoan);
        Assert.Equal("numeric", maximumLoan!.GetColumnType());
        Assert.Null(maximumLoan.GetPrecision());
        Assert.Null(maximumLoan.GetScale());

        var idempotencyIndex = entity.GetIndexes().Single(index =>
            index.Properties.Count == 1 &&
            index.Properties[0].Name == nameof(CreditEligibilityAssessmentRow.IdempotencyKey));
        Assert.True(idempotencyIndex.IsUnique);

        Assert.DoesNotContain(entity.GetProperties(), property =>
            property.Name.Contains("ApprovedLoan", StringComparison.OrdinalIgnoreCase)
            || property.Name.Contains("TenantContribution", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void LeaseContractTerms_UseOneImmutableSnapshotWithTwelveScheduleSlots()
    {
        using var context = CreateContext();
        var terms = context.Model.FindEntityType(typeof(LeaseContractTermsRow));
        var schedule = context.Model.FindEntityType(typeof(LeaseContractScheduleMonthRow));

        Assert.NotNull(terms);
        Assert.NotNull(schedule);
        Assert.Equal("lease_contract_terms", terms!.GetTableName());
        Assert.Equal("lease_contract_schedule_months", schedule!.GetTableName());

        Assert.Equal(
            nameof(LeaseContractTermsRow.ContractId),
            Assert.Single(terms.FindPrimaryKey()!.Properties).Name);

        Assert.Equal(
            new[]
            {
                nameof(LeaseContractScheduleMonthRow.ContractId),
                nameof(LeaseContractScheduleMonthRow.ContractMonthNumber),
            },
            schedule.FindPrimaryKey()!.Properties.Select(x => x.Name).ToArray());

        var dueIndex = schedule.GetIndexes().Single(index =>
            index.Properties.Select(x => x.Name).SequenceEqual(
                new[]
                {
                    nameof(LeaseContractScheduleMonthRow.ContractId),
                    nameof(LeaseContractScheduleMonthRow.DueAtUtc),
                }));
        Assert.True(dueIndex.IsUnique);

        var scheduleForeignKey = schedule.GetForeignKeys().Single();
        Assert.Equal(typeof(LeaseContractTermsRow), scheduleForeignKey.PrincipalEntityType.ClrType);
    }

    private static CharkhooneDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql("Host=localhost;Database=charkhoone_model_test;Username=test;Password=test")
            .Options;

        return new CharkhooneDbContext(options);
    }
}
