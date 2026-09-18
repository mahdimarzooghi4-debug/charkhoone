# Normal settlement notification delivery v1

Normal maturity now produces durable stakeholder notification requests only after both financial legs are complete and the lease contract transitions to `Settled`.

## Settlement completion evidence

Before finalizing normal settlement, the service requires the historical confirmed fund-principal freeze to match the settlement `FundReference`. This supplies the persisted fund provider/reference instead of inventing a recipient identity.

The final settlement transaction writes:

- audit `contract_settled_after_normal_maturity`
- audit `normal_settlement_financially_completed`
- existing terminal event `lease-contract.settled.v1`
- owner notification request `lease-contract.normal-settlement-owner-notification-requested.v1`
- tenant notification request `lease-contract.normal-settlement-tenant-notification-requested.v1`
- bank notification request `lease-contract.normal-settlement-bank-notification-requested.v1`
- fund notification request `lease-contract.normal-settlement-fund-notification-requested.v1`
- terminal evidence `lease-contract.normal-settlement-financially-completed.v1`

The terminal evidence binds owner, tenant, bank, fund, transfer transaction ids and journal ids in the same transaction that marks the contract `Settled`.

## Delivery worker

`NormalSettlementNotificationConsumer` binds a durable queue to the four notification-request event types.

Each message uses the original outbox GUID as RabbitMQ `MessageId`, which is also the provider delivery idempotency identity.

Before provider delivery, the consumer verifies persisted state:

- contract is `Settled`
- referenced normal settlement is completed
- bank-principal and tenant-residual legs are completed
- owner/tenant identities match the contract
- bank id matches the settlement and its bank external transaction is `Succeeded`
- fund provider/reference matches the confirmed historical fund-principal freeze and settlement fund reference

Invalid or inconsistent messages are quarantined through:

`lease-contract.normal-settlement-notification-review-required.v1`

## Retry and audit semantics

The existing inbox table deduplicates by message id.

- delivered requires adapter status `Delivered` plus a non-empty external reference
- indeterminate delivery is retried up to `RabbitMq:MaxDeliveryAttempts`
- exhausted indeterminate delivery is routed to review
- definitive external failure is routed directly to review without blind retry
- replay of a processed message acknowledges without another provider call

Audit actions:

- `normal_settlement_notification_delivered`
- `normal_settlement_notification_indeterminate`
- `normal_settlement_notification_failed`

## Provider boundary

`IExternalNormalSettlementNotificationAdapter` is the external delivery boundary.

Production-like configuration defaults to `UnavailableNormalSettlementNotificationAdapter`. Development mock delivery is permitted only when development mocks are allowed. Release compose explicitly keeps this adapter in `Unavailable` mode.

This phase therefore proves durable orchestration, identity/state validation, retries, quarantine and audit evidence. It does not claim that any real SMS, email, bank or fund provider was contacted.
