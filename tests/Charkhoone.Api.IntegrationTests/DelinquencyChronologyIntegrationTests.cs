using Charkhoone.Application.Payments;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class DelinquencyChronologyIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;

    public Task InitializeAsync() => _factory.MigrateAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task LaterMonth_CannotCloseWhileEarlierExistingMonthIsOpen()
    {
        var now = DateTimeOffset.UtcNow;
        var seeded = await SeedContractAsync(
            now,
            (1, MonthlyObligationStatus.Missed, PaymentInstructionStatus.Failed),
            (2, MonthlyObligationStatus.Open, PaymentInstructionStatus.Failed),
            (3, MonthlyObligationStatus.Open, PaymentInstructionStatus.Failed));

        await SetDelinquencyAsync(seeded.ContractId, 1, cancellationRequired: false, now);

        CloseMonthlyObligationResult result;
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var service = scope.ServiceProvider.GetRequiredService<IMonthlyObligationService>();
            result = await service.CloseAsync(seeded.MonthIds[3], now);
        }

        Assert.Equal(CloseMonthlyObligationOutcome.InvalidState, result.Outcome);

        await using var verificationScope = _factory.Services.CreateAsyncScope();
        var db = verificationScope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
        var month3 = await db.MonthlyObligations.AsNoTracking().SingleAsync(x => x.Id == seeded.MonthIds[3]);
        var delinquency = await db.ContractDelinquencies.AsNoTracking().SingleAsync(x => x.ContractId == seeded.ContractId);

        Assert.Equal(MonthlyObligationStatus.Open, month3.Status);
        Assert.Equal(1, delinquency.ConsecutiveMissedMonths);
        Assert.False(delinquency.CancellationRequired);
    }

    [Fact]
    public async Task CoveredPriorMonth_CountsAsTenantMiss_WhenNextMonthClosesMissed()
    {
        var now = DateTimeOffset.UtcNow;
        var seeded = await SeedContractAsync(
            now,
            (1, MonthlyObligationStatus.Missed, PaymentInstructionStatus.Failed),
            (2, MonthlyObligationStatus.Covered, PaymentInstructionStatus.Failed),
            (3, MonthlyObligationStatus.Open, PaymentInstructionStatus.Failed));

        // Seed a stale value deliberately: closure must derive the streak from persisted month chronology.
        await SetDelinquencyAsync(seeded.ContractId, 0, cancellationRequired: false, now);

        CloseMonthlyObligationResult result;
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var service = scope.ServiceProvider.GetRequiredService<IMonthlyObligationService>();
            result = await service.CloseAsync(seeded.MonthIds[3], now);
        }

        Assert.Equal(CloseMonthlyObligationOutcome.Missed, result.Outcome);

        await using var verificationScope = _factory.Services.CreateAsyncScope();
        var db = verificationScope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
        var contract = await db.LeaseContracts.AsNoTracking().SingleAsync(x => x.Id == seeded.ContractId);
        var delinquency = await db.ContractDelinquencies.AsNoTracking().SingleAsync(x => x.ContractId == seeded.ContractId);

        Assert.Equal(3, delinquency.ConsecutiveMissedMonths);
        Assert.True(delinquency.CancellationRequired);
        Assert.Equal(LeaseContractStatus.CancellationPending, contract.Status);
    }

    [Fact]
    public async Task FullyPaidCurrentMonth_ResetsCurrentStreakWithoutChangingOlderDebtStatuses()
    {
        var now = DateTimeOffset.UtcNow;
        var seeded = await SeedContractAsync(
            now,
            (1, MonthlyObligationStatus.Missed, PaymentInstructionStatus.Failed),
            (2, MonthlyObligationStatus.Missed, PaymentInstructionStatus.Failed),
            (3, MonthlyObligationStatus.Open, PaymentInstructionStatus.Succeeded));

        await SetDelinquencyAsync(seeded.ContractId, 2, cancellationRequired: false, now);

        CloseMonthlyObligationResult result;
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var service = scope.ServiceProvider.GetRequiredService<IMonthlyObligationService>();
            result = await service.CloseAsync(seeded.MonthIds[3], now);
        }

        Assert.Equal(CloseMonthlyObligationOutcome.Paid, result.Outcome);

        await using var verificationScope = _factory.Services.CreateAsyncScope();
        var db = verificationScope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
        var months = await db.MonthlyObligations
            .AsNoTracking()
            .Where(x => x.ContractId == seeded.ContractId)
            .OrderBy(x => x.ContractMonthNumber)
            .ToListAsync();
        var delinquency = await db.ContractDelinquencies.AsNoTracking().SingleAsync(x => x.ContractId == seeded.ContractId);

        Assert.Equal(MonthlyObligationStatus.Missed, months[0].Status);
        Assert.Equal(MonthlyObligationStatus.Missed, months[1].Status);
        Assert.Equal(MonthlyObligationStatus.Paid, months[2].Status);
        Assert.Equal(0, delinquency.ConsecutiveMissedMonths);
        Assert.False(delinquency.CancellationRequired);
    }

    private async Task<SeededContract> SeedContractAsync(
        DateTimeOffset now,
        params (int Month, MonthlyObligationStatus ObligationStatus, PaymentInstructionStatus PaymentStatus)[] months)
    {
        var tenantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var contractId = Guid.NewGuid();
        var monthIds = new Dictionary<int, Guid>();

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
        db.Users.AddRange(
            new UserRow
            {
                Id = tenantId,
                OidcSubject = $"chronology-tenant-{tenantId:D}",
                CreatedAtUtc = now,
            },
            new UserRow
            {
                Id = ownerId,
                OidcSubject = $"chronology-owner-{ownerId:D}",
                CreatedAtUtc = now,
            });
        db.LeaseContracts.Add(new LeaseContractRow
        {
            Id = contractId,
            TenantUserId = tenantId,
            OwnerUserId = ownerId,
            PropertyId = Guid.NewGuid(),
            Status = LeaseContractStatus.Active,
            CreatedAtUtc = now.AddMonths(-4),
            UpdatedAtUtc = now,
        });

        foreach (var spec in months)
        {
            var obligationId = Guid.NewGuid();
            monthIds.Add(spec.Month, obligationId);
            db.MonthlyObligations.Add(new MonthlyObligationRow
            {
                Id = obligationId,
                ContractId = contractId,
                ContractMonthNumber = spec.Month,
                DueAtUtc = now.AddDays(-(10 - spec.Month)),
                Status = spec.ObligationStatus,
                CreatedAtUtc = now.AddMonths(-1),
                UpdatedAtUtc = now.AddDays(-1),
                ClosedAtUtc = spec.ObligationStatus == MonthlyObligationStatus.Open ? null : now.AddDays(-1),
            });
            db.PaymentInstructions.Add(new PaymentInstructionRow
            {
                Id = Guid.NewGuid(),
                ObligationId = obligationId,
                DueAtUtc = now.AddDays(-(10 - spec.Month)),
                BeneficiaryId = $"chronology-beneficiary-{spec.Month}",
                AmountRial = 1_000_000m + spec.Month,
                IdempotencyKey = $"chronology:{contractId:D}:{spec.Month}",
                Status = spec.PaymentStatus,
                CreatedAtUtc = now.AddMonths(-1),
                UpdatedAtUtc = now.AddDays(-1),
            });
        }

        await db.SaveChangesAsync();
        return new SeededContract(contractId, monthIds);
    }

    private async Task SetDelinquencyAsync(
        Guid contractId,
        int consecutiveMissedMonths,
        bool cancellationRequired,
        DateTimeOffset now)
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
        db.ContractDelinquencies.Add(new ContractDelinquencyRow
        {
            ContractId = contractId,
            ConsecutiveMissedMonths = consecutiveMissedMonths,
            CancellationRequired = cancellationRequired,
            UpdatedAtUtc = now,
        });
        await db.SaveChangesAsync();
    }

    private sealed record SeededContract(Guid ContractId, IReadOnlyDictionary<int, Guid> MonthIds);
}
