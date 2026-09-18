namespace Charkhoone.Application.Payments;

public enum NormalSettlementNotificationRecipientKind
{
    Tenant,
    Owner,
    Bank,
    Fund,
}

public enum NormalSettlementNotificationDeliveryStatus
{
    Delivered,
    Indeterminate,
    Failed,
}

public sealed record NormalSettlementNotificationDeliveryRequest(
    Guid MessageId,
    string EventType,
    Guid ContractId,
    NormalSettlementNotificationRecipientKind RecipientKind,
    string RecipientReference,
    string PayloadJson);

public sealed record NormalSettlementNotificationDeliveryResponse(
    NormalSettlementNotificationDeliveryStatus Status,
    string Provider,
    string? ExternalReference = null,
    string? ReasonCode = null);

public interface IExternalNormalSettlementNotificationAdapter
{
    string Provider { get; }

    Task<NormalSettlementNotificationDeliveryResponse> DeliverAsync(
        NormalSettlementNotificationDeliveryRequest request,
        CancellationToken cancellationToken = default);
}
