using Charkhoone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class DatabaseIndexIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;

    public Task InitializeAsync() => _factory.MigrateAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task CandidateSelectionPartialIndexes_AreAppliedToRealPostgres()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();

        await dbContext.Database.OpenConnectionAsync();
        try
        {
            var indexes = new Dictionary<string, string>(StringComparer.Ordinal);
            await using var command = dbContext.Database.GetDbConnection().CreateCommand();
            command.CommandText = """
                SELECT indexname, indexdef
                FROM pg_indexes
                WHERE schemaname = 'public'
                  AND indexname IN (
                    'IX_outbox_messages_OccurredAtUtc_Id',
                    'IX_lost_fund_returns_ContractId',
                    'IX_external_transactions_UpdatedAtUtc_Id')
                """;

            await using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                indexes.Add(reader.GetString(0), reader.GetString(1));
            }

            Assert.Equal(3, indexes.Count);
            Assert.Contains("ProcessedAtUtc", indexes["IX_outbox_messages_OccurredAtUtc_Id"], StringComparison.Ordinal);
            Assert.Contains("IS NULL", indexes["IX_outbox_messages_OccurredAtUtc_Id"], StringComparison.OrdinalIgnoreCase);

            Assert.Contains("CalculatedReturnRial", indexes["IX_lost_fund_returns_ContractId"], StringComparison.Ordinal);
            Assert.Contains("IS NULL", indexes["IX_lost_fund_returns_ContractId"], StringComparison.OrdinalIgnoreCase);

            var paymentIndex = indexes["IX_external_transactions_UpdatedAtUtc_Id"];
            Assert.Contains("PaymentInstruction", paymentIndex, StringComparison.Ordinal);
            Assert.Contains("payment_reconciliation", paymentIndex, StringComparison.Ordinal);
            Assert.Contains("Pending", paymentIndex, StringComparison.Ordinal);
            Assert.Contains("Unknown", paymentIndex, StringComparison.Ordinal);
        }
        finally
        {
            await dbContext.Database.CloseConnectionAsync();
        }
    }
}
