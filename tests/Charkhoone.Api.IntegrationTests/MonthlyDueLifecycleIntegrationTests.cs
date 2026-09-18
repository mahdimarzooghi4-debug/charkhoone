using Charkhoone.Application.Payments;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class MonthlyDueLifecycleIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;
    private string? _isolatedConnectionString;
    private string? _isolatedDatabaseName;

    public async Task InitializeAsync()
    {
        var databaseName = $"charkhoone_due_lifecycle_{Guid.NewGuid():N}";
        var adminBuilder = new NpgsqlConnectionStringBuilder(_factory.ConnectionString)
        {
            Database = "postgres",
        };

        await using (var connection = new NpgsqlConnection(adminBuilder.ConnectionString))
        {
            await connection.OpenAsync();
            await using var command = connection.CreateCommand();
            command.CommandText = $"CREATE DATABASE \"{databaseName}\"";
            await command.ExecuteNonQueryAsync();
        }

        var isolatedBuilder = new NpgsqlConnectionStringBuilder(_factory.ConnectionString)
        {
            Database = databaseName,
        };
        _isolatedDatabaseName = databaseName;
        _isolatedConnectionString = isolatedBuilder.ConnectionString;

        await using var db = CreateDbContext();
        await db.Database.MigrateAsync();
    }

    public async Task DisposeAsync()
    {
        if (_isolatedDatabaseName is null)
        {
            return;
        }

        NpgsqlConnection.ClearAllPools();
        var adminBuilder = new NpgsqlConnectionStringBuilder(_factory.ConnectionString)
        {
            Database = "postgres",
        };

        await using var connection = new NpgsqlConnection(adminBuilder.ConnectionString);
        await connection.OpenAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = $"DROP DATABASE IF EXISTS \"{_isolatedDatabaseName}\" WITH (FORCE)";
        await command.ExecuteNonQueryAsync();
    }

    [Fact]
    public async Task DueMonth_ExactConfirmedComponents_ClosesPaidAndReplayDoesNotRequery()
    {
        var now = DateTimeOffset.Parse("2026-09-18T20:00:00+00:00");
        var fixture = await SeedSingleDueMonthAsync(now);
        var adapter = new RecordingPaymentAdapter(ExternalPaymentReconciliationStatus.Succeeded);

        ProcessMonthlyDueResult first;
        await using (var db = CreateDbContext())
        {
            var payments = new EfPaymentService(db, adapter);
            var service = new EfMonthlyDueLifecycleService(db, payments, payments);
            first = await service.ProcessAsync(fixture.ObligationId, now);
        }

        Assert.Equal(ProcessMonthlyDueOutcome.Paid, first.Outcome);
        Assert.Equal(2, first.ReconciliationAttempts);
        Assert.Equal(2, adapter.CallCount);

        await using (var db = CreateDbContext())
        {
            var obligation = await db.MonthlyObligations.AsNoTracking()
                .SingleAsync(x => x.Id == fixture.ObligationId);
            Assert.Equal(MonthlyObligationStatus.Paid, obligation.Status);
            Assert.NotNull(obligation.ClosedAtUtc);

            var statuses = await db.PaymentInstructions.AsNoTracking()
                .Where(x => x.ObligationId == fixture.ObligationId)
                .Select(x => x.Status)
                .ToListAsync();
            Assert.Equal(2, statuses.Count);
            Assert.All(statuses, status => Assert.Equal(PaymentInstructionStatus.Succeeded, status));

            Assert.Equal(
                2,
                await db.ExternalTransactions.CountAsync(x =>
                    x.AggregateType == "PaymentInstruction"
                    && x.OperationType == "payment_reconciliation"
                    && x.Status == ExternalTransactionStatus.Succeeded));
            Assert.Equal(
                1,
                await db.AuditEvents.CountAsync(x =>
                    x.AggregateId == fixture.ContractId
                    && x.Action == "monthly_obligation_paid"));
        }

        await using (var db = CreateDbContext())
        {
            var payments = new EfPaymentService(db, adapter);
            var service = new EfMonthlyDueLifecycleService(db, payments, payments);
            var replay = await service.ProcessAsync(fixture.ObligationId, now.AddMinutes(1));

            Assert.Equal(ProcessMonthlyDueOutcome.AlreadyClosed, replay.Outcome);
            Assert.Equal(0, replay.ReconciliationAttempts);
        }

        Assert.Equal(2, adapter.CallCount);
    }

    [Fact]
    public async Task DueMonth_DefinitiveFailures_ClosesMissed()
    {
        var now = DateTimeOffset.Parse("2026-09-18T20:30:00+00:00");
        var fixture = await SeedSingleDueMonthAsync(now);
        var adapter = new RecordingPaymentAdapter(ExternalPaymentReconciliationStatus.Failed);

        await using (var db = CreateDbContext())
        {
            var payments = new EfPaymentService(db, adapter);
            var service = new EfMonthlyDueLifecycleService(db, payments, payments);
            var result = await service.ProcessAsync(fixture.ObligationId, now);

            Assert.Equal(ProcessMonthlyDueOutcome.Missed, result.Outcome);
            Assert.Equal(2, result.ReconciliationAttempts);
        }

        Assert.Equal(2, adapter.CallCount);

        await using var finalDb = CreateDbContext();
        var obligation = await finalDb.MonthlyObligations.AsNoTracking()
            .SingleAsync(x => x.Id == fixture.ObligationId);
        Assert.Equal(MonthlyObligationStatus.Missed, obligation.Status);

        var statuses = await finalDb.PaymentInstructions.AsNoTracking()
            .Where(x => x.ObligationId == fixture.ObligationId)
            .Select(x => x.Status)
            .ToListAsync();
        Assert.All(statuses, status => Assert.Equal(PaymentInstructionStatus.Failed, status));

        var delinquency = await finalDb.ContractDelinquencies.AsNoTracking()
            .SingleAsync(x => x.ContractId == fixture.ContractId);
        Assert.Equal(1, delinquency.ConsecutiveMissedMonths);
        Assert.False(delinquency.CancellationRequired);
    }

    [Fact]
    public async Task DueMonth_WithOlderDebt_BecomesArrearsBlockedMissed_ThenCoverageCanPayIt()
    {
        var now = DateTimeOffset.Parse("2026-09-18T21:00:00+00:00");
        var fixture = await SeedArrearsBlockedScenarioAsync(now);
        var paymentAdapter = new RecordingPaymentAdapter(ExternalPaymentReconciliationStatus.Succeeded);

        await using (var db = CreateDbContext())
        {
            var payments = new EfPaymentService(db, paymentAdapter);
            var service = new EfMonthlyDueLifecycleService(db, payments, payments);
            var result = await service.ProcessAsync(fixture.CurrentObligationId, now);

            Assert.Equal(ProcessMonthlyDueOutcome.Missed, result.Outcome);
            Assert.Equal(1, result.ReconciliationAttempts);
        }

        Assert.Equal(0, paymentAdapter.CallCount);

        await using (var db = CreateDbContext())
        {
            var statuses = await db.PaymentInstructions.AsNoTracking()
                .Where(x => x.ObligationId == fixture.CurrentObligationId)
                .OrderBy(x => x.Id)
                .Select(x => x.Status)
                .ToListAsync();
            Assert.Equal(2, statuses.Count);
            Assert.All(statuses, status => Assert.Equal(PaymentInstructionStatus.ArrearsBlocked, status));

            var obligation = await db.MonthlyObligations.AsNoTracking()
                .SingleAsync(x => x.Id == fixture.CurrentObligationId);
            Assert.Equal(MonthlyObligationStatus.Missed, obligation.Status);

            var delinquency = await db.ContractDelinquencies.AsNoTracking()
                .SingleAsync(x => x.ContractId == fixture.ContractId);
            Assert.Equal(2, delinquency.ConsecutiveMissedMonths);
            Assert.False(delinquency.CancellationRequired);

            Assert.Equal(
                2,
                await db.AuditEvents.CountAsync(x =>
                    x.Action == "payment_blocked_by_older_arrears"
                    && db.PaymentInstructions.Any(payment =>
                        payment.Id == x.AggregateId
                        && payment.ObligationId == fixture.CurrentObligationId)));

            var blockedPayloads = await db.OutboxMessages.AsNoTracking()
                .Where(x => x.Type == "payment-instruction.arrears-blocked.v1")
                .Select(x => x.PayloadJson)
                .ToListAsync();
            Assert.Equal(
                2,
                blockedPayloads.Count(payload => payload.Contains(
                    fixture.CurrentObligationId.ToString("D"),
                    StringComparison.OrdinalIgnoreCase)));

            Assert.Equal(
                0,
                await db.ExternalTransactions.CountAsync(x =>
                    x.AggregateType == "PaymentInstruction"
                    && db.PaymentInstructions.Any(payment =>
                        payment.Id == x.AggregateId
                        && payment.ObligationId == fixture.CurrentObligationId)));
        }

        var coverageAdapter = new ConfirmingCoverageAdapter();
        await using (var db = CreateDbContext())
        {
            var coverage = new EfTenantContributionCoverageService(db, coverageAdapter);
            var result = await coverage.CoverAsync(fixture.CurrentObligationId, now.AddMinutes(1));

            Assert.Equal(CoverMonthlyObligationOutcome.Covered, result.Outcome);
            Assert.Equal(2, result.CoveragePayments.Count);
            Assert.All(
                result.CoveragePayments,
                payment => Assert.Equal(CoveragePaymentStatus.Succeeded, payment.Status));
        }

        Assert.Equal(2, coverageAdapter.CallCount);

        await using var coveredDb = CreateDbContext();
        Assert.Equal(
            MonthlyObligationStatus.Covered,
            await coveredDb.MonthlyObligations.AsNoTracking()
                .Where(x => x.Id == fixture.CurrentObligationId)
                .Select(x => x.Status)
                .SingleAsync());
        Assert.Equal(
            2,
            await coveredDb.CoveragePayments.CountAsync(x =>
                x.MonthlyObligationId == fixture.CurrentObligationId
                && x.Status == CoveragePaymentStatus.Succeeded));
    }

    private async Task<SingleMonthFixture> SeedSingleDueMonthAsync(DateTimeOffset now)
    {
        var tenantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var contractId = Guid.NewGuid();
        var obligationId = Guid.NewGuid();

        await using var db = CreateDbContext();
        db.Users.AddRange(
            new UserRow
            {
                Id = tenantId,
                OidcSubject = $"due-tenant-{tenantId:D}",
                CreatedAtUtc = now.AddDays(-30),
            },
            new UserRow
            {
                Id = ownerId,
                OidcSubject = $"due-owner-{ownerId:D}",
                CreatedAtUtc = now.AddDays(-30),
            });

        db.LeaseContracts.Add(new LeaseContractRow
        {
            Id = contractId,
            TenantUserId = tenantId,
            OwnerUserId = ownerId,
            PropertyId = Guid.NewGuid(),
            Status = LeaseContractStatus.Active,
            CreatedAtUtc = now.AddMonths(-2),
            UpdatedAtUtc = now.AddDays(-1),
        });

        db.ContractDelinquencies.Add(new ContractDelinquencyRow
        {
            ContractId = contractId,
            ConsecutiveMissedMonths = 0,
            CancellationRequired = false,
            UpdatedAtUtc = now.AddDays(-1),
        });

        db.MonthlyObligations.Add(new MonthlyObligationRow
        {
            Id = obligationId,
            ContractId = contractId,
            ContractMonthNumber = 1,
            DueAtUtc = now.AddMinutes(-5),
            Status = MonthlyObligationStatus.Open,
            CreatedAtUtc = now.AddDays(-10),
            UpdatedAtUtc = now.AddDays(-10),
        });

        AddCreatedInstruction(
            db,
            obligationId,
            contractId,
            1,
            MonthlyObligationComponentKind.OwnerPayment,
            "due-owner-beneficiary",
            90_000_000m,
            now);
        AddCreatedInstruction(
            db,
            obligationId,
            contractId,
            1,
            MonthlyObligationComponentKind.BankInterest,
            "due-bank-beneficiary",
            10_000_000m,
            now);

        await db.SaveChangesAsync();
        return new SingleMonthFixture(contractId, obligationId);
    }

    private async Task<ArrearsFixture> SeedArrearsBlockedScenarioAsync(DateTimeOffset now)
    {
        var tenantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var contractId = Guid.NewGuid();
        var allocationId = Guid.NewGuid();
        var previousObligationId = Guid.NewGuid();
        var currentObligationId = Guid.NewGuid();

        await using var db = CreateDbContext();
        db.Users.AddRange(
            new UserRow
            {
                Id = tenantId,
                OidcSubject = $"arrears-due-tenant-{tenantId:D}",
                CreatedAtUtc = now.AddMonths(-4),
            },
            new UserRow
            {
                Id = ownerId,
                OidcSubject = $"arrears-due-owner-{ownerId:D}",
                CreatedAtUtc = now.AddMonths(-4),
            });

        db.CreditApplications.Add(new CreditApplicationRow
        {
            Id = applicationId,
            ApplicantUserId = tenantId,
            Status = CreditApplicationStatus.ApprovedFunded,
            CreatedAtUtc = now.AddMonths(-4),
            UpdatedAtUtc = now.AddMonths(-4),
        });

        db.LeaseContracts.Add(new LeaseContractRow
        {
            Id = contractId,
            TenantUserId = tenantId,
            OwnerUserId = ownerId,
            PropertyId = Guid.NewGuid(),
            CreditApplicationId = applicationId,
            Status = LeaseContractStatus.Active,
            CreatedAtUtc = now.AddMonths(-3),
            UpdatedAtUtc = now.AddDays(-1),
        });

        db.FundingAllocations.Add(new FundingAllocationRow
        {
            Id = allocationId,
            CreditApplicationId = applicationId,
            ContractId = contractId,
            BankLoanPlanId = Guid.NewGuid(),
            BankLoanPlanVersion = "due-lifecycle-v1",
            BankId = "due-lifecycle-bank",
            FullDepositEquivalentRial = 1_000_000_000m,
            MaximumEligibleLoanRial = 700_000_000m,
            BankApprovedLoanRial = 700_000_000m,
            TenantContributionRial = 300_000_000m,
            CreatedAtUtc = now.AddMonths(-3),
            UpdatedAtUtc = now.AddMonths(-3),
        });

        db.TenantContributions.Add(new TenantContributionRow
        {
            ContractId = contractId,
            FundingAllocationId = allocationId,
            InitialAmountRial = 300_000_000m,
            FundReference = $"due-lifecycle-fund:{contractId:D}",
            FundedAtUtc = now.AddMonths(-3),
        });

        db.LedgerAccounts.AddRange(
            new LedgerAccountRow
            {
                Id = Guid.NewGuid(),
                Code = $"contract:{contractId:D}:fund-held-tenant-contribution",
                Name = "Fund-held tenant contribution",
                Currency = "IRR",
                ContractId = contractId,
                CreatedAtUtc = now.AddMonths(-3),
            },
            new LedgerAccountRow
            {
                Id = Guid.NewGuid(),
                Code = $"contract:{contractId:D}:tenant-contribution-balance",
                Name = "Tenant contribution balance",
                Currency = "IRR",
                ContractId = contractId,
                CreatedAtUtc = now.AddMonths(-3),
            });

        db.ContractDelinquencies.Add(new ContractDelinquencyRow
        {
            ContractId = contractId,
            ConsecutiveMissedMonths = 1,
            CancellationRequired = false,
            UpdatedAtUtc = now.AddMonths(-1),
        });

        db.MonthlyObligations.AddRange(
            new MonthlyObligationRow
            {
                Id = previousObligationId,
                ContractId = contractId,
                ContractMonthNumber = 1,
                DueAtUtc = now.AddMonths(-1),
                Status = MonthlyObligationStatus.Missed,
                CreatedAtUtc = now.AddMonths(-2),
                UpdatedAtUtc = now.AddMonths(-1),
                ClosedAtUtc = now.AddMonths(-1),
            },
            new MonthlyObligationRow
            {
                Id = currentObligationId,
                ContractId = contractId,
                ContractMonthNumber = 2,
                DueAtUtc = now.AddMinutes(-5),
                Status = MonthlyObligationStatus.Open,
                CreatedAtUtc = now.AddMonths(-1),
                UpdatedAtUtc = now.AddMonths(-1),
            });

        AddTerminalFailedInstruction(
            db,
            previousObligationId,
            contractId,
            1,
            MonthlyObligationComponentKind.OwnerPayment,
            "previous-owner-beneficiary",
            1_000_000m,
            now.AddMonths(-1));

        AddCreatedInstruction(
            db,
            currentObligationId,
            contractId,
            2,
            MonthlyObligationComponentKind.OwnerPayment,
            "current-owner-beneficiary",
            9_000_000m,
            now);
        AddCreatedInstruction(
            db,
            currentObligationId,
            contractId,
            2,
            MonthlyObligationComponentKind.BankInterest,
            "current-bank-beneficiary",
            6_000_000m,
            now);

        await db.SaveChangesAsync();
        return new ArrearsFixture(contractId, currentObligationId);
    }

    private static void AddCreatedInstruction(
        CharkhooneDbContext db,
        Guid obligationId,
        Guid contractId,
        int contractMonthNumber,
        MonthlyObligationComponentKind kind,
        string beneficiaryId,
        decimal amountRial,
        DateTimeOffset now)
    {
        var paymentId = Guid.NewGuid();
        db.PaymentInstructions.Add(new PaymentInstructionRow
        {
            Id = paymentId,
            ObligationId = obligationId,
            DueAtUtc = now.AddMinutes(-5),
            BeneficiaryId = beneficiaryId,
            AmountRial = amountRial,
            IdempotencyKey = $"monthly-obligation:{contractId:D}:{contractMonthNumber}:{kind}:v1".ToLowerInvariant(),
            Status = PaymentInstructionStatus.Created,
            CreatedAtUtc = now.AddDays(-5),
            UpdatedAtUtc = now.AddDays(-5),
        });
        db.MonthlyObligationComponents.Add(new MonthlyObligationComponentRow
        {
            PaymentInstructionId = paymentId,
            MonthlyObligationId = obligationId,
            Kind = kind,
        });
    }

    private static void AddTerminalFailedInstruction(
        CharkhooneDbContext db,
        Guid obligationId,
        Guid contractId,
        int contractMonthNumber,
        MonthlyObligationComponentKind kind,
        string beneficiaryId,
        decimal amountRial,
        DateTimeOffset now)
    {
        var paymentId = Guid.NewGuid();
        db.PaymentInstructions.Add(new PaymentInstructionRow
        {
            Id = paymentId,
            ObligationId = obligationId,
            DueAtUtc = now,
            BeneficiaryId = beneficiaryId,
            AmountRial = amountRial,
            IdempotencyKey = $"monthly-obligation:{contractId:D}:{contractMonthNumber}:{kind}:v1".ToLowerInvariant(),
            Status = PaymentInstructionStatus.Failed,
            CreatedAtUtc = now.AddDays(-5),
            UpdatedAtUtc = now,
        });
        db.MonthlyObligationComponents.Add(new MonthlyObligationComponentRow
        {
            PaymentInstructionId = paymentId,
            MonthlyObligationId = obligationId,
            Kind = kind,
        });
    }

    private CharkhooneDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql(_isolatedConnectionString ?? _factory.ConnectionString)
            .Options;
        return new CharkhooneDbContext(options);
    }

    private sealed record SingleMonthFixture(Guid ContractId, Guid ObligationId);

    private sealed record ArrearsFixture(Guid ContractId, Guid CurrentObligationId);

    private sealed class RecordingPaymentAdapter(ExternalPaymentReconciliationStatus status)
        : IExternalPaymentReconciliationAdapter
    {
        public string Provider => "due-lifecycle-payment-provider";

        public int CallCount { get; private set; }

        public Task<ExternalPaymentReconciliationResponse> QueryAsync(
            ExternalPaymentReconciliationRequest request,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            return Task.FromResult(status switch
            {
                ExternalPaymentReconciliationStatus.Succeeded =>
                    new ExternalPaymentReconciliationResponse(
                        status,
                        Provider,
                        request.ExpectedAmountRial,
                        $"due-payment:{request.PaymentInstructionId:D}"),
                ExternalPaymentReconciliationStatus.Failed =>
                    new ExternalPaymentReconciliationResponse(
                        status,
                        Provider,
                        ReasonCode: "tenant_payment_not_found"),
                _ => new ExternalPaymentReconciliationResponse(
                    status,
                    Provider,
                    ReasonCode: "payment_status_indeterminate"),
            });
        }
    }

    private sealed class ConfirmingCoverageAdapter : IExternalCoverageTransferAdapter
    {
        public string Provider => "due-lifecycle-coverage-provider";

        public int CallCount { get; private set; }

        public Task<ExternalCoverageTransferResponse> EnsureOrQueryAsync(
            ExternalCoverageTransferRequest request,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            return Task.FromResult(new ExternalCoverageTransferResponse(
                ExternalCoverageTransferStatus.Confirmed,
                Provider,
                request.ExpectedAmountRial,
                $"due-coverage:{request.CoveragePaymentId:D}"));
        }
    }
}
