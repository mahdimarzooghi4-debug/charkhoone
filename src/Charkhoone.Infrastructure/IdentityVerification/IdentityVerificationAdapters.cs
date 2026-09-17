using Charkhoone.Application.IdentityVerification;
using Microsoft.Extensions.Configuration;

namespace Charkhoone.Infrastructure.IdentityVerification;

public sealed class DevelopmentIdentityVerificationAdapter(IConfiguration configuration)
    : IIdentityVerificationAdapter
{
    public string Provider => "development-mock";

    public Task<IdentityVerificationResponse> VerifyAsync(
        IdentityVerificationRequest request,
        CancellationToken cancellationToken = default)
    {
        var configured = configuration["ExternalAdapters:Identity:DevelopmentOutcome"];
        var outcome = Enum.TryParse<IdentityVerificationOutcome>(configured, ignoreCase: true, out var parsed)
            ? parsed
            : IdentityVerificationOutcome.Indeterminate;

        return Task.FromResult(new IdentityVerificationResponse(
            outcome,
            Provider,
            $"dev:{request.VerificationRequestId:D}",
            "development_mock_response"));
    }
}

public sealed class UnavailableIdentityVerificationAdapter : IIdentityVerificationAdapter
{
    public string Provider => "unconfigured";

    public Task<IdentityVerificationResponse> VerifyAsync(
        IdentityVerificationRequest request,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(new IdentityVerificationResponse(
            IdentityVerificationOutcome.Indeterminate,
            Provider,
            ReasonCode: "identity_provider_unconfigured"));
}
