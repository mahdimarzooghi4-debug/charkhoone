using Charkhoone.Application.Payments;

namespace Charkhoone.Infrastructure.Payments;

public sealed class UnavailableNormalSettlementNotificationAdapter : IExternalNormalSettlementNotificationAdapter
{
    public string Provider => "unavailable-normal-settlement-notification";

    public Task<NormalSettlementNotificationDeliveryResponse> DeliverAsync(
        NormalSettlementNotificationDeliveryRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        return Task.FromResult(new NormalSettlementNotificationDeliveryResponse(
            NormalSettlementNotificationDeliveryStatus.Indeterminate,
            Provider,
            ReasonCode: "normal_settlement_notification_adapter_not_configured"));
    }
}

public sealed class DevelopmentNormalSettlementNotificationAdapter : IExternalNormalSettlementNotificationAdapter
{
    public string Provider => "development-normal-settlement-notification";

    public Task<NormalSettlementNotificationDeliveryResponse> DeliverAsync(
        NormalSettlementNotificationDeliveryRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        return Task.FromResult(new NormalSettlementNotificationDeliveryResponse(
            NormalSettlementNotificationDeliveryStatus.Delivered,
            Provider,
            $"development-normal-settlement-notification:{request.MessageId:D}"));
    }
}
