extern alias worker;

using Charkhoone.Application.Contracts;
using Charkhoone.Application.Payments;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Contracts;
using Charkhoone.Infrastructure.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using CharkhooneWorker = worker::Charkhoone.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Npgsql;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class NormalMaturityWorkerIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;
    private string? _isolatedConnectionString;
    private string? _isolatedDatabaseName;

    public async Task InitializeAsync()
    {
        var databaseName = $"charkhoone_maturity_worker_{Guid.NewGuid():N}";
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
    public async Task Worker_PreparesMaturity_ThenOffersNormalSettlementInSamePass()
    {
        var workerAt = DateTimeOffset.Parse("2026-09-18T16:00:00+00:00");
        var contractId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();

        await using (var db = CreateDbContext())
        {
            db.Users.AddRange(
                new UserRow
                {
                    Id = tenantId,
                    OidcSubject = $"maturity-worker-tenant-{tenantId:D}",
                    CreatedAtUtc = workerAt.AddMonths(-13),
                },
                new UserRow
                {
                    Id = ownerId,
                    OidcSubject = $"maturity-worker-owner-{ownerId:D}",
                    CreatedAtUtc = workerAt.AddMonths(-13),
                });

            db.LeaseContracts.Add(new LeaseContractRow
            {
                Id = contractId,
                TenantUserId = tenantId,
                OwnerUserId = ownerId,
                PropertyId = Guid.NewGuid(),
                Status = LeaseContractStatus.Active,
                CreatedAtUtc = workerAt.AddMonths(-13),
                UpdatedAtUtc = workerAt.AddMonths(-1),
            });

            for (var month = 1; month <= 12; month++)
            {
                var dueAt = workerAt.AddMonths(month - 13);
                db.MonthlyObligations.Add(new MonthlyObligationRow
                {
                    Id = Guid.NewGuid(),
                    ContractId = contractId,
                    ContractMonthNumber = month,
                    DueAtUtc = dueAt,
                    Status = MonthlyObligationStatus.Paid,
                    CreatedAtUtc = dueAt.AddDays(-2),
                    UpdatedAtUtc = dueAt.AddHours(1),
                    ClosedAtUtc = dueAt.AddHours(1),
                });
            }

            await db.SaveChangesAsync();
        }

        var normalSettlement = new RecordingNormalSettlementService();
        await using var provider = BuildWorkerServiceProvider(normalSettlement, workerAt);

        var worker = new CharkhooneWorker.FinancialReconciliationWorker(
            provider.GetRequiredService<IServiceScopeFactory>(),
            new CharkhooneWorker.FinancialReconciliationWorkerOptions
            {
                Enabled = true,
                BatchSize = 32,
            },
            provider.GetRequiredService<TimeProvider>(),
            provider.GetRequiredService<ILogger<CharkhooneWorker.FinancialReconciliationWorker>>());

        var result = await worker.ReconcileOnceAsync();

        Assert.Equal(0, result.LeaseFundingCandidates);
        Assert.Equal(0, result.ScheduleProvisioningCandidates);
        Assert.Equal(0, result.PaymentCandidates);
        Assert.Equal(0, result.DueLifecycleCandidates);
        Assert.Equal(0, result.CoverageCandidates);
        Assert.Equal(0, result.CancellationCandidates);
        Assert.Equal(0, result.CancellationBankPrincipalCandidates);
        Assert.Equal(1, result.NormalMaturityCandidates);
        Assert.Equal(1, result.NormalSettlementCandidates);
        Assert.Equal(1, normalSettlement.CallCount);
        Assert.Equal(contractId, normalSettlement.LastContractId);

        await using var finalDb = CreateDbContext();
        var contract = await finalDb.LeaseContracts.AsNoTracking()
            .SingleAsync(x => x.Id == contractId);
        Assert.Equal(LeaseContractStatus.SettlementPending, contract.Status);

        Assert.Equal(
            1,
            await finalDb.AuditEvents.CountAsync(x =>
                x.AggregateId == contractId
                && x.Action == "contract_entered_normal_settlement_pending"));
        Assert.Equal(
            1,
            await finalDb.OutboxMessages.CountAsync(x =>
                x.Type == "lease-contract.normal-settlement-pending.v1"));
    }

    [Fact]
    public async Task Worker_ActivatesFundingCompleteDraft_AndDoesNotRequeueActiveContract()
    {
        var workerAt = DateTimeOffset.Parse("2026-09-18T16:30:00+00:00");
        var contractId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var allocationId = Guid.NewGuid();
        var planId = Guid.NewGuid();
        var freezeId = Guid.NewGuid();
        var fundReference = $"worker-activation-fund-{contractId:D}";

        const decimal frozenPrincipalRial = 700_000_000m;
        const string bankId = "worker-activation-bank";
        const string planVersion = "worker-activation-v1";

        await using (var db = CreateDbContext())
        {
            db.Users.AddRange(
                new UserRow
                {
                    Id = tenantId,
                    OidcSubject = $"worker-activation-tenant-{tenantId:D}",
                    CreatedAtUtc = workerAt.AddMonths(-1),
                },
                new UserRow
                {
                    Id = ownerId,
                    OidcSubject = $"worker-activation-owner-{ownerId:D}",
                    CreatedAtUtc = workerAt.AddMonths(-1),
                });

            db.CreditApplications.Add(new CreditApplicationRow
            {
                Id = applicationId,
                ApplicantUserId = tenantId,
                Status = CreditApplicationStatus.ApprovedFunded,
                BankLoanPlanId = planId,
                BankLoanPlanVersion = planVersion,
                CreatedAtUtc = workerAt.AddDays(-10),
                UpdatedAtUtc = workerAt.AddMinutes(-10),
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
                CreatedAtUtc = workerAt.AddDays(-10),
                UpdatedAtUtc = workerAt.AddMinutes(-10),
            });

            db.FundingAllocations.Add(new FundingAllocationRow
            {
                Id = allocationId,
                CreditApplicationId = applicationId,
                ContractId = contractId,
                BankLoanPlanId = planId,
                BankLoanPlanVersion = planVersion,
                BankId = bankId,
                FullDepositEquivalentRial = frozenPrincipalRial,
                MaximumEligibleLoanRial = frozenPrincipalRial,
                BankApprovedLoanRial = frozenPrincipalRial,
                TenantContributionRial = 0m,
                CreatedAtUtc = workerAt.AddMinutes(-8),
                UpdatedAtUtc = workerAt.AddMinutes(-8),
            });

            db.FundPrincipalFreezes.Add(new FundPrincipalFreezeRow
            {
                Id = freezeId,
                FundingAllocationId = allocationId,
                Provider = "worker-activation-fund",
                Status = "Confirmed",
                IdempotencyKey = $"worker-activation-freeze:{allocationId:D}",
                FundReference = fundReference,
                ExternalReference = $"worker-activation-freeze-external:{freezeId:D}",
                AttemptCount = 1,
                CreatedAtUtc = workerAt.AddMinutes(-7),
                UpdatedAtUtc = workerAt.AddMinutes(-7),
            });

            db.FrozenPrincipals.Add(new FrozenPrincipalRow
            {
                ContractId = contractId,
                BankId = bankId,
                AmountRial = frozenPrincipalRial,
                FundReference = fundReference,
                FrozenAtUtc = workerAt.AddMinutes(-7),
            });

            db.LeaseContractTerms.Add(new LeaseContractTermsRow
            {
                ContractId = contractId,
                Calendar = "Persian",
                PersianStartYear = 1405,
                PersianStartMonth = 7,
                PersianStartDay = 1,
                TermMonths = 12,
                CashDepositRial = frozenPrincipalRial,
                MonthlyRentRial = 0m,
                FullDepositEquivalentRial = frozenPrincipalRial,
                OwnerBeneficiaryId = $"owner:{ownerId:D}",
                BankBeneficiaryId = bankId,
                SourceReference = $"fixture:worker-activation:{contractId:D}",
                CapturedAtUtc = workerAt.AddMinutes(-9),
            });

            for (var month = 1; month <= 12; month++)
            {
                db.LeaseContractScheduleMonths.Add(new LeaseContractScheduleMonthRow
                {
                    ContractId = contractId,
                    ContractMonthNumber = month,
                    DueAtUtc = workerAt.AddDays(1).AddMonths(month - 1),
                    OwnerPaymentRial = 0m,
                    BankInterestRial = 1_000_000m,
                });
            }

            await db.SaveChangesAsync();
        }

        var normalSettlement = new RecordingNormalSettlementService();
        await using var provider = BuildWorkerServiceProvider(normalSettlement, workerAt);
        var worker = new CharkhooneWorker.FinancialReconciliationWorker(
            provider.GetRequiredService<IServiceScopeFactory>(),
            new CharkhooneWorker.FinancialReconciliationWorkerOptions
            {
                Enabled = true,
                BatchSize = 32,
            },
            provider.GetRequiredService<TimeProvider>(),
            provider.GetRequiredService<ILogger<CharkhooneWorker.FinancialReconciliationWorker>>());

        var first = await worker.ReconcileOnceAsync();

        Assert.Equal(1, first.LeaseFundingCandidates);
        Assert.Equal(1, first.ScheduleProvisioningCandidates);
        Assert.Equal(0, first.PaymentCandidates);
        Assert.Equal(0, first.DueLifecycleCandidates);
        Assert.Equal(0, first.CoverageCandidates);
        Assert.Equal(0, first.CancellationCandidates);
        Assert.Equal(0, first.CancellationBankPrincipalCandidates);
        Assert.Equal(0, first.NormalMaturityCandidates);
        Assert.Equal(0, first.NormalSettlementCandidates);
        Assert.Equal(0, normalSettlement.CallCount);

        await using (var db = CreateDbContext())
        {
            var contract = await db.LeaseContracts.AsNoTracking()
                .SingleAsync(x => x.Id == contractId);
            Assert.Equal(LeaseContractStatus.Active, contract.Status);

            Assert.Equal(
                3,
                await db.WorkflowTransitions.CountAsync(x =>
                    x.AggregateType == "LeaseContract"
                    && x.AggregateId == contractId));
            Assert.Equal(
                1,
                await db.AuditEvents.CountAsync(x =>
                    x.AggregateId == contractId
                    && x.Action == "contract_activated"));
            Assert.Equal(
                12,
                await db.MonthlyObligations.CountAsync(x =>
                    x.ContractId == contractId));
            Assert.Equal(
                12,
                await db.PaymentInstructions.CountAsync(payment =>
                    db.MonthlyObligations.Any(obligation =>
                        obligation.Id == payment.ObligationId
                        && obligation.ContractId == contractId)));
            Assert.Equal(
                1,
                await db.AuditEvents.CountAsync(x =>
                    x.AggregateId == contractId
                    && x.Action == "monthly_schedule_provisioned"));
        }

        var second = await worker.ReconcileOnceAsync();

        Assert.Equal(0, second.LeaseFundingCandidates);
        Assert.Equal(0, second.ScheduleProvisioningCandidates);
        Assert.Equal(0, second.DueLifecycleCandidates);
        Assert.Equal(0, second.NormalMaturityCandidates);
        Assert.Equal(0, normalSettlement.CallCount);
    }

    [Fact]
    public async Task Worker_DelegatesOnlyDueOpenMonth_ToMonthlyDueLifecycle()
    {
        var workerAt = DateTimeOffset.Parse("2026-09-18T17:00:00+00:00");
        var tenantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var contractId = Guid.NewGuid();
        var dueObligationId = Guid.NewGuid();

        await using (var db = CreateDbContext())
        {
            db.Users.AddRange(
                new UserRow
                {
                    Id = tenantId,
                    OidcSubject = $"due-worker-tenant-{tenantId:D}",
                    CreatedAtUtc = workerAt.AddMonths(-2),
                },
                new UserRow
                {
                    Id = ownerId,
                    OidcSubject = $"due-worker-owner-{ownerId:D}",
                    CreatedAtUtc = workerAt.AddMonths(-2),
                });

            db.LeaseContracts.Add(new LeaseContractRow
            {
                Id = contractId,
                TenantUserId = tenantId,
                OwnerUserId = ownerId,
                PropertyId = Guid.NewGuid(),
                Status = LeaseContractStatus.Active,
                CreatedAtUtc = workerAt.AddMonths(-2),
                UpdatedAtUtc = workerAt.AddDays(-1),
            });

            db.MonthlyObligations.AddRange(
                new MonthlyObligationRow
                {
                    Id = dueObligationId,
                    ContractId = contractId,
                    ContractMonthNumber = 1,
                    DueAtUtc = workerAt.AddMinutes(-1),
                    Status = MonthlyObligationStatus.Open,
                    CreatedAtUtc = workerAt.AddMonths(-1),
                    UpdatedAtUtc = workerAt.AddMonths(-1),
                },
                new MonthlyObligationRow
                {
                    Id = Guid.NewGuid(),
                    ContractId = contractId,
                    ContractMonthNumber = 2,
                    DueAtUtc = workerAt.AddDays(1),
                    Status = MonthlyObligationStatus.Open,
                    CreatedAtUtc = workerAt.AddDays(-1),
                    UpdatedAtUtc = workerAt.AddDays(-1),
                });

            await db.SaveChangesAsync();
        }

        var normalSettlement = new RecordingNormalSettlementService();
        var dueLifecycle = new RecordingMonthlyDueLifecycleService();
        await using var provider = BuildWorkerServiceProvider(
            normalSettlement,
            workerAt,
            dueLifecycle);
        var worker = new CharkhooneWorker.FinancialReconciliationWorker(
            provider.GetRequiredService<IServiceScopeFactory>(),
            new CharkhooneWorker.FinancialReconciliationWorkerOptions
            {
                Enabled = true,
                BatchSize = 32,
            },
            provider.GetRequiredService<TimeProvider>(),
            provider.GetRequiredService<ILogger<CharkhooneWorker.FinancialReconciliationWorker>>());

        var result = await worker.ReconcileOnceAsync();

        Assert.Equal(1, result.DueLifecycleCandidates);
        Assert.Equal(1, dueLifecycle.CallCount);
        Assert.Equal(dueObligationId, dueLifecycle.LastObligationId);
        Assert.Equal(0, result.CoverageCandidates);
        Assert.Equal(0, result.CancellationCandidates);
        Assert.Equal(0, result.NormalMaturityCandidates);
    }

    [Fact]
    public async Task Worker_PostsConfirmedTenantArrearsRepayment_Once_WithExactLostFundReturn()
    {
        var workerAt = DateTimeOffset.Parse("2026-09-18T17:30:00+00:00");
        var withdrawnAtUtc = workerAt.AddDays(-10);
        var tenantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var contractId = Guid.NewGuid();
        var allocationId = Guid.NewGuid();
        var obligationId = Guid.NewGuid();
        var paymentInstructionId = Guid.NewGuid();
        var coverageExternalTransactionId = Guid.NewGuid();
        var coveragePaymentId = Guid.NewGuid();
        var replenishmentExternalTransactionId = Guid.NewGuid();
        var fundAssetAccountId = Guid.NewGuid();
        var tenantBalanceAccountId = Guid.NewGuid();
        const decimal principalRial = 1_000_000m;

        var exposure = LostFundReturnTerms.OpenExposure(
            contractId,
            coveragePaymentId,
            principalRial,
            withdrawnAtUtc);
        var accrual = LostFundReturnTerms.CalculateAccruedReturn(exposure, workerAt);
        var repaymentTotalRial = principalRial + accrual.PayableReturn.Rial;

        await using (var db = CreateDbContext())
        {
            db.Users.AddRange(
                new UserRow
                {
                    Id = tenantId,
                    OidcSubject = $"repayment-worker-tenant-{tenantId:D}",
                    CreatedAtUtc = withdrawnAtUtc.AddMonths(-2),
                },
                new UserRow
                {
                    Id = ownerId,
                    OidcSubject = $"repayment-worker-owner-{ownerId:D}",
                    CreatedAtUtc = withdrawnAtUtc.AddMonths(-2),
                });

            db.CreditApplications.Add(new CreditApplicationRow
            {
                Id = applicationId,
                ApplicantUserId = tenantId,
                Status = CreditApplicationStatus.ApprovedFunded,
                CreatedAtUtc = withdrawnAtUtc.AddMonths(-2),
                UpdatedAtUtc = withdrawnAtUtc.AddMonths(-2),
            });

            db.LeaseContracts.Add(new LeaseContractRow
            {
                Id = contractId,
                TenantUserId = tenantId,
                OwnerUserId = ownerId,
                PropertyId = Guid.NewGuid(),
                CreditApplicationId = applicationId,
                Status = LeaseContractStatus.Active,
                CreatedAtUtc = withdrawnAtUtc.AddMonths(-2),
                UpdatedAtUtc = withdrawnAtUtc,
            });

            db.FundingAllocations.Add(new FundingAllocationRow
            {
                Id = allocationId,
                CreditApplicationId = applicationId,
                ContractId = contractId,
                BankLoanPlanId = Guid.NewGuid(),
                BankLoanPlanVersion = "repayment-worker-v1",
                BankId = "repayment-worker-bank",
                FullDepositEquivalentRial = 5_000_000m,
                MaximumEligibleLoanRial = 3_000_000m,
                BankApprovedLoanRial = 3_000_000m,
                TenantContributionRial = 2_000_000m,
                CreatedAtUtc = withdrawnAtUtc.AddMonths(-2),
                UpdatedAtUtc = withdrawnAtUtc.AddMonths(-2),
            });

            db.TenantContributions.Add(new TenantContributionRow
            {
                ContractId = contractId,
                FundingAllocationId = allocationId,
                InitialAmountRial = 2_000_000m,
                FundReference = $"repayment-worker-fund:{contractId:D}",
                FundedAtUtc = withdrawnAtUtc.AddMonths(-2),
            });

            db.LedgerAccounts.AddRange(
                new LedgerAccountRow
                {
                    Id = fundAssetAccountId,
                    Code = $"contract:{contractId:D}:fund-held-tenant-contribution",
                    Name = "Fund-held tenant contribution",
                    Currency = "IRR",
                    ContractId = contractId,
                    CreatedAtUtc = withdrawnAtUtc.AddMonths(-2),
                },
                new LedgerAccountRow
                {
                    Id = tenantBalanceAccountId,
                    Code = $"contract:{contractId:D}:tenant-contribution-balance",
                    Name = "Tenant contribution balance",
                    Currency = "IRR",
                    ContractId = contractId,
                    CreatedAtUtc = withdrawnAtUtc.AddMonths(-2),
                });

            db.MonthlyObligations.Add(new MonthlyObligationRow
            {
                Id = obligationId,
                ContractId = contractId,
                ContractMonthNumber = 1,
                DueAtUtc = withdrawnAtUtc.AddDays(-1),
                Status = MonthlyObligationStatus.Covered,
                CreatedAtUtc = withdrawnAtUtc.AddMonths(-1),
                UpdatedAtUtc = withdrawnAtUtc,
                ClosedAtUtc = withdrawnAtUtc,
            });

            db.PaymentInstructions.Add(new PaymentInstructionRow
            {
                Id = paymentInstructionId,
                ObligationId = obligationId,
                DueAtUtc = withdrawnAtUtc.AddDays(-1),
                BeneficiaryId = "repayment-worker-owner-beneficiary",
                AmountRial = principalRial,
                IdempotencyKey = $"repayment-worker-payment:{paymentInstructionId:D}",
                Status = PaymentInstructionStatus.Failed,
                CreatedAtUtc = withdrawnAtUtc.AddMonths(-1),
                UpdatedAtUtc = withdrawnAtUtc,
            });

            db.MonthlyObligationComponents.Add(new MonthlyObligationComponentRow
            {
                MonthlyObligationId = obligationId,
                PaymentInstructionId = paymentInstructionId,
                Kind = MonthlyObligationComponentKind.OwnerPayment,
            });

            db.ExternalTransactions.AddRange(
                new ExternalTransactionRow
                {
                    Id = coverageExternalTransactionId,
                    Provider = "repayment-worker-coverage-provider",
                    OperationType = "tenant_contribution_coverage",
                    AggregateType = "PaymentInstruction",
                    AggregateId = paymentInstructionId,
                    Status = ExternalTransactionStatus.Succeeded,
                    AmountRial = principalRial,
                    Currency = "IRR",
                    IdempotencyKey = $"repayment-worker-coverage:{paymentInstructionId:D}",
                    ExternalReference = $"coverage:{paymentInstructionId:D}",
                    CreatedAtUtc = withdrawnAtUtc,
                    UpdatedAtUtc = withdrawnAtUtc,
                },
                new ExternalTransactionRow
                {
                    Id = replenishmentExternalTransactionId,
                    Provider = "repayment-worker-repayment-provider",
                    OperationType = "tenant_contribution_replenishment",
                    AggregateType = "LeaseContract",
                    AggregateId = contractId,
                    Status = ExternalTransactionStatus.Succeeded,
                    AmountRial = repaymentTotalRial,
                    Currency = "IRR",
                    IdempotencyKey = $"repayment-worker-replenishment:{contractId:D}",
                    ExternalReference = $"repayment:{contractId:D}",
                    CreatedAtUtc = workerAt.AddMinutes(-1),
                    UpdatedAtUtc = workerAt,
                });

            db.CoveragePayments.Add(new CoveragePaymentRow
            {
                Id = coveragePaymentId,
                ContractId = contractId,
                MonthlyObligationId = obligationId,
                PaymentInstructionId = paymentInstructionId,
                Kind = MonthlyObligationComponentKind.OwnerPayment,
                AmountRial = principalRial,
                BeneficiaryId = "repayment-worker-owner-beneficiary",
                Status = CoveragePaymentStatus.Succeeded,
                ExternalTransactionId = coverageExternalTransactionId,
                RemainingTenantContributionRial = 1_000_000m,
                CreatedAtUtc = withdrawnAtUtc,
                UpdatedAtUtc = withdrawnAtUtc,
                CoveredAtUtc = withdrawnAtUtc,
            });

            db.LostFundReturns.Add(new LostFundReturnRow
            {
                Id = Guid.NewGuid(),
                ContractId = contractId,
                CoveragePaymentId = coveragePaymentId,
                WithdrawnAmountRial = principalRial,
                MonthlyRate = LostFundReturnTerms.MonthlyRate,
                WithdrawnAtUtc = withdrawnAtUtc,
                CalculationPeriodStartUtc = withdrawnAtUtc,
                CreatedAtUtc = withdrawnAtUtc,
                UpdatedAtUtc = withdrawnAtUtc,
            });

            db.ContractDelinquencies.Add(new ContractDelinquencyRow
            {
                ContractId = contractId,
                ConsecutiveMissedMonths = 1,
                CancellationRequired = false,
                UpdatedAtUtc = withdrawnAtUtc,
            });

            await db.SaveChangesAsync();
        }

        var normalSettlement = new RecordingNormalSettlementService();
        await using var provider = BuildWorkerServiceProvider(
            normalSettlement,
            workerAt,
            useRealCoverage: true);
        var worker = new CharkhooneWorker.FinancialReconciliationWorker(
            provider.GetRequiredService<IServiceScopeFactory>(),
            new CharkhooneWorker.FinancialReconciliationWorkerOptions
            {
                Enabled = true,
                BatchSize = 32,
            },
            provider.GetRequiredService<TimeProvider>(),
            provider.GetRequiredService<ILogger<CharkhooneWorker.FinancialReconciliationWorker>>());

        var first = await worker.ReconcileOnceAsync();

        Assert.Equal(1, first.ReplenishmentCandidates);

        await using (var db = CreateDbContext())
        {
            var replenishment = await db.TenantContributionReplenishments
                .AsNoTracking()
                .SingleAsync(x => x.ExternalTransactionId == replenishmentExternalTransactionId);
            var lostReturn = await db.LostFundReturns
                .AsNoTracking()
                .SingleAsync(x => x.CoveragePaymentId == coveragePaymentId);
            var journalLines = await db.JournalLines
                .AsNoTracking()
                .Where(x => x.JournalEntryId == replenishment.JournalEntryId)
                .ToListAsync();

            Assert.Equal(principalRial, replenishment.AmountRial);
            Assert.Equal(2_000_000m, replenishment.RemainingTenantContributionRial);
            Assert.Equal(workerAt, replenishment.ReplenishedAtUtc);
            Assert.Equal(accrual.PayableReturn.Rial, lostReturn.CalculatedReturnRial!.Value);
            Assert.Equal(workerAt, lostReturn.ReplacedAtUtc!.Value);
            Assert.Equal(workerAt, lostReturn.CalculationPeriodEndUtc!.Value);
            Assert.Equal(LostFundReturnTerms.CalculationPolicyVersion, lostReturn.CalculationPolicyVersion);
            Assert.Equal(repaymentTotalRial, journalLines.Sum(x => x.DebitRial));
            Assert.Equal(repaymentTotalRial, journalLines.Sum(x => x.CreditRial));
            Assert.Contains(journalLines, x =>
                x.LedgerAccountId == fundAssetAccountId
                && x.DebitRial == repaymentTotalRial
                && x.CreditRial == 0m);
            Assert.Contains(journalLines, x =>
                x.LedgerAccountId == tenantBalanceAccountId
                && x.DebitRial == 0m
                && x.CreditRial == principalRial);
        }

        var second = await worker.ReconcileOnceAsync();

        Assert.Equal(0, second.ReplenishmentCandidates);
        await using var verificationDb = CreateDbContext();
        Assert.Equal(
            1,
            await verificationDb.TenantContributionReplenishments
                .CountAsync(x => x.ExternalTransactionId == replenishmentExternalTransactionId));
    }

    private ServiceProvider BuildWorkerServiceProvider(
        INormalSettlementService normalSettlement,
        DateTimeOffset workerAt,
        IMonthlyDueLifecycleService? dueLifecycle = null,
        bool useRealCoverage = false)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<CharkhooneDbContext>(options =>
            options.UseNpgsql(_isolatedConnectionString ?? _factory.ConnectionString));
        services.AddSingleton<TimeProvider>(new FixedTimeProvider(workerAt));
        services.AddScoped<ILeaseFundingLifecycleService, EfLeaseFundingLifecycleService>();
        services.AddScoped<IMonthlyScheduleProvisioningService, EfMonthlyScheduleProvisioningService>();
        services.AddSingleton<IMonthlyDueLifecycleService>(
            dueLifecycle ?? new NoOpMonthlyDueLifecycleService());
        services.AddScoped<INormalMaturityService, EfNormalMaturityService>();
        services.AddSingleton(normalSettlement);
        services.AddSingleton<INormalSettlementService>(normalSettlement);
        services.AddScoped<IPaymentReconciliationService, NoOpPaymentReconciliationService>();
        if (useRealCoverage)
        {
            services.AddSingleton<IExternalCoverageTransferAdapter, NeverCalledCoverageTransferAdapter>();
            services.AddScoped<ITenantContributionCoverageService, EfTenantContributionCoverageService>();
        }
        else
        {
            services.AddScoped<ITenantContributionCoverageService, NoOpCoverageService>();
        }
        services.AddScoped<ICancellationSettlementService, NoOpCancellationSettlementService>();
        services.AddScoped<ICancellationBankPrincipalSettlementService, NoOpCancellationBankPrincipalSettlementService>();
        return services.BuildServiceProvider();
    }

    private CharkhooneDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql(_isolatedConnectionString ?? _factory.ConnectionString)
            .Options;
        return new CharkhooneDbContext(options);
    }

    private sealed class FixedTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }

    private sealed class NoOpMonthlyDueLifecycleService : IMonthlyDueLifecycleService
    {
        public Task<ProcessMonthlyDueResult> ProcessAsync(
            Guid monthlyObligationId,
            DateTimeOffset occurredAtUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new ProcessMonthlyDueResult(
                ProcessMonthlyDueOutcome.InvalidState,
                monthlyObligationId,
                0,
                null));
    }

    private sealed class RecordingMonthlyDueLifecycleService : IMonthlyDueLifecycleService
    {
        public int CallCount { get; private set; }
        public Guid? LastObligationId { get; private set; }

        public Task<ProcessMonthlyDueResult> ProcessAsync(
            Guid monthlyObligationId,
            DateTimeOffset occurredAtUtc,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            LastObligationId = monthlyObligationId;
            return Task.FromResult(new ProcessMonthlyDueResult(
                ProcessMonthlyDueOutcome.ReconciliationRequired,
                monthlyObligationId,
                0,
                null));
        }
    }

    private sealed class RecordingNormalSettlementService : INormalSettlementService
    {
        public int CallCount { get; private set; }
        public Guid? LastContractId { get; private set; }

        public Task<SettleNormalContractResult> SettleAsync(
            Guid contractId,
            DateTimeOffset occurredAtUtc,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            LastContractId = contractId;
            return Task.FromResult(new SettleNormalContractResult(
                SettleNormalContractOutcome.InvalidState,
                null));
        }

        public Task<NormalSettlementView?> GetAsync(
            Guid contractId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<NormalSettlementView?>(null);
    }

    private sealed class NoOpPaymentReconciliationService : IPaymentReconciliationService
    {
        public Task<ReconcilePaymentResult> ReconcileAsync(
            Guid paymentInstructionId,
            Guid requestingUserId,
            DateTimeOffset occurredAtUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new ReconcilePaymentResult(ReconcilePaymentOutcome.InvalidState, null));
    }

    private sealed class NeverCalledCoverageTransferAdapter : IExternalCoverageTransferAdapter
    {
        public string Provider => "repayment-worker-unused-coverage-provider";

        public Task<ExternalCoverageTransferResponse> EnsureOrQueryAsync(
            ExternalCoverageTransferRequest request,
            CancellationToken cancellationToken = default) =>
            throw new InvalidOperationException(
                "The repayment worker test must not start or query a coverage transfer.");
    }

    private sealed class NoOpCoverageService : ITenantContributionCoverageService
    {
        public Task<CoverMonthlyObligationResult> CoverAsync(
            Guid monthlyObligationId,
            DateTimeOffset occurredAtUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new CoverMonthlyObligationResult(
                CoverMonthlyObligationOutcome.InvalidState,
                monthlyObligationId,
                null,
                Array.Empty<CoveragePaymentView>()));

        public Task<Charkhoone.Application.Payments.TenantContributionBalanceView?> GetBalanceAsync(
            Guid contractId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<Charkhoone.Application.Payments.TenantContributionBalanceView?>(null);

        public Task<PostConfirmedReplenishmentResult> PostConfirmedReplenishmentAsync(
            Guid externalTransactionId,
            DateTimeOffset occurredAtUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new PostConfirmedReplenishmentResult(
                PostConfirmedReplenishmentOutcome.InvalidState,
                null,
                null));
    }

    private sealed class NoOpCancellationSettlementService : ICancellationSettlementService
    {
        public Task<SettleCancellationResult> SettleAsync(
            Guid contractId,
            DateTimeOffset occurredAtUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new SettleCancellationResult(SettleCancellationOutcome.InvalidState, null));

        public Task<CancellationSettlementView?> GetAsync(
            Guid contractId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<CancellationSettlementView?>(null);
    }

    private sealed class NoOpCancellationBankPrincipalSettlementService
        : ICancellationBankPrincipalSettlementService
    {
        public Task<SettleCancellationBankPrincipalResult> SettleAsync(
            Guid contractId,
            DateTimeOffset occurredAtUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new SettleCancellationBankPrincipalResult(
                SettleCancellationBankPrincipalOutcome.InvalidState,
                null));

        public Task<CancellationBankPrincipalReturnView?> GetAsync(
            Guid contractId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<CancellationBankPrincipalReturnView?>(null);
    }
}
