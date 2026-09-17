using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Charkhoone.Infrastructure.Tests.Persistence;

public sealed class ContractReadPersistenceModelTests
{
    [Fact]
    public void LeaseContract_HasParticipantLookupIndexes()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(LeaseContractRow));

        Assert.NotNull(entity);
        Assert.Contains(entity!.GetIndexes(), index =>
            index.Properties.Count == 1
            && index.Properties[0].Name == nameof(LeaseContractRow.TenantUserId));
        Assert.Contains(entity.GetIndexes(), index =>
            index.Properties.Count == 1
            && index.Properties[0].Name == nameof(LeaseContractRow.OwnerUserId));
    }

    [Fact]
    public void AuditEvent_HasAggregateChronologyIndexForPagedReads()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(AuditEventRow));

        Assert.NotNull(entity);
        Assert.Contains(entity!.GetIndexes(), index =>
            index.Properties.Select(x => x.Name).SequenceEqual(new[]
            {
                nameof(AuditEventRow.AggregateType),
                nameof(AuditEventRow.AggregateId),
                nameof(AuditEventRow.OccurredAtUtc),
            }));
    }

    private static CharkhooneDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql("Host=localhost;Database=charkhoone_model_test;Username=test;Password=test")
            .Options;

        return new CharkhooneDbContext(options);
    }
}
