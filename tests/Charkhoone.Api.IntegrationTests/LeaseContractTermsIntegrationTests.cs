using Charkhoone.Application.Contracts;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Infrastructure.Contracts;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class LeaseContractTermsIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;

    public Task InitializeAsync() => _factory.MigrateAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Capture_ReplayAndConflict_AreImmutableAndIdempotent()
    {
        var occurredAt = DateTimeOffset.Parse("2026-09-18T18:00:00+00:00");
        var contractId = await SeedDraftContractAsync(
            occurredAt,
            eligibilityFullDepositRial: 3_000_000_000m);

        var command = CreateCommand(contractId);

        CaptureLeaseContractTermsResult captured;
        await using (var db = CreateDbContext())
        {
            var service = new EfLeaseContractTermsService(db);
            captured = await service.CaptureAsync(command, occurredAt);
        }

        Assert.Equal(CaptureLeaseContractTermsOutcome.Captured, captured.Outcome);
        Assert.NotNull(captured.Snapshot);
        Assert.Equal("Persian", captured.Snapshot!.Calendar);
        Assert.Equal(1405, captured.Snapshot.PersianStartYear);
        Assert.Equal(7, captured.Snapshot.PersianStartMonth);
        Assert.Equal(1, captured.Snapshot.PersianStartDay);
        Assert.Equal(12, captured.Snapshot.TermMonths);
        Assert.Equal(3_000_000_000m, captured.Snapshot.FullDepositEquivalentRial);
        Assert.Equal(12, captured.Snapshot.ScheduleMonths.Count);

        await using (var db = CreateDbContext())
        {
            Assert.Equal(
                1,
                await db.LeaseContractTerms.CountAsync(x => x.ContractId == contractId));
            Assert.Equal(
                12,
                await db.LeaseContractScheduleMonths.CountAsync(x => x.ContractId == contractId));
            Assert.Equal(
                1,
                await db.AuditEvents.CountAsync(x =>
                    x.AggregateId == contractId
                    && x.Action == "contract_terms_schedule_captured"));

            var payloads = await db.OutboxMessages.AsNoTracking()
                .Where(x => x.Type == "lease-contract.terms-schedule-captured.v1")
                .Select(x => x.PayloadJson)
                .ToListAsync();
            Assert.Single(
                payloads,
                payload => payload.Contains(
                    contractId.ToString("D"),
                    StringComparison.OrdinalIgnoreCase));

            var tenantUserId = await db.LeaseContracts.AsNoTracking()
                .Where(x => x.Id == contractId)
                .Select(x => x.TenantUserId)
                .SingleAsync();

            var reader = new EfContractReadService(db);
            var detail = await reader.GetDetailAsync(contractId, tenantUserId);

            Assert.NotNull(detail);
            Assert.NotNull(detail!.Terms);
            Assert.Equal("Persian", detail.Terms!.Calendar);
            Assert.Equal(3_000_000_000m, detail.Terms.FullDepositEquivalentRial);
            Assert.Equal(12, detail.Terms.ScheduleMonths.Count);
        }

        await using (var db = CreateDbContext())
        {
            var service = new EfLeaseContractTermsService(db);
            var replay = await service.CaptureAsync(command, occurredAt.AddMinutes(1));

            Assert.Equal(CaptureLeaseContractTermsOutcome.Existing, replay.Outcome);
            Assert.NotNull(replay.Snapshot);
        }

        var conflictCommand = command with
        {
            SourceReference = "contract-document:changed-reference",
        };

        await using (var db = CreateDbContext())
        {
            var service = new EfLeaseContractTermsService(db);
            var conflict = await service.CaptureAsync(
                conflictCommand,
                occurredAt.AddMinutes(2));

            Assert.Equal(CaptureLeaseContractTermsOutcome.Conflict, conflict.Outcome);
            Assert.NotNull(conflict.Snapshot);
        }

        await using (var db = CreateDbContext())
        {
            var terms = await db.LeaseContractTerms
                .SingleAsync(x => x.ContractId == contractId);
            terms.SourceReference = "mutation-attempt";

            var error = await Assert.ThrowsAsync<InvalidOperationException>(
                () => db.SaveChangesAsync());
            Assert.Contains("immutable", error.Message, StringComparison.OrdinalIgnoreCase);
        }

        await using var finalDb = CreateDbContext();
        Assert.Equal(
            1,
            await finalDb.AuditEvents.CountAsync(x =>
                x.AggregateId == contractId
                && x.Action == "contract_terms_schedule_captured"));
        Assert.Equal(
            12,
            await finalDb.LeaseContractScheduleMonths.CountAsync(x => x.ContractId == contractId));
    }

    [Fact]
    public async Task Capture_WithEligibilityMismatch_FailsClosedWithoutSnapshot()
    {
        var occurredAt = DateTimeOffset.Parse("2026-09-18T18:30:00+00:00");
        var contractId = await SeedDraftContractAsync(
            occurredAt,
            eligibilityFullDepositRial: 2_900_000_000m);

        await using var db = CreateDbContext();
        var service = new EfLeaseContractTermsService(db);

        var result = await service.CaptureAsync(CreateCommand(contractId), occurredAt);

        Assert.Equal(CaptureLeaseContractTermsOutcome.Conflict, result.Outcome);
        Assert.Null(result.Snapshot);
        Assert.False(await db.LeaseContractTerms.AnyAsync(x => x.ContractId == contractId));
        Assert.False(await db.LeaseContractScheduleMonths.AnyAsync(x => x.ContractId == contractId));
    }

    [Fact]
    public async Task ActiveContractWithoutSnapshot_CannotCaptureLateTerms()
    {
        var occurredAt = DateTimeOffset.Parse("2026-09-18T19:00:00+00:00");
        var contractId = await SeedDraftContractAsync(
            occurredAt,
            eligibilityFullDepositRial: null,
            status: LeaseContractStatus.Active);

        await using var db = CreateDbContext();
        var service = new EfLeaseContractTermsService(db);

        var result = await service.CaptureAsync(CreateCommand(contractId), occurredAt);

        Assert.Equal(CaptureLeaseContractTermsOutcome.InvalidState, result.Outcome);
        Assert.Null(result.Snapshot);
    }

    private async Task<Guid> SeedDraftContractAsync(
        DateTimeOffset occurredAt,
        decimal? eligibilityFullDepositRial,
        LeaseContractStatus status = LeaseContractStatus.Draft)
    {
        var tenantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var contractId = Guid.NewGuid();

        await using var db = CreateDbContext();

        db.Users.AddRange(
            new UserRow
            {
                Id = tenantId,
                OidcSubject = $"terms-tenant-{tenantId:D}",
                CreatedAtUtc = occurredAt.AddDays(-10),
            },
            new UserRow
            {
                Id = ownerId,
                OidcSubject = $"terms-owner-{ownerId:D}",
                CreatedAtUtc = occurredAt.AddDays(-10),
            });

        db.CreditApplications.Add(new CreditApplicationRow
        {
            Id = applicationId,
            ApplicantUserId = tenantId,
            Status = CreditApplicationStatus.PropertyContractPending,
            CreatedAtUtc = occurredAt.AddDays(-5),
            UpdatedAtUtc = occurredAt.AddDays(-5),
        });

        db.LeaseContracts.Add(new LeaseContractRow
        {
            Id = contractId,
            TenantUserId = tenantId,
            OwnerUserId = ownerId,
            PropertyId = Guid.NewGuid(),
            CreditApplicationId = applicationId,
            Status = status,
            CreatedAtUtc = occurredAt.AddDays(-5),
            UpdatedAtUtc = occurredAt.AddDays(-5),
        });

        if (eligibilityFullDepositRial is not null)
        {
            db.CreditEligibilityAssessments.Add(new CreditEligibilityAssessmentRow
            {
                Id = Guid.NewGuid(),
                CreditApplicationId = applicationId,
                Provider = "terms-credit-provider",
                Status = "Valid",
                ExternalSubGrade = "A1",
                FullDepositEquivalentRial = eligibilityFullDepositRial.Value,
                LoanRatio = 0.55m,
                MaximumEligibleLoanRial = 1_000_000_000m,
                IdempotencyKey = $"terms-credit:{applicationId:D}",
                ExternalReference = $"terms-credit-reference:{applicationId:D}",
                AttemptCount = 1,
                CreatedAtUtc = occurredAt.AddDays(-4),
                UpdatedAtUtc = occurredAt.AddDays(-4),
            });
        }

        await db.SaveChangesAsync();
        return contractId;
    }

    private static CaptureLeaseContractTermsCommand CreateCommand(Guid contractId)
    {
        var firstDueAt = DateTimeOffset.Parse("2026-09-23T20:30:00+00:00");
        var schedule = Enumerable.Range(1, 12)
            .Select(month => new LeaseContractScheduleMonthInput(
                month,
                firstDueAt.AddMonths(month - 1),
                90_000_000m,
                10_000_000m))
            .ToArray();

        return new CaptureLeaseContractTermsCommand(
            contractId,
            PersianStartYear: 1405,
            PersianStartMonth: 7,
            PersianStartDay: 1,
            CashDepositRial: 0m,
            MonthlyRentRial: 90_000_000m,
            OwnerBeneficiaryId: "owner-beneficiary:trusted-v1",
            BankBeneficiaryId: "bank-beneficiary:trusted-v1",
            SourceReference: "contract-document:trusted-v1",
            ScheduleMonths: schedule);
    }

    private CharkhooneDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql(_factory.ConnectionString)
            .Options;
        return new CharkhooneDbContext(options);
    }
}
