using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class RialPrecisionIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;

    public Task InitializeAsync() => _factory.MigrateAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task ExternalTransactionRial_UsesUnscaledNumeric_AndRoundTripsWithoutScaleRounding()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();

        await dbContext.Database.OpenConnectionAsync();
        await using (var command = dbContext.Database.GetDbConnection().CreateCommand())
        {
            command.CommandText = """
                SELECT numeric_precision, numeric_scale
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'external_transactions'
                  AND column_name = 'AmountRial'
                """;

            await using var reader = await command.ExecuteReaderAsync();
            Assert.True(await reader.ReadAsync());
            Assert.True(reader.IsDBNull(0));
            Assert.True(reader.IsDBNull(1));
        }

        const decimal exactRial = 123456789.1234567890123456789m;
        var transactionId = Guid.NewGuid();
        dbContext.ExternalTransactions.Add(new ExternalTransactionRow
        {
            Id = transactionId,
            Provider = "integration-test",
            OperationType = "rial_precision_roundtrip",
            AggregateType = "IntegrationTest",
            AggregateId = Guid.NewGuid(),
            Status = ExternalTransactionStatus.Pending,
            AmountRial = exactRial,
            Currency = "IRR",
            IdempotencyKey = $"integration-rial-precision:{transactionId:D}",
            CreatedAtUtc = DateTimeOffset.UtcNow,
            UpdatedAtUtc = DateTimeOffset.UtcNow,
        });

        await dbContext.SaveChangesAsync();
        dbContext.ChangeTracker.Clear();

        var persisted = await dbContext.ExternalTransactions
            .AsNoTracking()
            .SingleAsync(x => x.Id == transactionId);

        Assert.Equal(exactRial, persisted.AmountRial);
    }
}
