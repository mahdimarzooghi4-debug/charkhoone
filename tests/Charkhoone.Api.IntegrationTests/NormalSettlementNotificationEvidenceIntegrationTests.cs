using System.Text.Json;
using Charkhoone.Application.Payments;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Infrastructure.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class NormalSettlementNotificationEvidenceIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;

    public Task InitializeAsync() => _factory.MigrateAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task NormalSettlement_CompletesWithStakeholderNotificationsAndTerminalEvidence()
    {
        var occurredAt = DateTimeOffset.Parse("2026-09-18T16:00:00+00:00");
        var contractId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var fundingAllocationId = Guid.NewGuid();
        var fundFreezeId = Guid.NewGuid();

        const decimal frozenPrincipalRial = 700_000_000m;
        const decimal tenantResidualRial = 200_000_000m;
        const string bankId = "normal-notification-bank";
        const string fundProvider = "normal-notification-fund";
        var fundReference = $"normal-notification-fund-{contractId:D}";

        await using (var db = CreateDbContext())
        {
            db.Users.AddRange(
                new UserRow
                {
                    Id = tenantId,
                    OidcSubject = $"normal-notification-tenant-{tenantId:D}",
                    CreatedAtUtc = occurredAt.AddMonths(-12),
                },
                new UserRow
                {
                    Id = ownerId,
                    OidcSubject = $"normal-notification-owner-{ownerId:D}",
                    CreatedAtUtc = occurredAt.AddMonths(-12),
                });

            db.CreditApplications.Add(new CreditApplicationRow
            {
                Id = applicationId,
                ApplicantUserId = tenantId,
                Status = CreditApplicationStatus.ApprovedFunded,
                CreatedAtUtc = occurredAt.AddMonths(-12),
                UpdatedAtUtc = occurredAt.AddMonths(-12),
            });

            db.LeaseContracts.Add(new LeaseContractRow
            {
                Id = contractId,
                TenantUserId = tenantId,
                OwnerUserId = ownerId,
                PropertyId = Guid.NewGuid(),
                CreditApplicationId = applicationId,
                Status = LeaseContractStatus.SettlementPending,
                CreatedAtUtc = occurredAt.AddMonths(-12),
                UpdatedAtUtc = occurredAt.AddHours(-1),
            });

            db.FundingAllocations.Add(new FundingAllocationRow
            {
                Id = fundingAllocationId,
                CreditApplicationId = applicationId,
                ContractId = contractId,
                BankLoanPlanId = Guid.NewGuid(),
                BankLoanPlanVersion = "normal-notification-v1",
                BankId = bankId,
                FullDepositEquivalentRial = frozenPrincipalRial,
                MaximumEligibleLoanRial = frozenPrincipalRial,
                BankApprovedLoanRial = frozenPrincipalRial,
                TenantContributionRial = tenantResidualRial,
                CreatedAtUtc = occurredAt.AddMonths(-12),
                UpdatedAtUtc = occurredAt.AddMonths(-12),
            });

            db.FundPrincipalFreezes.Add(new FundPrincipalFreezeRow
            {
                Id = fundFreezeId,
                FundingAllocationId = fundingAllocationId,
                Provider = fundProvider,
                Status = "Confirmed",
                IdempotencyKey = $"normal-notification-freeze:{fundingAllocationId:D}",
                FundReference = fundReference,
                ExternalReference = $"normal-notification-freeze-external:{fundFreezeId:D}",
                AttemptCount = 1,
                CreatedAtUtc = occurredAt.AddMonths(-12),
                UpdatedAtUtc = occurredAt.AddMonths(-12),
            });

            db.FrozenPrincipals.Add(new FrozenPrincipalRow
            {
                ContractId = contractId,
                BankId = bankId,
                AmountRial = frozenPrincipalRial,
                FundReference = fundReference,
                FrozenAtUtc = occurredAt.AddMonths(-12),
            });

            db.TenantContributions.Add(new TenantContributionRow
            {
                ContractId = contractId,
                FundingAllocationId = fundingAllocationId,
                InitialAmountRial = tenantResidualRial,
                FundReference = fundReference,
                FundedAtUtc = occurredAt.AddMonths(-12),
            });

            db.LedgerAccounts.AddRange(
                new LedgerAccountRow
                {
                    Id = Guid.NewGuid(),
                    Code = $"contract:{contractId:D}:fund-held-tenant-contribution",
                    Name = "Fund-held tenant contribution",
                    Currency = "IRR",
                    ContractId = contractId,
                    CreatedAtUtc = occurredAt.AddMonths(-12),
                },
                new LedgerAccountRow
                {
                    Id = Guid.NewGuid(),
                    Code = $"contract:{contractId:D}:tenant-contribution-balance",
                    Name = "Tenant contribution balance",
                    Currency = "IRR",
                    ContractId = contractId,
                    CreatedAtUtc = occurredAt.AddMonths(-12),
                });

            await db.SaveChangesAsync();
        }

        var bankAdapter = new ConfirmingBankAdapter();
        var tenantAdapter = new ConfirmingTenantAdapter();

        SettleNormalContractResult first;
        await using (var db = CreateDbContext())
        {
            var service = new EfNormalSettlementService(db, bankAdapter, tenantAdapter);
            first = await service.SettleAsync(contractId, occurredAt);
        }

        Assert.Equal(SettleNormalContractOutcome.Completed, first.Outcome);
        Assert.NotNull(first.Settlement);
        Assert.Equal(1, bankAdapter.CallCount);
        Assert.Equal(1, tenantAdapter.CallCount);
        Assert.Equal(tenantResidualRial, first.Settlement!.TenantResidualAmountRial);
        Assert.Equal(
            Charkhoone.Domain.Payments.NormalSettlementTransferStatus.Succeeded,
            first.Settlement.TenantResidualStatus);

        await using (var db = CreateDbContext())
        {
            var contract = await db.LeaseContracts.AsNoTracking()
                .SingleAsync(x => x.Id == contractId);
            Assert.Equal(LeaseContractStatus.Settled, contract.Status);

            var settlement = await db.NormalSettlements.AsNoTracking()
                .SingleAsync(x => x.ContractId == contractId);
            Assert.NotNull(settlement.CompletedAtUtc);
            Assert.Equal(frozenPrincipalRial, settlement.BankPrincipalAmountRial);
            Assert.Equal(tenantResidualRial, settlement.TenantResidualAmountRial);

            var owner = await db.OutboxMessages.AsNoTracking()
                .SingleAsync(x => x.Type == "lease-contract.normal-settlement-owner-notification-requested.v1");
            using (var payload = JsonDocument.Parse(owner.PayloadJson))
            {
                Assert.Equal(contractId, payload.RootElement.GetProperty("contractId").GetGuid());
                Assert.Equal(ownerId, payload.RootElement.GetProperty("ownerUserId").GetGuid());
                Assert.Equal(settlement.Id, payload.RootElement.GetProperty("settlementId").GetGuid());
            }

            var tenant = await db.OutboxMessages.AsNoTracking()
                .SingleAsync(x => x.Type == "lease-contract.normal-settlement-tenant-notification-requested.v1");
            using (var payload = JsonDocument.Parse(tenant.PayloadJson))
            {
                Assert.Equal(tenantId, payload.RootElement.GetProperty("tenantUserId").GetGuid());
                Assert.Equal(tenantResidualRial, payload.RootElement.GetProperty("tenantResidualAmountRial").GetDecimal());
                Assert.Equal(settlement.TenantJournalEntryId, payload.RootElement.GetProperty("tenantJournalEntryId").GetGuid());
            }

            var bank = await db.OutboxMessages.AsNoTracking()
                .SingleAsync(x => x.Type == "lease-contract.normal-settlement-bank-notification-requested.v1");
            using (var payload = JsonDocument.Parse(bank.PayloadJson))
            {
                Assert.Equal(bankId, payload.RootElement.GetProperty("bankId").GetString());
                Assert.Equal(frozenPrincipalRial, payload.RootElement.GetProperty("amountRial").GetDecimal());
                Assert.Equal(settlement.BankJournalEntryId, payload.RootElement.GetProperty("journalEntryId").GetGuid());
            }

            var fund = await db.OutboxMessages.AsNoTracking()
                .SingleAsync(x => x.Type == "lease-contract.normal-settlement-fund-notification-requested.v1");
            using (var payload = JsonDocument.Parse(fund.PayloadJson))
            {
                Assert.Equal(fundProvider, payload.RootElement.GetProperty("fundProvider").GetString());
                Assert.Equal(fundReference, payload.RootElement.GetProperty("fundReference").GetString());
            }

            var completed = await db.OutboxMessages.AsNoTracking()
                .SingleAsync(x => x.Type == "lease-contract.normal-settlement-financially-completed.v1");
            using (var payload = JsonDocument.Parse(completed.PayloadJson))
            {
                Assert.Equal(contractId, payload.RootElement.GetProperty("contractId").GetGuid());
                Assert.Equal(ownerId, payload.RootElement.GetProperty("ownerUserId").GetGuid());
                Assert.Equal(tenantId, payload.RootElement.GetProperty("tenantUserId").GetGuid());
                Assert.Equal(bankId, payload.RootElement.GetProperty("bankId").GetString());
                Assert.Equal(fundProvider, payload.RootElement.GetProperty("fundProvider").GetString());
                Assert.Equal(fundReference, payload.RootElement.GetProperty("fundReference").GetString());
            }

            Assert.Equal(
                1,
                await db.AuditEvents.CountAsync(x =>
                    x.AggregateId == contractId
                    && x.Action == "normal_settlement_financially_completed"));
        }

        SettleNormalContractResult replay;
        await using (var db = CreateDbContext())
        {
            var service = new EfNormalSettlementService(db, bankAdapter, tenantAdapter);
            replay = await service.SettleAsync(contractId, occurredAt.AddHours(1));
        }

        Assert.Equal(SettleNormalContractOutcome.AlreadyCompleted, replay.Outcome);
        Assert.Equal(1, bankAdapter.CallCount);

        await using var finalDb = CreateDbContext();
        var stakeholderTypes = new[]
        {
            "lease-contract.normal-settlement-owner-notification-requested.v1",
            "lease-contract.normal-settlement-tenant-notification-requested.v1",
            "lease-contract.normal-settlement-bank-notification-requested.v1",
            "lease-contract.normal-settlement-fund-notification-requested.v1",
            "lease-contract.normal-settlement-financially-completed.v1",
        };

        foreach (var type in stakeholderTypes)
        {
            Assert.Equal(1, await finalDb.OutboxMessages.CountAsync(x => x.Type == type));
        }
    }

    private CharkhooneDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql(_factory.ConnectionString)
            .Options;
        return new CharkhooneDbContext(options);
    }

    private sealed class ConfirmingBankAdapter : IExternalBankPrincipalReturnAdapter
    {
        public string Provider => "normal-notification-bank-provider";

        public int CallCount { get; private set; }

        public Task<ExternalBankPrincipalReturnResponse> EnsureOrQueryAsync(
            ExternalBankPrincipalReturnRequest request,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            return Task.FromResult(new ExternalBankPrincipalReturnResponse(
                ExternalNormalSettlementTransferStatus.Confirmed,
                Provider,
                request.ExpectedAmountRial,
                $"normal-notification-bank-return:{request.SettlementId:D}"));
        }
    }

    private sealed class ConfirmingTenantAdapter : IExternalTenantResidualReturnAdapter
    {
        public string Provider => "normal-notification-tenant-provider";

        public int CallCount { get; private set; }

        public Task<ExternalTenantResidualReturnResponse> EnsureOrQueryAsync(
            ExternalTenantResidualReturnRequest request,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            return Task.FromResult(new ExternalTenantResidualReturnResponse(
                ExternalNormalSettlementTransferStatus.Confirmed,
                Provider,
                request.ExpectedAmountRial,
                $"normal-notification-tenant-return:{request.SettlementId:D}"));
        }
    }
}
