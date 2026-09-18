# Cancellation notification delivery v1

Cancellation financial workflows emit durable notification-request outbox events. This phase adds the worker-side delivery boundary for those requests without claiming any real provider integration.

## Supported requests

The cancellation notification consumer binds one durable queue to:

- `lease-contract.cancelled-owner-notification-requested.v1`
- `lease-contract.cancelled-tenant-notification-requested.v1`
- `lease-contract.cancelled-bank-notification-requested.v1`
- `lease-contract.cancelled-fund-notification-requested.v1`

Each RabbitMQ message must have the outbox message GUID as `MessageId`. That GUID is also passed to the external adapter as the delivery idempotency identity.

## Validation before delivery

The consumer does not trust routing payloads in isolation.

Before calling the adapter it checks persisted cancellation state:

- contract exists and is `Cancelled`
- referenced cancellation settlement exists and is `Completed`
- owner or tenant user id matches the contract
- bank id matches frozen principal and the cancellation bank-principal return is already `Succeeded`
- fund provider/reference matches the confirmed historical fund-principal freeze

Invalid or state-mismatched messages are acknowledged only after they are quarantined through a review-required outbox event.

## Inbox and retries

The existing `inbox_messages` table deduplicates by RabbitMQ `MessageId`.

- already processed messages acknowledge without calling the provider again
- indeterminate provider results remain unprocessed and are retried
- after `RabbitMq:MaxDeliveryAttempts`, the inbox row is marked processed and a review-required event is emitted
- definitive provider failure is not blindly retried; it is immediately routed to review
- unexpected processing exceptions retry to the same bounded attempt policy

Review event:

`lease-contract.cancellation-notification-review-required.v1`

The review payload contains source message id/type, known contract/recipient identity, reason, and attempt count.

## Audit evidence

For a known contract the consumer records:

- `cancellation_notification_delivered`
- `cancellation_notification_indeterminate`
- `cancellation_notification_failed`

A delivered result is accepted only when the adapter reports `Delivered` with a non-empty external reference.

## Provider boundary

`IExternalCancellationNotificationAdapter` is the provider boundary.

The default adapter is `UnavailableCancellationNotificationAdapter`, which returns an indeterminate result. `DevelopmentCancellationNotificationAdapter` is available only when development mocks are allowed. The normal external-adapter safety check rejects `DevelopmentMock` outside Development.

The release compose configuration explicitly keeps this adapter in `Unavailable` mode. Therefore this implementation provides durable orchestration, validation, retries, quarantine and audit evidence, but it does not claim that SMS, email, bank or fund notifications are delivered in staging or production.

A real provider integration must supply recipient resolution and a provider-side idempotent delivery implementation before the release configuration can change from fail-closed behavior.
