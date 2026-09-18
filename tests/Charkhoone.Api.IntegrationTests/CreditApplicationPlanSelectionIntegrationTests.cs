using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Finance;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class CreditApplicationPlanSelectionIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;

    public Task InitializeAsync() => _factory.MigrateAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Applicant_SelectsExactPublishedPublicPlan_AndReplayIsIdempotent()
    {
        var now = DateTimeOffset.UtcNow;
        var applicantId = Guid.NewGuid();
        var outsiderId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var planId = Guid.NewGuid();
        var applicantSubject = $"plan-selection-applicant-{applicantId:D}";
        var outsiderSubject = $"plan-selection-outsider-{outsiderId:D}";

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
            db.Users.AddRange(
                new UserRow
                {
                    Id = applicantId,
                    OidcSubject = applicantSubject,
                    CreatedAtUtc = now.AddDays(-1),
                },
                new UserRow
                {
                    Id = outsiderId,
                    OidcSubject = outsiderSubject,
                    CreatedAtUtc = now.AddDays(-1),
                });
            db.CreditApplications.Add(new CreditApplicationRow
            {
                Id = applicationId,
                ApplicantUserId = applicantId,
                Status = CreditApplicationStatus.PlanSelectionPending,
                CreatedAtUtc = now.AddHours(-1),
                UpdatedAtUtc = now.AddHours(-1),
            });
            db.BankLoanPlanVersions.Add(new BankLoanPlanVersionRow
            {
                Id = Guid.NewGuid(),
                PlanId = planId,
                Version = "public-v1",
                BankId = "integration-bank",
                Title = "Integration public plan",
                InterestTerms = "trusted persisted terms",
                Scope = BankLoanPlanScope.Public,
                Status = BankLoanPlanStatus.Published,
                TermMonths = BankLoanPlanVersion.RequiredTermMonths,
                CreatedAtUtc = now.AddDays(-2),
            });
            await db.SaveChangesAsync();
        }

        using var outsider = _factory.CreateAuthenticatedClient(outsiderSubject);
        var outsiderResponse = await outsider.PostAsJsonAsync(
            $"/api/v1/credit-applications/{applicationId:D}/loan-plan",
            new { planId, version = "public-v1" });
        Assert.Equal(HttpStatusCode.NotFound, outsiderResponse.StatusCode);

        using var applicant = _factory.CreateAuthenticatedClient(applicantSubject);
        var firstResponse = await applicant.PostAsJsonAsync(
            $"/api/v1/credit-applications/{applicationId:D}/loan-plan",
            new { planId, version = " public-v1 " });

        Assert.Equal(HttpStatusCode.OK, firstResponse.StatusCode);
        using (var document = JsonDocument.Parse(await firstResponse.Content.ReadAsStringAsync()))
        {
            Assert.Equal("Selected", document.RootElement.GetProperty("outcome").GetString());
            Assert.Equal("PropertyContractPending", document.RootElement.GetProperty("applicationStatus").GetString());
            Assert.Equal(planId, document.RootElement.GetProperty("planId").GetGuid());
            Assert.Equal("public-v1", document.RootElement.GetProperty("planVersion").GetString());
        }

        var replayResponse = await applicant.PostAsJsonAsync(
            $"/api/v1/credit-applications/{applicationId:D}/loan-plan",
            new { planId, version = "public-v1" });

        Assert.Equal(HttpStatusCode.OK, replayResponse.StatusCode);
        using (var document = JsonDocument.Parse(await replayResponse.Content.ReadAsStringAsync()))
        {
            Assert.Equal("AlreadySelected", document.RootElement.GetProperty("outcome").GetString());
            Assert.Equal("PropertyContractPending", document.RootElement.GetProperty("applicationStatus").GetString());
        }

        await using var verificationScope = _factory.Services.CreateAsyncScope();
        var verification = verificationScope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
        var application = await verification.CreditApplications
            .AsNoTracking()
            .SingleAsync(x => x.Id == applicationId);

        Assert.Equal(CreditApplicationStatus.PropertyContractPending, application.Status);
        Assert.Equal(planId, application.BankLoanPlanId);
        Assert.Equal("public-v1", application.BankLoanPlanVersion);
        Assert.Equal(
            1,
            await verification.WorkflowTransitions.CountAsync(x =>
                x.AggregateType == "CreditApplication"
                && x.AggregateId == applicationId
                && x.FromStatus == nameof(CreditApplicationStatus.PlanSelectionPending)
                && x.ToStatus == nameof(CreditApplicationStatus.PropertyContractPending)));
        Assert.Equal(
            1,
            await verification.AuditEvents.CountAsync(x =>
                x.AggregateType == "CreditApplication"
                && x.AggregateId == applicationId
                && x.Action == "bank_loan_plan_selected"));
        var selectionEvents = await verification.OutboxMessages
            .AsNoTracking()
            .Where(x => x.Type == "credit-application.bank-loan-plan-selected.v1")
            .ToListAsync();
        Assert.Single(selectionEvents.Where(x =>
            x.PayloadJson.Contains(applicationId.ToString(), StringComparison.OrdinalIgnoreCase)));
    }

    [Fact]
    public async Task OrganizationalOrUnpublishedPlan_IsRejected_WithoutMutation()
    {
        var now = DateTimeOffset.UtcNow;
        var applicantId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var organizationalPlanId = Guid.NewGuid();
        var suspendedPlanId = Guid.NewGuid();
        var subject = $"plan-selection-restricted-{applicantId:D}";

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
            db.Users.Add(new UserRow
            {
                Id = applicantId,
                OidcSubject = subject,
                CreatedAtUtc = now.AddDays(-1),
            });
            db.CreditApplications.Add(new CreditApplicationRow
            {
                Id = applicationId,
                ApplicantUserId = applicantId,
                Status = CreditApplicationStatus.PlanSelectionPending,
                CreatedAtUtc = now.AddHours(-1),
                UpdatedAtUtc = now.AddHours(-1),
            });
            db.BankLoanPlanVersions.AddRange(
                new BankLoanPlanVersionRow
                {
                    Id = Guid.NewGuid(),
                    PlanId = organizationalPlanId,
                    Version = "org-v1",
                    BankId = "org-bank",
                    Title = "Organization-only plan",
                    InterestTerms = "trusted persisted terms",
                    Scope = BankLoanPlanScope.Organizational,
                    Status = BankLoanPlanStatus.Published,
                    TermMonths = BankLoanPlanVersion.RequiredTermMonths,
                    CreatedAtUtc = now.AddDays(-2),
                },
                new BankLoanPlanVersionRow
                {
                    Id = Guid.NewGuid(),
                    PlanId = suspendedPlanId,
                    Version = "suspended-v1",
                    BankId = "suspended-bank",
                    Title = "Suspended public plan",
                    InterestTerms = "trusted persisted terms",
                    Scope = BankLoanPlanScope.Public,
                    Status = BankLoanPlanStatus.Suspended,
                    TermMonths = BankLoanPlanVersion.RequiredTermMonths,
                    CreatedAtUtc = now.AddDays(-2),
                });
            await db.SaveChangesAsync();
        }

        using var client = _factory.CreateAuthenticatedClient(subject);

        var organizational = await client.PostAsJsonAsync(
            $"/api/v1/credit-applications/{applicationId:D}/loan-plan",
            new { planId = organizationalPlanId, version = "org-v1" });
        Assert.Equal(HttpStatusCode.Conflict, organizational.StatusCode);

        var suspended = await client.PostAsJsonAsync(
            $"/api/v1/credit-applications/{applicationId:D}/loan-plan",
            new { planId = suspendedPlanId, version = "suspended-v1" });
        Assert.Equal(HttpStatusCode.Conflict, suspended.StatusCode);

        await using var verificationScope = _factory.Services.CreateAsyncScope();
        var verification = verificationScope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
        var application = await verification.CreditApplications
            .AsNoTracking()
            .SingleAsync(x => x.Id == applicationId);

        Assert.Equal(CreditApplicationStatus.PlanSelectionPending, application.Status);
        Assert.Null(application.BankLoanPlanId);
        Assert.Null(application.BankLoanPlanVersion);
        Assert.False(await verification.AuditEvents.AnyAsync(x =>
            x.AggregateType == "CreditApplication"
            && x.AggregateId == applicationId
            && x.Action == "bank_loan_plan_selected"));
    }
}
