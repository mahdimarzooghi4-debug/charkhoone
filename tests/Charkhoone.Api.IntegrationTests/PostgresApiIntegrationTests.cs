using System.Net;
using System.Text.Json;
using Charkhoone.Application.BankFunding;
using Charkhoone.Application.TenantContributionFunding;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Charkhoone.Infrastructure.TenantContributionFunding;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class PostgresApiIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;

    public Task InitializeAsync() => _factory.MigrateAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task MigrationChain_AppliesCleanlyToRealPostgres()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();

        var pending = await dbContext.Database.GetPendingMigrationsAsync();
        var applied = await dbContext.Database.GetAppliedMigrationsAsync();

        Assert.Empty(pending);
        Assert.NotEmpty(applied);
    }

    [Fact]
    public async Task ContractDetail_RequiresAuthentication_AndDoesNotLeakOtherUsersContract()
    {
        var seeded = await SeedContractAsync();

        using var anonymousClient = _factory.CreateClient();
        var anonymousResponse = await anonymousClient.GetAsync($"/api/v1/contracts/{seeded.ContractId:D}");
        Assert.Equal(HttpStatusCode.Unauthorized, anonymousResponse.StatusCode);

        using var outsiderClient = _factory.CreateAuthenticatedClient(seeded.OutsiderSubject);
        var outsiderResponse = await outsiderClient.GetAsync($"/api/v1/contracts/{seeded.ContractId:D}");
        Assert.Equal(HttpStatusCode.NotFound, outsiderResponse.StatusCode);

        using var tenantClient = _factory.CreateAuthenticatedClient(seeded.TenantSubject);
        var tenantResponse = await tenantClient.GetAsync($"/api/v1/contracts/{seeded.ContractId:D}");
        Assert.Equal(HttpStatusCode.OK, tenantResponse.StatusCode);

        using var document = JsonDocument.Parse(await tenantResponse.Content.ReadAsStringAsync());
        Assert.Equal(seeded.ContractId, document.RootElement.GetProperty("contractId").GetGuid());
        Assert.Equal("Active", document.RootElement.GetProperty("status").GetString());
    }

    [Fact]
    public async Task PaymentReconciliation_IndeterminateResult_RemainsUnknown_AndRetryDoesNotDuplicateExternalTransaction()
    {
        var seeded = await SeedContractAsync();
        var now = DateTimeOffset.UtcNow;
        var obligationId = Guid.NewGuid();
        var paymentId = Guid.NewGuid();

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
            dbContext.MonthlyObligations.Add(new MonthlyObligationRow
            {
                Id = obligationId,
                ContractId = seeded.ContractId,
                ContractMonthNumber = 1,
                DueAtUtc = now.AddDays(-1),
                Status = MonthlyObligationStatus.Open,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
            });
            dbContext.ContractDelinquencies.Add(new ContractDelinquencyRow
            {
                ContractId = seeded.ContractId,
                ConsecutiveMissedMonths = 0,
                CancellationRequired = false,
                UpdatedAtUtc = now,
            });
            dbContext.PaymentInstructions.Add(new PaymentInstructionRow
            {
                Id = paymentId,
                ObligationId = obligationId,
                DueAtUtc = now.AddDays(-1),
                BeneficiaryId = "integration-beneficiary",
                AmountRial = 12_345_678m,
                IdempotencyKey = $"integration-payment:{paymentId:D}",
                Status = PaymentInstructionStatus.Created,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
            });
            await dbContext.SaveChangesAsync();
        }

        using var tenantClient = _factory.CreateAuthenticatedClient(seeded.TenantSubject);

        var firstResponse = await tenantClient.PostAsync($"/api/v1/payments/{paymentId:D}/reconcile", null);
        Assert.Equal(HttpStatusCode.OK, firstResponse.StatusCode);
        using (var firstDocument = JsonDocument.Parse(await firstResponse.Content.ReadAsStringAsync()))
        {
            Assert.Equal("Indeterminate", firstDocument.RootElement.GetProperty("outcome").GetString());
            Assert.Equal("Unknown", firstDocument.RootElement.GetProperty("paymentStatus").GetString());
        }

        var secondResponse = await tenantClient.PostAsync($"/api/v1/payments/{paymentId:D}/reconcile", null);
        Assert.Equal(HttpStatusCode.OK, secondResponse.StatusCode);
        using (var secondDocument = JsonDocument.Parse(await secondResponse.Content.ReadAsStringAsync()))
        {
            Assert.Equal("Indeterminate", secondDocument.RootElement.GetProperty("outcome").GetString());
            Assert.Equal("Unknown", secondDocument.RootElement.GetProperty("paymentStatus").GetString());
        }

        await using var verificationScope = _factory.Services.CreateAsyncScope();
        var verificationDb = verificationScope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
        var payment = await verificationDb.PaymentInstructions.AsNoTracking().SingleAsync(x => x.Id == paymentId);
        var externalTransactions = await verificationDb.ExternalTransactions
            .AsNoTracking()
            .Where(x => x.AggregateType == "PaymentInstruction" && x.AggregateId == paymentId)
            .ToListAsync();

        Assert.Equal(PaymentInstructionStatus.Unknown, payment.Status);
        var externalTransaction = Assert.Single(externalTransactions);
        Assert.Equal(ExternalTransactionStatus.Unknown, externalTransaction.Status);
        Assert.Equal(12_345_678m, externalTransaction.AmountRial);
    }

    [Fact]
    public async Task TenantContributionFunding_PostsBalancedDoubleEntry_AndReplayDoesNotDuplicateJournal()
    {
        var tenantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var contractId = Guid.NewGuid();
        var allocationId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        const decimal approvedLoanRial = 600_000_000m;
        const decimal tenantContributionRial = 400_000_000m;

        await using (var dbContext = CreateDbContext())
        {
            dbContext.Users.AddRange(
                new UserRow
                {
                    Id = tenantId,
                    OidcSubject = $"integration-tenant-{tenantId:D}",
                    CreatedAtUtc = now,
                },
                new UserRow
                {
                    Id = ownerId,
                    OidcSubject = $"integration-owner-{ownerId:D}",
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
                BankLoanPlanVersion = "integration-v1",
                BankId = "integration-bank",
                FullDepositEquivalentRial = approvedLoanRial + tenantContributionRial,
                MaximumEligibleLoanRial = 700_000_000m,
                BankApprovedLoanRial = approvedLoanRial,
                TenantContributionRial = tenantContributionRial,
                CreatedAtUtc = now,
                UpdatedAtUtc = now,
            });
            dbContext.FrozenPrincipals.Add(new FrozenPrincipalRow
            {
                ContractId = contractId,
                BankId = "integration-bank",
                AmountRial = approvedLoanRial,
                FundReference = $"integration-frozen-{contractId:D}",
                FrozenAtUtc = now,
            });
            await dbContext.SaveChangesAsync();
        }

        ReconcileTenantContributionResult firstResult;
        await using (var firstDbContext = CreateDbContext())
        {
            var service = new EfTenantContributionFundingService(firstDbContext, new ConfirmingFundAdapter());
            firstResult = await service.ReconcileAsync(applicationId, now.AddMinutes(1));
        }

        Assert.Equal(ReconcileTenantContributionOutcome.Reconciled, firstResult.Outcome);
        Assert.NotNull(firstResult.Funding);
        Assert.NotNull(firstResult.Funding!.JournalEntryId);
        Assert.NotNull(firstResult.Funding.ExternalTransactionId);

        await using (var verificationDb = CreateDbContext())
        {
            var journalId = firstResult.Funding.JournalEntryId!.Value;
            var lines = await verificationDb.JournalLines
                .AsNoTracking()
                .Where(x => x.JournalEntryId == journalId)
                .ToListAsync();

            Assert.Equal(2, lines.Count);
            Assert.Equal(tenantContributionRial, lines.Sum(x => x.DebitRial));
            Assert.Equal(tenantContributionRial, lines.Sum(x => x.CreditRial));
            Assert.Equal(lines.Sum(x => x.DebitRial), lines.Sum(x => x.CreditRial));
            Assert.True(await verificationDb.TenantContributions.AnyAsync(x => x.ContractId == contractId));
        }

        ReconcileTenantContributionResult replayResult;
        await using (var replayDbContext = CreateDbContext())
        {
            var service = new EfTenantContributionFundingService(replayDbContext, new ConfirmingFundAdapter());
            replayResult = await service.ReconcileAsync(applicationId, now.AddMinutes(2));
        }

        Assert.Equal(ReconcileTenantContributionOutcome.AlreadyReconciled, replayResult.Outcome);

        await using var finalDb = CreateDbContext();
        var externalTransactionId = firstResult.Funding.ExternalTransactionId!.Value;
        Assert.Equal(
            1,
            await finalDb.JournalEntries.CountAsync(x =>
                x.ReferenceType == "ExternalTransaction" && x.ReferenceId == externalTransactionId));
        Assert.Equal(1, await finalDb.TenantContributions.CountAsync(x => x.ContractId == contractId));
    }

    private async Task<SeededContract> SeedContractAsync()
    {
        var tenantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var outsiderId = Guid.NewGuid();
        var contractId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        var tenantSubject = $"integration-tenant-{tenantId:D}";
        var ownerSubject = $"integration-owner-{ownerId:D}";
        var outsiderSubject = $"integration-outsider-{outsiderId:D}";

        await using var scope = _factory.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
        dbContext.Users.AddRange(
            new UserRow { Id = tenantId, OidcSubject = tenantSubject, CreatedAtUtc = now },
            new UserRow { Id = ownerId, OidcSubject = ownerSubject, CreatedAtUtc = now },
            new UserRow { Id = outsiderId, OidcSubject = outsiderSubject, CreatedAtUtc = now });
        dbContext.LeaseContracts.Add(new LeaseContractRow
        {
            Id = contractId,
            TenantUserId = tenantId,
            OwnerUserId = ownerId,
            PropertyId = Guid.NewGuid(),
            Status = LeaseContractStatus.Active,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        });
        await dbContext.SaveChangesAsync();

        return new SeededContract(contractId, tenantSubject, ownerSubject, outsiderSubject);
    }

    private CharkhooneDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql(_factory.ConnectionString)
            .Options;
        return new CharkhooneDbContext(options);
    }

    private sealed record SeededContract(
        Guid ContractId,
        string TenantSubject,
        string OwnerSubject,
        string OutsiderSubject);

    private sealed class ConfirmingFundAdapter : IExternalFundAdapter
    {
        public string Provider => "integration-test-fund";

        public Task<FundPrincipalFreezeResponse> FreezePrincipalAsync(
            FundPrincipalFreezeRequest request,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new FundPrincipalFreezeResponse(
                FundPrincipalFreezeStatus.Indeterminate,
                Provider,
                ReasonCode: "not_used_by_this_test"));

        public Task<FundTenantContributionResponse> CheckTenantContributionAsync(
            FundTenantContributionRequest request,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new FundTenantContributionResponse(
                FundTenantContributionStatus.Confirmed,
                Provider,
                request.ExpectedAmountRial,
                $"integration-fund-reference-{request.FundingAllocationId:D}",
                $"integration-external-reference-{request.RequestId:D}"));
    }
}
