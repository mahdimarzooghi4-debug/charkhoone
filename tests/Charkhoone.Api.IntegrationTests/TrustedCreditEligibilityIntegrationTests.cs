using System.Net;
using System.Text.Json;
using Charkhoone.Application.Contracts;
using Charkhoone.Application.CreditEligibility;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Finance;
using Charkhoone.Infrastructure.Contracts;
using Charkhoone.Infrastructure.CreditEligibility;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class TrustedCreditEligibilityIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;

    public Task InitializeAsync() => _factory.MigrateAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task TrustedSnapshotAmount_DrivesEligibility_AndReplayDoesNotCallProviderAgain()
    {
        var seeded = await SeedTrustedApplicationAsync(
            DateTimeOffset.Parse("2026-09-18T18:30:00+00:00"));

        var adapter = new RecordingCreditGradeAdapter(
            new ExternalCreditGradeResponse(
                ExternalCreditResultStatus.Valid,
                "integration-credit-grade",
                "A1",
                "integration-credit-reference"));

        EvaluateCreditEligibilityResult first;
        await using (var db = CreateDbContext())
        {
            var service = new EfCreditEligibilityService(db, adapter);
            first = await service.EvaluateAsync(
                seeded.ApplicationId,
                seeded.ApplicantId,
                seeded.Now);
        }

        Assert.Equal(EvaluateCreditEligibilityOutcome.Applied, first.Outcome);
        Assert.NotNull(first.Eligibility);
        Assert.Equal(CreditApplicationStatus.DecisionReady, first.Eligibility!.ApplicationStatus);
        Assert.Equal(2_000_000_000m, first.Eligibility.FullDepositEquivalentRial);
        Assert.Equal(0.55m, first.Eligibility.LoanRatio);
        Assert.Equal(
            CreditAllocationCalculator.CalculateMaximumLoan(2_000_000_000m, "A1"),
            first.Eligibility.MaximumEligibleLoanRial);
        Assert.Equal(1, adapter.CallCount);

        await using (var verification = CreateDbContext())
        {
            var application = await verification.CreditApplications
                .AsNoTracking()
                .SingleAsync(x => x.Id == seeded.ApplicationId);
            var assessment = await verification.CreditEligibilityAssessments
                .AsNoTracking()
                .SingleAsync(x => x.CreditApplicationId == seeded.ApplicationId);

            Assert.Equal(CreditApplicationStatus.DecisionReady, application.Status);
            Assert.Equal(2_000_000_000m, assessment.FullDepositEquivalentRial);
            Assert.Equal(nameof(ExternalCreditResultStatus.Valid), assessment.Status);
            Assert.Equal("A1", assessment.ExternalSubGrade);
            Assert.Equal(0.55m, assessment.LoanRatio);
            Assert.Equal(1, assessment.AttemptCount);

            Assert.Equal(
                1,
                await verification.WorkflowTransitions.CountAsync(x =>
                    x.AggregateType == "CreditApplication"
                    && x.AggregateId == seeded.ApplicationId
                    && x.FromStatus == nameof(CreditApplicationStatus.ExternalChecksPending)
                    && x.ToStatus == nameof(CreditApplicationStatus.DecisionReady)));

            Assert.Equal(
                1,
                await verification.AuditEvents.CountAsync(x =>
                    x.AggregateType == "CreditApplication"
                    && x.AggregateId == seeded.ApplicationId
                    && x.Action == "credit_eligibility_evaluated"));

            var outbox = await verification.OutboxMessages
                .AsNoTracking()
                .Where(x => x.Type == "credit-application.credit-eligibility-evaluated.v1")
                .ToListAsync();
            Assert.Single(outbox.Where(x =>
                x.PayloadJson.Contains(seeded.ApplicationId.ToString(), StringComparison.OrdinalIgnoreCase)
                && x.PayloadJson.Contains("2000000000", StringComparison.Ordinal)));
        }

        EvaluateCreditEligibilityResult replay;
        await using (var replayDb = CreateDbContext())
        {
            var service = new EfCreditEligibilityService(replayDb, adapter);
            replay = await service.EvaluateAsync(
                seeded.ApplicationId,
                seeded.ApplicantId,
                seeded.Now.AddMinutes(1));
        }

        Assert.Equal(EvaluateCreditEligibilityOutcome.AlreadyEvaluated, replay.Outcome);
        Assert.NotNull(replay.Eligibility);
        Assert.Equal(2_000_000_000m, replay.Eligibility!.FullDepositEquivalentRial);
        Assert.Equal(1, adapter.CallCount);
    }

    [Fact]
    public async Task ExistingAssessmentWithDifferentFullDeposit_ReturnsConflict_WithoutProviderCall()
    {
        var seeded = await SeedTrustedApplicationAsync(
            DateTimeOffset.Parse("2026-09-18T19:00:00+00:00"));

        await using (var db = CreateDbContext())
        {
            db.CreditEligibilityAssessments.Add(new CreditEligibilityAssessmentRow
            {
                Id = Guid.NewGuid(),
                CreditApplicationId = seeded.ApplicationId,
                Provider = "legacy-internal-call",
                Status = nameof(ExternalCreditResultStatus.Unknown),
                FullDepositEquivalentRial = 1_999_999_999m,
                IdempotencyKey = $"credit-grade:{seeded.ApplicationId:D}:v1",
                CreatedAtUtc = seeded.Now.AddMinutes(-5),
                UpdatedAtUtc = seeded.Now.AddMinutes(-5),
            });
            await db.SaveChangesAsync();
        }

        var adapter = new RecordingCreditGradeAdapter(
            new ExternalCreditGradeResponse(
                ExternalCreditResultStatus.Valid,
                "integration-credit-grade",
                "A1"));

        EvaluateCreditEligibilityResult result;
        await using (var db = CreateDbContext())
        {
            var service = new EfCreditEligibilityService(db, adapter);
            result = await service.EvaluateAsync(
                seeded.ApplicationId,
                seeded.ApplicantId,
                seeded.Now);
        }

        Assert.Equal(EvaluateCreditEligibilityOutcome.Conflict, result.Outcome);
        Assert.Equal(0, adapter.CallCount);

        await using var verification = CreateDbContext();
        var application = await verification.CreditApplications
            .AsNoTracking()
            .SingleAsync(x => x.Id == seeded.ApplicationId);
        var assessment = await verification.CreditEligibilityAssessments
            .AsNoTracking()
            .SingleAsync(x => x.CreditApplicationId == seeded.ApplicationId);

        Assert.Equal(CreditApplicationStatus.ExternalChecksPending, application.Status);
        Assert.Equal(1_999_999_999m, assessment.FullDepositEquivalentRial);
        Assert.Equal(0, assessment.AttemptCount);
    }

    [Fact]
    public async Task ReconcileEndpoint_IsApplicantOwned_AndUnavailableProviderUsesTrustedSnapshot()
    {
        var seeded = await SeedTrustedApplicationAsync(DateTimeOffset.UtcNow);
        var outsiderId = Guid.NewGuid();
        var outsiderSubject = $"trusted-credit-outsider-{outsiderId:D}";

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
            $"/api/v1/credit-applications/{seeded.ApplicationId:D}/credit-eligibility/reconcile",
            null);
        Assert.Equal(HttpStatusCode.NotFound, outsiderResponse.StatusCode);

        using var applicant = _factory.CreateAuthenticatedClient(seeded.ApplicantSubject);
        var applicantResponse = await applicant.PostAsync(
            $"/api/v1/credit-applications/{seeded.ApplicationId:D}/credit-eligibility/reconcile",
            null);
        Assert.Equal(HttpStatusCode.OK, applicantResponse.StatusCode);

        using (var document = JsonDocument.Parse(await applicantResponse.Content.ReadAsStringAsync()))
        {
            Assert.Equal("Indeterminate", document.RootElement.GetProperty("outcome").GetString());
            Assert.Equal(
                "ExternalCheckIndeterminate",
                document.RootElement.GetProperty("applicationStatus").GetString());
            Assert.Equal(
                2_000_000_000m,
                document.RootElement.GetProperty("fullDepositEquivalentRial").GetDecimal());
        }

        await using var verificationScope = _factory.Services.CreateAsyncScope();
        var verification = verificationScope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
        var application = await verification.CreditApplications
            .AsNoTracking()
            .SingleAsync(x => x.Id == seeded.ApplicationId);
        var assessment = await verification.CreditEligibilityAssessments
            .AsNoTracking()
            .SingleAsync(x => x.CreditApplicationId == seeded.ApplicationId);

        Assert.Equal(CreditApplicationStatus.ExternalCheckIndeterminate, application.Status);
        Assert.Equal(2_000_000_000m, assessment.FullDepositEquivalentRial);
        Assert.Equal(nameof(ExternalCreditResultStatus.Unknown), assessment.Status);
        Assert.Equal(1, assessment.AttemptCount);
    }

    private async Task<SeededTrustedApplication> SeedTrustedApplicationAsync(DateTimeOffset now)
    {
        var applicantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var contractId = Guid.NewGuid();
        var planId = Guid.NewGuid();
        const string planVersion = "public-v1";
        var applicantSubject = $"trusted-credit-applicant-{applicantId:D}";

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
                OidcSubject = $"trusted-credit-owner-{ownerId:D}",
                CreatedAtUtc = now.AddDays(-3),
            });

        db.BankLoanPlanVersions.Add(new BankLoanPlanVersionRow
        {
            Id = Guid.NewGuid(),
            PlanId = planId,
            Version = planVersion,
            BankId = "integration-bank",
            Title = "Integration public plan",
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
            Status = CreditApplicationStatus.ExternalChecksPending,
            BankLoanPlanId = planId,
            BankLoanPlanVersion = planVersion,
            CreatedAtUtc = now.AddHours(-3),
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
            BankLoanPlanVersion = planVersion,
            CreatedAtUtc = now.AddHours(-2),
            UpdatedAtUtc = now.AddHours(-2),
        });

        await db.SaveChangesAsync();

        var terms = scope.ServiceProvider.GetRequiredService<ILeaseContractTermsService>();
        var capture = await terms.CaptureAsync(
            new CaptureLeaseContractTermsCommand(
                contractId,
                1405,
                6,
                27,
                1_000_000_000m,
                30_000_000m,
                "integration-owner-beneficiary",
                "integration-bank-beneficiary",
                $"trusted-credit-contract:{contractId:D}",
                Enumerable.Range(1, 12)
                    .Select(index => new LeaseContractScheduleMonthInput(
                        index,
                        now.AddDays(10).AddMonths(index - 1),
                        90_000_000m,
                        10_000_000m))
                    .ToArray()),
            now.AddMinutes(-30));

        Assert.Equal(CaptureLeaseContractTermsOutcome.Captured, capture.Outcome);
        Assert.NotNull(capture.Snapshot);
        Assert.Equal(2_000_000_000m, capture.Snapshot!.FullDepositEquivalentRial);

        return new SeededTrustedApplication(
            applicantId,
            applicationId,
            contractId,
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

    private sealed record SeededTrustedApplication(
        Guid ApplicantId,
        Guid ApplicationId,
        Guid ContractId,
        string ApplicantSubject,
        DateTimeOffset Now);

    private sealed class RecordingCreditGradeAdapter(ExternalCreditGradeResponse response)
        : IExternalCreditGradeAdapter
    {
        public string Provider => "integration-credit-grade";
        public int CallCount { get; private set; }

        public Task<ExternalCreditGradeResponse> CheckAsync(
            ExternalCreditGradeRequest request,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            return Task.FromResult(response);
        }
    }
}
