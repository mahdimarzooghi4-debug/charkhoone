using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Charkhoone.Application.IdentityVerification;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class PilotOperationsIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;

    public Task InitializeAsync() => _factory.MigrateAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task PilotEndpoints_FailClosed_WhenFeatureIsDisabled()
    {
        using var client = _factory.CreateAuthenticatedClient(
            $"pilot-disabled-subject-{Guid.NewGuid():D}");

        var response = await client.GetAsync("/api/v1/pilot/cases");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task AllowlistedOperator_ReadsRealCase_AndRetriesIdentity_WithAudit()
    {
        var now = DateTimeOffset.Parse("2026-09-18T23:30:00+00:00");
        var applicantId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var applicantSubject = $"pilot-applicant-{applicantId:D}";
        var operatorSubject = $"pilot-operator-{Guid.NewGuid():D}";

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
            db.Users.Add(new UserRow
            {
                Id = applicantId,
                OidcSubject = applicantSubject,
                CreatedAtUtc = now.AddDays(-1),
            });
            db.CreditApplications.Add(new CreditApplicationRow
            {
                Id = applicationId,
                ApplicantUserId = applicantId,
                Status = CreditApplicationStatus.IdentityPending,
                CreatedAtUtc = now.AddHours(-1),
                UpdatedAtUtc = now.AddMinutes(-20),
            });
            await db.SaveChangesAsync();
        }

        var identityAdapter = new RecordingIdentityAdapter();
        using var pilotFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("PilotOperations:Enabled", "true");
            builder.UseSetting("PilotOperations:AllowedSubjects:0", operatorSubject);
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IIdentityVerificationAdapter>();
                services.AddSingleton<IIdentityVerificationAdapter>(identityAdapter);
            });
        });

        using (var outsider = pilotFactory.CreateClient())
        {
            outsider.DefaultRequestHeaders.Add(
                "X-Test-Subject",
                $"pilot-outsider-{Guid.NewGuid():D}");

            var forbidden = await outsider.GetAsync("/api/v1/pilot/cases");
            Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);
        }

        using var client = pilotFactory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Subject", operatorSubject);

        var listResponse = await client.GetAsync(
            "/api/v1/pilot/cases?status=IdentityPending&page=1&pageSize=25");
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);

        using (var listDocument = JsonDocument.Parse(
            await listResponse.Content.ReadAsStringAsync()))
        {
            var items = listDocument.RootElement.GetProperty("items");
            Assert.Contains(
                items.EnumerateArray(),
                item => item.GetProperty("creditApplicationId").GetGuid() == applicationId);
        }

        var detailResponse = await client.GetAsync(
            $"/api/v1/pilot/cases/{applicationId:D}");
        Assert.Equal(HttpStatusCode.OK, detailResponse.StatusCode);

        using (var detailDocument = JsonDocument.Parse(
            await detailResponse.Content.ReadAsStringAsync()))
        {
            Assert.Equal(
                applicationId,
                detailDocument.RootElement.GetProperty("creditApplicationId").GetGuid());
            Assert.Equal(
                applicantId,
                detailDocument.RootElement.GetProperty("applicantUserId").GetGuid());
            Assert.Equal(
                0,
                detailDocument.RootElement.GetProperty("verificationRequests").GetArrayLength());
        }

        var reconcileResponse = await client.PostAsJsonAsync(
            $"/api/v1/pilot/cases/{applicationId:D}/reconcile",
            new
            {
                operation = "Identity",
                reason = "Pilot operator retry after external identity timeout.",
            });
        Assert.Equal(HttpStatusCode.OK, reconcileResponse.StatusCode);

        using (var reconcileDocument = JsonDocument.Parse(
            await reconcileResponse.Content.ReadAsStringAsync()))
        {
            Assert.Equal(
                "Applied",
                reconcileDocument.RootElement.GetProperty("operationOutcome").GetString());
            Assert.NotEqual(
                Guid.Empty,
                reconcileDocument.RootElement.GetProperty("auditEventId").GetGuid());
        }

        Assert.Equal(1, identityAdapter.CallCount);
        Assert.Equal(applicationId, identityAdapter.LastApplicationId);
        Assert.Equal(applicantId, identityAdapter.LastApplicantUserId);

        await using (var verificationScope = _factory.Services.CreateAsyncScope())
        {
            var db = verificationScope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
            var application = await db.CreditApplications
                .AsNoTracking()
                .SingleAsync(x => x.Id == applicationId);
            var verification = await db.VerificationRequests
                .AsNoTracking()
                .SingleAsync(x => x.CreditApplicationId == applicationId);
            var operatorAudit = await db.AuditEvents
                .AsNoTracking()
                .SingleAsync(x =>
                    x.AggregateType == "CreditApplication"
                    && x.AggregateId == applicationId
                    && x.Action == "pilot_operator_reconcile_requested");

            Assert.Equal(CreditApplicationStatus.PlanSelectionPending, application.Status);
            Assert.Equal(nameof(IdentityVerificationOutcome.Verified), verification.Status);
            Assert.Equal("pilot-identity-provider", verification.Provider);
            Assert.Equal("pilot-identity-reference", verification.ExternalReference);
            Assert.Equal(1, verification.AttemptCount);

            Assert.Equal($"pilot:{operatorSubject}", operatorAudit.ActorId);
            Assert.Equal(
                "Identity: Pilot operator retry after external identity timeout.",
                operatorAudit.Reason);
        }

        var updatedDetail = await client.GetAsync(
            $"/api/v1/pilot/cases/{applicationId:D}");
        Assert.Equal(HttpStatusCode.OK, updatedDetail.StatusCode);

        using var updatedDocument = JsonDocument.Parse(
            await updatedDetail.Content.ReadAsStringAsync());
        var updatedVerifications = updatedDocument.RootElement.GetProperty("verificationRequests");
        Assert.Equal(1, updatedVerifications.GetArrayLength());
        Assert.Equal(
            "Verified",
            updatedVerifications[0].GetProperty("status").GetString());
        Assert.Equal(
            "pilot-identity-provider",
            updatedVerifications[0].GetProperty("provider").GetString());
    }

    private sealed class RecordingIdentityAdapter : IIdentityVerificationAdapter
    {
        public string Provider => "pilot-identity-provider";
        public int CallCount { get; private set; }
        public Guid? LastApplicationId { get; private set; }
        public Guid? LastApplicantUserId { get; private set; }

        public Task<IdentityVerificationResponse> VerifyAsync(
            IdentityVerificationRequest request,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            LastApplicationId = request.CreditApplicationId;
            LastApplicantUserId = request.ApplicantUserId;

            return Task.FromResult(new IdentityVerificationResponse(
                IdentityVerificationOutcome.Verified,
                Provider,
                "pilot-identity-reference"));
        }
    }
}
