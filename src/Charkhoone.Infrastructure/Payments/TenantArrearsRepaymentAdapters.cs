using Charkhoone.Application.Payments;
using Microsoft.Extensions.Configuration;

namespace Charkhoone.Infrastructure.Payments;

public sealed class UnavailableTenantArrearsRepaymentAdapter : IExternalTenantArrearsRepaymentAdapter
{
    public string Provider => "unavailable";

    public Task<ExternalTenantArrearsRepaymentResponse> EnsureOrQueryAsync(
        ExternalTenantArrearsRepaymentRequest request,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(new ExternalTenantArrearsRepaymentResponse(
            ExternalTenantArrearsRepaymentStatus.Indeterminate,
            Provider,
            ReasonCode: "tenant_arrears_repayment_adapter_unconfigured"));
}

public sealed class DevelopmentTenantArrearsRepaymentAdapter(IConfiguration configuration)
    : IExternalTenantArrearsRepaymentAdapter
{
    public string Provider => "development-mock";

    public Task<ExternalTenantArrearsRepaymentResponse> EnsureOrQueryAsync(
        ExternalTenantArrearsRepaymentRequest request,
        CancellationToken cancellationToken = default)
    {
        var configured = configuration["ExternalAdapters:ArrearsRepayment:DevelopmentMock:Result"];

        if (string.Equals(configured, "Confirmed", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(new ExternalTenantArrearsRepaymentResponse(
                ExternalTenantArrearsRepaymentStatus.Confirmed,
                Provider,
                request.QuotedTotalRial,
                $"dev-arrears-repayment-{request.ExternalTransactionId:D}",
                request.QuoteAtUtc));
        }

        if (string.Equals(configured, "Failed", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(new ExternalTenantArrearsRepaymentResponse(
                ExternalTenantArrearsRepaymentStatus.Failed,
                Provider,
                ReasonCode: "development_mock_failure"));
        }

        return Task.FromResult(new ExternalTenantArrearsRepaymentResponse(
            ExternalTenantArrearsRepaymentStatus.Indeterminate,
            Provider,
            ReasonCode: "development_mock_indeterminate"));
    }
}
