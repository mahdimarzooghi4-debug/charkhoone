using System.Net;
using System.Text.Json;
using Charkhoone.Application.BankFunding;
using Charkhoone.Application.Contracts;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Finance;
using Charkhoone.Infrastructure.BankFunding;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class TrustedBankFundingIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;

    public Task InitializeAsync() => _factory.MigrateAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task TrustedEligibility_DrivesBankApprovalAndFundFreeze_AndReplayIsIdempotent()
    {
        var seeded = await SeedDecisionReadyAsync(
            DateTimeOffset.Parse("2026-09-18T20:00:00+00:00"));

        var bank = new RecordingBankAdapter(new BankApprovalResponse(
            BankApprovalDecisionStatus.Approved,
            "integration-bank-provider",
            1_000_000_000m,
            "bank-approval-reference"));
        var fund = new RecordingFundAdapter(new FundPrincipalFreezeResponse(
            FundPrincipalFreezeStatus.Confirmed,
            "integration-fund",
            "fund-reference",
            "fund-freeze-reference"));

        ProcessBankFundingResult first;
        await using (var db = CreateDbContext())
        {
            var service = new EfBankFundingService(db, bank, fund);
            first = await service.ProcessAsync(
                seeded.ApplicationId,
                seeded.ApplicantId,
                seeded.Now);
        }

        Assert.Equal(ProcessBankFundingOutcome.Funded, first.Outcome);
        Assert.NotNull(first.Funding);
        Assert.Equal(CreditApplicationStatus.ApprovedFunded, first.Funding!.ApplicationStatus);
        Assert.Equal(2_000_000_000m, first.Funding.FullDepositEquivalentRial);
        Assert.Equal(1_100_000_000m, first.Funding.MaximumEligibleLoanRial);
        Assert.Equal(1_000_000_000m, first.Funding.BankApprovedLoanRial);
        Assert.Equal(1_000_000_000m, first.Funding.TenantContributionRial);
        Assert.Equal("fund-reference", first.Funding.FundReference);
        Assert.Equal(1, bank.CallCount);
        Assert.Equal(1, fund.FreezeCallCount);

        await using (var verification = CreateDbContext())
        {
            var application = await verification.CreditApplications
                .AsNoTracking()
                .SingleAsync(x => x.Id == seeded.ApplicationId);
            var approval = await verification.BankApprovals
                .AsNoTracking()
                .SingleAsync(x => x.CreditApplicationId == seeded.ApplicationId);
            var allocation = await verification.FundingAllocations
                .AsNoTracking()
                .SingleAsync(x => x.CreditApplicationId == seeded.ApplicationId);
            var principal = await verification.FrozenPrincipals
                .AsNoTracking()
                .SingleAsync(x => x.ContractId == seeded.ContractId);

            Assert.Equal(CreditApplicationStatus.ApprovedFunded, application.Status);
            Assert.Equal(nameof(BankApprovalDecisionStatus.Approved), approval.Status);
            Assert.Equal(1_100_000_000m, approval.MaximumEligibleLoanRial);
            Assert.Equal(1_000_000_000m, approval.ApprovedLoanRial);
            Assert.Equal("bank-approval-reference", approval.ExternalReference);
            Assert.Equal(1, approval.AttemptCount);

            Assert.Equal(seeded.ContractId, allocation.ContractId);
            Assert.Equal(seeded.PlanId, allocation.BankLoanPlanId);
            Assert.Equal("public-v1", allocation.BankLoanPlanVersion);
            Assert.Equal("integration-bank", allocation.BankId);
            Assert.Equal(2_000_000_000m, allocation.FullDepositEquivalentRial);
            Assert.Equal(1_100_000_000m, allocation.MaximumEligibleLoanRial);
            Assert.Equal(1_000_000_000m, allocation.BankApprovedLoanRial);
            Assert.Equal(1_000_000_000m, allocation.TenantContributionRial);

            Assert.Equal("integration-bank", principal.BankId);
            Assert.Equal(1_000_000_000m, principal.AmountRial);
            Assert.Equal("fund-reference", principal.FundReference);
        }

        ProcessBankFundingResult replay;
        await using (var replayDb = CreateDbContext())
        {
            var service = new EfBankFundingService(replayDb, bank, fund);
            replay = await service.ProcessAsync(
                seeded.ApplicationId,
                seeded.ApplicantId,
                seeded.Now.AddMinutes(1));
        }

        Assert.Equal(ProcessBankFundingOutcome.AlreadyFunded, replay.Outcome);
        Assert.Equal(1, bank.CallCount);
        Assert.Equal(1, fund.FreezeCallCount);
    }

    [Fact]
    public async Task ExistingApprovalWithDifferentEligibilityCeiling_ReturnsConflict_WithoutProviderCalls()
    {
        var seeded = await SeedDecisionReadyAsync(
            DateTimeOffset.Parse("2026-09-18T20:30:00+00:00"));

        await using (var db = CreateDbContext())
        {
            db.BankApprovals.Add(new BankApprovalRow
            {
                Id = Guid.NewGuid(),
                CreditApplicationId = seeded.ApplicationId,
                Provider = "legacy-bank",
                Status = nameof(BankApprovalDecisionStatus.Indeterminate),
                MaximumEligibleLoanRial = 1_099_999_999m,
                IdempotencyKey = $"bank-approval:{seeded.ApplicationId:D}:v1",
                CreatedAtUtc = seeded.Now.AddMinutes(-5),
                UpdatedAtUtc = seeded.Now.AddMinutes(-5),
            });
            await db.SaveChangesAsync();
        }

        var bank = new RecordingBankAdapter(new BankApprovalResponse(
            BankApprovalDecisionStatus.Approved,
            "integration-bank-provider",
            1_000_000_000m,
            "should-not-be-called"));
        var fund = new RecordingFundAdapter(new FundPrincipalFreezeResponse(
            FundPrincipalFreezeStatus.Confirmed,
            "integration-fund",
            "should-not-be-called",
            "should-not-be-called"));

        ProcessBankFundingResult result;
        await using (var db = CreateDbContext())
        {
            var service = new EfBankFundingService(db, bank, fund);
            result = await service.ProcessAsync(
                seeded.ApplicationId,
                seeded.ApplicantId,
                seeded.Now);
        }

        Assert.Equal(ProcessBankFundingOutcome.Conflict, result.Outcome);
        Assert.Equal(0, bank.CallCount);
        Assert.Equal(0, fund.FreezeCallCount);

        await using var verification = CreateDbContext();
        var application = await verification.CreditApplications
            .AsNoTracking()
            .SingleAsync(x => x.Id == seeded.ApplicationId);
        var approval = await verification.BankApprovals
            .AsNoTracking()
            .SingleAsync(x => x.CreditApplicationId == seeded.ApplicationId);

        Assert.Equal(CreditApplicationStatus.DecisionReady, application.Status);
        Assert.Equal(1_099_999_999m, approval.MaximumEligibleLoanRial);
        Assert.Equal(0, approval.AttemptCount);
        Assert.False(await verification.FundingAllocations
            .AnyAsync(x => x.CreditApplicationId == seeded.ApplicationId));
    }

    [Fact]
    public async Task BankFundingEndpoint_IsApplicantOwned_AndUnavailableBankFailsClosed()
    {
        var seeded = await SeedDecisionReadyAsync(DateTimeOffset.UtcNow);
        var outsiderId = Guid.NewGuid();
        var outsiderSubject = $"bank-funding-outsider-{outsiderId:D}";

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
            db.Users.Add(new UserRow
            {
                Id = outsiderId,
                OidcSubject = outsiderSubject,
                CreatedAtUtc = seeded.Now.AddDays(-1),
            });
            await db.SaveChangesAsync();
        }

        using var outsider = _factory.CreateAuthenticatedClient(outsiderSubject);
        var outsiderResponse = await outsider.PostAsync(
            $"/api/v1/credit-applications/{seeded.ApplicationId:D}/bank-funding/reconcile",
            null);
        Assert.Equal(HttpStatusCode.NotFound, outsiderResponse.StatusCode);

        using var applicant = _factory.CreateAuthenticatedClient(seeded.ApplicantSubject);
        var response = await applicant.PostAsync(
            $"/api/v1/credit-applications/{seeded.ApplicationId:D}/bank-funding/reconcile",
            null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal("BankApprovalIndeterminate", document.RootElement.GetProperty("outcome").GetString());
        Assert.Equal(
            "ExternalCheckIndeterminate",
            document.RootElement.GetProperty("applicationStatus").GetString());

        await using var verificationScope = _factory.Services.CreateAsyncScope();
        var verification = verificationScope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
        var application = await verification.CreditApplications
            .AsNoTracking()
            .SingleAsync(x => x.Id == seeded.ApplicationId);
        var approval = await verification.BankApprovals
            .AsNoTracking()
            .SingleAsync(x => x.CreditApplicationId == seeded.ApplicationId);

        Assert.Equal(CreditApplicationStatus.ExternalCheckIndeterminate, application.Status);
        Assert.Equal(nameof(BankApprovalDecisionStatus.Indeterminate), approval.Status);
        Assert.Equal(1_100_000_000m, approval.MaximumEligibleLoanRial);
        Assert.Equal(1, approval.AttemptCount);
        Assert.False(await verification.FundingAllocations
            .AnyAsync(x => x.CreditApplicationId == seeded.ApplicationId));
    }

    private async Task<SeededDecisionReady> SeedDecisionReadyAsync(DateTimeOffset now)
    {
        var applicantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var contractId = Guid.NewGuid();
        var planId = Guid.NewGuid();
        var applicantSubject = $"bank-funding-applicant-{applicantId:D}";

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();

        db.Users.AddRange(
            new UserRow
            {
                Id = applicantId,
                OidcSubject = applicantSubject,
                CreatedAtUtc = now.AddDays(-3),
            },
            new UserRow
            {
                Id = ownerId,
                OidcSubject = $"bank-funding-owner-{ownerId:D}",
                CreatedAtUtc = now.AddDays(-3),
            });
        db.BankLoanPlanVersions.Add(new BankLoanPlanVersionRow
        {
            Id = Guid.NewGuid(),
            PlanId = planId,
            Version = "public-v1",
            BankId = "integration-bank",
            Title = "Integration bank plan",
            InterestTerms = "trusted persisted terms",
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
            BankLoanPlanVersion = "public-v1",
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
            BankLoanPlanVersion = "public-v1",
            CreatedAtUtc = now.AddHours(-3),
            UpdatedAtUtc = now.AddHours(-2),
        });
        await db.SaveChangesAsync();

        var terms = scope.ServiceProvider.GetRequiredService<ILeaseContractTermsService>();
        var captured = await terms.CaptureAsync(
            new CaptureLeaseContractTermsCommand(
                contractId,
                1405,
                6,
                27,
                1_000_000_000m,
                30_000_000m,
                "integration-owner-beneficiary",
                "integration-bank-beneficiary",
                $"trusted-bank-funding:{contractId:D}",
                Enumerable.Range(1, 12)
                    .Select(index => new LeaseContractScheduleMonthInput(
                        index,
                        now.AddDays(10).AddMonths(index - 1),
                        90_000_000m,
                        10_000_000m))
                    .ToArray()),
            now.AddMinutes(-45));

        Assert.Equal(CaptureLeaseContractTermsOutcome.Captured, captured.Outcome);

        db.CreditEligibilityAssessments.Add(new CreditEligibilityAssessmentRow
        {
            Id = Guid.NewGuid(),
            CreditApplicationId = applicationId,
            Provider = "integration-credit-grade",
            Status = nameof(ExternalCreditResultStatus.Valid),
            ExternalSubGrade = "A1",
            FullDepositEquivalentRial = 2_000_000_000m,
            LoanRatio = 0.55m,
            MaximumEligibleLoanRial = 1_100_000_000m,
            IdempotencyKey = $"credit-grade:{applicationId:D}:v1",
            ExternalReference = "credit-grade-reference",
            AttemptCount = 1,
            CreatedAtUtc = now.AddMinutes(-30),
            UpdatedAtUtc = now.AddMinutes(-30),
        });
        await db.SaveChangesAsync();

        return new SeededDecisionReady(
            applicantId,
            applicationId,
            contractId,
            planId,
            applicantSubject,
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
        Guid PlanId,
        string ApplicantSubject,
        DateTimeOffset Now);

    private sealed class RecordingBankAdapter(BankApprovalResponse response)
        : IExternalBankApprovalAdapter
    {
        public string Provider => "integration-bank-provider";
        public int CallCount { get; private set; }

        public Task<BankApprovalResponse> CheckAsync(
            BankApprovalRequest request,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            Assert.Equal(1_100_000_000m, request.MaximumEligibleLoanRial);
            Assert.Equal("integration-bank", request.BankId);
            return Task.FromResult(response);
        }
    }

    private sealed class RecordingFundAdapter(FundPrincipalFreezeResponse freezeResponse)
        : IExternalFundAdapter
    {
        public string Provider => "integration-fund";
        public int FreezeCallCount { get; private set; }

        public Task<FundPrincipalFreezeResponse> FreezePrincipalAsync(
            FundPrincipalFreezeRequest request,
            CancellationToken cancellationToken = default)
        {
            FreezeCallCount++;
            Assert.Equal(1_000_000_000m, request.AmountRial);
            return Task.FromResult(freezeResponse);
        }

        public Task<FundTenantContributionResponse> CheckTenantContributionAsync(
            FundTenantContributionRequest request,
            CancellationToken cancellationToken = default) =>
            throw new InvalidOperationException("Tenant contribution is outside this test boundary.");
    }
}
