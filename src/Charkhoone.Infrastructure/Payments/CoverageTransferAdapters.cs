using Charkhoone.Application.Payments;
using Microsoft.Extensions.Configuration;

namespace Charkhoone.Infrastructure.Payments;

public sealed class UnavailableCoverageTransferAdapter : IExternalCoverageTransferAdapter
{
    public string Provider => "unavailable";

    public Task<ExternalCoverageTransferResponse> EnsureOrQueryAsync(
        ExternalCoverageTransferRequest request,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(new ExternalCoverageTransferResponse(
            ExternalCoverageTransferStatus.Indeterminate,
            Provider,
            ReasonCode: "coverage_transfer_adapter_unconfigured"));
}

public sealed class DevelopmentCoverageTransferAdapter(IConfiguration configuration)
    : IExternalCoverageTransferAdapter
{
    public string Provider => "development-mock";

    public Task<ExternalCoverageTransferResponse> EnsureOrQueryAsync(
        ExternalCoverageTransferRequest request,
        CancellationToken cancellationToken = default)
    {
        var configured = configuration["ExternalAdapters:Coverage:DevelopmentMock:Result"];

        if (string.Equals(configured, "Confirmed", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(new ExternalCoverageTransferResponse(
                ExternalCoverageTransferStatus.Confirmed,
                Provider,
                request.ExpectedAmountRial,
                $"dev-coverage-{request.CoveragePaymentId:D}"));
        }

        if (string.Equals(configured, "Failed", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(new ExternalCoverageTransferResponse(
                ExternalCoverageTransferStatus.Failed,
                Provider,
                ReasonCode: "development_mock_failure"));
        }

        return Task.FromResult(new ExternalCoverageTransferResponse(
            ExternalCoverageTransferStatus.Indeterminate,
            Provider,
            ReasonCode: "development_mock_indeterminate"));
    }
}
