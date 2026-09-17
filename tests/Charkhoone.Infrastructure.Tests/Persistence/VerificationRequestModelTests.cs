using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Charkhoone.Infrastructure.Tests.Persistence;

public sealed class VerificationRequestModelTests
{
    [Fact]
    public void VerificationRequest_HasUniqueIdempotencyKeyAndApplicationForeignKey()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(VerificationRequestRow));

        Assert.NotNull(entity);
        Assert.Equal("verification_requests", entity!.GetTableName());

        var idempotencyIndex = entity.GetIndexes().Single(index =>
            index.Properties.Count == 1 &&
            index.Properties[0].Name == nameof(VerificationRequestRow.IdempotencyKey));
        Assert.True(idempotencyIndex.IsUnique);

        var applicationForeignKey = entity.GetForeignKeys().Single(foreignKey =>
            foreignKey.Properties.Count == 1 &&
            foreignKey.Properties[0].Name == nameof(VerificationRequestRow.CreditApplicationId));
        Assert.Equal(typeof(CreditApplicationRow), applicationForeignKey.PrincipalEntityType.ClrType);
    }

    private static CharkhooneDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql("Host=localhost;Database=charkhoone_model_test;Username=test;Password=test")
            .Options;

        return new CharkhooneDbContext(options);
    }
}
