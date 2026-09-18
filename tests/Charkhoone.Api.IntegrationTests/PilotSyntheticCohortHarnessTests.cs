using System.Collections.Concurrent;
using System.Text.Json;
using Charkhoone.Application.BankFunding;
using Charkhoone.Application.Contracts;
using Charkhoone.Application.CreditApplications;
using Charkhoone.Application.CreditEligibility;
using Charkhoone.Application.IdentityVerification;
using Charkhoone.Application.Payments;
using Charkhoone.Application.TenantContributionFunding;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Finance;
using Charkhoone.Infrastructure.BankFunding;
using Charkhoone.Infrastructure.Contracts;
using Charkhoone.Infrastructure.CreditApplications;
using Charkhoone.Infrastructure.CreditEligibility;
using Charkhoone.Infrastructure.IdentityVerification;
using Charkhoone.Infrastructure.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Charkhoone.Infrastructure.TenantContributionFunding;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class PilotSyntheticCohortHarnessTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;

    public Task InitializeAsync() => _factory.MigrateAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task SmallCohort_ExercisesDeterministicScenarioMix()
    {
        var scenarios = Enum.GetValues<SyntheticScenario>();
        var summary = await RunCohortAsync(
            _factory.ConnectionString,
            scenarios.Length,
            3,
            scenarios,
            $"ci-{Guid.NewGuid():N}",
            CancellationToken.None);

        Assert.Equal(scenarios.Length, summary.TotalCases);
        Assert.Equal(scenarios.Length, summary.CompletedCases);
        Assert.Equal(scenarios.Length, summary.ScenarioCounts.Count);
        Assert.All(summary.ScenarioCounts.Values, value => Assert.Equal(1, value));
    }

    [Fact]
    public async Task ExternalCohort_RunConfiguredSize()
    {
        if (!string.Equals(
                Environment.GetEnvironmentVariable("CHARKHOONE_RUN_PILOT_COHORT"),
                "true",
                StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var count = RequiredPositiveInt("CHARKHOONE_PILOT_COHORT_SIZE", 100_000);
        var concurrency = OptionalPositiveInt(
            "CHARKHOONE_PILOT_COHORT_CONCURRENCY",
            Math.Min(8, count),
            256);
        var scenarios = ParseScenarios(
            Environment.GetEnvironmentVariable("CHARKHOONE_PILOT_COHORT_SCENARIOS"));
        var runId = NormalizeRunId(
            Environment.GetEnvironmentVariable("CHARKHOONE_PILOT_COHORT_RUN_ID")
            ?? $"pilot-{Guid.NewGuid():N}");

        var summary = await RunCohortAsync(
            _factory.ConnectionString,
            count,
            concurrency,
            scenarios,
            runId,
            CancellationToken.None);

        Assert.Equal(count, summary.TotalCases);
        Assert.Equal(count, summary.CompletedCases);

        var evidenceRoot = Environment.GetEnvironmentVariable(
            "CHARKHOONE_PILOT_COHORT_EVIDENCE_DIR");
        if (!string.IsNullOrWhiteSpace(evidenceRoot))
        {
            var outputDirectory = Path.Combine(evidenceRoot.Trim(), runId);
            Directory.CreateDirectory(outputDirectory);
            await File.WriteAllTextAsync(
                Path.Combine(outputDirectory, "summary.json"),
                JsonSerializer.Serialize(
                    summary,
                    new JsonSerializerOptions { WriteIndented = true }));
        }
    }

    private static async Task<CohortSummary> RunCohortAsync(
        string connectionString,
        int count,
        int concurrency,
        IReadOnlyList<SyntheticScenario> scenarios,
        string runId,
        CancellationToken cancellationToken)
    {
        if (count < 1 || concurrency < 1 || scenarios.Count == 0)
        {
            throw new ArgumentOutOfRangeException(nameof(count));
        }

        var startedAtUtc = DateTimeOffset.UtcNow;
        var planId = Guid.NewGuid();
        const string planVersion = "pilot-cohort-v1";
        const string bankId = "pilot-cohort-bank";

        await using (var seedDb = CreateDbContext(connectionString))
        {
            seedDb.BankLoanPlanVersions.Add(new BankLoanPlanVersionRow
            {
                Id = Guid.NewGuid(),
                PlanId = planId,
                Version = planVersion,
                BankId = bankId,
                Title = $"Synthetic cohort {runId}",
                InterestTerms = "Synthetic pilot harness only; no real provider or money movement.",
                Scope = BankLoanPlanScope.Public,
                Status = BankLoanPlanStatus.Published,
                TermMonths = BankLoanPlanVersion.RequiredTermMonths,
                CreatedAtUtc = startedAtUtc,
            });
            await seedDb.SaveChangesAsync(cancellationToken);
        }

        var counts = new ConcurrentDictionary<string, int>(StringComparer.Ordinal);
        var completed = 0;

        await Parallel.ForEachAsync(
            Enumerable.Range(0, count),
            new ParallelOptions
            {
                MaxDegreeOfParallelism = Math.Min(concurrency, count),
                CancellationToken = cancellationToken,
            },
            async (index, token) =>
            {
                var scenario = scenarios[index % scenarios.Count];
                await RunCaseAsync(
                    connectionString,
                    runId,
                    index,
                    scenario,
                    planId,
                    planVersion,
                    bankId,
                    startedAtUtc.AddMilliseconds(index),
                    token);

                counts.AddOrUpdate(ScenarioName(scenario), 1, (_, current) => current + 1);
                Interlocked.Increment(ref completed);
            });

        return new CohortSummary(
            runId,
            count,
            completed,
            Math.Min(concurrency, count),
            counts.OrderBy(x => x.Key, StringComparer.Ordinal)
                .ToDictionary(x => x.Key, x => x.Value, StringComparer.Ordinal),
            startedAtUtc,
            DateTimeOffset.UtcNow);
    }

    private static async Task RunCaseAsync(
        string connectionString,
        string runId,
        int index,
        SyntheticScenario scenario,
        Guid planId,
        string planVersion,
        string bankId,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        await using var db = CreateDbContext(connectionString);

        var applicantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        db.Users.AddRange(
            new UserRow
            {
                Id = applicantId,
                OidcSubject = $"cohort:{runId}:applicant:{index}",
                CreatedAtUtc = now,
            },
            new UserRow
            {
                Id = ownerId,
                OidcSubject = $"cohort:{runId}:owner:{index}",
                CreatedAtUtc = now,
            });
        await db.SaveChangesAsync(cancellationToken);

        var adapters = new SyntheticScenarioAdapters(
            scenario,
            runId,
            index,
            ownerId,
            bankId,
            now);
        var termsService = new EfLeaseContractTermsService(db);
        var applicationService = new EfCreditApplicationService(db);
        var identityService = new EfCreditApplicationIdentityService(db, adapters);
        var propertyService = new EfPropertyContractRegistrationService(db, adapters, termsService);
        var eligibilityService = new EfCreditEligibilityService(db, adapters);
        var bankFundingService = new EfBankFundingService(db, adapters, adapters);
        var tenantFundingService = new EfTenantContributionFundingService(db, adapters);
        var leaseFundingService = new EfLeaseFundingLifecycleService(db);
        var scheduleService = new EfMonthlyScheduleProvisioningService(db);

        var draft = await applicationService.CreateDraftAsync(applicantId, now, cancellationToken);
        var submitted = await applicationService.SubmitAsync(
            draft.Id, applicantId, now.AddSeconds(1), cancellationToken);
        Assert.Equal(SubmitCreditApplicationOutcome.Submitted, submitted.Outcome);

        var identity = await identityService.ProcessAsync(
            draft.Id, now.AddSeconds(2), cancellationToken);

        if (scenario == SyntheticScenario.IdentityNeedsDocuments)
        {
            Assert.Equal(ProcessIdentityVerificationOutcome.Applied, identity.Outcome);
            await AssertApplicationStatusAsync(
                db, draft.Id, CreditApplicationStatus.NeedsDocuments, cancellationToken);
            return;
        }

        Assert.Equal(ProcessIdentityVerificationOutcome.Applied, identity.Outcome);
        Assert.Equal(CreditApplicationStatus.PlanSelectionPending, identity.ApplicationStatus);

        var selection = await applicationService.SelectBankLoanPlanAsync(
            draft.Id, applicantId, planId, planVersion, now.AddSeconds(3), cancellationToken);
        Assert.Equal(SelectBankLoanPlanOutcome.Selected, selection.Outcome);

        var property = await propertyService.ReconcileAsync(
            draft.Id, applicantId, now.AddSeconds(4), cancellationToken);
        Assert.Equal(ReconcilePropertyContractOutcome.Registered, property.Outcome);
        var contractId = property.Registration!.ContractId;

        var eligibility = await eligibilityService.EvaluateAsync(
            draft.Id, applicantId, now.AddSeconds(5), cancellationToken);

        if (scenario == SyntheticScenario.CreditIndeterminate)
        {
            Assert.Equal(EvaluateCreditEligibilityOutcome.Indeterminate, eligibility.Outcome);
            await AssertApplicationStatusAsync(
                db, draft.Id, CreditApplicationStatus.ExternalCheckIndeterminate, cancellationToken);
            return;
        }

        Assert.Equal(EvaluateCreditEligibilityOutcome.Applied, eligibility.Outcome);

        var bankFunding = await bankFundingService.ProcessAsync(
            draft.Id, applicantId, now.AddSeconds(6), cancellationToken);

        if (scenario == SyntheticScenario.BankDeclined)
        {
            Assert.Equal(ProcessBankFundingOutcome.BankDeclined, bankFunding.Outcome);
            await AssertApplicationStatusAsync(
                db, draft.Id, CreditApplicationStatus.Rejected, cancellationToken);
            return;
        }

        if (scenario == SyntheticScenario.FundIndeterminate)
        {
            Assert.Equal(ProcessBankFundingOutcome.FundingIndeterminate, bankFunding.Outcome);
            await AssertApplicationStatusAsync(
                db, draft.Id, CreditApplicationStatus.ExternalCheckIndeterminate, cancellationToken);
            return;
        }

        Assert.Equal(ProcessBankFundingOutcome.Funded, bankFunding.Outcome);

        var tenantFunding = await tenantFundingService.ReconcileAsync(
            draft.Id, now.AddSeconds(7), cancellationToken);

        if (scenario == SyntheticScenario.TenantContributionIndeterminate)
        {
            Assert.Equal(ReconcileTenantContributionOutcome.Indeterminate, tenantFunding.Outcome);
            var partial = await leaseFundingService.AdvanceAsync(
                contractId, now.AddSeconds(8), cancellationToken);
            Assert.NotEqual(AdvanceLeaseFundingLifecycleOutcome.Activated, partial.Outcome);

            var status = await db.LeaseContracts.AsNoTracking()
                .Where(x => x.Id == contractId)
                .Select(x => x.Status)
                .SingleAsync(cancellationToken);
            Assert.Equal(LeaseContractStatus.AwaitingCompletion, status);
            return;
        }

        Assert.Equal(ReconcileTenantContributionOutcome.Reconciled, tenantFunding.Outcome);
        Assert.NotNull(tenantFunding.Funding);
        var tenantFundingAllocationId = tenantFunding.Funding!.FundingAllocationId;

        var lease = await leaseFundingService.AdvanceAsync(
            contractId, now.AddSeconds(8), cancellationToken);
        Assert.Equal(AdvanceLeaseFundingLifecycleOutcome.Activated, lease.Outcome);
        Assert.Equal(LeaseContractStatus.Active, lease.Status);

        var schedule = await scheduleService.ProvisionAsync(
            contractId, now.AddSeconds(9), cancellationToken);
        Assert.Equal(ProvisionMonthlyScheduleOutcome.Provisioned, schedule.Outcome);
        Assert.Equal(12, schedule.CreatedObligationCount);

        Assert.Equal(
            12,
            await db.MonthlyObligations.CountAsync(
                x => x.ContractId == contractId,
                cancellationToken));
        Assert.True(
            await db.JournalEntries.AnyAsync(
                x => x.ReferenceType == "ExternalTransaction"
                    && x.IdempotencyKey
                        == $"journal:tenant-contribution-funding:{tenantFundingAllocationId:D}:v1",
                cancellationToken));
    }

    private static async Task AssertApplicationStatusAsync(
        CharkhooneDbContext db,
        Guid applicationId,
        CreditApplicationStatus expected,
        CancellationToken cancellationToken)
    {
        var status = await db.CreditApplications.AsNoTracking()
            .Where(x => x.Id == applicationId)
            .Select(x => x.Status)
            .SingleAsync(cancellationToken);
        Assert.Equal(expected, status);
    }

    private static CharkhooneDbContext CreateDbContext(string connectionString)
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql(connectionString)
            .Options;
        return new CharkhooneDbContext(options);
    }

    private static IReadOnlyList<SyntheticScenario> ParseScenarios(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return Enum.GetValues<SyntheticScenario>();
        }

        var values = raw.Split(
                ',',
                StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Select(ParseScenario)
            .Distinct()
            .ToArray();

        return values.Length == 0
            ? throw new InvalidOperationException("No pilot cohort scenarios were configured.")
            : values;
    }

    private static SyntheticScenario ParseScenario(string raw) =>
        raw.Trim().ToLowerInvariant() switch
        {
            "happy" => SyntheticScenario.Happy,
            "identity-needs-documents" => SyntheticScenario.IdentityNeedsDocuments,
            "credit-indeterminate" => SyntheticScenario.CreditIndeterminate,
            "bank-declined" => SyntheticScenario.BankDeclined,
            "fund-indeterminate" => SyntheticScenario.FundIndeterminate,
            "tenant-contribution-indeterminate" => SyntheticScenario.TenantContributionIndeterminate,
            _ => throw new InvalidOperationException($"Unknown pilot cohort scenario: {raw}"),
        };

    private static string ScenarioName(SyntheticScenario scenario) =>
        scenario switch
        {
            SyntheticScenario.Happy => "happy",
            SyntheticScenario.IdentityNeedsDocuments => "identity-needs-documents",
            SyntheticScenario.CreditIndeterminate => "credit-indeterminate",
            SyntheticScenario.BankDeclined => "bank-declined",
            SyntheticScenario.FundIndeterminate => "fund-indeterminate",
            SyntheticScenario.TenantContributionIndeterminate => "tenant-contribution-indeterminate",
            _ => throw new InvalidOperationException("Unknown synthetic scenario."),
        };

    private static int RequiredPositiveInt(string key, int maximum)
    {
        var raw = Environment.GetEnvironmentVariable(key);
        if (!int.TryParse(raw, out var value) || value is < 1 || value > maximum)
        {
            throw new InvalidOperationException(
                $"{key} must be a whole number between 1 and {maximum}.");
        }
        return value;
    }

    private static int OptionalPositiveInt(string key, int fallback, int maximum)
    {
        var raw = Environment.GetEnvironmentVariable(key);
        if (string.IsNullOrWhiteSpace(raw))
        {
            return fallback;
        }
        return int.TryParse(raw, out var value) && value is >= 1 && value <= maximum
            ? value
            : throw new InvalidOperationException(
                $"{key} must be a whole number between 1 and {maximum}.");
    }

    private static string NormalizeRunId(string runId)
    {
        var normalized = runId.Trim();
        if (normalized.Length is < 1 or > 100
            || normalized.Any(character =>
                !(char.IsAsciiLetterOrDigit(character)
                    || character is '-' or '_' or '.')))
        {
            throw new InvalidOperationException(
                "Pilot cohort run id must contain only letters, digits, dash, underscore, or dot and be at most 100 characters.");
        }
        return normalized;
    }

    private enum SyntheticScenario
    {
        Happy,
        IdentityNeedsDocuments,
        CreditIndeterminate,
        BankDeclined,
        FundIndeterminate,
        TenantContributionIndeterminate,
    }

    private sealed record CohortSummary(
        string RunId,
        int TotalCases,
        int CompletedCases,
        int Concurrency,
        IReadOnlyDictionary<string, int> ScenarioCounts,
        DateTimeOffset StartedAtUtc,
        DateTimeOffset CompletedAtUtc);

    private sealed class SyntheticScenarioAdapters(
        SyntheticScenario scenario,
        string runId,
        int index,
        Guid ownerUserId,
        string bankId,
        DateTimeOffset now)
        : IIdentityVerificationAdapter,
          IExternalPropertyContractEvidenceAdapter,
          IExternalCreditGradeAdapter,
          IExternalBankApprovalAdapter,
          IExternalFundAdapter
    {
        public string Provider => "pilot-synthetic-harness";

        public Task<IdentityVerificationResponse> VerifyAsync(
            IdentityVerificationRequest request,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(
                scenario == SyntheticScenario.IdentityNeedsDocuments
                    ? new IdentityVerificationResponse(
                        IdentityVerificationOutcome.NeedsDocuments,
                        Provider,
                        $"cohort:{runId}:{index}:identity-documents",
                        "synthetic_documents_required")
                    : new IdentityVerificationResponse(
                        IdentityVerificationOutcome.Verified,
                        Provider,
                        $"cohort:{runId}:{index}:identity"));

        public Task<ExternalPropertyContractEvidenceResponse> CheckAsync(
            ExternalPropertyContractEvidenceRequest request,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new ExternalPropertyContractEvidenceResponse(
                ExternalPropertyContractEvidenceStatus.Confirmed,
                Provider,
                OwnerUserId: ownerUserId,
                PropertyId: Guid.NewGuid(),
                PersianStartYear: 1405,
                PersianStartMonth: 7,
                PersianStartDay: 1,
                CashDepositRial: 1_000_000_000m,
                MonthlyRentRial: 0m,
                OwnerBeneficiaryId: $"cohort-owner:{ownerUserId:D}",
                BankBeneficiaryId: bankId,
                ScheduleMonths: Enumerable.Range(1, 12)
                    .Select(month => new LeaseContractScheduleMonthInput(
                        month,
                        now.AddDays(30).AddMonths(month - 1),
                        90_000_000m,
                        10_000_000m))
                    .ToArray(),
                ExternalReference: $"cohort:{runId}:{index}:property"));

        Task<ExternalCreditGradeResponse> IExternalCreditGradeAdapter.CheckAsync(
            ExternalCreditGradeRequest request,
            CancellationToken cancellationToken) =>
            Task.FromResult(
                scenario == SyntheticScenario.CreditIndeterminate
                    ? new ExternalCreditGradeResponse(
                        ExternalCreditResultStatus.Unknown,
                        Provider,
                        null,
                        $"cohort:{runId}:{index}:credit-unknown",
                        "synthetic_credit_indeterminate")
                    : new ExternalCreditGradeResponse(
                        ExternalCreditResultStatus.Valid,
                        Provider,
                        "A1",
                        $"cohort:{runId}:{index}:credit"));

        Task<BankApprovalResponse> IExternalBankApprovalAdapter.CheckAsync(
            BankApprovalRequest request,
            CancellationToken cancellationToken) =>
            Task.FromResult(
                scenario == SyntheticScenario.BankDeclined
                    ? new BankApprovalResponse(
                        BankApprovalDecisionStatus.Declined,
                        Provider,
                        null,
                        $"cohort:{runId}:{index}:bank-declined",
                        "synthetic_bank_declined")
                    : new BankApprovalResponse(
                        BankApprovalDecisionStatus.Approved,
                        Provider,
                        500_000_000m,
                        $"cohort:{runId}:{index}:bank-approved"));

        public Task<FundPrincipalFreezeResponse> FreezePrincipalAsync(
            FundPrincipalFreezeRequest request,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(
                scenario == SyntheticScenario.FundIndeterminate
                    ? new FundPrincipalFreezeResponse(
                        FundPrincipalFreezeStatus.Indeterminate,
                        Provider,
                        null,
                        null,
                        "synthetic_fund_indeterminate")
                    : new FundPrincipalFreezeResponse(
                        FundPrincipalFreezeStatus.Confirmed,
                        Provider,
                        $"cohort-fund:{runId}:{index}",
                        $"cohort:{runId}:{index}:principal-freeze"));

        public Task<FundTenantContributionResponse> CheckTenantContributionAsync(
            FundTenantContributionRequest request,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(
                scenario == SyntheticScenario.TenantContributionIndeterminate
                    ? new FundTenantContributionResponse(
                        FundTenantContributionStatus.Indeterminate,
                        Provider,
                        null,
                        null,
                        null,
                        "synthetic_tenant_contribution_indeterminate")
                    : new FundTenantContributionResponse(
                        FundTenantContributionStatus.Confirmed,
                        Provider,
                        request.ExpectedAmountRial,
                        $"cohort-tenant-fund:{runId}:{index}",
                        $"cohort:{runId}:{index}:tenant-contribution"));
    }
}
