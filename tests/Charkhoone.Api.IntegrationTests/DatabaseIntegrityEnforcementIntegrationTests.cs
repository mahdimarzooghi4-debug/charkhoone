using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class DatabaseIntegrityEnforcementIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    public Task InitializeAsync() => factory.MigrateAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    [Theory]
    [InlineData("zero", "UPDATE journal_lines SET \"DebitRial\" = 0 WHERE \"Id\" = @line")]
    [InlineData("negative", "UPDATE journal_lines SET \"DebitRial\" = -10 WHERE \"Id\" = @line")]
    [InlineData("two-sided", "UPDATE journal_lines SET \"CreditRial\" = 10 WHERE \"Id\" = @line")]
    [InlineData("nan", "UPDATE journal_lines SET \"DebitRial\" = 'NaN'::numeric WHERE \"Id\" = @line")]
    public async Task JournalLineConstraint_RejectsInvalidAmounts(string _, string mutationSql)
    {
        await using var connection = await OpenAsync();
        var entry = Guid.NewGuid();
        var account = Guid.NewGuid();
        var debitLine = Guid.NewGuid();
        await SeedJournalAsync(connection, entry, account, debitLine, Guid.NewGuid());

        await using var command = new NpgsqlCommand(mutationSql, connection);
        command.Parameters.AddWithValue("line", debitLine);
        var exception = await Assert.ThrowsAsync<PostgresException>(() => command.ExecuteNonQueryAsync());

        Assert.Equal(PostgresErrorCodes.CheckViolation, exception.SqlState);
        Assert.Equal("CK_journal_lines_one_sided_positive_finite_amount", exception.ConstraintName);
    }

    [Fact]
    public async Task CanonicalCurrencyAndJournalIdempotency_AreDatabaseEnforced()
    {
        await using var connection = await OpenAsync();
        var entry = Guid.NewGuid();
        var account = Guid.NewGuid();
        await SeedJournalAsync(connection, entry, account, Guid.NewGuid(), Guid.NewGuid());

        var currencyException = await Assert.ThrowsAsync<PostgresException>(() => ExecuteAsync(
            connection,
            $"UPDATE ledger_accounts SET \"Currency\" = 'TOMAN' WHERE \"Id\" = '{account}'"));
        Assert.Equal(PostgresErrorCodes.CheckViolation, currencyException.SqlState);
        Assert.Equal("CK_ledger_accounts_currency_irr", currencyException.ConstraintName);

        var blankKeyException = await Assert.ThrowsAsync<PostgresException>(() => ExecuteAsync(
            connection,
            $"UPDATE journal_entries SET \"IdempotencyKey\" = '   ' WHERE \"Id\" = '{entry}'"));
        Assert.Equal(PostgresErrorCodes.CheckViolation, blankKeyException.SqlState);
        Assert.Equal("CK_journal_entries_idempotency_key_nonblank", blankKeyException.ConstraintName);
    }

    [Fact]
    public async Task FrozenPrincipal_RequiresAnExistingLeaseContract()
    {
        await using var connection = await OpenAsync();
        var contractId = Guid.NewGuid();

        var exception = await Assert.ThrowsAsync<PostgresException>(() => ExecuteAsync(
            connection,
            $"INSERT INTO frozen_principals (\"ContractId\", \"BankId\", \"AmountRial\", \"FundReference\", \"FrozenAtUtc\") VALUES ('{contractId}', 'bank', 10, 'fund-ref', now())"));

        Assert.Equal(PostgresErrorCodes.ForeignKeyViolation, exception.SqlState);
    }

    [Fact]
    public async Task FundingAllocation_RejectsContributionThatDoesNotMatchApprovedLoan()
    {
        var tenantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var contractId = Guid.NewGuid();
        var allocationId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
            dbContext.Users.AddRange(
                new UserRow
                {
                    Id = tenantId,
                    OidcSubject = $"integrity-tenant-{tenantId:D}",
                    CreatedAtUtc = now,
                },
                new UserRow
                {
                    Id = ownerId,
                    OidcSubject = $"integrity-owner-{ownerId:D}",
                    CreatedAtUtc = now,
                });
            dbContext.CreditApplications.Add(new CreditApplicationRow
            {
                Id = applicationId,
                ApplicantUserId = tenantId,
                Status = CreditApplicationStatus.ApprovedFunded,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
            });
            dbContext.LeaseContracts.Add(new LeaseContractRow
            {
                Id = contractId,
                TenantUserId = tenantId,
                OwnerUserId = ownerId,
                PropertyId = Guid.NewGuid(),
                CreditApplicationId = applicationId,
                Status = LeaseContractStatus.Active,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
            });
            dbContext.FundingAllocations.Add(new FundingAllocationRow
            {
                Id = allocationId,
                CreditApplicationId = applicationId,
                ContractId = contractId,
                BankLoanPlanId = Guid.NewGuid(),
                BankLoanPlanVersion = "v1",
                BankId = "bank",
                FullDepositEquivalentRial = 100m,
                MaximumEligibleLoanRial = 60m,
                BankApprovedLoanRial = 60m,
                TenantContributionRial = 40m,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
            });
            await dbContext.SaveChangesAsync();
        }

        await using var connection = await OpenAsync();
        var exception = await Assert.ThrowsAsync<PostgresException>(() => ExecuteAsync(
            connection,
            $"UPDATE funding_allocations SET \"TenantContributionRial\" = 41 WHERE \"Id\" = '{allocationId}'"));

        Assert.Equal(PostgresErrorCodes.CheckViolation, exception.SqlState);
        Assert.Equal("CK_funding_allocations_amounts_and_equation", exception.ConstraintName);
    }

    private async Task<NpgsqlConnection> OpenAsync()
    {
        var connection = new NpgsqlConnection(factory.ConnectionString);
        await connection.OpenAsync();
        return connection;
    }

    private static async Task SeedJournalAsync(
        NpgsqlConnection connection,
        Guid entry,
        Guid account,
        Guid debit,
        Guid credit)
    {
        await ExecuteAsync(connection, $"""
            INSERT INTO ledger_accounts ("Id", "Code", "Name", "Currency", "CreatedAtUtc")
            VALUES ('{account}', 'integrity-{account}', 'integrity test', 'IRR', now());
            INSERT INTO journal_entries ("Id", "ReferenceType", "ReferenceId", "IdempotencyKey", "Description", "OccurredAtUtc", "PostedAtUtc")
            VALUES ('{entry}', 'IntegrityTest', '{entry}', 'integrity-{entry}', 'integrity test', now(), now());
            INSERT INTO journal_lines ("Id", "JournalEntryId", "LedgerAccountId", "DebitRial", "CreditRial") VALUES
            ('{debit}', '{entry}', '{account}', 10, 0), ('{credit}', '{entry}', '{account}', 0, 10);
            """);
    }

    private static async Task ExecuteAsync(NpgsqlConnection connection, string sql)
    {
        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync();
    }
}
