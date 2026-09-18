using Charkhoone.Application.BankFunding;
using Charkhoone.Application.IdentityVerification;
using Charkhoone.Application.Payments;
using Charkhoone.Infrastructure.BankFunding;
using Charkhoone.Infrastructure.IdentityVerification;
using Charkhoone.Infrastructure.Payments;
using Charkhoone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Charkhoone.Worker;

public sealed class WorkerPostgresReadinessHealthCheck(IServiceScopeFactory scopeFactory) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
            return await dbContext.Database.CanConnectAsync(cancellationToken)
                ? HealthCheckResult.Healthy("PostgreSQL is reachable.")
                : HealthCheckResult.Unhealthy("PostgreSQL is not reachable.");
        }
        catch
        {
            return HealthCheckResult.Unhealthy("PostgreSQL readiness check failed.");
        }
    }
}

public sealed class WorkerRabbitMqReadinessHealthCheck(RabbitMqWorkerOptions options) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        if (!options.Enabled)
        {
            return HealthCheckResult.Healthy("RabbitMQ is disabled for this Worker deployment.");
        }

        try
        {
            var factory = options.CreateConnectionFactory();
            await using var connection = await factory.CreateConnectionAsync(cancellationToken);
            return connection.IsOpen
                ? HealthCheckResult.Healthy("RabbitMQ is reachable.")
                : HealthCheckResult.Unhealthy("RabbitMQ connection is not open.");
        }
        catch
        {
            return HealthCheckResult.Unhealthy("RabbitMQ readiness check failed.");
        }
    }
}

public sealed class WorkerExternalAdaptersReadinessHealthCheck(
    RabbitMqWorkerOptions rabbitMqOptions,
    FinancialReconciliationWorkerOptions financialReconciliationOptions,
    IIdentityVerificationAdapter identityAdapter,
    IExternalCancellationNotificationAdapter cancellationNotificationAdapter,
    IExternalNormalSettlementNotificationAdapter normalSettlementNotificationAdapter,
    IExternalBankApprovalAdapter bankApprovalAdapter,
    IExternalFundAdapter fundAdapter,
    IExternalPaymentReconciliationAdapter paymentAdapter,
    IExternalCoverageTransferAdapter coverageAdapter,
    IExternalTenantArrearsRepaymentAdapter arrearsRepaymentAdapter,
    IExternalOwnerResidualTransferAdapter cancellationSettlementAdapter,
    IExternalBankPrincipalReturnAdapter normalSettlementBankAdapter,
    IExternalTenantResidualReturnAdapter normalSettlementTenantAdapter) : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var unavailable = new List<string>();

        if (rabbitMqOptions.Enabled)
        {
            AddUnavailable(
                unavailable,
                "Identity",
                identityAdapter is UnavailableIdentityVerificationAdapter);
            AddUnavailable(
                unavailable,
                "CancellationNotification",
                cancellationNotificationAdapter is UnavailableCancellationNotificationAdapter);
            AddUnavailable(
                unavailable,
                "NormalSettlementNotification",
                normalSettlementNotificationAdapter is UnavailableNormalSettlementNotificationAdapter);
        }

        if (financialReconciliationOptions.Enabled)
        {
            AddUnavailable(
                unavailable,
                "BankApproval",
                bankApprovalAdapter is UnavailableBankApprovalAdapter);
            AddUnavailable(
                unavailable,
                "Fund",
                fundAdapter is UnavailableFundAdapter);
            AddUnavailable(
                unavailable,
                "Payment",
                paymentAdapter is UnavailablePaymentReconciliationAdapter);
            AddUnavailable(
                unavailable,
                "Coverage",
                coverageAdapter is UnavailableCoverageTransferAdapter);
            AddUnavailable(
                unavailable,
                "ArrearsRepayment",
                arrearsRepaymentAdapter is UnavailableTenantArrearsRepaymentAdapter);
            AddUnavailable(
                unavailable,
                "CancellationSettlement",
                cancellationSettlementAdapter is UnavailableOwnerResidualTransferAdapter);
            AddUnavailable(
                unavailable,
                "NormalSettlementBank",
                normalSettlementBankAdapter is UnavailableBankPrincipalReturnAdapter);
            AddUnavailable(
                unavailable,
                "NormalSettlementTenant",
                normalSettlementTenantAdapter is UnavailableTenantResidualReturnAdapter);
        }

        if (unavailable.Count == 0)
        {
            return Task.FromResult(
                HealthCheckResult.Healthy("All external adapters required by enabled Worker features are available."));
        }

        return Task.FromResult(
            HealthCheckResult.Unhealthy(
                $"Unavailable external adapters required by enabled Worker features: {string.Join(", ", unavailable)}."));
    }

    private static void AddUnavailable(
        ICollection<string> unavailable,
        string adapterName,
        bool isUnavailable)
    {
        if (isUnavailable)
        {
            unavailable.Add(adapterName);
        }
    }
}
