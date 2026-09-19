using System.Net;
using System.Text.Json;
using Charkhoone.Application.BankFunding;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Finance;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class MobileBootstrapIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;

    public Task InitializeAsync() => _factory.MigrateAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task AuthenticatedMobileBootstrap_ReadsOnlyOwnedPostgresData_WithExactRialText()
    {
        var now = DateTimeOffset.Parse("2199-09-19T03:00:00+00:00");
        var tenantId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var otherOwnerId = Guid.NewGuid();
        var unrelatedTenantId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var unrelatedApplicationId = Guid.NewGuid();
        var planId = Guid.NewGuid();
        var unrelatedPlanId = Guid.NewGuid();
        var planRowId = Guid.NewGuid();
        var unrelatedPlanRowId = Guid.NewGuid();
        var contractId = Guid.NewGuid();
        var unrelatedContractId = Guid.NewGuid();
        var otherOwnerContractId = Guid.NewGuid();
        var obligationId = Guid.NewGuid();
        var paymentId = Guid.NewGuid();
        var unrelatedObligationId = Guid.NewGuid();
        var unrelatedPaymentId = Guid.NewGuid();
        var tenantSubject = $"mobile-tenant-{tenantId:D}";
        const decimal amountRial = 1234567890123456.78m;

        const decimal fullDepositEquivalentRial = 2234567890123456m;
        const decimal maximumEligibleLoanRial = 1234567890123456m;
        const decimal bankApprovedLoanRial = 1234567890123456m;
        const decimal tenantContributionRial = 1000000000000000m;

        await using (var seedScope = _factory.Services.CreateAsyncScope())
        {
            var db = seedScope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
            db.Users.AddRange(
                new UserRow
                {
                    Id = tenantId,
                    OidcSubject = tenantSubject,
                    CreatedAtUtc = now.AddDays(-3),
                },
                new UserRow
                {
                    Id = ownerId,
                    OidcSubject = $"mobile-owner-{ownerId:D}",
                    CreatedAtUtc = now.AddDays(-3),
                },
                new UserRow
                {
                    Id = otherOwnerId,
                    OidcSubject = $"mobile-other-owner-{otherOwnerId:D}",
                    CreatedAtUtc = now.AddDays(-3),
                },
                new UserRow
                {
                    Id = unrelatedTenantId,
                    OidcSubject = $"mobile-unrelated-{unrelatedTenantId:D}",
                    CreatedAtUtc = now.AddDays(-3),
                });

            db.BankLoanPlanVersions.AddRange(
                new BankLoanPlanVersionRow
                {
                    Id = planRowId,
                    PlanId = planId,
                    Version = "public-mobile-v1",
                    BankId = "mobile-bank",
                    Title = "Mobile authoritative plan",
                    InterestTerms = "persisted mobile terms",
                    Scope = BankLoanPlanScope.Public,
                    Status = BankLoanPlanStatus.Published,
                    TermMonths = BankLoanPlanVersion.RequiredTermMonths,
                    CreatedAtUtc = now.AddDays(-4),
                },
                new BankLoanPlanVersionRow
                {
                    Id = unrelatedPlanRowId,
                    PlanId = unrelatedPlanId,
                    Version = "unrelated-v1",
                    BankId = "unrelated-bank",
                    Title = "Unrelated financing plan",
                    InterestTerms = "must not leak",
                    Scope = BankLoanPlanScope.Public,
                    Status = BankLoanPlanStatus.Published,
                    TermMonths = BankLoanPlanVersion.RequiredTermMonths,
                    CreatedAtUtc = now.AddDays(-4),
                });

            db.CreditApplications.AddRange(
                new CreditApplicationRow
                {
                    Id = applicationId,
                    ApplicantUserId = tenantId,
                    Status = CreditApplicationStatus.ApprovedFunded,
                    BankLoanPlanId = planId,
                    BankLoanPlanVersion = "public-mobile-v1",
                    CreatedAtUtc = now.AddDays(-2),
                    UpdatedAtUtc = now.AddHours(-3),
                },
                new CreditApplicationRow
                {
                    Id = unrelatedApplicationId,
                    ApplicantUserId = unrelatedTenantId,
                    Status = CreditApplicationStatus.ApprovedFunded,
                    BankLoanPlanId = unrelatedPlanId,
                    BankLoanPlanVersion = "unrelated-v1",
                    CreatedAtUtc = now.AddDays(-2),
                    UpdatedAtUtc = now.AddHours(-1),
                });

            db.LeaseContracts.AddRange(
                new LeaseContractRow
                {
                    Id = contractId,
                    TenantUserId = tenantId,
                    OwnerUserId = ownerId,
                    PropertyId = Guid.NewGuid(),
                    CreditApplicationId = applicationId,
                    Status = LeaseContractStatus.Active,
                    BankLoanPlanId = planId,
                    BankLoanPlanVersion = "public-mobile-v1",
                    CreatedAtUtc = now.AddDays(-1),
                    UpdatedAtUtc = now.AddHours(-2),
                },
                new LeaseContractRow
                {
                    Id = unrelatedContractId,
                    TenantUserId = unrelatedTenantId,
                    OwnerUserId = ownerId,
                    PropertyId = Guid.NewGuid(),
                    CreditApplicationId = unrelatedApplicationId,
                    Status = LeaseContractStatus.Active,
                    BankLoanPlanId = unrelatedPlanId,
                    BankLoanPlanVersion = "unrelated-v1",
                    CreatedAtUtc = now.AddDays(-1),
                    UpdatedAtUtc = now.AddHours(-1),
                },
                new LeaseContractRow
                {
                    Id = otherOwnerContractId,
                    TenantUserId = unrelatedTenantId,
                    OwnerUserId = otherOwnerId,
                    PropertyId = Guid.NewGuid(),
                    CreditApplicationId = null,
                    Status = LeaseContractStatus.Draft,
                    CreatedAtUtc = now.AddDays(-1),
                    UpdatedAtUtc = now.AddHours(-1),
                });

            // Terms are an immutable, trusted Persian-calendar snapshot of
            // the funded lease. Its amount must match the funded allocation.
            db.LeaseContractTerms.Add(new LeaseContractTermsRow
            {
                ContractId = contractId,
                Calendar = "Persian",
                PersianStartYear = 1405,
                PersianStartMonth = 7,
                PersianStartDay = 15,
                TermMonths = 12,
                CashDepositRial = 2234564556790156m,
                MonthlyRentRial = 99999999m,
                FullDepositEquivalentRial = fullDepositEquivalentRial,
                OwnerBeneficiaryId = "owned-owner-beneficiary",
                BankBeneficiaryId = "owned-bank-beneficiary",
                SourceReference = "trusted-mobile-contract-source",
                CapturedAtUtc = now.AddHours(-2),
            });

            db.BankApprovals.AddRange(
                new BankApprovalRow
                {
                    Id = Guid.NewGuid(),
                    CreditApplicationId = applicationId,
                    Provider = "tenant-bank-provider",
                    Status = nameof(BankApprovalDecisionStatus.Approved),
                    MaximumEligibleLoanRial = maximumEligibleLoanRial,
                    ApprovedLoanRial = bankApprovedLoanRial,
                    IdempotencyKey = $"mobile-bank-approval:{applicationId:D}",
                    ExternalReference = "tenant-bank-reference",
                    ReasonCode = "approved_for_mobile_bootstrap",
                    AttemptCount = 1,
                    CreatedAtUtc = now.AddHours(-4),
                    UpdatedAtUtc = now.AddHours(-3),
                },
                new BankApprovalRow
                {
                    Id = Guid.NewGuid(),
                    CreditApplicationId = unrelatedApplicationId,
                    Provider = "unrelated-bank-provider",
                    Status = nameof(BankApprovalDecisionStatus.Approved),
                    MaximumEligibleLoanRial = 3_000_000_000m,
                    ApprovedLoanRial = 2_500_000_000m,
                    IdempotencyKey = $"mobile-bank-approval:{unrelatedApplicationId:D}",
                    ExternalReference = "unrelated-bank-reference",
                    ReasonCode = "must_not_leak",
                    AttemptCount = 1,
                    CreatedAtUtc = now.AddHours(-4),
                    UpdatedAtUtc = now.AddHours(-1),
                });

            db.FundingAllocations.AddRange(
                new FundingAllocationRow
                {
                    Id = Guid.NewGuid(),
                    CreditApplicationId = applicationId,
                    ContractId = contractId,
                    BankLoanPlanId = planId,
                    BankLoanPlanVersion = "public-mobile-v1",
                    BankId = "mobile-bank",
                    FullDepositEquivalentRial = fullDepositEquivalentRial,
                    MaximumEligibleLoanRial = maximumEligibleLoanRial,
                    BankApprovedLoanRial = bankApprovedLoanRial,
                    TenantContributionRial = tenantContributionRial,
                    CreatedAtUtc = now.AddHours(-3),
                    UpdatedAtUtc = now.AddHours(-3),
                },
                new FundingAllocationRow
                {
                    Id = Guid.NewGuid(),
                    CreditApplicationId = unrelatedApplicationId,
                    ContractId = unrelatedContractId,
                    BankLoanPlanId = unrelatedPlanId,
                    BankLoanPlanVersion = "unrelated-v1",
                    BankId = "unrelated-bank",
                    FullDepositEquivalentRial = 5_000_000_000m,
                    MaximumEligibleLoanRial = 3_000_000_000m,
                    BankApprovedLoanRial = 2_500_000_000m,
                    TenantContributionRial = 2_500_000_000m,
                    CreatedAtUtc = now.AddHours(-2),
                    UpdatedAtUtc = now.AddHours(-1),
                });

            db.MonthlyObligations.AddRange(
                new MonthlyObligationRow
                {
                    Id = obligationId,
                    ContractId = contractId,
                    ContractMonthNumber = 2,
                    DueAtUtc = now.AddDays(4),
                    Status = MonthlyObligationStatus.Open,
                    CreatedAtUtc = now.AddHours(-2),
                    UpdatedAtUtc = now.AddMinutes(-20),
                },
                new MonthlyObligationRow
                {
                    Id = unrelatedObligationId,
                    ContractId = unrelatedContractId,
                    ContractMonthNumber = 1,
                    DueAtUtc = now.AddDays(1),
                    Status = MonthlyObligationStatus.Open,
                    CreatedAtUtc = now.AddHours(-2),
                    UpdatedAtUtc = now.AddMinutes(-15),
                });

            db.PaymentInstructions.AddRange(
                new PaymentInstructionRow
                {
                    Id = paymentId,
                    ObligationId = obligationId,
                    DueAtUtc = now.AddDays(4),
                    BeneficiaryId = "mobile-owner-beneficiary",
                    AmountRial = amountRial,
                    IdempotencyKey = $"mobile-bootstrap-{paymentId:D}",
                    Status = PaymentInstructionStatus.Pending,
                    CreatedAtUtc = now.AddHours(-1),
                    UpdatedAtUtc = now.AddMinutes(-10),
                },
                new PaymentInstructionRow
                {
                    Id = unrelatedPaymentId,
                    ObligationId = unrelatedObligationId,
                    DueAtUtc = now.AddDays(1),
                    BeneficiaryId = "unrelated-beneficiary",
                    AmountRial = 999999999m,
                    IdempotencyKey = $"mobile-bootstrap-{unrelatedPaymentId:D}",
                    Status = PaymentInstructionStatus.Pending,
                    CreatedAtUtc = now.AddHours(-1),
                    UpdatedAtUtc = now.AddMinutes(-5),
                });

            db.MonthlyObligationComponents.AddRange(
                new MonthlyObligationComponentRow
                {
                    PaymentInstructionId = paymentId,
                    MonthlyObligationId = obligationId,
                    Kind = MonthlyObligationComponentKind.OwnerPayment,
                },
                new MonthlyObligationComponentRow
                {
                    PaymentInstructionId = unrelatedPaymentId,
                    MonthlyObligationId = unrelatedObligationId,
                    Kind = MonthlyObligationComponentKind.OwnerPayment,
                });

            await db.SaveChangesAsync();
        }

        try
        {
            using var client = _factory.CreateAuthenticatedClient(tenantSubject);
            var response = await client.GetAsync("/api/v1/mobile/bootstrap");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            var root = document.RootElement;
            Assert.Equal(tenantId, root.GetProperty("userId").GetGuid());

            var application = root.GetProperty("latestCreditApplication");
            Assert.Equal(applicationId, application.GetProperty("creditApplicationId").GetGuid());
            Assert.Equal(nameof(CreditApplicationStatus.ApprovedFunded), application.GetProperty("status").GetString());

            var plan = application.GetProperty("selectedPlan");
            Assert.Equal(planId, plan.GetProperty("planId").GetGuid());
            Assert.Equal("public-mobile-v1", plan.GetProperty("version").GetString());
            Assert.Equal("mobile-bank", plan.GetProperty("bankId").GetString());
            Assert.Equal("Mobile authoritative plan", plan.GetProperty("title").GetString());
            Assert.Equal("persisted mobile terms", plan.GetProperty("interestTerms").GetString());
            Assert.Equal(BankLoanPlanVersion.RequiredTermMonths, plan.GetProperty("termMonths").GetInt32());

            var approval = application.GetProperty("bankApproval");
            Assert.Equal("tenant-bank-provider", approval.GetProperty("provider").GetString());
            Assert.Equal(nameof(BankApprovalDecisionStatus.Approved), approval.GetProperty("status").GetString());
            Assert.Equal(JsonValueKind.String, approval.GetProperty("maximumEligibleLoanRial").ValueKind);
            Assert.Equal("1234567890123456", approval.GetProperty("maximumEligibleLoanRial").GetString());
            Assert.Equal(JsonValueKind.String, approval.GetProperty("approvedLoanRial").ValueKind);
            Assert.Equal("1234567890123456", approval.GetProperty("approvedLoanRial").GetString());
            Assert.Equal("approved_for_mobile_bootstrap", approval.GetProperty("reasonCode").GetString());

            var allocation = application.GetProperty("fundingAllocation");
            Assert.Equal(contractId, allocation.GetProperty("contractId").GetGuid());
            Assert.Equal("mobile-bank", allocation.GetProperty("bankId").GetString());
            Assert.Equal("2234567890123456", allocation.GetProperty("fullDepositEquivalentRial").GetString());
            Assert.Equal("1234567890123456", allocation.GetProperty("maximumEligibleLoanRial").GetString());
            Assert.Equal("1234567890123456", allocation.GetProperty("bankApprovedLoanRial").GetString());
            Assert.Equal("1000000000000000", allocation.GetProperty("tenantContributionRial").GetString());
            Assert.DoesNotContain("unrelated", application.GetRawText(), StringComparison.OrdinalIgnoreCase);

            var contracts = root.GetProperty("contracts");
            var contract = Assert.Single(
                contracts.EnumerateArray(),
                item => item.GetProperty("contractId").GetGuid() == contractId);
            Assert.Equal("Tenant", contract.GetProperty("role").GetString());
            Assert.Equal("99999999", contract.GetProperty("monthlyRentRial").GetString());
            var terms = contract.GetProperty("terms");
            Assert.Equal("Persian", terms.GetProperty("calendar").GetString());
            Assert.Equal(1405, terms.GetProperty("persianStartYear").GetInt32());
            Assert.Equal(7, terms.GetProperty("persianStartMonth").GetInt32());
            Assert.Equal(15, terms.GetProperty("persianStartDay").GetInt32());
            Assert.Equal(12, terms.GetProperty("termMonths").GetInt32());
            Assert.Equal(JsonValueKind.String, terms.GetProperty("cashDepositRial").ValueKind);
            Assert.Equal("2234564556790156", terms.GetProperty("cashDepositRial").GetString());
            Assert.Equal("2234567890123456", terms.GetProperty("fullDepositEquivalentRial").GetString());
            Assert.DoesNotContain("owned-owner-beneficiary", terms.GetRawText());
            Assert.DoesNotContain("trusted-mobile-contract-source", terms.GetRawText());
            Assert.DoesNotContain(
                contracts.EnumerateArray(),
                item => item.GetProperty("contractId").GetGuid() == unrelatedContractId);

            var payments = root.GetProperty("payments");
            var payment = Assert.Single(
                payments.EnumerateArray(),
                item => item.GetProperty("paymentInstructionId").GetGuid() == paymentId);
            Assert.Equal(contractId, payment.GetProperty("contractId").GetGuid());
            Assert.Equal(2, payment.GetProperty("contractMonthNumber").GetInt32());
            Assert.Equal("OwnerPayment", payment.GetProperty("kind").GetString());
            Assert.Equal(nameof(PaymentInstructionStatus.Pending), payment.GetProperty("status").GetString());

            var amount = payment.GetProperty("amountRial");
            Assert.Equal(JsonValueKind.String, amount.ValueKind);
            Assert.Equal("1234567890123456.78", amount.GetString());
            Assert.DoesNotContain(
                payments.EnumerateArray(),
                item => item.GetProperty("paymentInstructionId").GetGuid() == unrelatedPaymentId);

            // Real owner OIDC subject sees both of their contracts, including
            // one without a terms snapshot, but no other owner's contract,
            // no tenant payment instructions and no tenant application data.
            using var ownerClient = _factory.CreateAuthenticatedClient($"mobile-owner-{ownerId:D}");
            var ownerResponse = await ownerClient.GetAsync("/api/v1/mobile/bootstrap");
            Assert.Equal(HttpStatusCode.OK, ownerResponse.StatusCode);
            using var ownerDocument = JsonDocument.Parse(await ownerResponse.Content.ReadAsStringAsync());
            var ownerRoot = ownerDocument.RootElement;
            Assert.Equal(ownerId, ownerRoot.GetProperty("userId").GetGuid());
            Assert.Equal(JsonValueKind.Null, ownerRoot.GetProperty("latestCreditApplication").ValueKind);
            Assert.Empty(ownerRoot.GetProperty("payments").EnumerateArray());
            var ownerContracts = ownerRoot.GetProperty("contracts").EnumerateArray().ToArray();
            Assert.Equal(2, ownerContracts.Length);
            Assert.All(ownerContracts, item => Assert.Equal("Owner", item.GetProperty("role").GetString()));
            var fundedOwnerContract = Assert.Single(
                ownerContracts,
                item => item.GetProperty("contractId").GetGuid() == contractId);
            Assert.Equal("2234567890123456",
                fundedOwnerContract.GetProperty("terms").GetProperty("fullDepositEquivalentRial").GetString());
            Assert.Equal("99999999", fundedOwnerContract.GetProperty("monthlyRentRial").GetString());
            var withoutTerms = Assert.Single(
                ownerContracts,
                item => item.GetProperty("contractId").GetGuid() == unrelatedContractId);
            Assert.Equal(JsonValueKind.Null, withoutTerms.GetProperty("terms").ValueKind);
            Assert.Equal(JsonValueKind.Null, withoutTerms.GetProperty("monthlyRentRial").ValueKind);
            Assert.DoesNotContain(ownerContracts,
                item => item.GetProperty("contractId").GetGuid() == otherOwnerContractId);
            Assert.DoesNotContain("tenant-bank-provider", ownerRoot.GetRawText());

            using var otherOwner = _factory.CreateAuthenticatedClient($"mobile-other-owner-{otherOwnerId:D}");
            var otherOwnerResponse = await otherOwner.GetAsync("/api/v1/mobile/bootstrap");
            Assert.Equal(HttpStatusCode.OK, otherOwnerResponse.StatusCode);
            using var otherOwnerDocument = JsonDocument.Parse(await otherOwnerResponse.Content.ReadAsStringAsync());
            var otherOwnerRoot = otherOwnerDocument.RootElement;
            var onlyOtherOwnerContract = Assert.Single(otherOwnerRoot.GetProperty("contracts").EnumerateArray());
            Assert.Equal(otherOwnerContractId, onlyOtherOwnerContract.GetProperty("contractId").GetGuid());
            Assert.Equal("Owner", onlyOtherOwnerContract.GetProperty("role").GetString());
            Assert.Equal(JsonValueKind.Null, onlyOtherOwnerContract.GetProperty("terms").ValueKind);
            Assert.Empty(otherOwnerRoot.GetProperty("payments").EnumerateArray());

            using var unknown = _factory.CreateAuthenticatedClient($"mobile-unknown-{Guid.NewGuid():D}");
            var forbidden = await unknown.GetAsync("/api/v1/mobile/bootstrap");
            Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);
        }
        finally
        {
            await using var cleanupScope = _factory.Services.CreateAsyncScope();
            var db = cleanupScope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
            await db.MonthlyObligationComponents
                .Where(x => x.PaymentInstructionId == paymentId || x.PaymentInstructionId == unrelatedPaymentId)
                .ExecuteDeleteAsync();
            await db.PaymentInstructions
                .Where(x => x.Id == paymentId || x.Id == unrelatedPaymentId)
                .ExecuteDeleteAsync();
            await db.MonthlyObligations
                .Where(x => x.Id == obligationId || x.Id == unrelatedObligationId)
                .ExecuteDeleteAsync();
            await db.FundingAllocations
                .Where(x => x.CreditApplicationId == applicationId || x.CreditApplicationId == unrelatedApplicationId)
                .ExecuteDeleteAsync();
            await db.BankApprovals
                .Where(x => x.CreditApplicationId == applicationId || x.CreditApplicationId == unrelatedApplicationId)
                .ExecuteDeleteAsync();
            await db.LeaseContractTerms
                .Where(x => x.ContractId == contractId)
                .ExecuteDeleteAsync();
            await db.LeaseContracts
                .Where(x => x.Id == contractId || x.Id == unrelatedContractId || x.Id == otherOwnerContractId)
                .ExecuteDeleteAsync();
            await db.CreditApplications
                .Where(x => x.Id == applicationId || x.Id == unrelatedApplicationId)
                .ExecuteDeleteAsync();
            await db.BankLoanPlanVersions
                .Where(x => x.Id == planRowId || x.Id == unrelatedPlanRowId)
                .ExecuteDeleteAsync();
            await db.Users
                .Where(x => x.Id == tenantId || x.Id == ownerId || x.Id == otherOwnerId || x.Id == unrelatedTenantId)
                .ExecuteDeleteAsync();
        }
    }
}
