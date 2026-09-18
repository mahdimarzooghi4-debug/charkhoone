using System.Net;
using System.Text.Json;
using Charkhoone.Application.Contracts;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Finance;
using Charkhoone.Infrastructure.Contracts;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class PropertyContractRegistrationIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;

    public Task InitializeAsync() => _factory.MigrateAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task ConfirmedTrustedEvidence_CreatesDraftContractAndImmutableTerms_AndReplayIsIdempotent()
    {
        var now = DateTimeOffset.Parse("2026-09-18T17:00:00+00:00");
        var applicantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var planId = Guid.NewGuid();
        var propertyId = Guid.NewGuid();
        var sourceReference = $"trusted-registry:{applicationId:D}";
        const string planVersion = "public-v1";

        await SeedApplicationAsync(
            applicantId,
            ownerId,
            applicationId,
            planId,
            planVersion,
            now);

        var adapter = new RecordingPropertyContractAdapter(request =>
        {
            Assert.Equal(applicationId, request.CreditApplicationId);
            Assert.Equal(applicantId, request.ApplicantUserId);
            Assert.Equal(planId, request.BankLoanPlanId);
            Assert.Equal(planVersion, request.BankLoanPlanVersion);

            return ConfirmedEvidence(
                ownerId,
                propertyId,
                sourceReference,
                now.AddDays(10));
        });

        ReconcilePropertyContractResult first;
        await using (var db = CreateDbContext())
        {
            var terms = new EfLeaseContractTermsService(db);
            var service = new EfPropertyContractRegistrationService(db, adapter, terms);
            first = await service.ReconcileAsync(
                applicationId,
                applicantId,
                now);
        }

        Assert.Equal(ReconcilePropertyContractOutcome.Registered, first.Outcome);
        Assert.NotNull(first.Registration);
        Assert.Equal(CreditApplicationStatus.ExternalChecksPending, first.Registration!.ApplicationStatus);
        Assert.Equal(LeaseContractStatus.Draft, first.Registration.ContractStatus);
        Assert.Equal(applicantId, first.Registration.TenantUserId);
        Assert.Equal(ownerId, first.Registration.OwnerUserId);
        Assert.Equal(propertyId, first.Registration.PropertyId);
        Assert.Equal(planId, first.Registration.BankLoanPlanId);
        Assert.Equal(planVersion, first.Registration.BankLoanPlanVersion);
        Assert.Equal(2_000_000_000m, first.Registration.FullDepositEquivalentRial);
        Assert.Equal(sourceReference, first.Registration.SourceReference);
        Assert.Equal(1, adapter.CallCount);

        await using (var verification = CreateDbContext())
        {
            var application = await verification.CreditApplications
                .AsNoTracking()
                .SingleAsync(x => x.Id == applicationId);
            var contract = await verification.LeaseContracts
                .AsNoTracking()
                .SingleAsync(x => x.CreditApplicationId == applicationId);
            var terms = await verification.LeaseContractTerms
                .AsNoTracking()
                .SingleAsync(x => x.ContractId == contract.Id);
            var schedule = await verification.LeaseContractScheduleMonths
                .AsNoTracking()
                .Where(x => x.ContractId == contract.Id)
                .OrderBy(x => x.ContractMonthNumber)
                .ToListAsync();
            var request = await verification.VerificationRequests
                .AsNoTracking()
                .SingleAsync(x =>
                    x.CreditApplicationId == applicationId
                    && x.Type == "PropertyContract");

            Assert.Equal(CreditApplicationStatus.ExternalChecksPending, application.Status);
            Assert.Equal(LeaseContractStatus.Draft, contract.Status);
            Assert.Equal(applicantId, contract.TenantUserId);
            Assert.Equal(ownerId, contract.OwnerUserId);
            Assert.Equal(propertyId, contract.PropertyId);
            Assert.Equal(planId, contract.BankLoanPlanId);
            Assert.Equal(planVersion, contract.BankLoanPlanVersion);
            Assert.Equal("Persian", terms.Calendar);
            Assert.Equal(1405, terms.PersianStartYear);
            Assert.Equal(6, terms.PersianStartMonth);
            Assert.Equal(27, terms.PersianStartDay);
            Assert.Equal(1_000_000_000m, terms.CashDepositRial);
            Assert.Equal(30_000_000m, terms.MonthlyRentRial);
            Assert.Equal(2_000_000_000m, terms.FullDepositEquivalentRial);
            Assert.Equal(sourceReference, terms.SourceReference);
            Assert.Equal(12, schedule.Count);
            Assert.Equal(Enumerable.Range(1, 12), schedule.Select(x => x.ContractMonthNumber));
            Assert.Equal(nameof(ExternalPropertyContractEvidenceStatus.Confirmed), request.Status);
            Assert.Equal(sourceReference, request.ExternalReference);
            Assert.Equal(1, request.AttemptCount);

            Assert.Equal(
                1,
                await verification.WorkflowTransitions.CountAsync(x =>
                    x.AggregateType == "CreditApplication"
                    && x.AggregateId == applicationId
                    && x.FromStatus == nameof(CreditApplicationStatus.PropertyContractPending)
                    && x.ToStatus == nameof(CreditApplicationStatus.ExternalChecksPending)));

            Assert.Equal(
                1,
                await verification.AuditEvents.CountAsync(x =>
                    x.AggregateType == "CreditApplication"
                    && x.AggregateId == applicationId
                    && x.Action == "property_contract_registered"));

            var outbox = await verification.OutboxMessages
                .AsNoTracking()
                .Where(x => x.Type == "credit-application.property-contract-registered.v1")
                .ToListAsync();
            Assert.Single(outbox.Where(x =>
                x.PayloadJson.Contains(applicationId.ToString(), StringComparison.OrdinalIgnoreCase)));
        }

        ReconcilePropertyContractResult replay;
        await using (var replayDb = CreateDbContext())
        {
            var terms = new EfLeaseContractTermsService(replayDb);
            var service = new EfPropertyContractRegistrationService(replayDb, adapter, terms);
            replay = await service.ReconcileAsync(
                applicationId,
                applicantId,
                now.AddMinutes(1));
        }

        Assert.Equal(ReconcilePropertyContractOutcome.AlreadyRegistered, replay.Outcome);
        Assert.NotNull(replay.Registration);
        Assert.Equal(first.Registration.ContractId, replay.Registration!.ContractId);
        Assert.Equal(1, adapter.CallCount);

        await using var finalVerification = CreateDbContext();
        Assert.Equal(
            1,
            await finalVerification.LeaseContracts.CountAsync(x => x.CreditApplicationId == applicationId));
        Assert.Equal(
            1,
            await finalVerification.LeaseContractTerms.CountAsync(x =>
                x.ContractId == first.Registration.ContractId));
    }

    [Fact]
    public async Task ConfirmedEvidenceWithUnmappedOwner_RemainsIndeterminate_AndCreatesNoContract()
    {
        var now = DateTimeOffset.Parse("2026-09-18T18:00:00+00:00");
        var applicantId = Guid.NewGuid();
        var mappedOwnerId = Guid.NewGuid();
        var unmappedOwnerId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var planId = Guid.NewGuid();
        var sourceReference = $"trusted-registry:{applicationId:D}";
        const string planVersion = "public-v1";

        await SeedApplicationAsync(
            applicantId,
            mappedOwnerId,
            applicationId,
            planId,
            planVersion,
            now);

        var adapter = new RecordingPropertyContractAdapter(_ =>
            ConfirmedEvidence(
                unmappedOwnerId,
                Guid.NewGuid(),
                sourceReference,
                now.AddDays(10)));

        ReconcilePropertyContractResult result;
        await using (var db = CreateDbContext())
        {
            var terms = new EfLeaseContractTermsService(db);
            var service = new EfPropertyContractRegistrationService(db, adapter, terms);
            result = await service.ReconcileAsync(
                applicationId,
                applicantId,
                now);
        }

        Assert.Equal(ReconcilePropertyContractOutcome.Indeterminate, result.Outcome);

        await using var verification = CreateDbContext();
        var application = await verification.CreditApplications
            .AsNoTracking()
            .SingleAsync(x => x.Id == applicationId);
        var request = await verification.VerificationRequests
            .AsNoTracking()
            .SingleAsync(x =>
                x.CreditApplicationId == applicationId
                && x.Type == "PropertyContract");

        Assert.Equal(CreditApplicationStatus.PropertyContractPending, application.Status);
        Assert.Equal(nameof(ExternalPropertyContractEvidenceStatus.Indeterminate), request.Status);
        Assert.Equal("property_contract_owner_not_mapped", request.ReasonCode);
        Assert.False(await verification.LeaseContracts
            .AnyAsync(x => x.CreditApplicationId == applicationId));
        Assert.False(await verification.LeaseContractTerms
            .AnyAsync(x => x.SourceReference == sourceReference));
    }

    [Fact]
    public async Task ReconcileEndpoint_IsApplicantOwned_AndUnavailableAdapterFailsClosed()
    {
        var now = DateTimeOffset.UtcNow;
        var applicantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var outsiderId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var planId = Guid.NewGuid();
        const string planVersion = "public-v1";
        var applicantSubject = $"property-contract-applicant-{applicantId:D}";
        var outsiderSubject = $"property-contract-outsider-{outsiderId:D}";

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
            db.Users.AddRange(
                new UserRow
                {
                    Id = applicantId,
                    OidcSubject = applicantSubject,
                    CreatedAtUtc = now.AddDays(-2),
                },
                new UserRow
                {
                    Id = ownerId,
                    OidcSubject = $"property-contract-owner-{ownerId:D}",
                    CreatedAtUtc = now.AddDays(-2),
                },
                new UserRow
                {
                    Id = outsiderId,
                    OidcSubject = outsiderSubject,
                    CreatedAtUtc = now.AddDays(-2),
                });
            db.CreditApplications.Add(new CreditApplicationRow
            {
                Id = applicationId,
                ApplicantUserId = applicantId,
                Status = CreditApplicationStatus.PropertyContractPending,
                BankLoanPlanId = planId,
                BankLoanPlanVersion = planVersion,
                CreatedAtUtc = now.AddHours(-2),
                UpdatedAtUtc = now.AddHours(-1),
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
                CreatedAtUtc = now.AddDays(-3),
            });
            await db.SaveChangesAsync();
        }

        using var outsider = _factory.CreateAuthenticatedClient(outsiderSubject);
        var outsiderResponse = await outsider.PostAsync(
            $"/api/v1/credit-applications/{applicationId:D}/property-contract/reconcile",
            null);
        Assert.Equal(HttpStatusCode.NotFound, outsiderResponse.StatusCode);

        using var applicant = _factory.CreateAuthenticatedClient(applicantSubject);
        var applicantResponse = await applicant.PostAsync(
            $"/api/v1/credit-applications/{applicationId:D}/property-contract/reconcile",
            null);
        Assert.Equal(HttpStatusCode.OK, applicantResponse.StatusCode);

        using var document = JsonDocument.Parse(await applicantResponse.Content.ReadAsStringAsync());
        Assert.Equal("Indeterminate", document.RootElement.GetProperty("outcome").GetString());
        Assert.Equal(JsonValueKind.Null, document.RootElement.GetProperty("contractId").ValueKind);

        await using var verificationScope = _factory.Services.CreateAsyncScope();
        var verification = verificationScope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
        Assert.False(await verification.LeaseContracts
            .AnyAsync(x => x.CreditApplicationId == applicationId));
    }

    private async Task SeedApplicationAsync(
        Guid applicantId,
        Guid ownerId,
        Guid applicationId,
        Guid planId,
        string planVersion,
        DateTimeOffset now)
    {
        await using var db = CreateDbContext();
        db.Users.AddRange(
            new UserRow
            {
                Id = applicantId,
                OidcSubject = $"property-contract-applicant-{applicantId:D}",
                CreatedAtUtc = now.AddDays(-2),
            },
            new UserRow
            {
                Id = ownerId,
                OidcSubject = $"property-contract-owner-{ownerId:D}",
                CreatedAtUtc = now.AddDays(-2),
            });
        db.CreditApplications.Add(new CreditApplicationRow
        {
            Id = applicationId,
            ApplicantUserId = applicantId,
            Status = CreditApplicationStatus.PropertyContractPending,
            BankLoanPlanId = planId,
            BankLoanPlanVersion = planVersion,
            CreatedAtUtc = now.AddHours(-2),
            UpdatedAtUtc = now.AddHours(-1),
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
            CreatedAtUtc = now.AddDays(-3),
        });
        await db.SaveChangesAsync();
    }

    private static ExternalPropertyContractEvidenceResponse ConfirmedEvidence(
        Guid ownerId,
        Guid propertyId,
        string sourceReference,
        DateTimeOffset firstDueAtUtc) =>
        new(
            ExternalPropertyContractEvidenceStatus.Confirmed,
            "integration-property-registry",
            ownerId,
            propertyId,
            1405,
            6,
            27,
            1_000_000_000m,
            30_000_000m,
            "integration-owner-beneficiary",
            "integration-bank-beneficiary",
            Enumerable.Range(1, 12)
                .Select(index => new LeaseContractScheduleMonthInput(
                    index,
                    firstDueAtUtc.AddMonths(index - 1),
                    90_000_000m,
                    10_000_000m))
                .ToArray(),
            sourceReference);

    private CharkhooneDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql(_factory.ConnectionString)
            .Options;
        return new CharkhooneDbContext(options);
    }

    private sealed class RecordingPropertyContractAdapter(
        Func<ExternalPropertyContractEvidenceRequest, ExternalPropertyContractEvidenceResponse> responseFactory)
        : IExternalPropertyContractEvidenceAdapter
    {
        public string Provider => "integration-property-registry";
        public int CallCount { get; private set; }

        public Task<ExternalPropertyContractEvidenceResponse> CheckAsync(
            ExternalPropertyContractEvidenceRequest request,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            return Task.FromResult(responseFactory(request));
        }
    }
}
