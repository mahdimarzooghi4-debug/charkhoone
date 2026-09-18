using System.Text.Json;
using Charkhoone.Application.Payments;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class CancellationBankPrincipalSettlementIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;

    public Task InitializeAsync() => _factory.MigrateAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task CancelledContract_ReturnsExactFrozenPrincipalToBank_WithBalancedLedgerAndIdempotentReplay()
    {
        var cancellationAt = DateTimeOffset.Parse("2026-09-18T09:00:00+00:00");
        var settlementAt = cancellationAt.AddHours(2);
        var bankReturnAt = cancellationAt.AddHours(3);
        var contractId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var fundingAllocationId = Guid.NewGuid();
        var fundFreezeId = Guid.NewGuid();
        var cancellationSettlementId = Guid.NewGuid();

        const decimal frozenBankPrincipalRial = 600_000_000m;

        await using (var db = CreateDbContext())
        {
            db.Users.AddRange(
                new UserRow
                {
                    Id = tenantId,
                    OidcSubject = $"cancel-bank-tenant-{tenantId:D}",
                    CreatedAtUtc = cancellationAt.AddMonths(-4),
                },
                new UserRow
                {
                    Id = ownerId,
                    OidcSubject = $"cancel-bank-owner-{ownerId:D}",
                    CreatedAtUtc = cancellationAt.AddMonths(-4),
                });

            db.CreditApplications.Add(new CreditApplicationRow
            {
                Id = applicationId,
                ApplicantUserId = tenantId,
                Status = CreditApplicationStatus.ApprovedFunded,
                CreatedAtUtc = cancellationAt.AddMonths(-4),
                UpdatedAtUtc = cancellationAt.AddMonths(-4),
            });

            db.LeaseContracts.Add(new LeaseContractRow
            {
                Id = contractId,
                TenantUserId = tenantId,
                OwnerUserId = ownerId,
                PropertyId = Guid.NewGuid(),
                CreditApplicationId = applicationId,
                Status = LeaseContractStatus.Cancelled,
                CreatedAtUtc = cancellationAt.AddMonths(-4),
                UpdatedAtUtc = settlementAt,
            });

            db.CancellationSettlements.Add(new CancellationSettlementRow
            {
                Id = cancellationSettlementId,
                ContractId = contractId,
                OwnerUserId = ownerId,
                AmountRial = 300_000_000m,
                Status = CancellationSettlementStatus.Completed,
                RemainingTenantContributionRial = 0m,
                CreatedAtUtc = settlementAt,
                UpdatedAtUtc = settlementAt,
                CompletedAtUtc = settlementAt,
            });

            db.FundingAllocations.Add(new FundingAllocationRow
            {
                Id = fundingAllocationId,
                CreditApplicationId = applicationId,
                ContractId = contractId,
                BankLoanPlanId = Guid.NewGuid(),
                BankLoanPlanVersion = "cancel-bank-integration-v1",
                BankId = "cancel-bank-integration-bank",
                FullDepositEquivalentRial = frozenBankPrincipalRial,
                MaximumEligibleLoanRial = frozenBankPrincipalRial,
                BankApprovedLoanRial = frozenBankPrincipalRial,
                TenantContributionRial = 0m,
                CreatedAtUtc = cancellationAt.AddMonths(-4),
                UpdatedAtUtc = cancellationAt.AddMonths(-4),
            });
            db.FundPrincipalFreezes.Add(new FundPrincipalFreezeRow
            {
                Id = fundFreezeId,
                FundingAllocationId = fundingAllocationId,
                Provider = "cancel-bank-integration-fund",
                Status = "Confirmed",
                IdempotencyKey = $"cancel-bank-fund-freeze:{fundingAllocationId:D}",
                FundReference = $"cancel-bank-frozen-{contractId:D}",
                ExternalReference = $"cancel-bank-fund-external-{fundFreezeId:D}",
                AttemptCount = 1,
                CreatedAtUtc = cancellationAt.AddMonths(-4),
                UpdatedAtUtc = cancellationAt.AddMonths(-4),
            });

            db.FrozenPrincipals.Add(new FrozenPrincipalRow
            {
                ContractId = contractId,
                BankId = "cancel-bank-integration-bank",
                AmountRial = frozenBankPrincipalRial,
                FundReference = $"cancel-bank-frozen-{contractId:D}",
                FrozenAtUtc = cancellationAt.AddMonths(-4),
            });

            await db.SaveChangesAsync();
        }

        var adapter = new ConfirmingBankPrincipalReturnAdapter();
        SettleCancellationBankPrincipalResult first;
        await using (var db = CreateDbContext())
        {
            var service = new EfCancellationBankPrincipalSettlementService(db, adapter);
            first = await service.SettleAsync(contractId, bankReturnAt);
        }

        Assert.Equal(SettleCancellationBankPrincipalOutcome.Completed, first.Outcome);
        Assert.NotNull(first.Return);
        Assert.Equal(frozenBankPrincipalRial, first.Return!.AmountRial);
        Assert.Equal(CancellationBankPrincipalReturnStatus.Succeeded, first.Return.Status);
        Assert.Equal(frozenBankPrincipalRial, adapter.LastRequest?.ExpectedAmountRial);
        Assert.Equal(cancellationSettlementId, adapter.LastRequest?.SettlementId);
        Assert.Equal(1, adapter.CallCount);

        await using (var db = CreateDbContext())
        {
            var frozen = await db.FrozenPrincipals.AsNoTracking()
                .SingleAsync(x => x.ContractId == contractId);
            Assert.Equal(frozenBankPrincipalRial, frozen.AmountRial);
            Assert.Equal("cancel-bank-integration-bank", frozen.BankId);

            var external = await db.ExternalTransactions.AsNoTracking()
                .SingleAsync(x => x.IdempotencyKey == $"cancellation-bank-principal:{contractId:D}:v1");
            Assert.Equal(ExternalTransactionStatus.Succeeded, external.Status);
            Assert.Equal(frozenBankPrincipalRial, external.AmountRial);
            Assert.Equal("IRR", external.Currency);

            var recognition = await db.JournalEntries.AsNoTracking()
                .SingleAsync(x => x.IdempotencyKey == $"journal:frozen-bank-principal-recognition:{contractId:D}:v1");
            var returnJournal = await db.JournalEntries.AsNoTracking()
                .SingleAsync(x => x.IdempotencyKey == $"journal:cancellation-bank-principal:{contractId:D}:v1");

            var recognitionLines = await db.JournalLines.AsNoTracking()
                .Where(x => x.JournalEntryId == recognition.Id)
                .ToListAsync();
            var returnLines = await db.JournalLines.AsNoTracking()
                .Where(x => x.JournalEntryId == returnJournal.Id)
                .ToListAsync();

            Assert.Equal(frozenBankPrincipalRial, recognitionLines.Sum(x => x.DebitRial));
            Assert.Equal(frozenBankPrincipalRial, recognitionLines.Sum(x => x.CreditRial));
            Assert.Equal(frozenBankPrincipalRial, returnLines.Sum(x => x.DebitRial));
            Assert.Equal(frozenBankPrincipalRial, returnLines.Sum(x => x.CreditRial));

            var frozenAsset = await db.LedgerAccounts.AsNoTracking()
                .SingleAsync(x => x.Code == $"contract:{contractId:D}:fund-held-frozen-bank-principal");
            var bankPayable = await db.LedgerAccounts.AsNoTracking()
                .SingleAsync(x => x.Code == $"contract:{contractId:D}:bank-principal-payable");

            Assert.Contains(recognitionLines, x =>
                x.LedgerAccountId == frozenAsset.Id
                && x.DebitRial == frozenBankPrincipalRial
                && x.CreditRial == 0m);
            Assert.Contains(recognitionLines, x =>
                x.LedgerAccountId == bankPayable.Id
                && x.DebitRial == 0m
                && x.CreditRial == frozenBankPrincipalRial);
            Assert.Contains(returnLines, x =>
                x.LedgerAccountId == bankPayable.Id
                && x.DebitRial == frozenBankPrincipalRial
                && x.CreditRial == 0m);
            Assert.Contains(returnLines, x =>
                x.LedgerAccountId == frozenAsset.Id
                && x.DebitRial == 0m
                && x.CreditRial == frozenBankPrincipalRial);

            var principalReturnedEvents = await db.OutboxMessages.AsNoTracking()
                .Where(x => x.Type == "lease-contract.cancellation-bank-principal-returned.v1")
                .ToListAsync();
            var bankNotificationRequests = await db.OutboxMessages.AsNoTracking()
                .Where(x => x.Type == "lease-contract.cancelled-bank-notification-requested.v1")
                .ToListAsync();

            Assert.Single(
                principalReturnedEvents,
                x => x.PayloadJson.Contains(
                    contractId.ToString("D"),
                    StringComparison.OrdinalIgnoreCase));
            Assert.Single(
                bankNotificationRequests,
                x => x.PayloadJson.Contains(
                    contractId.ToString("D"),
                    StringComparison.OrdinalIgnoreCase));

            var fundNotification = await db.OutboxMessages.AsNoTracking()
                .SingleAsync(x => x.Type == "lease-contract.cancelled-fund-notification-requested.v1");
            using (var fundPayload = JsonDocument.Parse(fundNotification.PayloadJson))
            {
                Assert.Equal(contractId, fundPayload.RootElement.GetProperty("contractId").GetGuid());
                Assert.Equal("cancel-bank-integration-fund", fundPayload.RootElement.GetProperty("fundProvider").GetString());
                Assert.Equal($"cancel-bank-frozen-{contractId:D}", fundPayload.RootElement.GetProperty("fundReference").GetString());
                Assert.Equal("cancel-bank-integration-bank", fundPayload.RootElement.GetProperty("bankId").GetString());
                Assert.Equal(frozenBankPrincipalRial, fundPayload.RootElement.GetProperty("amountRial").GetDecimal());
            }

            var completed = await db.OutboxMessages.AsNoTracking()
                .SingleAsync(x => x.Type == "lease-contract.cancellation-financially-completed.v1");
            using (var completedPayload = JsonDocument.Parse(completed.PayloadJson))
            {
                Assert.Equal(contractId, completedPayload.RootElement.GetProperty("contractId").GetGuid());
                Assert.Equal(tenantId, completedPayload.RootElement.GetProperty("tenantUserId").GetGuid());
                Assert.Equal(ownerId, completedPayload.RootElement.GetProperty("ownerUserId").GetGuid());
                Assert.Equal(300_000_000m, completedPayload.RootElement.GetProperty("ownerResidualAmountRial").GetDecimal());
                Assert.Equal("cancel-bank-integration-bank", completedPayload.RootElement.GetProperty("bankId").GetString());
                Assert.Equal(frozenBankPrincipalRial, completedPayload.RootElement.GetProperty("bankPrincipalAmountRial").GetDecimal());
                Assert.Equal("cancel-bank-integration-fund", completedPayload.RootElement.GetProperty("fundProvider").GetString());
                Assert.Equal($"cancel-bank-frozen-{contractId:D}", completedPayload.RootElement.GetProperty("fundReference").GetString());
                Assert.Equal(returnJournal.Id, completedPayload.RootElement.GetProperty("bankJournalEntryId").GetGuid());
            }

            Assert.Equal(
                1,
                await db.AuditEvents.CountAsync(x =>
                    x.AggregateId == contractId
                    && x.Action == "cancellation_bank_principal_returned"));
            Assert.Equal(
                1,
                await db.AuditEvents.CountAsync(x =>
                    x.AggregateId == contractId
                    && x.Action == "cancellation_financially_completed"));
        }

        SettleCancellationBankPrincipalResult replay;
        await using (var db = CreateDbContext())
        {
            var service = new EfCancellationBankPrincipalSettlementService(db, adapter);
            replay = await service.SettleAsync(contractId, bankReturnAt.AddHours(1));
        }

        Assert.Equal(SettleCancellationBankPrincipalOutcome.AlreadyCompleted, replay.Outcome);
        Assert.Equal(1, adapter.CallCount);

        await using var finalDb = CreateDbContext();
        Assert.Equal(
            1,
            await finalDb.ExternalTransactions.CountAsync(x =>
                x.IdempotencyKey == $"cancellation-bank-principal:{contractId:D}:v1"));
        Assert.Equal(
            1,
            await finalDb.JournalEntries.CountAsync(x =>
                x.IdempotencyKey == $"journal:frozen-bank-principal-recognition:{contractId:D}:v1"));
        Assert.Equal(
            1,
            await finalDb.JournalEntries.CountAsync(x =>
                x.IdempotencyKey == $"journal:cancellation-bank-principal:{contractId:D}:v1"));
        Assert.Equal(
            1,
            await finalDb.OutboxMessages.CountAsync(x =>
                x.Type == "lease-contract.cancelled-fund-notification-requested.v1"));
        Assert.Equal(
            1,
            await finalDb.OutboxMessages.CountAsync(x =>
                x.Type == "lease-contract.cancellation-financially-completed.v1"));
        Assert.Equal(
            1,
            await finalDb.AuditEvents.CountAsync(x =>
                x.AggregateId == contractId
                && x.Action == "cancellation_financially_completed"));
    }

    private CharkhooneDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql(_factory.ConnectionString)
            .Options;
        return new CharkhooneDbContext(options);
    }

    private sealed class ConfirmingBankPrincipalReturnAdapter : IExternalBankPrincipalReturnAdapter
    {
        public string Provider => "cancel-bank-integration-provider";

        public int CallCount { get; private set; }

        public ExternalBankPrincipalReturnRequest? LastRequest { get; private set; }

        public Task<ExternalBankPrincipalReturnResponse> EnsureOrQueryAsync(
            ExternalBankPrincipalReturnRequest request,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            LastRequest = request;
            return Task.FromResult(new ExternalBankPrincipalReturnResponse(
                ExternalNormalSettlementTransferStatus.Confirmed,
                Provider,
                request.ExpectedAmountRial,
                $"cancel-bank-return-{request.SettlementId:D}"));
        }
    }
}
