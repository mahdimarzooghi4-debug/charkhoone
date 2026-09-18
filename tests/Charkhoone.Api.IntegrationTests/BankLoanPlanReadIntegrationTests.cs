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

public sealed class BankLoanPlanReadIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;

    public Task InitializeAsync() => _factory.MigrateAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Applicant_ListsOnlySelectablePersistedPlans_ThenSelectsExactVersion()
    {
        var now = DateTimeOffset.Parse("2199-09-19T04:00:00+00:00");
        var applicantId = Guid.NewGuid();
        var outsiderId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var publicPlanId = Guid.NewGuid();
        var draftPlanId = Guid.NewGuid();
        var organizationalPlanId = Guid.NewGuid();
        var suspendedPlanId = Guid.NewGuid();
        var applicantSubject = $"plan-read-applicant-{applicantId:D}";
        var outsiderSubject = $"plan-read-outsider-{outsiderId:D}";
        var planRowIds = new[]
        {
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
        };

        await using (var seedScope = _factory.Services.CreateAsyncScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
            db.Users.AddRange(
                new UserRow
                {
                    Id = applicantId,
                    OidcSubject = applicantSubject,
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
                Status = CreditApplicationStatus.PlanSelectionPending,
                CreatedAtUtc = now.AddHours(-2),
                UpdatedAtUtc = now.AddHours(-1),
            });

            db.BankLoanPlanVersions.AddRange(
                new BankLoanPlanVersionRow
                {
                    Id = planRowIds[0],
                    PlanId = publicPlanId,
                    Version = "public-v7",
                    BankId = "bank-authoritative",
                    Title = "Authoritative public plan",
                    InterestTerms = "persisted interest terms v7",
                    Scope = BankLoanPlanScope.Public,
                    Status = BankLoanPlanStatus.Published,
                    TermMonths = BankLoanPlanVersion.RequiredTermMonths,
                    CreatedAtUtc = now.AddDays(-3),
                },
                new BankLoanPlanVersionRow
                {
                    Id = planRowIds[1],
                    PlanId = draftPlanId,
                    Version = "draft-v1",
                    BankId = "bank-draft",
                    Title = "Draft public plan",
                    InterestTerms = "must not be exposed",
                    Scope = BankLoanPlanScope.Public,
                    Status = BankLoanPlanStatus.Draft,
                    TermMonths = BankLoanPlanVersion.RequiredTermMonths,
                    CreatedAtUtc = now.AddDays(-3),
                },
                new BankLoanPlanVersionRow
                {
                    Id = planRowIds[2],
                    PlanId = organizationalPlanId,
                    Version = "org-v1",
                    BankId = "bank-org",
                    Title = "Organization-only plan",
                    InterestTerms = "must not be exposed",
                    Scope = BankLoanPlanScope.Organizational,
                    Status = BankLoanPlanStatus.Published,
                    TermMonths = BankLoanPlanVersion.RequiredTermMonths,
                    CreatedAtUtc = now.AddDays(-3),
                },
                new BankLoanPlanVersionRow
                {
                    Id = planRowIds[3],
                    PlanId = suspendedPlanId,
                    Version = "suspended-v1",
                    BankId = "bank-suspended",
                    Title = "Suspended plan",
                    InterestTerms = "must not be exposed",
                    Scope = BankLoanPlanScope.Public,
                    Status = BankLoanPlanStatus.Suspended,
                    TermMonths = BankLoanPlanVersion.RequiredTermMonths,
                    CreatedAtUtc = now.AddDays(-3),
                });

            await db.SaveChangesAsync();
        }

        try
        {
            using var outsider = _factory.CreateAuthenticatedClient(outsiderSubject);
            var outsiderResponse = await outsider.GetAsync(
                $"/api/v1/credit-applications/{applicationId:D}/loan-plans");
            Assert.Equal(HttpStatusCode.NotFound, outsiderResponse.StatusCode);

            using var applicant = _factory.CreateAuthenticatedClient(applicantSubject);
            var listResponse = await applicant.GetAsync(
                $"/api/v1/credit-applications/{applicationId:D}/loan-plans");
            Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);

            using (var document = JsonDocument.Parse(await listResponse.Content.ReadAsStringAsync()))
            {
                var root = document.RootElement;
                Assert.Equal(applicationId, root.GetProperty("creditApplicationId").GetGuid());
                Assert.Equal(
                    nameof(CreditApplicationStatus.PlanSelectionPending),
                    root.GetProperty("applicationStatus").GetString());

                var items = root.GetProperty("items").EnumerateArray().ToArray();
                var item = Assert.Single(
                    items,
                    candidate =>
                        candidate.GetProperty("planId").GetGuid() == publicPlanId
                        && candidate.GetProperty("version").GetString() == "public-v7");

                Assert.Equal("bank-authoritative", item.GetProperty("bankId").GetString());
                Assert.Equal("Authoritative public plan", item.GetProperty("title").GetString());
                Assert.Equal("persisted interest terms v7", item.GetProperty("interestTerms").GetString());
                Assert.Equal(BankLoanPlanVersion.RequiredTermMonths, item.GetProperty("termMonths").GetInt32());

                Assert.DoesNotContain(items, candidate =>
                    candidate.GetProperty("planId").GetGuid() == draftPlanId);
                Assert.DoesNotContain(items, candidate =>
                    candidate.GetProperty("planId").GetGuid() == organizationalPlanId);
                Assert.DoesNotContain(items, candidate =>
                    candidate.GetProperty("planId").GetGuid() == suspendedPlanId);
            }

            var selectResponse = await applicant.PostAsJsonAsync(
                $"/api/v1/credit-applications/{applicationId:D}/loan-plan",
                new { planId = publicPlanId, version = "public-v7" });
            Assert.Equal(HttpStatusCode.OK, selectResponse.StatusCode);

            using (var document = JsonDocument.Parse(await selectResponse.Content.ReadAsStringAsync()))
            {
                Assert.Equal("Selected", document.RootElement.GetProperty("outcome").GetString());
                Assert.Equal(
                    nameof(CreditApplicationStatus.PropertyContractPending),
                    document.RootElement.GetProperty("applicationStatus").GetString());
                Assert.Equal(publicPlanId, document.RootElement.GetProperty("planId").GetGuid());
                Assert.Equal("public-v7", document.RootElement.GetProperty("planVersion").GetString());
            }

            var invalidStateResponse = await applicant.GetAsync(
                $"/api/v1/credit-applications/{applicationId:D}/loan-plans");
            Assert.Equal(HttpStatusCode.Conflict, invalidStateResponse.StatusCode);

            await using var verificationScope = _factory.Services.CreateAsyncScope();
            var verification = verificationScope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
            var application = await verification.CreditApplications
                .AsNoTracking()
                .SingleAsync(x => x.Id == applicationId);

            Assert.Equal(CreditApplicationStatus.PropertyContractPending, application.Status);
            Assert.Equal(publicPlanId, application.BankLoanPlanId);
            Assert.Equal("public-v7", application.BankLoanPlanVersion);
        }
        finally
        {
            await using var cleanupScope = _factory.Services.CreateAsyncScope();
            var db = cleanupScope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();

            await db.WorkflowTransitions
                .Where(x => x.AggregateType == "CreditApplication" && x.AggregateId == applicationId)
                .ExecuteDeleteAsync();
            await db.AuditEvents
                .Where(x => x.AggregateType == "CreditApplication" && x.AggregateId == applicationId)
                .ExecuteDeleteAsync();

            var outboxRows = await db.OutboxMessages
                .Where(x => x.Type == "credit-application.bank-loan-plan-selected.v1")
                .ToListAsync();
            db.OutboxMessages.RemoveRange(outboxRows.Where(x =>
                x.PayloadJson.Contains(applicationId.ToString(), StringComparison.OrdinalIgnoreCase)));

            await db.CreditApplications
                .Where(x => x.Id == applicationId)
                .ExecuteDeleteAsync();
            await db.BankLoanPlanVersions
                .Where(x => planRowIds.Contains(x.Id))
                .ExecuteDeleteAsync();
            await db.Users
                .Where(x => x.Id == applicantId || x.Id == outsiderId)
                .ExecuteDeleteAsync();
            await db.SaveChangesAsync();
        }
    }
}
