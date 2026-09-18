using Charkhoone.Application.BankFunding;
using Charkhoone.Application.Contracts;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Finance;
using Charkhoone.Infrastructure.BankFunding;
using Charkhoone.Infrastructure.Contracts;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class ScenarioCohortCoverageIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;

    public Task InitializeAsync() => _factory.MigrateAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task NeedsDocuments_PropertyEvidence_PersistsStateWithoutCreatingContract()
    {
        var now = DateTimeOffset.Parse("2199-09-19T01:00:00+00:00");
        var applicantId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var planId = Guid.NewGuid();

        await using (var db = CreateDbContext())
        {
            db.Users.Add(new UserRow
            {
                Id = applicantId,
                OidcSubject = $"scenario-needs-docs-{applicantId:D}",
                CreatedAtUtc = now.AddDays(-1),
            });
            db.BankLoanPlanVersions.Add(new BankLoanPlanVersionRow
            {
                Id = Guid.NewGuid(),
                PlanId = planId,
                Version = "scenario-v1",
                BankId = "scenario-bank",
                Title = "Scenario public plan",
                InterestTerms = "scenario terms",
                Scope = BankLoanPlanScope.Public,
                Status = BankLoanPlanStatus.Published,
                TermMonths = BankLoanPlanVersion.RequiredTermMonths,
                CreatedAtUtc = now.AddDays(-2),
            });
            db.CreditApplications.Add(new CreditApplicationRow
            {
                Id = applicationId,
                ApplicantUserId = applicantId,
                Status = CreditApplicationStatus.PropertyContractPending,
                BankLoanPlanId = planId,
                BankLoanPlanVersion = "scenario-v1",
                CreatedAtUtc = now.AddHours(-2),
                UpdatedAtUtc = now.AddHours(-1),
            });
            await db.SaveChangesAsync();
        }

        ReconcilePropertyContractResult result;
        await using (var db = CreateDbContext())
        {
            var terms = new EfLeaseContractTermsService(db);
            var service = new EfPropertyContractRegistrationService(
                db,
                new NeedsDocumentsPropertyAdapter(),
                terms);

            result = await service.ReconcileAsync(applicationId, applicantId, now);
        }

        Assert.Equal(ReconcilePropertyContractOutcome.NeedsDocuments, result.Outcome);
        Assert.Null(result.Registration);

        await using var verification = CreateDbContext();
        var application = await verification.CreditApplications
            .AsNoTracking()
            .SingleAsync(x => x.Id == applicationId);
        var request = await verification.VerificationRequests
            .AsNoTracking()
            .SingleAsync(x => x.CreditApplicationId == applicationId && x.Type == "PropertyContract");

        Assert.Equal(CreditApplicationStatus.NeedsDocuments, application.Status);
        Assert.Equal(nameof(ExternalPropertyContractEvidenceStatus.NeedsDocuments), request.Status);
        Assert.Equal("scenario-property-provider", request.Provider);
        Assert.Equal("scenario-needs-documents", request.ExternalReference);
        Assert.Equal("documents_required", request.ReasonCode);
        Assert.Equal(1, request.AttemptCount);
        Assert.False(await verification.LeaseContracts.AnyAsync(x => x.CreditApplicationId == applicationId));
    }

    [Fact]
    public async Task Decline_BankDecision_RejectsApplicationWithoutFundingOrFundCall()
    {
        var seeded = await SeedDecisionReadyAsync(
            DateTimeOffset.Parse("2199-09-19T02:00:00+00:00"));
        var bank = new SequenceBankAdapter(
            new BankApprovalResponse(
                BankApprovalDecisionStatus.Declined,
                "scenario-bank-provider",
                ExternalReference: "scenario-bank-decline",
                ReasonCode: "declined_by_bank"));
        var fund = new RecordingFundAdapter();

        ProcessBankFundingResult result;
        await using (var db = CreateDbContext())
        {
            var service = new EfBankFundingService(db, bank, fund);
            result = await service.ProcessAsync(
                seeded.ApplicationId,
                seeded.ApplicantId,
                seeded.Now);
        }

        Assert.Equal(ProcessBankFundingOutcome.BankDeclined, result.Outcome);
        Assert.Equal(1, bank.CallCount);
        Assert.Equal(0, fund.FreezeCallCount);

        await using var verification = CreateDbContext();
        var application = await verification.CreditApplications
            .AsNoTracking()
            .SingleAsync(x => x.Id == seeded.ApplicationId);
        var approval = await verification.BankApprovals
            .AsNoTracking()
            .SingleAsync(x => x.CreditApplicationId == seeded.ApplicationId);

        Assert.Equal(CreditApplicationStatus.Rejected, application.Status);
        Assert.Equal(nameof(BankApprovalDecisionStatus.Declined), approval.Status);
        Assert.Equal("scenario-bank-decline", approval.ExternalReference);
        Assert.Equal(1, approval.AttemptCount);
        Assert.False(await verification.FundingAllocations
            .AnyAsync(x => x.CreditApplicationId == seeded.ApplicationId));
        Assert.Equal(
            1,
            await verification.AuditEvents.CountAsync(x =>
                x.AggregateType == "CreditApplication"
                && x.AggregateId == seeded.ApplicationId
                && x.Action == "bank_approval_declined"));
    }

    [Fact]
    public async Task Retry_IndeterminateBankDecision_CanResumeAndFundExactlyOnce()
    {
        var seeded = await SeedDecisionReadyAsync(
            DateTimeOffset.Parse("2199-09-19T03:00:00+00:00"));
        var bank = new SequenceBankAdapter(
            new BankApprovalResponse(
                BankApprovalDecisionStatus.Indeterminate,
                "scenario-bank-provider",
                ReasonCode: "provider_timeout"),
            new BankApprovalResponse(
                BankApprovalDecisionStatus.Approved,
                "scenario-bank-provider",
                ApprovedLoanRial: 1_000_000_000m,
                ExternalReference: "scenario-bank-approved"));
        var fund = new RecordingFundAdapter();

        ProcessBankFundingResult first;
        await using (var db = CreateDbContext())
        {
            var service = new EfBankFundingService(db, bank, fund);
            first = await service.ProcessAsync(
                seeded.ApplicationId,
                seeded.ApplicantId,
                seeded.Now);
        }

        Assert.Equal(ProcessBankFundingOutcome.BankApprovalIndeterminate, first.Outcome);
        Assert.Equal(1, bank.CallCount);
        Assert.Equal(0, fund.FreezeCallCount);

        ProcessBankFundingResult retry;
        await using (var db = CreateDbContext())
        {
            var service = new EfBankFundingService(db, bank, fund);
            retry = await service.ProcessAsync(
                seeded.ApplicationId,
                seeded.ApplicantId,
                seeded.Now.AddMinutes(5));
        }

        Assert.Equal(ProcessBankFundingOutcome.Funded, retry.Outcome);
        Assert.Equal(2, bank.CallCount);
        Assert.Equal(1, fund.FreezeCallCount);

        ProcessBankFundingResult replay;
        await using (var db = CreateDbContext())
        {
            var service = new EfBankFundingService(db, bank, fund);
            replay = await service.ProcessAsync(
                seeded.ApplicationId,
                seeded.ApplicantId,
                seeded.Now.AddMinutes(10));
        }

        Assert.Equal(ProcessBankFundingOutcome.AlreadyFunded, replay.Outcome);
        Assert.Equal(2, bank.CallCount);
        Assert.Equal(1, fund.FreezeCallCount);

        await using var verification = CreateDbContext();
        var application = await verification.CreditApplications
            .AsNoTracking()
            .SingleAsync(x => x.Id == seeded.ApplicationId);
        var approval = await verification.BankApprovals
            .AsNoTracking()
            .SingleAsync(x => x.CreditApplicationId == seeded.ApplicationId);
        var allocation = await verification.FundingAllocations
            .AsNoTracking()
            .SingleAsync(x => x.CreditApplicationId == seeded.ApplicationId);
        var frozenPrincipal = await verification.FrozenPrincipals
            .AsNoTracking()
            .SingleAsync(x => x.ContractId == seeded.ContractId);

        Assert.Equal(CreditApplicationStatus.ApprovedFunded, application.Status);
        Assert.Equal(nameof(BankApprovalDecisionStatus.Approved), approval.Status);
        Assert.Equal(2, approval.AttemptCount);
        Assert.Equal(1_000_000_000m, allocation.BankApprovedLoanRial);
        Assert.Equal(1_000_000_000m, frozenPrincipal.AmountRial);
        Assert.Equal("scenario-fund-reference", frozenPrincipal.FundReference);
    }

    private async Task<SeededDecisionReady> SeedDecisionReadyAsync(DateTimeOffset now)
    {
        var applicantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var contractId = Guid.NewGuid();
        var planId = Guid.NewGuid();

        await using var db = CreateDbContext();

        db.Users.AddRange(
            new UserRow
            {
                Id = applicantId,
                OidcSubject = $"scenario-applicant-{applicantId:D}",
                CreatedAtUtc = now.AddDays(-3),
            },
            new UserRow
            {
                Id = ownerId,
                OidcSubject = $"scenario-owner-{ownerId:D}",
                CreatedAtUtc = now.AddDays(-3),
            });

        db.BankLoanPlanVersions.Add(new BankLoanPlanVersionRow
        {
            Id = Guid.NewGuid(),
            PlanId = planId,
            Version = "scenario-v1",
            BankId = "scenario-bank",
            Title = "Scenario bank plan",
            InterestTerms = "trusted scenario terms",
            Scope = BankLoanPlanScope.Public,
            Status = BankLoanPlanStatus.Published,
            TermMonths = BankLoanPlanVersion.RequiredTermMonths,
            CreatedAtUtc = now.AddDays(-4),
        });

        db.CreditApplications.Add(new CreditApplicationRow
        {
            Id = applicationId,
            ApplicantUserId = applicantId,
            Status = CreditApplicationStatus.DecisionReady,
            BankLoanPlanId = planId,
            BankLoanPlanVersion = "scenario-v1",
            CreatedAtUtc = now.AddHours(-4),
            UpdatedAtUtc = now.AddHours(-1),
        });

        db.LeaseContracts.Add(new LeaseContractRow
        {
            Id = contractId,
            TenantUserId = applicantId,
            OwnerUserId = ownerId,
            PropertyId = Guid.NewGuid(),
            CreditApplicationId = applicationId,
            Status = LeaseContractStatus.Draft,
            BankLoanPlanId = planId,
            BankLoanPlanVersion = "scenario-v1",
            CreatedAtUtc = now.AddHours(-3),
            UpdatedAtUtc = now.AddHours(-2),
        });

        db.LeaseContractTerms.Add(new LeaseContractTermsRow
        {
            ContractId = contractId,
            Calendar = "Persian",
            PersianStartYear = 1405,
            PersianStartMonth = 6,
            PersianStartDay = 28,
            TermMonths = BankLoanPlanVersion.RequiredTermMonths,
            CashDepositRial = 1_000_000_000m,
            MonthlyRentRial = 30_000_000m,
            FullDepositEquivalentRial = 2_000_000_000m,
            OwnerBeneficiaryId = "scenario-owner-beneficiary",
            BankBeneficiaryId = "scenario-bank-beneficiary",
            SourceReference = $"scenario-contract:{contractId:D}",
            CapturedAtUtc = now.AddMinutes(-45),
        });

        for (var month = 1; month <= BankLoanPlanVersion.RequiredTermMonths; month++)
        {
            db.LeaseContractScheduleMonths.Add(new LeaseContractScheduleMonthRow
            {
                ContractId = contractId,
                ContractMonthNumber = month,
                DueAtUtc = now.AddDays(10).AddMonths(month - 1),
                OwnerPaymentRial = 90_000_000m,
                BankInterestRial = 10_000_000m,
            });
        }

        db.CreditEligibilityAssessments.Add(new CreditEligibilityAssessmentRow
        {
            Id = Guid.NewGuid(),
            CreditApplicationId = applicationId,
            Provider = "scenario-credit-provider",
            Status = nameof(ExternalCreditResultStatus.Valid),
            ExternalSubGrade = "A1",
            FullDepositEquivalentRial = 2_000_000_000m,
            LoanRatio = 0.55m,
            MaximumEligibleLoanRial = 1_100_000_000m,
            IdempotencyKey = $"credit-grade:{applicationId:D}:v1",
            ExternalReference = "scenario-credit-reference",
            AttemptCount = 1,
            CreatedAtUtc = now.AddMinutes(-30),
            UpdatedAtUtc = now.AddMinutes(-30),
        });

        await db.SaveChangesAsync();

        return new SeededDecisionReady(
            applicantId,
            applicationId,
            contractId,
            now);
    }

    private CharkhooneDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql(_factory.ConnectionString)
            .Options;
        return new CharkhooneDbContext(options);
    }

    private sealed record SeededDecisionReady(
        Guid ApplicantId,
        Guid ApplicationId,
        Guid ContractId,
        DateTimeOffset Now);

    private sealed class NeedsDocumentsPropertyAdapter : IExternalPropertyContractEvidenceAdapter
    {
        public string Provider => "scenario-property-provider";

        public Task<ExternalPropertyContractEvidenceResponse> CheckAsync(
            ExternalPropertyContractEvidenceRequest request,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new ExternalPropertyContractEvidenceResponse(
                ExternalPropertyContractEvidenceStatus.NeedsDocuments,
                Provider,
                ExternalReference: "scenario-needs-documents",
                ReasonCode: "documents_required"));
    }

    private sealed class SequenceBankAdapter(params BankApprovalResponse[] responses)
        : IExternalBankApprovalAdapter
    {
        private readonly Queue<BankApprovalResponse> _responses = new(responses);

        public string Provider => "scenario-bank-provider";

        public int CallCount { get; private set; }

        public Task<BankApprovalResponse> CheckAsync(
            BankApprovalRequest request,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            Assert.NotEmpty(_responses);
            Assert.Equal(1_100_000_000m, request.MaximumEligibleLoanRial);
            Assert.Equal("scenario-bank", request.BankId);
            return Task.FromResult(_responses.Dequeue());
        }
    }

    private sealed class RecordingFundAdapter : IExternalFundAdapter
    {
        public string Provider => "scenario-fund-provider";

        public int FreezeCallCount { get; private set; }

        public Task<FundPrincipalFreezeResponse> FreezePrincipalAsync(
            FundPrincipalFreezeRequest request,
            CancellationToken cancellationToken = default)
        {
            FreezeCallCount++;
            Assert.Equal(1_000_000_000m, request.AmountRial);
            return Task.FromResult(new FundPrincipalFreezeResponse(
                FundPrincipalFreezeStatus.Confirmed,
                Provider,
                FundReference: "scenario-fund-reference",
                ExternalReference: $"scenario-freeze:{request.RequestId:D}"));
        }

        public Task<FundTenantContributionResponse> CheckTenantContributionAsync(
            FundTenantContributionRequest request,
            CancellationToken cancellationToken = default) =>
            throw new InvalidOperationException(
                "Tenant contribution is outside the scenario cohort bank-funding boundary.");
    }
}
