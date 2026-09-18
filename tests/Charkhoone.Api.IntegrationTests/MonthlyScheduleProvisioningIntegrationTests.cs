using Charkhoone.Application.Payments;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class MonthlyScheduleProvisioningIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;

    public Task InitializeAsync() => _factory.MigrateAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task ExactSnapshot_ProvisionsTwelveMonthsAndReplaysExactlyOnce()
    {
        var now = DateTimeOffset.Parse("2026-09-18T18:00:00+00:00");
        var fixture = await SeedActiveContractWithTermsAsync(now);

        ProvisionMonthlyScheduleResult first;
        await using (var db = CreateDbContext())
        {
            var service = new EfMonthlyScheduleProvisioningService(db);
            first = await service.ProvisionAsync(fixture.ContractId, now);
        }

        Assert.Equal(ProvisionMonthlyScheduleOutcome.Provisioned, first.Outcome);
        Assert.Equal(12, first.CreatedObligationCount);
        Assert.Equal(0, first.ExistingObligationCount);

        await using (var db = CreateDbContext())
        {
            var obligations = await db.MonthlyObligations.AsNoTracking()
                .Where(x => x.ContractId == fixture.ContractId)
                .OrderBy(x => x.ContractMonthNumber)
                .ToListAsync();
            Assert.Equal(12, obligations.Count);

            var obligationIds = obligations.Select(x => x.Id).ToArray();
            var components = await (
                from component in db.MonthlyObligationComponents.AsNoTracking()
                join payment in db.PaymentInstructions.AsNoTracking()
                    on component.PaymentInstructionId equals payment.Id
                where obligationIds.Contains(component.MonthlyObligationId)
                select new
                {
                    component.MonthlyObligationId,
                    component.Kind,
                    payment.DueAtUtc,
                    payment.BeneficiaryId,
                    payment.AmountRial,
                    payment.IdempotencyKey,
                })
                .ToListAsync();

            Assert.Equal(24, components.Count);

            foreach (var obligation in obligations)
            {
                var month = obligation.ContractMonthNumber;
                var expectedDueAt = fixture.FirstDueAt.AddMonths(month - 1);
                Assert.Equal(expectedDueAt, obligation.DueAtUtc);
                Assert.Equal(MonthlyObligationStatus.Open, obligation.Status);

                var owner = Assert.Single(
                    components,
                    x => x.MonthlyObligationId == obligation.Id
                        && x.Kind == MonthlyObligationComponentKind.OwnerPayment);
                Assert.Equal(expectedDueAt, owner.DueAtUtc);
                Assert.Equal(fixture.OwnerBeneficiaryId, owner.BeneficiaryId);
                Assert.Equal(90_000_000m, owner.AmountRial);
                Assert.Equal(
                    PaymentInstructionKey(
                        fixture.ContractId,
                        month,
                        MonthlyObligationComponentKind.OwnerPayment),
                    owner.IdempotencyKey);

                var bank = Assert.Single(
                    components,
                    x => x.MonthlyObligationId == obligation.Id
                        && x.Kind == MonthlyObligationComponentKind.BankInterest);
                Assert.Equal(expectedDueAt, bank.DueAtUtc);
                Assert.Equal(fixture.BankBeneficiaryId, bank.BeneficiaryId);
                Assert.Equal(10_000_000m, bank.AmountRial);
                Assert.Equal(
                    PaymentInstructionKey(
                        fixture.ContractId,
                        month,
                        MonthlyObligationComponentKind.BankInterest),
                    bank.IdempotencyKey);
            }

            Assert.Equal(
                1,
                await db.ContractDelinquencies.CountAsync(x =>
                    x.ContractId == fixture.ContractId));
            Assert.Equal(
                12,
                await db.AuditEvents.CountAsync(x =>
                    x.AggregateId == fixture.ContractId
                    && x.Action == "monthly_obligation_created"));
            Assert.Equal(
                1,
                await db.AuditEvents.CountAsync(x =>
                    x.AggregateId == fixture.ContractId
                    && x.Action == "monthly_schedule_provisioned"));

            var terminalPayloads = await db.OutboxMessages.AsNoTracking()
                .Where(x => x.Type == "lease-contract.monthly-schedule-provisioned.v1")
                .Select(x => x.PayloadJson)
                .ToListAsync();
            Assert.Single(
                terminalPayloads,
                payload => payload.Contains(
                    fixture.ContractId.ToString("D"),
                    StringComparison.OrdinalIgnoreCase));
        }

        await using (var db = CreateDbContext())
        {
            var service = new EfMonthlyScheduleProvisioningService(db);
            var replay = await service.ProvisionAsync(
                fixture.ContractId,
                now.AddMinutes(1));

            Assert.Equal(ProvisionMonthlyScheduleOutcome.AlreadyProvisioned, replay.Outcome);
            Assert.Equal(0, replay.CreatedObligationCount);
            Assert.Equal(12, replay.ExistingObligationCount);
        }

        await using var finalDb = CreateDbContext();
        Assert.Equal(
            12,
            await finalDb.MonthlyObligations.CountAsync(x =>
                x.ContractId == fixture.ContractId));
        Assert.Equal(
            1,
            await finalDb.AuditEvents.CountAsync(x =>
                x.AggregateId == fixture.ContractId
                && x.Action == "monthly_schedule_provisioned"));
        Assert.Equal(
            1,
            await finalDb.OutboxMessages.CountAsync(x =>
                x.Type == "lease-contract.monthly-schedule-provisioned.v1"));
    }

    [Fact]
    public async Task ExactPartialState_IsCompletedAtomicallyWithoutDuplicatingExistingMonth()
    {
        var now = DateTimeOffset.Parse("2026-09-18T18:30:00+00:00");
        var fixture = await SeedActiveContractWithTermsAsync(now);
        var existingObligationId = await SeedExistingMonthAsync(
            fixture,
            contractMonthNumber: 1,
            ownerPaymentRial: 90_000_000m,
            bankInterestRial: 10_000_000m,
            now.AddMinutes(-1));

        await using (var db = CreateDbContext())
        {
            var service = new EfMonthlyScheduleProvisioningService(db);
            var result = await service.ProvisionAsync(fixture.ContractId, now);

            Assert.Equal(ProvisionMonthlyScheduleOutcome.Provisioned, result.Outcome);
            Assert.Equal(11, result.CreatedObligationCount);
            Assert.Equal(1, result.ExistingObligationCount);
        }

        await using var finalDb = CreateDbContext();
        Assert.Equal(
            12,
            await finalDb.MonthlyObligations.CountAsync(x =>
                x.ContractId == fixture.ContractId));
        Assert.Equal(
            existingObligationId,
            await finalDb.MonthlyObligations.AsNoTracking()
                .Where(x =>
                    x.ContractId == fixture.ContractId
                    && x.ContractMonthNumber == 1)
                .Select(x => x.Id)
                .SingleAsync());
        Assert.Equal(
            24,
            await (
                from payment in finalDb.PaymentInstructions.AsNoTracking()
                join obligation in finalDb.MonthlyObligations.AsNoTracking()
                    on payment.ObligationId equals obligation.Id
                where obligation.ContractId == fixture.ContractId
                select payment.Id)
                .CountAsync());
        Assert.Equal(
            11,
            await finalDb.AuditEvents.CountAsync(x =>
                x.AggregateId == fixture.ContractId
                && x.Action == "monthly_obligation_created"));
        Assert.Equal(
            1,
            await finalDb.AuditEvents.CountAsync(x =>
                x.AggregateId == fixture.ContractId
                && x.Action == "monthly_schedule_provisioned"));
    }

    [Fact]
    public async Task ExistingMismatch_FailsClosedAndQueuesReviewOnce()
    {
        var now = DateTimeOffset.Parse("2026-09-18T19:00:00+00:00");
        var fixture = await SeedActiveContractWithTermsAsync(now);
        await SeedExistingMonthAsync(
            fixture,
            contractMonthNumber: 1,
            ownerPaymentRial: 90_000_001m,
            bankInterestRial: 10_000_000m,
            now.AddMinutes(-1));

        await using (var db = CreateDbContext())
        {
            var service = new EfMonthlyScheduleProvisioningService(db);
            var result = await service.ProvisionAsync(fixture.ContractId, now);

            Assert.Equal(ProvisionMonthlyScheduleOutcome.Conflict, result.Outcome);
            Assert.Equal(0, result.CreatedObligationCount);
            Assert.Equal(1, result.ExistingObligationCount);
        }

        await using (var db = CreateDbContext())
        {
            Assert.Equal(
                1,
                await db.MonthlyObligations.CountAsync(x =>
                    x.ContractId == fixture.ContractId));
            Assert.Equal(
                1,
                await db.AuditEvents.CountAsync(x =>
                    x.AggregateId == fixture.ContractId
                    && x.Action == "monthly_schedule_provisioning_conflict"));
            Assert.Equal(
                1,
                await db.OutboxMessages.CountAsync(x =>
                    x.Type == "lease-contract.monthly-schedule-provisioning-review-required.v1"));
            Assert.Equal(
                0,
                await db.AuditEvents.CountAsync(x =>
                    x.AggregateId == fixture.ContractId
                    && x.Action == "monthly_schedule_provisioned"));
        }

        await using (var db = CreateDbContext())
        {
            var service = new EfMonthlyScheduleProvisioningService(db);
            var replay = await service.ProvisionAsync(
                fixture.ContractId,
                now.AddMinutes(1));

            Assert.Equal(ProvisionMonthlyScheduleOutcome.Conflict, replay.Outcome);
            Assert.Equal(0, replay.CreatedObligationCount);
            Assert.Equal(1, replay.ExistingObligationCount);
        }

        await using var finalDb = CreateDbContext();
        Assert.Equal(
            1,
            await finalDb.AuditEvents.CountAsync(x =>
                x.AggregateId == fixture.ContractId
                && x.Action == "monthly_schedule_provisioning_conflict"));
        Assert.Equal(
            1,
            await finalDb.OutboxMessages.CountAsync(x =>
                x.Type == "lease-contract.monthly-schedule-provisioning-review-required.v1"));
    }

    private async Task<Fixture> SeedActiveContractWithTermsAsync(DateTimeOffset now)
    {
        var contractId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var ownerBeneficiaryId = $"owner-beneficiary:{ownerId:D}";
        var bankBeneficiaryId = $"bank-beneficiary:{contractId:D}";
        var firstDueAt = now.AddDays(5);

        await using var db = CreateDbContext();
        db.Users.AddRange(
            new UserRow
            {
                Id = tenantId,
                OidcSubject = $"schedule-tenant-{tenantId:D}",
                CreatedAtUtc = now.AddDays(-30),
            },
            new UserRow
            {
                Id = ownerId,
                OidcSubject = $"schedule-owner-{ownerId:D}",
                CreatedAtUtc = now.AddDays(-30),
            });

        db.LeaseContracts.Add(new LeaseContractRow
        {
            Id = contractId,
            TenantUserId = tenantId,
            OwnerUserId = ownerId,
            PropertyId = Guid.NewGuid(),
            Status = LeaseContractStatus.Active,
            CreatedAtUtc = now.AddDays(-10),
            UpdatedAtUtc = now.AddMinutes(-5),
        });

        db.LeaseContractTerms.Add(new LeaseContractTermsRow
        {
            ContractId = contractId,
            Calendar = "Persian",
            PersianStartYear = 1405,
            PersianStartMonth = 7,
            PersianStartDay = 1,
            TermMonths = 12,
            CashDepositRial = 3_000_000_000m,
            MonthlyRentRial = 0m,
            FullDepositEquivalentRial = 3_000_000_000m,
            OwnerBeneficiaryId = ownerBeneficiaryId,
            BankBeneficiaryId = bankBeneficiaryId,
            SourceReference = $"trusted-schedule:{contractId:D}",
            CapturedAtUtc = now.AddMinutes(-6),
        });

        for (var month = 1; month <= 12; month++)
        {
            db.LeaseContractScheduleMonths.Add(new LeaseContractScheduleMonthRow
            {
                ContractId = contractId,
                ContractMonthNumber = month,
                DueAtUtc = firstDueAt.AddMonths(month - 1),
                OwnerPaymentRial = 90_000_000m,
                BankInterestRial = 10_000_000m,
            });
        }

        await db.SaveChangesAsync();

        return new Fixture(
            contractId,
            ownerBeneficiaryId,
            bankBeneficiaryId,
            firstDueAt);
    }

    private async Task<Guid> SeedExistingMonthAsync(
        Fixture fixture,
        int contractMonthNumber,
        decimal ownerPaymentRial,
        decimal bankInterestRial,
        DateTimeOffset occurredAtUtc)
    {
        var obligationId = Guid.NewGuid();
        var dueAt = fixture.FirstDueAt.AddMonths(contractMonthNumber - 1);
        var ownerPaymentId = Guid.NewGuid();
        var bankPaymentId = Guid.NewGuid();

        await using var db = CreateDbContext();

        db.MonthlyObligations.Add(new MonthlyObligationRow
        {
            Id = obligationId,
            ContractId = fixture.ContractId,
            ContractMonthNumber = contractMonthNumber,
            DueAtUtc = dueAt,
            Status = MonthlyObligationStatus.Open,
            CreatedAtUtc = occurredAtUtc,
            UpdatedAtUtc = occurredAtUtc,
        });

        db.PaymentInstructions.AddRange(
            new PaymentInstructionRow
            {
                Id = ownerPaymentId,
                ObligationId = obligationId,
                DueAtUtc = dueAt,
                BeneficiaryId = fixture.OwnerBeneficiaryId,
                AmountRial = ownerPaymentRial,
                IdempotencyKey = PaymentInstructionKey(
                    fixture.ContractId,
                    contractMonthNumber,
                    MonthlyObligationComponentKind.OwnerPayment),
                Status = PaymentInstructionStatus.Created,
                CreatedAtUtc = occurredAtUtc,
                UpdatedAtUtc = occurredAtUtc,
            },
            new PaymentInstructionRow
            {
                Id = bankPaymentId,
                ObligationId = obligationId,
                DueAtUtc = dueAt,
                BeneficiaryId = fixture.BankBeneficiaryId,
                AmountRial = bankInterestRial,
                IdempotencyKey = PaymentInstructionKey(
                    fixture.ContractId,
                    contractMonthNumber,
                    MonthlyObligationComponentKind.BankInterest),
                Status = PaymentInstructionStatus.Created,
                CreatedAtUtc = occurredAtUtc,
                UpdatedAtUtc = occurredAtUtc,
            });

        db.MonthlyObligationComponents.AddRange(
            new MonthlyObligationComponentRow
            {
                PaymentInstructionId = ownerPaymentId,
                MonthlyObligationId = obligationId,
                Kind = MonthlyObligationComponentKind.OwnerPayment,
            },
            new MonthlyObligationComponentRow
            {
                PaymentInstructionId = bankPaymentId,
                MonthlyObligationId = obligationId,
                Kind = MonthlyObligationComponentKind.BankInterest,
            });

        await db.SaveChangesAsync();
        return obligationId;
    }

    private static string PaymentInstructionKey(
        Guid contractId,
        int contractMonthNumber,
        MonthlyObligationComponentKind kind) =>
        $"monthly-obligation:{contractId:D}:{contractMonthNumber}:{kind}:v1".ToLowerInvariant();

    private CharkhooneDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql(_factory.ConnectionString)
            .Options;
        return new CharkhooneDbContext(options);
    }

    private sealed record Fixture(
        Guid ContractId,
        string OwnerBeneficiaryId,
        string BankBeneficiaryId,
        DateTimeOffset FirstDueAt);
}
