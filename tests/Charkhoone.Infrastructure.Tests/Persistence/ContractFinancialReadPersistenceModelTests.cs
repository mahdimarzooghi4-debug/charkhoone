using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Charkhoone.Infrastructure.Tests.Persistence;

public sealed class ContractFinancialReadPersistenceModelTests
{
    [Fact]
    public void FinancialReadQueries_AreBackedByContractScopedIndexes()
    {
        using var context = CreateContext();

        AssertIndex(context, typeof(MonthlyObligationRow),
            nameof(MonthlyObligationRow.ContractId),
            nameof(MonthlyObligationRow.ContractMonthNumber));
        AssertIndex(context, typeof(CoveragePaymentRow),
            nameof(CoveragePaymentRow.ContractId),
            nameof(CoveragePaymentRow.Status));
        AssertIndex(context, typeof(TenantContributionReplenishmentRow),
            nameof(TenantContributionReplenishmentRow.ContractId),
            nameof(TenantContributionReplenishmentRow.ReplenishedAtUtc));
        AssertIndex(context, typeof(LostFundReturnRow),
            nameof(LostFundReturnRow.ContractId),
            nameof(LostFundReturnRow.WithdrawnAtUtc));
    }

    [Fact]
    public void ExternalTransaction_HasAggregateLookupIndexForPaymentReconciliationAttention()
    {
        using var context = CreateContext();

        AssertIndex(context, typeof(ExternalTransactionRow),
            nameof(ExternalTransactionRow.AggregateType),
            nameof(ExternalTransactionRow.AggregateId),
            nameof(ExternalTransactionRow.CreatedAtUtc));
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
