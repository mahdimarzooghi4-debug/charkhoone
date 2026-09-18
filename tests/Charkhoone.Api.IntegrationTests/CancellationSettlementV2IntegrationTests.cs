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

public sealed class CancellationSettlementV2IntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;

    public Task InitializeAsync() => _factory.MigrateAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Cancellation_SettlesLostReturnFromTenantContribution_TransfersOnlyResidual_AndLeavesFrozenPrincipalUntouched()
    {
        var cancellationAt = DateTimeOffset.Parse("2026-09-18T09:00:00+00:00");
        var settlementAt = cancellationAt.AddHours(2);
        var contractId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var allocationId = Guid.NewGuid();
        var obligationId = Guid.NewGuid();
        var paymentId = Guid.NewGuid();
        var coverageId = Guid.NewGuid();
        var coverageExternalId = Guid.NewGuid();
        var initialJournalId = Guid.NewGuid();
        var coverageJournalId = Guid.NewGuid();
        var fundAssetId = Guid.NewGuid();
        var tenantBalanceId = Guid.NewGuid();

        const decimal initialContributionRial = 500_000_000m;
        const decimal coveragePrincipalRial = 100_000_000m;
        const decimal frozenBankPrincipalRial = 600_000_000m;

        var lostAccrual = LostFundReturnTerms.CalculateAccruedReturn(
            LostFundReturnTerms.OpenExposure(
                contractId,
                coverageId,
                coveragePrincipalRial,
                cancellationAt.AddDays(-40)),
            cancellationAt);
        var expectedLostReturnRial = lostAccrual.PayableReturn.Rial;
        var expectedPostedBalanceRial = initialContributionRial - coveragePrincipalRial;
        var expectedOwnerResidualRial = expectedPostedBalanceRial - expectedLostReturnRial;

        await using (var db = CreateDbContext())
        {
            db.Users.AddRange(
                new UserRow
                {
                    Id = tenantId,
                    OidcSubject = $"cancel-v2-tenant-{tenantId:D}",
                    CreatedAtUtc = cancellationAt.AddMonths(-4),
                },
                new UserRow
                {
                    Id = ownerId,
                    OidcSubject = $"cancel-v2-owner-{ownerId:D}",
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
                Status = LeaseContractStatus.CancellationPending,
                CreatedAtUtc = cancellationAt.AddMonths(-4),
                UpdatedAtUtc = cancellationAt,
            });

            db.FundingAllocations.Add(new FundingAllocationRow
            {
                Id = allocationId,
                CreditApplicationId = applicationId,
                ContractId = contractId,
                BankLoanPlanId = Guid.NewGuid(),
                BankLoanPlanVersion = "cancel-v2-test",
                BankId = "cancel-v2-bank",
                FullDepositEquivalentRial = initialContributionRial + frozenBankPrincipalRial,
                MaximumEligibleLoanRial = frozenBankPrincipalRial,
                BankApprovedLoanRial = frozenBankPrincipalRial,
                TenantContributionRial = initialContributionRial,
                CreatedAtUtc = cancellationAt.AddMonths(-4),
                UpdatedAtUtc = cancellationAt.AddMonths(-4),
            });

            db.FrozenPrincipals.Add(new FrozenPrincipalRow
            {
                ContractId = contractId,
                BankId = "cancel-v2-bank",
                AmountRial = frozenBankPrincipalRial,
                FundReference = $"cancel-v2-frozen-{contractId:D}",
                FrozenAtUtc = cancellationAt.AddMonths(-4),
            });

            db.TenantContributions.Add(new TenantContributionRow
            {
                ContractId = contractId,
                FundingAllocationId = allocationId,
                InitialAmountRial = initialContributionRial,
                FundReference = $"cancel-v2-contribution-{contractId:D}",
                FundedAtUtc = cancellationAt.AddMonths(-4),
            });

            db.WorkflowTransitions.Add(new WorkflowTransitionRow
            {
                Id = Guid.NewGuid(),
                AggregateType = "LeaseContract",
                AggregateId = contractId,
                FromStatus = LeaseContractStatus.Active.ToString(),
                ToStatus = LeaseContractStatus.CancellationPending.ToString(),
                ActorId = "system:delinquency",
                Reason = "Three consecutive contractual months closed without full tenant payment.",
                OccurredAtUtc = cancellationAt,
            });

            db.LedgerAccounts.AddRange(
                new LedgerAccountRow
                {
                    Id = fundAssetId,
                    Code = $"contract:{contractId:D}:fund-held-tenant-contribution",
                    Name = "Fund-held tenant contribution",
                    Currency = "IRR",
                    ContractId = contractId,
                    CreatedAtUtc = cancellationAt.AddMonths(-4),
                },
                new LedgerAccountRow
                {
                    Id = tenantBalanceId,
                    Code = $"contract:{contractId:D}:tenant-contribution-balance",
                    Name = "Tenant contribution balance",
                    Currency = "IRR",
                    ContractId = contractId,
                    CreatedAtUtc = cancellationAt.AddMonths(-4),
                });

            db.JournalEntries.AddRange(
                new JournalEntryRow
                {
                    Id = initialJournalId,
                    ReferenceType = "TestTenantContributionFunding",
                    ReferenceId = allocationId,
                    IdempotencyKey = $"cancel-v2-initial:{contractId:D}",
                    Description = "Integration fixture initial tenant contribution.",
                    OccurredAtUtc = cancellationAt.AddMonths(-4),
                    PostedAtUtc = cancellationAt.AddMonths(-4),
                },
                new JournalEntryRow
                {
                    Id = coverageJournalId,
                    ReferenceType = "CoveragePayment",
                    ReferenceId = coverageId,
                    IdempotencyKey = $"cancel-v2-coverage:{paymentId:D}",
                    Description = "Integration fixture tenant contribution coverage.",
                    OccurredAtUtc = cancellationAt.AddDays(-40),
                    PostedAtUtc = cancellationAt.AddDays(-40),
                });

            db.JournalLines.AddRange(
                new JournalLineRow
                {
                    Id = Guid.NewGuid(),
                    JournalEntryId = initialJournalId,
                    LedgerAccountId = fundAssetId,
                    DebitRial = initialContributionRial,
                    CreditRial = 0m,
                },
                new JournalLineRow
                {
                    Id = Guid.NewGuid(),
                    JournalEntryId = initialJournalId,
                    LedgerAccountId = tenantBalanceId,
                    DebitRial = 0m,
                    CreditRial = initialContributionRial,
                },
                new JournalLineRow
                {
                    Id = Guid.NewGuid(),
                    JournalEntryId = coverageJournalId,
                    LedgerAccountId = tenantBalanceId,
                    DebitRial = coveragePrincipalRial,
                    CreditRial = 0m,
                },
                new JournalLineRow
                {
                    Id = Guid.NewGuid(),
                    JournalEntryId = coverageJournalId,
                    LedgerAccountId = fundAssetId,
                    DebitRial = 0m,
                    CreditRial = coveragePrincipalRial,
                });

            db.MonthlyObligations.Add(new MonthlyObligationRow
            {
                Id = obligationId,
                ContractId = contractId,
                ContractMonthNumber = 3,
                DueAtUtc = cancellationAt.AddDays(-40),
                Status = MonthlyObligationStatus.Covered,
                CreatedAtUtc = cancellationAt.AddDays(-45),
                UpdatedAtUtc = cancellationAt.AddDays(-40),
                ClosedAtUtc = cancellationAt.AddDays(-40),
            });

            db.PaymentInstructions.Add(new PaymentInstructionRow
            {
                Id = paymentId,
                ObligationId = obligationId,
                DueAtUtc = cancellationAt.AddDays(-40),
                BeneficiaryId = "cancel-v2-owner-beneficiary",
                AmountRial = coveragePrincipalRial,
                IdempotencyKey = $"cancel-v2-payment:{paymentId:D}",
                Status = PaymentInstructionStatus.Failed,
                CreatedAtUtc = cancellationAt.AddDays(-45),
                UpdatedAtUtc = cancellationAt.AddDays(-40),
            });

            db.ExternalTransactions.Add(new ExternalTransactionRow
            {
                Id = coverageExternalId,
                Provider = "cancel-v2-coverage-provider",
                OperationType = "tenant_contribution_coverage",
                AggregateType = "PaymentInstruction",
                AggregateId = paymentId,
                Status = ExternalTransactionStatus.Succeeded,
                AmountRial = coveragePrincipalRial,
                Currency = "IRR",
                IdempotencyKey = $"cancel-v2-coverage-external:{paymentId:D}",
                ExternalReference = $"cancel-v2-coverage-ref-{coverageId:D}",
                CreatedAtUtc = cancellationAt.AddDays(-40),
                UpdatedAtUtc = cancellationAt.AddDays(-40),
            });

            db.CoveragePayments.Add(new CoveragePaymentRow
            {
                Id = coverageId,
                ContractId = contractId,
                MonthlyObligationId = obligationId,
                PaymentInstructionId = paymentId,
                Kind = MonthlyObligationComponentKind.OwnerPayment,
                AmountRial = coveragePrincipalRial,
                BeneficiaryId = "cancel-v2-owner-beneficiary",
                Status = CoveragePaymentStatus.Succeeded,
                ExternalTransactionId = coverageExternalId,
                JournalEntryId = coverageJournalId,
                RemainingTenantContributionRial = expectedPostedBalanceRial,
                CreatedAtUtc = cancellationAt.AddDays(-40),
                UpdatedAtUtc = cancellationAt.AddDays(-40),
                CoveredAtUtc = cancellationAt.AddDays(-40),
            });

            db.LostFundReturns.Add(new LostFundReturnRow
            {
                Id = Guid.NewGuid(),
                ContractId = contractId,
                CoveragePaymentId = coverageId,
                WithdrawnAmountRial = coveragePrincipalRial,
                MonthlyRate = LostFundReturnTerms.MonthlyRate,
                WithdrawnAtUtc = cancellationAt.AddDays(-40),
                CalculationPeriodStartUtc = cancellationAt.AddDays(-40),
                CalculationPolicyVersion = LostFundReturnTerms.CalculationPolicyVersion,
                CreatedAtUtc = cancellationAt.AddDays(-40),
                UpdatedAtUtc = cancellationAt.AddDays(-40),
            });

            await db.SaveChangesAsync();
        }

        SettleCancellationResult first;
        var adapter = new ConfirmingOwnerResidualAdapter();
        await using (var db = CreateDbContext())
        {
            var service = new EfCancellationSettlementService(db, adapter);
            first = await service.SettleAsync(contractId, settlementAt);
        }

        Assert.Equal(SettleCancellationOutcome.Completed, first.Outcome);
        Assert.NotNull(first.Settlement);
        Assert.Equal(expectedOwnerResidualRial, first.Settlement!.AmountRial);
        Assert.Equal(expectedOwnerResidualRial, adapter.LastRequest?.ExpectedAmountRial);

        await using (var db = CreateDbContext())
        {
            var contract = await db.LeaseContracts.AsNoTracking().SingleAsync(x => x.Id == contractId);
            var frozen = await db.FrozenPrincipals.AsNoTracking().SingleAsync(x => x.ContractId == contractId);
            var exposure = await db.LostFundReturns.AsNoTracking().SingleAsync(x => x.CoveragePaymentId == coverageId);
            var settlement = await db.CancellationSettlements.AsNoTracking().SingleAsync(x => x.ContractId == contractId);
            var ownerTransfer = await db.ExternalTransactions.AsNoTracking()
                .SingleAsync(x => x.Id == settlement.ExternalTransactionId);
            var journal = await db.JournalEntries.AsNoTracking()
                .SingleAsync(x => x.Id == settlement.JournalEntryId);
            var lines = await db.JournalLines.AsNoTracking()
                .Where(x => x.JournalEntryId == journal.Id)
                .ToListAsync();

            Assert.Equal(LeaseContractStatus.Cancelled, contract.Status);
            Assert.Equal(frozenBankPrincipalRial, frozen.AmountRial);
            Assert.Equal(expectedLostReturnRial, exposure.CalculatedReturnRial);
            Assert.Equal(cancellationAt, exposure.CalculationPeriodEndUtc);
            Assert.Null(exposure.ReplacedAtUtc);
            Assert.Equal(LostFundReturnTerms.CalculationPolicyVersion, exposure.CalculationPolicyVersion);
            Assert.Equal(expectedOwnerResidualRial, ownerTransfer.AmountRial);
            Assert.Equal(ExternalTransactionStatus.Succeeded, ownerTransfer.Status);

            Assert.Equal(expectedPostedBalanceRial, lines.Sum(x => x.DebitRial));
            Assert.Equal(expectedPostedBalanceRial, lines.Sum(x => x.CreditRial));
            Assert.Contains(lines, x =>
                x.LedgerAccountId == tenantBalanceId
                && x.DebitRial == expectedPostedBalanceRial
                && x.CreditRial == 0m);
            Assert.Contains(lines, x =>
                x.LedgerAccountId == fundAssetId
                && x.DebitRial == 0m
                && x.CreditRial == expectedOwnerResidualRial);
            Assert.Contains(lines, x =>
                x.LedgerAccountId != tenantBalanceId
                && x.LedgerAccountId != fundAssetId
                && x.DebitRial == 0m
                && x.CreditRial == expectedLostReturnRial);

            var ownerNotification = await db.OutboxMessages.AsNoTracking()
                .SingleAsync(x => x.Type == "lease-contract.cancelled-owner-notification-requested.v1");
            using (var ownerPayload = JsonDocument.Parse(ownerNotification.PayloadJson))
            {
                Assert.Equal(contractId, ownerPayload.RootElement.GetProperty("contractId").GetGuid());
                Assert.Equal(ownerId, ownerPayload.RootElement.GetProperty("ownerUserId").GetGuid());
                Assert.Equal(expectedOwnerResidualRial, ownerPayload.RootElement.GetProperty("amountRial").GetDecimal());
            }

            var tenantNotification = await db.OutboxMessages.AsNoTracking()
                .SingleAsync(x => x.Type == "lease-contract.cancelled-tenant-notification-requested.v1");
            using (var tenantPayload = JsonDocument.Parse(tenantNotification.PayloadJson))
            {
                Assert.Equal(contractId, tenantPayload.RootElement.GetProperty("contractId").GetGuid());
                Assert.Equal(tenantId, tenantPayload.RootElement.GetProperty("tenantUserId").GetGuid());
                Assert.Equal(expectedPostedBalanceRial, tenantPayload.RootElement.GetProperty("tenantContributionBeforeSettlementRial").GetDecimal());
                Assert.Equal(expectedLostReturnRial, tenantPayload.RootElement.GetProperty("lostFundReturnRial").GetDecimal());
                Assert.Equal(expectedOwnerResidualRial, tenantPayload.RootElement.GetProperty("ownerResidualAmountRial").GetDecimal());
                Assert.Equal(cancellationAt, tenantPayload.RootElement.GetProperty("cancellationEffectiveAtUtc").GetDateTimeOffset());
            }
        }

        SettleCancellationResult replay;
        await using (var db = CreateDbContext())
        {
            var service = new EfCancellationSettlementService(db, adapter);
            replay = await service.SettleAsync(contractId, settlementAt.AddHours(1));
        }

        Assert.Equal(SettleCancellationOutcome.AlreadyCompleted, replay.Outcome);

        await using var finalDb = CreateDbContext();
        Assert.Equal(
            1,
            await finalDb.JournalEntries.CountAsync(x =>
                x.IdempotencyKey == $"journal:cancellation-financial-settlement:{contractId:D}:v2"));
        Assert.Equal(
            1,
            await finalDb.ExternalTransactions.CountAsync(x =>
                x.IdempotencyKey == $"cancellation-owner-residual:{contractId:D}:v2"));
    }

    private CharkhooneDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql(_factory.ConnectionString)
            .Options;
        return new CharkhooneDbContext(options);
    }

    private sealed class ConfirmingOwnerResidualAdapter : IExternalOwnerResidualTransferAdapter
    {
        public string Provider => "cancel-v2-integration-provider";

        public ExternalOwnerResidualTransferRequest? LastRequest { get; private set; }

        public Task<ExternalOwnerResidualTransferResponse> EnsureOrQueryAsync(
            ExternalOwnerResidualTransferRequest request,
            CancellationToken cancellationToken = default)
        {
            LastRequest = request;
            return Task.FromResult(new ExternalOwnerResidualTransferResponse(
                ExternalOwnerResidualTransferStatus.Confirmed,
                Provider,
                request.ExpectedAmountRial,
                $"cancel-v2-owner-transfer-{request.SettlementId:D}"));
        }
    }
}
