using Charkhoone.Application.Payments;
using Microsoft.Extensions.Configuration;

namespace Charkhoone.Infrastructure.Payments;

public sealed class UnavailableBankPrincipalReturnAdapter : IExternalBankPrincipalReturnAdapter
{
    public string Provider => "unavailable";

    public Task<ExternalBankPrincipalReturnResponse> EnsureOrQueryAsync(
        ExternalBankPrincipalReturnRequest request,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(new ExternalBankPrincipalReturnResponse(
            ExternalNormalSettlementTransferStatus.Indeterminate,
            Provider,
            ReasonCode: "bank_principal_return_adapter_unconfigured"));
}

public sealed class DevelopmentBankPrincipalReturnAdapter(IConfiguration configuration)
    : IExternalBankPrincipalReturnAdapter
{
    public string Provider => "development-mock";

    public Task<ExternalBankPrincipalReturnResponse> EnsureOrQueryAsync(
        ExternalBankPrincipalReturnRequest request,
        CancellationToken cancellationToken = default)
    {
        var configured = configuration["ExternalAdapters:NormalSettlementBank:DevelopmentMock:Result"];

        if (string.Equals(configured, "Confirmed", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(new ExternalBankPrincipalReturnResponse(
                ExternalNormalSettlementTransferStatus.Confirmed,
                Provider,
                request.ExpectedAmountRial,
                $"dev-bank-principal-return-{request.SettlementId:D}"));
        }

        if (string.Equals(configured, "Failed", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(new ExternalBankPrincipalReturnResponse(
                ExternalNormalSettlementTransferStatus.Failed,
                Provider,
                ReasonCode: "development_mock_failure"));
        }

        return Task.FromResult(new ExternalBankPrincipalReturnResponse(
            ExternalNormalSettlementTransferStatus.Indeterminate,
            Provider,
            ReasonCode: "development_mock_indeterminate"));
    }
}

public sealed class UnavailableTenantResidualReturnAdapter : IExternalTenantResidualReturnAdapter
{
    public string Provider => "unavailable";

    public Task<ExternalTenantResidualReturnResponse> EnsureOrQueryAsync(
        ExternalTenantResidualReturnRequest request,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(new ExternalTenantResidualReturnResponse(
            ExternalNormalSettlementTransferStatus.Indeterminate,
            Provider,
            ReasonCode: "tenant_residual_return_adapter_unconfigured"));
}

public sealed class DevelopmentTenantResidualReturnAdapter(IConfiguration configuration)
    : IExternalTenantResidualReturnAdapter
{
    public string Provider => "development-mock";

    public Task<ExternalTenantResidualReturnResponse> EnsureOrQueryAsync(
        ExternalTenantResidualReturnRequest request,
        CancellationToken cancellationToken = default)
    {
        var configured = configuration["ExternalAdapters:NormalSettlementTenant:DevelopmentMock:Result"];

        if (string.Equals(configured, "Confirmed", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(new ExternalTenantResidualReturnResponse(
                ExternalNormalSettlementTransferStatus.Confirmed,
                Provider,
                request.ExpectedAmountRial,
                $"dev-tenant-residual-return-{request.SettlementId:D}"));
        }

        if (string.Equals(configured, "Failed", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(new ExternalTenantResidualReturnResponse(
                ExternalNormalSettlementTransferStatus.Failed,
                Provider,
                ReasonCode: "development_mock_failure"));
        }

        return Task.FromResult(new ExternalTenantResidualReturnResponse(
            ExternalNormalSettlementTransferStatus.Indeterminate,
            Provider,
            ReasonCode: "development_mock_indeterminate"));
    }
}
