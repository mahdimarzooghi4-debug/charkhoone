using Charkhoone.Application.Contracts;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Contracts;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class NormalMaturityIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;

    public Task InitializeAsync() => _factory.MigrateAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task CompleteTwelveMonthSchedule_TransitionsActiveContractOnce()
    {
        var occurredAt = DateTimeOffset.Parse("2026-09-18T16:00:00+00:00");
        var contractId = await SeedActiveContractAsync(
            occurredAt,
            monthCount: 12,
            closeFinalMonth: true);

        PrepareNormalMaturityResult first;
        await using (var db = CreateDbContext())
        {
            var service = new EfNormalMaturityService(db);
            first = await service.PrepareAsync(contractId, occurredAt);
        }

        Assert.Equal(PrepareNormalMaturityOutcome.Prepared, first.Outcome);
        Assert.NotNull(first.FinalMonthDueAtUtc);
        Assert.True(first.FinalMonthDueAtUtc!.Value <= occurredAt);
        Assert.NotNull(first.FinalMonthClosedAtUtc);

        await using (var db = CreateDbContext())
        {
            var contract = await db.LeaseContracts.AsNoTracking()
                .SingleAsync(x => x.Id == contractId);
            Assert.Equal(LeaseContractStatus.SettlementPending, contract.Status);

            Assert.Equal(
                1,
                await db.WorkflowTransitions.CountAsync(x =>
                    x.AggregateType == "LeaseContract"
                    && x.AggregateId == contractId
                    && x.FromStatus == LeaseContractStatus.Active.ToString()
                    && x.ToStatus == LeaseContractStatus.SettlementPending.ToString()));

            Assert.Equal(
                1,
                await db.AuditEvents.CountAsync(x =>
                    x.AggregateId == contractId
                    && x.Action == "contract_entered_normal_settlement_pending"));

            var pendingPayloads = await db.OutboxMessages.AsNoTracking()
                .Where(x => x.Type == "lease-contract.normal-settlement-pending.v1")
                .Select(x => x.PayloadJson)
                .ToListAsync();
            Assert.Single(
                pendingPayloads,
                payload => payload.Contains(
                    contractId.ToString("D"),
                    StringComparison.OrdinalIgnoreCase));
        }

        PrepareNormalMaturityResult replay;
        await using (var db = CreateDbContext())
        {
            var service = new EfNormalMaturityService(db);
            replay = await service.PrepareAsync(contractId, occurredAt.AddHours(1));
        }

        Assert.Equal(PrepareNormalMaturityOutcome.AlreadyPrepared, replay.Outcome);

        await using var finalDb = CreateDbContext();
        Assert.Equal(
            1,
            await finalDb.AuditEvents.CountAsync(x =>
                x.AggregateId == contractId
                && x.Action == "contract_entered_normal_settlement_pending"));
        var finalPendingPayloads = await finalDb.OutboxMessages.AsNoTracking()
            .Where(x => x.Type == "lease-contract.normal-settlement-pending.v1")
            .Select(x => x.PayloadJson)
            .ToListAsync();
        Assert.Single(
            finalPendingPayloads,
            payload => payload.Contains(
                contractId.ToString("D"),
                StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task MissingOrOpenFinalMonth_DoesNotEnterSettlementPending()
    {
        var occurredAt = DateTimeOffset.Parse("2026-09-18T16:00:00+00:00");
        var missingMonthContract = await SeedActiveContractAsync(
            occurredAt,
            monthCount: 11,
            closeFinalMonth: true);
        var openFinalMonthContract = await SeedActiveContractAsync(
            occurredAt,
            monthCount: 12,
            closeFinalMonth: false);

        await using var db = CreateDbContext();
        var service = new EfNormalMaturityService(db);

        var missing = await service.PrepareAsync(missingMonthContract, occurredAt);
        db.ChangeTracker.Clear();
        var open = await service.PrepareAsync(openFinalMonthContract, occurredAt);

        Assert.Equal(PrepareNormalMaturityOutcome.NotMature, missing.Outcome);
        Assert.Equal(PrepareNormalMaturityOutcome.NotMature, open.Outcome);

        var statuses = await db.LeaseContracts.AsNoTracking()
            .Where(x => x.Id == missingMonthContract || x.Id == openFinalMonthContract)
            .Select(x => x.Status)
            .ToListAsync();
        Assert.All(statuses, status => Assert.Equal(LeaseContractStatus.Active, status));
    }

    private async Task<Guid> SeedActiveContractAsync(
        DateTimeOffset occurredAt,
        int monthCount,
        bool closeFinalMonth)
    {
        var contractId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();

        await using var db = CreateDbContext();

        db.Users.AddRange(
            new UserRow
            {
                Id = tenantId,
                OidcSubject = $"maturity-tenant-{tenantId:D}",
                CreatedAtUtc = occurredAt.AddMonths(-13),
            },
            new UserRow
            {
                Id = ownerId,
                OidcSubject = $"maturity-owner-{ownerId:D}",
                CreatedAtUtc = occurredAt.AddMonths(-13),
            });

        db.LeaseContracts.Add(new LeaseContractRow
        {
            Id = contractId,
            TenantUserId = tenantId,
            OwnerUserId = ownerId,
            PropertyId = Guid.NewGuid(),
            Status = LeaseContractStatus.Active,
            CreatedAtUtc = occurredAt.AddMonths(-13),
            UpdatedAtUtc = occurredAt.AddMonths(-1),
        });

        for (var month = 1; month <= monthCount; month++)
        {
            var dueAt = occurredAt.AddMonths(month - 13);
            var isOpenFinal = month == 12 && !closeFinalMonth;

            db.MonthlyObligations.Add(new MonthlyObligationRow
            {
                Id = Guid.NewGuid(),
                ContractId = contractId,
                ContractMonthNumber = month,
                DueAtUtc = dueAt,
                Status = isOpenFinal
                    ? MonthlyObligationStatus.Open
                    : MonthlyObligationStatus.Paid,
                CreatedAtUtc = dueAt.AddDays(-2),
                UpdatedAtUtc = isOpenFinal ? dueAt : dueAt.AddHours(1),
                ClosedAtUtc = isOpenFinal ? null : dueAt.AddHours(1),
            });
        }

        await db.SaveChangesAsync();
        return contractId;
    }

    private CharkhooneDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql(_factory.ConnectionString)
            .Options;
        return new CharkhooneDbContext(options);
    }
}
