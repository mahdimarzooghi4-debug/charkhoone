using System.Net;
using System.Text.Json;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
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
        var unrelatedTenantId = Guid.NewGuid();
        var applicationId = Guid.NewGuid();
        var contractId = Guid.NewGuid();
        var unrelatedContractId = Guid.NewGuid();
        var obligationId = Guid.NewGuid();
        var paymentId = Guid.NewGuid();
        var unrelatedObligationId = Guid.NewGuid();
        var unrelatedPaymentId = Guid.NewGuid();
        var tenantSubject = $"mobile-tenant-{tenantId:D}";
        const decimal amountRial = 1234567890123456.78m;

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
                    Id = unrelatedTenantId,
                    OidcSubject = $"mobile-unrelated-{unrelatedTenantId:D}",
                    CreatedAtUtc = now.AddDays(-3),
                });

            db.CreditApplications.Add(new CreditApplicationRow
            {
                Id = applicationId,
                ApplicantUserId = tenantId,
                Status = CreditApplicationStatus.ApprovedFunded,
                CreatedAtUtc = now.AddDays(-2),
                UpdatedAtUtc = now.AddHours(-3),
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
                    CreatedAtUtc = now.AddDays(-1),
                    UpdatedAtUtc = now.AddHours(-2),
                },
                new LeaseContractRow
                {
                    Id = unrelatedContractId,
                    TenantUserId = unrelatedTenantId,
                    OwnerUserId = ownerId,
                    PropertyId = Guid.NewGuid(),
                    Status = LeaseContractStatus.Active,
                    CreatedAtUtc = now.AddDays(-1),
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

            var contracts = root.GetProperty("contracts");
            var contract = Assert.Single(
                contracts.EnumerateArray(),
                item => item.GetProperty("contractId").GetGuid() == contractId);
            Assert.Equal("Tenant", contract.GetProperty("role").GetString());
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
            await db.LeaseContracts
                .Where(x => x.Id == contractId || x.Id == unrelatedContractId)
                .ExecuteDeleteAsync();
            await db.CreditApplications
                .Where(x => x.Id == applicationId)
                .ExecuteDeleteAsync();
            await db.Users
                .Where(x => x.Id == tenantId || x.Id == ownerId || x.Id == unrelatedTenantId)
                .ExecuteDeleteAsync();
        }
    }
}
