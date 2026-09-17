using Charkhoone.Application.Payments;
using Microsoft.Extensions.Configuration;

namespace Charkhoone.Infrastructure.Payments;

public sealed class UnavailableOwnerResidualTransferAdapter : IExternalOwnerResidualTransferAdapter
{
    public string Provider => "unavailable";

    public Task<ExternalOwnerResidualTransferResponse> EnsureOrQueryAsync(
        ExternalOwnerResidualTransferRequest request,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(new ExternalOwnerResidualTransferResponse(
            ExternalOwnerResidualTransferStatus.Indeterminate,
            Provider,
            ReasonCode: "owner_residual_transfer_adapter_unconfigured"));
}

public sealed class DevelopmentOwnerResidualTransferAdapter(IConfiguration configuration)
    : IExternalOwnerResidualTransferAdapter
{
    public string Provider => "development-mock";

    public Task<ExternalOwnerResidualTransferResponse> EnsureOrQueryAsync(
        ExternalOwnerResidualTransferRequest request,
        CancellationToken cancellationToken = default)
    {
        var configured = configuration["ExternalAdapters:CancellationSettlement:DevelopmentMock:Result"];

        if (string.Equals(configured, "Confirmed", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(new ExternalOwnerResidualTransferResponse(
                ExternalOwnerResidualTransferStatus.Confirmed,
                Provider,
                request.ExpectedAmountRial,
                $"dev-owner-residual-{request.SettlementId:D}"));
        }

        if (string.Equals(configured, "Failed", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(new ExternalOwnerResidualTransferResponse(
                ExternalOwnerResidualTransferStatus.Failed,
                Provider,
                ReasonCode: "development_mock_failure"));
        }

        return Task.FromResult(new ExternalOwnerResidualTransferResponse(
            ExternalOwnerResidualTransferStatus.Indeterminate,
            Provider,
            ReasonCode: "development_mock_indeterminate"));
    }
}
