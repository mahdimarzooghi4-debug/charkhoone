using Charkhoone.Application.Contracts;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Contracts;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class LeaseFundingLifecycleIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;

    public Task InitializeAsync() => _factory.MigrateAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task CompletePositiveFunding_ActivatesExactlyOnce()
    {
        var now = DateTimeOffset.Parse("2026-09-18T20:00:00+00:00");
        var fixture = await SeedFundingAsync(now, tenantContributionRial: 200_000_000m, includeTenantEvidence: true);

        AdvanceLeaseFundingLifecycleResult first;
        await using (var db = CreateDbContext())
        {
            var service = new EfLeaseFundingLifecycleService(db);
            first = await service.AdvanceAsync(fixture.ContractId, now);
        }

        Assert.Equal(AdvanceLeaseFundingLifecycleOutcome.Activated, first.Outcome);
        Assert.Equal(LeaseContractStatus.Active, first.Status);
        Assert.Equal(3, first.AppliedTransitions);

        await using (var db = CreateDbContext())
        {
            var contract = await db.LeaseContracts.AsNoTracking()
                .SingleAsync(x => x.Id == fixture.ContractId);
            Assert.Equal(LeaseContractStatus.Active, contract.Status);

            var transitions = await db.WorkflowTransitions.AsNoTracking()
                .Where(x => x.AggregateType == "LeaseContract" && x.AggregateId == fixture.ContractId)
                .OrderBy(x => x.OccurredAtUtc)
                .ThenBy(x => x.Id)
                .ToListAsync();

            Assert.Equal(3, transitions.Count);
            Assert.Contains(transitions, x =>
                x.FromStatus == LeaseContractStatus.Draft.ToString()
                && x.ToStatus == LeaseContractStatus.AwaitingFunding.ToString());
            Assert.Contains(transitions, x =>
                x.FromStatus == LeaseContractStatus.AwaitingFunding.ToString()
                && x.ToStatus == LeaseContractStatus.AwaitingCompletion.ToString());
            Assert.Contains(transitions, x =>
                x.FromStatus == LeaseContractStatus.AwaitingCompletion.ToString()
                && x.ToStatus == LeaseContractStatus.Active.ToString());

            foreach (var action in new[]
            {
                "contract_entered_awaiting_funding",
                "contract_entered_awaiting_completion",
                "contract_activated",
            })
            {
                Assert.Equal(
                    1,
                    await db.AuditEvents.CountAsync(x =>
                        x.AggregateId == fixture.ContractId
                        && x.Action == action));
            }

            var payloads = await db.OutboxMessages.AsNoTracking()
                .Where(x =>
                    x.Type == "lease-contract.awaiting-funding.v1"
                    || x.Type == "lease-contract.awaiting-completion.v1"
                    || x.Type == "lease-contract.activated.v1")
                .Select(x => new { x.Type, x.PayloadJson })
                .ToListAsync();

            foreach (var type in new[]
            {
                "lease-contract.awaiting-funding.v1",
                "lease-contract.awaiting-completion.v1",
                "lease-contract.activated.v1",
            })
            {
                Assert.Single(
                    payloads,
                    x => x.Type == type
                        && x.PayloadJson.Contains(
                            fixture.ContractId.ToString("D"),
                            StringComparison.OrdinalIgnoreCase));
            }
        }

        AdvanceLeaseFundingLifecycleResult replay;
        await using (var db = CreateDbContext())
        {
            var service = new EfLeaseFundingLifecycleService(db);
            replay = await service.AdvanceAsync(fixture.ContractId, now.AddHours(1));
        }

        Assert.Equal(AdvanceLeaseFundingLifecycleOutcome.AlreadyActivated, replay.Outcome);
        Assert.Equal(LeaseContractStatus.Active, replay.Status);
        Assert.Equal(0, replay.AppliedTransitions);

        await using var finalDb = CreateDbContext();
        Assert.Equal(
            3,
            await finalDb.WorkflowTransitions.CountAsync(x =>
                x.AggregateType == "LeaseContract"
                && x.AggregateId == fixture.ContractId));
    }

    [Fact]
    public async Task ZeroTenantContribution_ActivatesWithoutSyntheticTenantFunding()
    {
        var now = DateTimeOffset.Parse("2026-09-18T20:30:00+00:00");
        var fixture = await SeedFundingAsync(now, tenantContributionRial: 0m, includeTenantEvidence: false);

        await using var db = CreateDbContext();
        var service = new EfLeaseFundingLifecycleService(db);

        var result = await service.AdvanceAsync(fixture.ContractId, now);

        Assert.Equal(AdvanceLeaseFundingLifecycleOutcome.Activated, result.Outcome);
        Assert.Equal(LeaseContractStatus.Active, result.Status);
        Assert.Equal(3, result.AppliedTransitions);

        Assert.False(await db.TenantContributions.AsNoTracking()
            .AnyAsync(x => x.ContractId == fixture.ContractId));
        Assert.False(await db.TenantContributionFundings.AsNoTracking()
            .AnyAsync(x => x.FundingAllocationId == fixture.FundingAllocationId));
        Assert.False(await db.ExternalTransactions.AsNoTracking()
            .AnyAsync(x => x.IdempotencyKey ==
                $"tenant-contribution-funding:{fixture.FundingAllocationId:D}:v1"));
    }

    [Fact]
    public async Task AllocationWithoutConfirmedPrincipal_AdvancesOnlyToAwaitingFunding()
    {
        var now = DateTimeOffset.Parse("2026-09-18T21:00:00+00:00");
        var fixture = await SeedFundingAsync(
            now,
            tenantContributionRial: 200_000_000m,
            includeTenantEvidence: false,
            applicationStatus: CreditApplicationStatus.FundingPending,
            includePrincipalEvidence: false);

        await using var db = CreateDbContext();
        var service = new EfLeaseFundingLifecycleService(db);

        var first = await service.AdvanceAsync(fixture.ContractId, now);
        Assert.Equal(AdvanceLeaseFundingLifecycleOutcome.Advanced, first.Outcome);
        Assert.Equal(LeaseContractStatus.AwaitingFunding, first.Status);
        Assert.Equal(1, first.AppliedTransitions);

        db.ChangeTracker.Clear();

        var second = await service.AdvanceAsync(fixture.ContractId, now.AddMinutes(1));
        Assert.Equal(AdvanceLeaseFundingLifecycleOutcome.NotReady, second.Outcome);
        Assert.Equal(LeaseContractStatus.AwaitingFunding, second.Status);
        Assert.Equal(0, second.AppliedTransitions);

        Assert.Equal(
            1,
            await db.WorkflowTransitions.CountAsync(x =>
                x.AggregateType == "LeaseContract"
                && x.AggregateId == fixture.ContractId));
    }

    [Fact]
    public async Task CompleteFundingWithoutTrustedTerms_StopsAtAwaitingCompletion()
    {
        var now = DateTimeOffset.Parse("2026-09-18T21:30:00+00:00");
        var fixture = await SeedFundingAsync(
            now,
            tenantContributionRial: 0m,
            includeTenantEvidence: false,
            includeTermsSnapshot: false);

        await using var db = CreateDbContext();
        var service = new EfLeaseFundingLifecycleService(db);

        var result = await service.AdvanceAsync(fixture.ContractId, now);

        Assert.Equal(AdvanceLeaseFundingLifecycleOutcome.Advanced, result.Outcome);
        Assert.Equal(LeaseContractStatus.AwaitingCompletion, result.Status);
        Assert.Equal(2, result.AppliedTransitions);

        var contract = await db.LeaseContracts.AsNoTracking()
            .SingleAsync(x => x.Id == fixture.ContractId);
        Assert.Equal(LeaseContractStatus.AwaitingCompletion, contract.Status);
        Assert.Equal(
            0,
            await db.AuditEvents.CountAsync(x =>
                x.AggregateId == fixture.ContractId
                && x.Action == "contract_activated"));
    }

    private async Task<Fixture> SeedFundingAsync(
        DateTimeOffset now,
        decimal tenantContributionRial,
        bool includeTenantEvidence,
        CreditApplicationStatus applicationStatus = CreditApplicationStatus.ApprovedFunded,
        bool includePrincipalEvidence = true,
        bool includeTermsSnapshot = true)
    {
        var contractId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var allocationId = Guid.NewGuid();
        var planId = Guid.NewGuid();
        var freezeId = Guid.NewGuid();
        var fundReference = $"lease-funding-principal-{contractId:D}";
        const decimal bankPrincipalRial = 700_000_000m;
        const string bankId = "lease-funding-bank";
        const string planVersion = "lease-funding-plan-v1";

        await using var db = CreateDbContext();

        db.Users.AddRange(
            new UserRow
            {
                Id = tenantId,
                OidcSubject = $"lease-funding-tenant-{tenantId:D}",
                CreatedAtUtc = now.AddMonths(-1),
            },
            new UserRow
            {
                Id = ownerId,
                OidcSubject = $"lease-funding-owner-{ownerId:D}",
                CreatedAtUtc = now.AddMonths(-1),
            });

        db.CreditApplications.Add(new CreditApplicationRow
        {
            Id = applicationId,
            ApplicantUserId = tenantId,
            Status = applicationStatus,
            BankLoanPlanId = planId,
            BankLoanPlanVersion = planVersion,
            CreatedAtUtc = now.AddDays(-10),
            UpdatedAtUtc = now.AddMinutes(-10),
        });

        db.LeaseContracts.Add(new LeaseContractRow
        {
            Id = contractId,
            TenantUserId = tenantId,
            OwnerUserId = ownerId,
            PropertyId = Guid.NewGuid(),
            CreditApplicationId = applicationId,
            Status = LeaseContractStatus.Draft,
            BankLoanPlanId = planId,
            BankLoanPlanVersion = planVersion,
            CreatedAtUtc = now.AddDays(-10),
            UpdatedAtUtc = now.AddMinutes(-10),
        });

        db.FundingAllocations.Add(new FundingAllocationRow
        {
            Id = allocationId,
            CreditApplicationId = applicationId,
            ContractId = contractId,
            BankLoanPlanId = planId,
            BankLoanPlanVersion = planVersion,
            BankId = bankId,
            FullDepositEquivalentRial = bankPrincipalRial + tenantContributionRial,
            MaximumEligibleLoanRial = bankPrincipalRial + tenantContributionRial,
            BankApprovedLoanRial = bankPrincipalRial,
            TenantContributionRial = tenantContributionRial,
            CreatedAtUtc = now.AddMinutes(-8),
            UpdatedAtUtc = now.AddMinutes(-8),
        });

        if (includeTermsSnapshot)
        {
            db.LeaseContractTerms.Add(new LeaseContractTermsRow
            {
                ContractId = contractId,
                Calendar = "Persian",
                PersianStartYear = 1405,
                PersianStartMonth = 7,
                PersianStartDay = 1,
                TermMonths = 12,
                CashDepositRial = bankPrincipalRial + tenantContributionRial,
                MonthlyRentRial = 0m,
                FullDepositEquivalentRial = bankPrincipalRial + tenantContributionRial,
                OwnerBeneficiaryId = $"owner:{ownerId:D}",
                BankBeneficiaryId = bankId,
                SourceReference = $"fixture:lease-terms:{contractId:D}",
                CapturedAtUtc = now.AddMinutes(-9),
            });

            for (var month = 1; month <= 12; month++)
            {
                db.LeaseContractScheduleMonths.Add(new LeaseContractScheduleMonthRow
                {
                    ContractId = contractId,
                    ContractMonthNumber = month,
                    DueAtUtc = now.AddMonths(month - 1),
                    OwnerPaymentRial = 0m,
                    BankInterestRial = 1_000_000m,
                });
            }
        }

        if (includePrincipalEvidence)
        {
            db.FundPrincipalFreezes.Add(new FundPrincipalFreezeRow
            {
                Id = freezeId,
                FundingAllocationId = allocationId,
                Provider = "lease-funding-fund",
                Status = "Confirmed",
                IdempotencyKey = $"lease-funding-freeze:{allocationId:D}",
                FundReference = fundReference,
                ExternalReference = $"lease-funding-freeze-external:{freezeId:D}",
                AttemptCount = 1,
                CreatedAtUtc = now.AddMinutes(-7),
                UpdatedAtUtc = now.AddMinutes(-7),
            });

            db.FrozenPrincipals.Add(new FrozenPrincipalRow
            {
                ContractId = contractId,
                BankId = bankId,
                AmountRial = bankPrincipalRial,
                FundReference = fundReference,
                FrozenAtUtc = now.AddMinutes(-7),
            });
        }

        if (includeTenantEvidence)
        {
            if (tenantContributionRial <= 0m)
            {
                throw new InvalidOperationException("Tenant evidence requires a positive tenant contribution.");
            }

            var externalId = Guid.NewGuid();
            var journalId = Guid.NewGuid();
            var fundAssetId = Guid.NewGuid();
            var tenantBalanceId = Guid.NewGuid();
            var tenantFundReference = $"lease-funding-tenant-{contractId:D}";

            db.ExternalTransactions.Add(new ExternalTransactionRow
            {
                Id = externalId,
                Provider = "lease-funding-tenant-provider",
                OperationType = "tenant_contribution_funding",
                AggregateType = "LeaseContract",
                AggregateId = contractId,
                Status = ExternalTransactionStatus.Succeeded,
                AmountRial = tenantContributionRial,
                Currency = "IRR",
                IdempotencyKey = $"tenant-contribution-funding:{allocationId:D}:v1",
                ExternalReference = $"lease-funding-tenant-external:{externalId:D}",
                CreatedAtUtc = now.AddMinutes(-5),
                UpdatedAtUtc = now.AddMinutes(-5),
            });

            db.TenantContributionFundings.Add(new TenantContributionFundingRow
            {
                Id = Guid.NewGuid(),
                FundingAllocationId = allocationId,
                ExternalTransactionId = externalId,
                FundReference = tenantFundReference,
                AttemptCount = 1,
                CreatedAtUtc = now.AddMinutes(-5),
                UpdatedAtUtc = now.AddMinutes(-5),
            });

            db.TenantContributions.Add(new TenantContributionRow
            {
                ContractId = contractId,
                FundingAllocationId = allocationId,
                InitialAmountRial = tenantContributionRial,
                FundReference = tenantFundReference,
                FundedAtUtc = now.AddMinutes(-5),
            });

            db.LedgerAccounts.AddRange(
                new LedgerAccountRow
                {
                    Id = fundAssetId,
                    Code = $"contract:{contractId:D}:fund-held-tenant-contribution",
                    Name = "Fund-held tenant contribution",
                    Currency = "IRR",
                    ContractId = contractId,
                    CreatedAtUtc = now.AddMinutes(-5),
                },
                new LedgerAccountRow
                {
                    Id = tenantBalanceId,
                    Code = $"contract:{contractId:D}:tenant-contribution-balance",
                    Name = "Tenant contribution balance",
                    Currency = "IRR",
                    ContractId = contractId,
                    CreatedAtUtc = now.AddMinutes(-5),
                });

            db.JournalEntries.Add(new JournalEntryRow
            {
                Id = journalId,
                ReferenceType = "ExternalTransaction",
                ReferenceId = externalId,
                IdempotencyKey = $"journal:tenant-contribution-funding:{allocationId:D}:v1",
                Description = "Confirmed tenant contribution deposited into the fund.",
                OccurredAtUtc = now.AddMinutes(-5),
                PostedAtUtc = now.AddMinutes(-5),
            });

            db.JournalLines.AddRange(
                new JournalLineRow
                {
                    Id = Guid.NewGuid(),
                    JournalEntryId = journalId,
                    LedgerAccountId = fundAssetId,
                    DebitRial = tenantContributionRial,
                    CreditRial = 0m,
                },
                new JournalLineRow
                {
                    Id = Guid.NewGuid(),
                    JournalEntryId = journalId,
                    LedgerAccountId = tenantBalanceId,
                    DebitRial = 0m,
                    CreditRial = tenantContributionRial,
                });
        }

        await db.SaveChangesAsync();

        return new Fixture(contractId, allocationId);
    }

    private CharkhooneDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql(_factory.ConnectionString)
            .Options;
        return new CharkhooneDbContext(options);
    }

    private sealed record Fixture(Guid ContractId, Guid FundingAllocationId);
}
