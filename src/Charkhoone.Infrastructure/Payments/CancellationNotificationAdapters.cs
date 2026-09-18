using Charkhoone.Application.Payments;

namespace Charkhoone.Infrastructure.Payments;

public sealed class UnavailableCancellationNotificationAdapter : IExternalCancellationNotificationAdapter
{
    public string Provider => "unavailable-cancellation-notification";

    public Task<CancellationNotificationDeliveryResponse> DeliverAsync(
        CancellationNotificationDeliveryRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        return Task.FromResult(new CancellationNotificationDeliveryResponse(
            CancellationNotificationDeliveryStatus.Indeterminate,
            Provider,
            ReasonCode: "cancellation_notification_adapter_not_configured"));
    }
}

public sealed class DevelopmentCancellationNotificationAdapter : IExternalCancellationNotificationAdapter
{
    public string Provider => "development-cancellation-notification";

    public Task<CancellationNotificationDeliveryResponse> DeliverAsync(
        CancellationNotificationDeliveryRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        return Task.FromResult(new CancellationNotificationDeliveryResponse(
            CancellationNotificationDeliveryStatus.Delivered,
            Provider,
            $"development-notification:{request.MessageId:D}"));
    }
}
