using Charkhoone.Application.Payments;
using Microsoft.Extensions.Configuration;

namespace Charkhoone.Infrastructure.Payments;

public sealed class UnavailablePaymentReconciliationAdapter : IExternalPaymentReconciliationAdapter
{
    public string Provider => "unavailable";

    public Task<ExternalPaymentReconciliationResponse> QueryAsync(
        ExternalPaymentReconciliationRequest request,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(new ExternalPaymentReconciliationResponse(
            ExternalPaymentReconciliationStatus.Indeterminate,
            Provider,
            ReasonCode: "payment_reconciliation_adapter_unconfigured"));
}

public sealed class DevelopmentPaymentReconciliationAdapter(IConfiguration configuration)
    : IExternalPaymentReconciliationAdapter
{
    public string Provider => "development-mock";

    public Task<ExternalPaymentReconciliationResponse> QueryAsync(
        ExternalPaymentReconciliationRequest request,
        CancellationToken cancellationToken = default)
    {
        var configured = configuration["ExternalAdapters:Payment:DevelopmentMock:Result"];

        if (string.Equals(configured, "Succeeded", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(new ExternalPaymentReconciliationResponse(
                ExternalPaymentReconciliationStatus.Succeeded,
                Provider,
                request.ExpectedAmountRial,
                $"dev-payment-{request.PaymentInstructionId:D}"));
        }

        if (string.Equals(configured, "Failed", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(new ExternalPaymentReconciliationResponse(
                ExternalPaymentReconciliationStatus.Failed,
                Provider,
                ReasonCode: "development_mock_failure"));
        }

        return Task.FromResult(new ExternalPaymentReconciliationResponse(
            ExternalPaymentReconciliationStatus.Indeterminate,
            Provider,
            ReasonCode: "development_mock_indeterminate"));
    }
}
