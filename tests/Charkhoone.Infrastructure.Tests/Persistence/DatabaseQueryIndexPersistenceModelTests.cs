using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Charkhoone.Infrastructure.Tests.Persistence;

public sealed class DatabaseQueryIndexPersistenceModelTests
{
    [Fact]
    public void ReconciliationWorkers_HaveCandidateSelectionIndexes()
    {
        using var context = CreateContext();

        AssertIndex(context, typeof(LeaseContractRow),
            nameof(LeaseContractRow.Status),
            nameof(LeaseContractRow.UpdatedAtUtc),
            nameof(LeaseContractRow.Id));
        AssertIndex(context, typeof(MonthlyObligationRow),
            nameof(MonthlyObligationRow.Status),
            nameof(MonthlyObligationRow.DueAtUtc),
            nameof(MonthlyObligationRow.Id));
        AssertIndex(context, typeof(CoveragePaymentRow),
            nameof(CoveragePaymentRow.MonthlyObligationId),
            nameof(CoveragePaymentRow.Status));
        AssertIndex(context, typeof(ExternalTransactionRow),
            nameof(ExternalTransactionRow.UpdatedAtUtc),
            nameof(ExternalTransactionRow.Id));
    }

    [Fact]
    public void OutboxAndContractReads_HaveOrderedLookupIndexes()
    {
        using var context = CreateContext();

        AssertIndex(context, typeof(OutboxMessageRow),
            nameof(OutboxMessageRow.OccurredAtUtc),
            nameof(OutboxMessageRow.Id));
        AssertIndex(context, typeof(ExternalTransactionRow),
            nameof(ExternalTransactionRow.AggregateType),
            nameof(ExternalTransactionRow.AggregateId),
            nameof(ExternalTransactionRow.UpdatedAtUtc),
            nameof(ExternalTransactionRow.Id));
        AssertIndex(context, typeof(AuditEventRow),
            nameof(AuditEventRow.AggregateType),
            nameof(AuditEventRow.AggregateId),
            nameof(AuditEventRow.OccurredAtUtc),
            nameof(AuditEventRow.Id));
        AssertIndex(context, typeof(AuditEventRow),
            nameof(AuditEventRow.AggregateType),
            nameof(AuditEventRow.AggregateId),
            nameof(AuditEventRow.Action),
            nameof(AuditEventRow.OccurredAtUtc),
            nameof(AuditEventRow.Id));
        AssertIndex(context, typeof(LostFundReturnRow),
            nameof(LostFundReturnRow.ContractId));
    }

    private static void AssertIndex(
        CharkhooneDbContext context,
        Type entityType,
        params string[] propertyNames)
    {
        var entity = context.Model.FindEntityType(entityType);
        Assert.NotNull(entity);
        Assert.Contains(entity!.GetIndexes(), index =>
            index.Properties.Select(x => x.Name).SequenceEqual(propertyNames));
    }

    private static CharkhooneDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql("Host=localhost;Database=charkhoone_model_test;Username=test;Password=test")
            .Options;

        return new CharkhooneDbContext(options);
    }
}
