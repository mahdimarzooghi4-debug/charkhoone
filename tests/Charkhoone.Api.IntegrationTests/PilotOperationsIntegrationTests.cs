using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Charkhoone.Application.IdentityVerification;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Payments;
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

        var casesResponse = await client.GetAsync("/api/v1/pilot/cases");
        var paymentsResponse = await client.GetAsync("/api/v1/pilot/payments");

        Assert.Equal(HttpStatusCode.Forbidden, casesResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, paymentsResponse.StatusCode);
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

    [Fact]
    public async Task AllowlistedOperator_PaginatesRealPostgresQueue_ForAdminWeb()
    {
        var now = DateTimeOffset.Parse("2199-09-18T23:45:00+00:00");
        var operatorSubject = $"pilot-web-operator-{Guid.NewGuid():D}";
        var newestApplicantId = Guid.NewGuid();
        var olderApplicantId = Guid.NewGuid();
        var newestApplicationId = Guid.NewGuid();
        var olderApplicationId = Guid.NewGuid();

        await using (var seedScope = _factory.Services.CreateAsyncScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
            db.Users.AddRange(
                new UserRow
                {
                    Id = newestApplicantId,
                    OidcSubject = $"pilot-web-applicant-{newestApplicantId:D}",
                    CreatedAtUtc = now.AddDays(-2),
                },
                new UserRow
                {
                    Id = olderApplicantId,
                    OidcSubject = $"pilot-web-applicant-{olderApplicantId:D}",
                    CreatedAtUtc = now.AddDays(-2),
                });
            db.CreditApplications.AddRange(
                new CreditApplicationRow
                {
                    Id = newestApplicationId,
                    ApplicantUserId = newestApplicantId,
                    Status = CreditApplicationStatus.IdentityPending,
                    CreatedAtUtc = now.AddDays(-1),
                    UpdatedAtUtc = now,
                },
                new CreditApplicationRow
                {
                    Id = olderApplicationId,
                    ApplicantUserId = olderApplicantId,
                    Status = CreditApplicationStatus.IdentityPending,
                    CreatedAtUtc = now.AddDays(-1),
                    UpdatedAtUtc = now.AddMinutes(-1),
                });
            await db.SaveChangesAsync();
        }

        try
        {
            using var pilotFactory = _factory.WithWebHostBuilder(builder =>
            {
                builder.UseSetting("PilotOperations:Enabled", "true");
                builder.UseSetting("PilotOperations:AllowedSubjects:0", operatorSubject);
            });

            using var client = pilotFactory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Test-Subject", operatorSubject);

            var firstPage = await client.GetAsync(
                "/api/v1/pilot/cases?status=IdentityPending&page=1&pageSize=1");
            Assert.Equal(HttpStatusCode.OK, firstPage.StatusCode);

            using (var firstDocument = JsonDocument.Parse(
                await firstPage.Content.ReadAsStringAsync()))
            {
                Assert.Equal(1, firstDocument.RootElement.GetProperty("page").GetInt32());
                Assert.Equal(1, firstDocument.RootElement.GetProperty("pageSize").GetInt32());
                var items = firstDocument.RootElement.GetProperty("items");
                Assert.Equal(1, items.GetArrayLength());
                Assert.Equal(
                    newestApplicationId,
                    items[0].GetProperty("creditApplicationId").GetGuid());
                Assert.Equal(
                    newestApplicantId,
                    items[0].GetProperty("applicantUserId").GetGuid());
                Assert.Equal(
                    nameof(CreditApplicationStatus.IdentityPending),
                    items[0].GetProperty("applicationStatus").GetString());
                Assert.Equal(
                    "Identity",
                    items[0].GetProperty("suggestedOperation").GetString());
            }

            var secondPage = await client.GetAsync(
                "/api/v1/pilot/cases?status=IdentityPending&page=2&pageSize=1");
            Assert.Equal(HttpStatusCode.OK, secondPage.StatusCode);

            using (var secondDocument = JsonDocument.Parse(
                await secondPage.Content.ReadAsStringAsync()))
            {
                Assert.Equal(2, secondDocument.RootElement.GetProperty("page").GetInt32());
                var items = secondDocument.RootElement.GetProperty("items");
                Assert.Equal(1, items.GetArrayLength());
                Assert.Equal(
                    olderApplicationId,
                    items[0].GetProperty("creditApplicationId").GetGuid());
            }

            var missing = await client.GetAsync(
                $"/api/v1/pilot/cases/{Guid.NewGuid():D}");
            Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
        }
        finally
        {
            await using var cleanupScope = _factory.Services.CreateAsyncScope();
            var db = cleanupScope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
            await db.CreditApplications
                .Where(x => x.Id == newestApplicationId || x.Id == olderApplicationId)
                .ExecuteDeleteAsync();
            await db.Users
                .Where(x => x.Id == newestApplicantId || x.Id == olderApplicantId)
                .ExecuteDeleteAsync();
        }
    }

    [Fact]
    public async Task AllowlistedOperator_DetailSerializesFinancialDecimalsAsExactStrings()
    {
        var now = DateTimeOffset.Parse("2199-09-19T00:00:00+00:00");
        var operatorSubject = $"pilot-decimal-operator-{Guid.NewGuid():D}";
        var applicantId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var assessmentId = Guid.NewGuid();
        const decimal fullDepositEquivalentRial = 1234567890123456.78m;
        const decimal loanRatio = 0.12345678m;
        const decimal maximumEligibleLoanRial = 987654321098765.43m;

        await using (var seedScope = _factory.Services.CreateAsyncScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
            db.Users.Add(new UserRow
            {
                Id = applicantId,
                OidcSubject = $"pilot-decimal-applicant-{applicantId:D}",
                CreatedAtUtc = now.AddDays(-1),
            });
            db.CreditApplications.Add(new CreditApplicationRow
            {
                Id = applicationId,
                ApplicantUserId = applicantId,
                Status = CreditApplicationStatus.ExternalChecksPending,
                CreatedAtUtc = now.AddHours(-1),
                UpdatedAtUtc = now,
            });
            db.CreditEligibilityAssessments.Add(new CreditEligibilityAssessmentRow
            {
                Id = assessmentId,
                CreditApplicationId = applicationId,
                Provider = "pilot-credit-provider",
                Status = "Indeterminate",
                ExternalSubGrade = null,
                FullDepositEquivalentRial = fullDepositEquivalentRial,
                LoanRatio = loanRatio,
                MaximumEligibleLoanRial = maximumEligibleLoanRial,
                IdempotencyKey = $"pilot-decimal-{applicationId:D}",
                ExternalReference = "pilot-credit-reference",
                ReasonCode = "provider_timeout",
                AttemptCount = 1,
                CreatedAtUtc = now.AddMinutes(-5),
                UpdatedAtUtc = now,
            });
            await db.SaveChangesAsync();
        }

        try
        {
            using var pilotFactory = _factory.WithWebHostBuilder(builder =>
            {
                builder.UseSetting("PilotOperations:Enabled", "true");
                builder.UseSetting("PilotOperations:AllowedSubjects:0", operatorSubject);
            });

            using var client = pilotFactory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Test-Subject", operatorSubject);

            var response = await client.GetAsync(
                $"/api/v1/pilot/cases/{applicationId:D}");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            using var document = JsonDocument.Parse(
                await response.Content.ReadAsStringAsync());
            var credit = document.RootElement.GetProperty("creditEligibility");

            var deposit = credit.GetProperty("fullDepositEquivalentRial");
            var ratio = credit.GetProperty("loanRatio");
            var maximum = credit.GetProperty("maximumEligibleLoanRial");

            Assert.Equal(JsonValueKind.String, deposit.ValueKind);
            Assert.Equal(JsonValueKind.String, ratio.ValueKind);
            Assert.Equal(JsonValueKind.String, maximum.ValueKind);
            Assert.Equal("1234567890123456.78", deposit.GetString());
            Assert.Equal("0.12345678", ratio.GetString());
            Assert.Equal("987654321098765.43", maximum.GetString());
        }
        finally
        {
            await using var cleanupScope = _factory.Services.CreateAsyncScope();
            var db = cleanupScope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
            await db.CreditEligibilityAssessments
                .Where(x => x.Id == assessmentId)
                .ExecuteDeleteAsync();
            await db.CreditApplications
                .Where(x => x.Id == applicationId)
                .ExecuteDeleteAsync();
            await db.Users
                .Where(x => x.Id == applicantId)
                .ExecuteDeleteAsync();
        }
    }

    [Fact]
    public async Task AllowlistedOperator_ReadsRealPostgresPaymentQueue_WithExactAmountAndEvidence()
    {
        var now = DateTimeOffset.Parse("2199-09-19T01:00:00+00:00");
        var operatorSubject = $"pilot-payment-operator-{Guid.NewGuid():D}";
        var tenantUserId = Guid.NewGuid();
        var ownerUserId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var contractId = Guid.NewGuid();
        var obligationId = Guid.NewGuid();
        var paymentInstructionId = Guid.NewGuid();
        var externalTransactionId = Guid.NewGuid();
        const decimal amountRial = 1234567890123456.78m;

        await using (var seedScope = _factory.Services.CreateAsyncScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
            db.Users.AddRange(
                new UserRow
                {
                    Id = tenantUserId,
                    OidcSubject = $"pilot-payment-tenant-{tenantUserId:D}",
                    CreatedAtUtc = now.AddDays(-2),
                },
                new UserRow
                {
                    Id = ownerUserId,
                    OidcSubject = $"pilot-payment-owner-{ownerUserId:D}",
                    CreatedAtUtc = now.AddDays(-2),
                });
            db.CreditApplications.Add(new CreditApplicationRow
            {
                Id = applicationId,
                ApplicantUserId = tenantUserId,
                Status = CreditApplicationStatus.ApprovedFunded,
                CreatedAtUtc = now.AddDays(-1),
                UpdatedAtUtc = now.AddHours(-4),
            });
            db.LeaseContracts.Add(new LeaseContractRow
            {
                Id = contractId,
                TenantUserId = tenantUserId,
                OwnerUserId = ownerUserId,
                PropertyId = Guid.NewGuid(),
                CreditApplicationId = applicationId,
                Status = LeaseContractStatus.Active,
                CreatedAtUtc = now.AddDays(-1),
                UpdatedAtUtc = now.AddHours(-3),
            });
            db.MonthlyObligations.Add(new MonthlyObligationRow
            {
                Id = obligationId,
                ContractId = contractId,
                ContractMonthNumber = 4,
                DueAtUtc = now.AddDays(2),
                Status = MonthlyObligationStatus.Open,
                CreatedAtUtc = now.AddHours(-2),
                UpdatedAtUtc = now.AddMinutes(-20),
            });
            db.PaymentInstructions.Add(new PaymentInstructionRow
            {
                Id = paymentInstructionId,
                ObligationId = obligationId,
                DueAtUtc = now.AddDays(2),
                BeneficiaryId = "pilot-owner-beneficiary",
                AmountRial = amountRial,
                IdempotencyKey = $"pilot-payment-{paymentInstructionId:D}",
                Status = PaymentInstructionStatus.ReconciliationRequired,
                CreatedAtUtc = now.AddHours(-1),
                UpdatedAtUtc = now.AddMinutes(-10),
            });
            db.MonthlyObligationComponents.Add(new MonthlyObligationComponentRow
            {
                PaymentInstructionId = paymentInstructionId,
                MonthlyObligationId = obligationId,
                Kind = MonthlyObligationComponentKind.OwnerPayment,
            });
            db.ExternalTransactions.Add(new ExternalTransactionRow
            {
                Id = externalTransactionId,
                Provider = "pilot-payment-provider",
                OperationType = "payment_reconciliation",
                AggregateType = "PaymentInstruction",
                AggregateId = paymentInstructionId,
                Status = ExternalTransactionStatus.Unknown,
                AmountRial = amountRial,
                Currency = "IRR",
                IdempotencyKey = $"pilot-payment-external-{paymentInstructionId:D}",
                ExternalReference = "pilot-payment-reference",
                ReasonCode = "provider_timeout",
                CreatedAtUtc = now.AddMinutes(-12),
                UpdatedAtUtc = now.AddMinutes(-5),
            });
            await db.SaveChangesAsync();
        }

        try
        {
            using var pilotFactory = _factory.WithWebHostBuilder(builder =>
            {
                builder.UseSetting("PilotOperations:Enabled", "true");
                builder.UseSetting("PilotOperations:AllowedSubjects:0", operatorSubject);
            });

            using var client = pilotFactory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Test-Subject", operatorSubject);

            var response = await client.GetAsync(
                "/api/v1/pilot/payments?status=ReconciliationRequired&page=1&pageSize=25");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            using var document = JsonDocument.Parse(
                await response.Content.ReadAsStringAsync());
            var items = document.RootElement.GetProperty("items");
            var item = Assert.Single(
                items.EnumerateArray(),
                x => x.GetProperty("paymentInstructionId").GetGuid() == paymentInstructionId);

            Assert.Equal(obligationId, item.GetProperty("monthlyObligationId").GetGuid());
            Assert.Equal(contractId, item.GetProperty("contractId").GetGuid());
            Assert.Equal(applicationId, item.GetProperty("creditApplicationId").GetGuid());
            Assert.Equal(4, item.GetProperty("contractMonthNumber").GetInt32());
            Assert.Equal("OwnerPayment", item.GetProperty("kind").GetString());
            Assert.Equal("ReconciliationRequired", item.GetProperty("paymentStatus").GetString());

            var amount = item.GetProperty("amountRial");
            Assert.Equal(JsonValueKind.String, amount.ValueKind);
            Assert.Equal("1234567890123456.78", amount.GetString());

            Assert.Equal(externalTransactionId, item.GetProperty("externalTransactionId").GetGuid());
            Assert.Equal("Unknown", item.GetProperty("externalTransactionStatus").GetString());
            Assert.Equal("pilot-payment-provider", item.GetProperty("provider").GetString());
            Assert.Equal("pilot-payment-reference", item.GetProperty("externalReference").GetString());
            Assert.Equal("provider_timeout", item.GetProperty("reasonCode").GetString());

            var invalidStatus = await client.GetAsync(
                "/api/v1/pilot/payments?status=DefinitelyNotAStatus");
            Assert.Equal(HttpStatusCode.BadRequest, invalidStatus.StatusCode);
        }
        finally
        {
            await using var cleanupScope = _factory.Services.CreateAsyncScope();
            var db = cleanupScope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
            await db.ExternalTransactions
                .Where(x => x.Id == externalTransactionId)
                .ExecuteDeleteAsync();
            await db.MonthlyObligationComponents
                .Where(x => x.PaymentInstructionId == paymentInstructionId)
                .ExecuteDeleteAsync();
            await db.PaymentInstructions
                .Where(x => x.Id == paymentInstructionId)
                .ExecuteDeleteAsync();
            await db.MonthlyObligations
                .Where(x => x.Id == obligationId)
                .ExecuteDeleteAsync();
            await db.LeaseContracts
                .Where(x => x.Id == contractId)
                .ExecuteDeleteAsync();
            await db.CreditApplications
                .Where(x => x.Id == applicationId)
                .ExecuteDeleteAsync();
            await db.Users
                .Where(x => x.Id == tenantUserId || x.Id == ownerUserId)
                .ExecuteDeleteAsync();
        }
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
