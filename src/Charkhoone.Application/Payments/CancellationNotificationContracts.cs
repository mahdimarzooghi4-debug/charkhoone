namespace Charkhoone.Application.Payments;

public enum CancellationNotificationRecipientKind
{
    Tenant,
    Owner,
    Bank,
    Fund,
}

public enum CancellationNotificationDeliveryStatus
{
    Delivered,
    Indeterminate,
    Failed,
}

public sealed record CancellationNotificationDeliveryRequest(
    Guid MessageId,
    string EventType,
    Guid ContractId,
    CancellationNotificationRecipientKind RecipientKind,
    string RecipientReference,
    string PayloadJson);

public sealed record CancellationNotificationDeliveryResponse(
    CancellationNotificationDeliveryStatus Status,
    string Provider,
    string? ExternalReference = null,
    string? ReasonCode = null);

public interface IExternalCancellationNotificationAdapter
{
    string Provider { get; }

    Task<CancellationNotificationDeliveryResponse> DeliverAsync(
        CancellationNotificationDeliveryRequest request,
        CancellationToken cancellationToken = default);
}
