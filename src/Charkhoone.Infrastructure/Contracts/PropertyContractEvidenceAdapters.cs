using Charkhoone.Application.Contracts;
using Microsoft.Extensions.Configuration;

namespace Charkhoone.Infrastructure.Contracts;

public sealed class UnavailablePropertyContractEvidenceAdapter
    : IExternalPropertyContractEvidenceAdapter
{
    public string Provider => "unavailable";

    public Task<ExternalPropertyContractEvidenceResponse> CheckAsync(
        ExternalPropertyContractEvidenceRequest request,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(new ExternalPropertyContractEvidenceResponse(
            ExternalPropertyContractEvidenceStatus.Indeterminate,
            Provider,
            ReasonCode: "property_contract_evidence_adapter_unconfigured"));
}

public sealed class DevelopmentPropertyContractEvidenceAdapter(IConfiguration configuration)
    : IExternalPropertyContractEvidenceAdapter
{
    public string Provider => "development-mock";

    public Task<ExternalPropertyContractEvidenceResponse> CheckAsync(
        ExternalPropertyContractEvidenceRequest request,
        CancellationToken cancellationToken = default)
    {
        var outcome = configuration["ExternalAdapters:PropertyContract:DevelopmentOutcome"];

        if (string.Equals(outcome, "NeedsDocuments", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(new ExternalPropertyContractEvidenceResponse(
                ExternalPropertyContractEvidenceStatus.NeedsDocuments,
                Provider,
                ReasonCode: "development_mock_documents_required"));
        }

        // Confirmed development evidence is intentionally unsupported. A confirmed
        // contract requires authoritative owner/property/beneficiary/schedule evidence.
        return Task.FromResult(new ExternalPropertyContractEvidenceResponse(
            ExternalPropertyContractEvidenceStatus.Indeterminate,
            Provider,
            ReasonCode: "development_mock_indeterminate"));
    }
}
