extern alias worker;

using Charkhoone.Infrastructure.BankFunding;
using Charkhoone.Infrastructure.IdentityVerification;
using Charkhoone.Infrastructure.Payments;
using Charkhoone.Infrastructure.Persistence;
using CharkhooneWorker = worker::Charkhoone.Worker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class WorkerDependencyReadinessIntegrationTests(CharkhooneApiFactory factory)
    : IClassFixture<CharkhooneApiFactory>, IAsyncLifetime
{
    private readonly CharkhooneApiFactory _factory = factory;

    public Task InitializeAsync() => _factory.MigrateAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task PostgresReadiness_UsesRealPostgreSql_AndReportsHealthy()
    {
        var services = new ServiceCollection();
        services.AddDbContext<CharkhooneDbContext>(options =>
            options.UseNpgsql(_factory.ConnectionString));

        await using var provider = services.BuildServiceProvider();
        var check = new CharkhooneWorker.WorkerPostgresReadinessHealthCheck(
            provider.GetRequiredService<IServiceScopeFactory>());

        var result = await check.CheckHealthAsync(new HealthCheckContext());

        Assert.Equal(HealthStatus.Healthy, result.Status);
    }

    [Fact]
    public async Task RabbitMqReadiness_IsHealthyWhenDependencyIsExplicitlyDisabled()
    {
        var check = new CharkhooneWorker.WorkerRabbitMqReadinessHealthCheck(
            new CharkhooneWorker.RabbitMqWorkerOptions
            {
                Enabled = false,
            });

        var result = await check.CheckHealthAsync(new HealthCheckContext());

        Assert.Equal(HealthStatus.Healthy, result.Status);
        Assert.Contains("disabled", result.Description, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ExternalAdapterReadiness_FailsClosedForUnavailableAdaptersRequiredByEnabledWorkerFeatures()
    {
        var check = CreateAdapterReadiness(
            rabbitMqEnabled: true,
            financialReconciliationEnabled: true);

        var result = await check.CheckHealthAsync(new HealthCheckContext());

        Assert.Equal(HealthStatus.Unhealthy, result.Status);
        Assert.Contains("Identity", result.Description, StringComparison.Ordinal);
        Assert.Contains("CancellationNotification", result.Description, StringComparison.Ordinal);
        Assert.Contains("NormalSettlementNotification", result.Description, StringComparison.Ordinal);
        Assert.Contains("BankApproval", result.Description, StringComparison.Ordinal);
        Assert.Contains("Fund", result.Description, StringComparison.Ordinal);
        Assert.Contains("Payment", result.Description, StringComparison.Ordinal);
        Assert.Contains("Coverage", result.Description, StringComparison.Ordinal);
        Assert.Contains("ArrearsRepayment", result.Description, StringComparison.Ordinal);
        Assert.Contains("CancellationSettlement", result.Description, StringComparison.Ordinal);
        Assert.Contains("NormalSettlementBank", result.Description, StringComparison.Ordinal);
        Assert.Contains("NormalSettlementTenant", result.Description, StringComparison.Ordinal);
    }

    [Fact]
    public async Task ExternalAdapterReadiness_DoesNotRequireAdaptersForDisabledWorkerFeatures()
    {
        var check = CreateAdapterReadiness(
            rabbitMqEnabled: false,
            financialReconciliationEnabled: false);

        var result = await check.CheckHealthAsync(new HealthCheckContext());

        Assert.Equal(HealthStatus.Healthy, result.Status);
    }

    private static CharkhooneWorker.WorkerExternalAdaptersReadinessHealthCheck CreateAdapterReadiness(
        bool rabbitMqEnabled,
        bool financialReconciliationEnabled) =>
        new(
            new CharkhooneWorker.RabbitMqWorkerOptions
            {
                Enabled = rabbitMqEnabled,
            },
            new CharkhooneWorker.FinancialReconciliationWorkerOptions
            {
                Enabled = financialReconciliationEnabled,
            },
            new UnavailableIdentityVerificationAdapter(),
            new UnavailableCancellationNotificationAdapter(),
            new UnavailableNormalSettlementNotificationAdapter(),
            new UnavailableBankApprovalAdapter(),
            new UnavailableFundAdapter(),
            new UnavailablePaymentReconciliationAdapter(),
            new UnavailableCoverageTransferAdapter(),
            new UnavailableTenantArrearsRepaymentAdapter(),
            new UnavailableOwnerResidualTransferAdapter(),
            new UnavailableBankPrincipalReturnAdapter(),
            new UnavailableTenantResidualReturnAdapter());
}
