using System.Net;
using System.Text.Json;
using Charkhoone.Application.BankFunding;
using Charkhoone.Application.TenantContributionFunding;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.TenantContributionFunding;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

// Deliberately no MigrateAsync, EnsureCreated or seed calls: every fixture comes from pg_restore.
public sealed class RestoredDatabaseSmokeTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>
{
    private CharkhooneDbContext CreateDb() => new(new DbContextOptionsBuilder<CharkhooneDbContext>()
        .UseNpgsql(factory.ConnectionString).Options);

    [RestoreDrillFact]
    public async Task MigrationHistory_AndContractRead_SurviveRestore()
    {
        await using var db = CreateDb();
        Assert.Equal(db.Database.GetMigrations(), await db.Database.GetAppliedMigrationsAsync());
        Assert.Empty(await db.Database.GetPendingMigrationsAsync());
        var fixture = await (from c in db.LeaseContracts
                             join u in db.Users on c.TenantUserId equals u.Id
                             where u.OidcSubject.StartsWith("integration-tenant-")
                             select new { c.Id, u.OidcSubject }).FirstAsync();
        using var client = factory.CreateAuthenticatedClient(fixture.OidcSubject);
        var response = await client.GetAsync($"/api/v1/contracts/{fixture.Id:D}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal(fixture.Id, json.RootElement.GetProperty("contractId").GetGuid());
    }

    [RestoreDrillFact]
    public async Task UnknownPayment_QueryReconciliation_PreservesIdentityAndUnknownState()
    {
        await using var db = CreateDb();
        var fixture = await (from p in db.PaymentInstructions
                             join o in db.MonthlyObligations on p.ObligationId equals o.Id
                             join c in db.LeaseContracts on o.ContractId equals c.Id
                             join u in db.Users on c.TenantUserId equals u.Id
                             where p.Status == PaymentInstructionStatus.Unknown
                                && p.IdempotencyKey.StartsWith("integration-payment:")
                             select new { p.Id, u.OidcSubject }).SingleAsync();
        var before = await db.ExternalTransactions.AsNoTracking().SingleAsync(x =>
            x.AggregateType == "PaymentInstruction" && x.AggregateId == fixture.Id);
        using var client = factory.CreateAuthenticatedClient(fixture.OidcSubject);
        for (var attempt = 0; attempt < 2; attempt++)
        {
            var response = await client.PostAsync($"/api/v1/payments/{fixture.Id:D}/reconcile", null);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            Assert.Equal("Indeterminate", json.RootElement.GetProperty("outcome").GetString());
            Assert.Equal("Unknown", json.RootElement.GetProperty("paymentStatus").GetString());
        }
        var after = await db.ExternalTransactions.AsNoTracking().SingleAsync(x =>
            x.AggregateType == "PaymentInstruction" && x.AggregateId == fixture.Id);
        Assert.Equal(before.Id, after.Id);
        Assert.Equal(before.IdempotencyKey, after.IdempotencyKey);
        Assert.Equal(before.AmountRial, after.AmountRial);
        Assert.Equal(ExternalTransactionStatus.Unknown, after.Status);
    }

    [RestoreDrillFact]
    public async Task FundedContribution_ReplayPreservesPostedLedgerAndFrozenPrincipal()
    {
        await using var db = CreateDb();
        var allocation = await db.FundingAllocations
            .AsNoTracking()
            .SingleAsync(x =>
                x.BankId == "integration-bank"
                && db.TenantContributions.Any(contribution =>
                    contribution.FundingAllocationId == x.Id));
        var journalsBefore = await db.JournalEntries.AsNoTracking().OrderBy(x => x.Id).ToListAsync();
        var linesBefore = await db.JournalLines.AsNoTracking().OrderBy(x => x.Id).ToListAsync();
        var frozenBefore = await db.FrozenPrincipals.AsNoTracking().OrderBy(x => x.ContractId).ToListAsync();
        var service = new EfTenantContributionFundingService(db, new FailOnExternalCallAdapter());
        var result = await service.ReconcileAsync(allocation.CreditApplicationId, DateTimeOffset.UtcNow);
        Assert.Equal(ReconcileTenantContributionOutcome.AlreadyReconciled, result.Outcome);
        Assert.Equal(JsonSerializer.Serialize(journalsBefore), JsonSerializer.Serialize(
            await db.JournalEntries.AsNoTracking().OrderBy(x => x.Id).ToListAsync()));
        Assert.Equal(JsonSerializer.Serialize(linesBefore), JsonSerializer.Serialize(
            await db.JournalLines.AsNoTracking().OrderBy(x => x.Id).ToListAsync()));
        Assert.Equal(JsonSerializer.Serialize(frozenBefore), JsonSerializer.Serialize(
            await db.FrozenPrincipals.AsNoTracking().OrderBy(x => x.ContractId).ToListAsync()));
        Assert.NotEmpty(journalsBefore);
        foreach (var journal in journalsBefore)
        {
            var lines = linesBefore.Where(x => x.JournalEntryId == journal.Id).ToList();
            Assert.True(lines.Count >= 2);
            Assert.Equal(lines.Sum(x => x.DebitRial), lines.Sum(x => x.CreditRial));
        }
    }

    [RestoreDrillFact]
    public async Task TransportStates_AndDuplicateGuards_SurviveRestore()
    {
        await using var db = CreateDb();
        var pendingId = Guid.Parse("11111111-1111-4111-8111-111111111111");
        var processedId = Guid.Parse("22222222-2222-4222-8222-222222222222");
        var pending = await db.OutboxMessages.SingleAsync(x => x.Id == pendingId);
        Assert.Null(pending.ProcessedAtUtc);
        Assert.Equal(1, pending.AttemptCount);
        Assert.Equal("synthetic retry", pending.LastError);
        Assert.NotNull((await db.OutboxMessages.SingleAsync(x => x.Id == processedId)).ProcessedAtUtc);
        Assert.Null((await db.InboxMessages.SingleAsync(x => x.MessageId == pendingId)).ProcessedAtUtc);
        Assert.NotNull((await db.InboxMessages.SingleAsync(x => x.MessageId == processedId)).ProcessedAtUtc);
        // Each failed write is rolled back. The financial probes use NEW IDs and existing keys,
        // proving the idempotency-key unique indexes rather than merely primary keys.
        string[] probes =
        [
            "INSERT INTO inbox_messages SELECT * FROM inbox_messages WHERE \"MessageId\" = '22222222-2222-4222-8222-222222222222'",
            "INSERT INTO outbox_messages SELECT * FROM outbox_messages WHERE \"Id\" = '11111111-1111-4111-8111-111111111111'",
            "INSERT INTO external_transactions SELECT (jsonb_populate_record(NULL::external_transactions, to_jsonb(t) || jsonb_build_object('Id', gen_random_uuid()))).* FROM external_transactions t LIMIT 1",
            "INSERT INTO journal_entries SELECT (jsonb_populate_record(NULL::journal_entries, to_jsonb(t) || jsonb_build_object('Id', gen_random_uuid()))).* FROM journal_entries t LIMIT 1",
        ];
        foreach (var sql in probes)
        {
            await using var transaction = await db.Database.BeginTransactionAsync();
            var error = await Assert.ThrowsAsync<PostgresException>(() => db.Database.ExecuteSqlRawAsync(sql));
            Assert.Equal(PostgresErrorCodes.UniqueViolation, error.SqlState);
            await transaction.RollbackAsync();
        }
    }

    private sealed class FailOnExternalCallAdapter : IExternalFundAdapter
    {
        public string Provider => "restore-drill-no-external-calls";
        public Task<FundPrincipalFreezeResponse> FreezePrincipalAsync(FundPrincipalFreezeRequest request,
            CancellationToken cancellationToken = default) => throw new InvalidOperationException("Unexpected external freeze");
        public Task<FundTenantContributionResponse> CheckTenantContributionAsync(FundTenantContributionRequest request,
            CancellationToken cancellationToken = default) => throw new InvalidOperationException("Unexpected external query");
    }
}

public sealed class RestoreDrillFactAttribute : FactAttribute
{
    public RestoreDrillFactAttribute()
    {
        if (Environment.GetEnvironmentVariable("CHARKHOONE_RESTORE_DRILL") != "true")
            Skip = "Runs only after the CI backup/restore drill.";
    }
}
