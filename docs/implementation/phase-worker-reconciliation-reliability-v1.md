# Worker reconciliation and reliability v1

This phase closes the background-processing gap for financial reconciliation and bounded message retry.

## Financial reconciliation polling

`FinancialReconciliationWorker` is opt-in through `FinancialReconciliation:Enabled` and performs query/reconciliation work only. It never treats an unknown external result as failure or success and does not invent external confirmations.

Each pass selects bounded candidates for:

- payment instructions that already have a pending/unknown `payment_reconciliation` external transaction;
- monthly obligations already closed as `Missed`, so tenant-contribution coverage can be ensured/reconciled idempotently;
- contracts already in `CancellationPending`, so the existing cancellation settlement service can ensure/reconcile the owner residual transfer;
- contracts already in `SettlementPending`, so the existing normal settlement service can ensure/reconcile its required legs.

Terminal failed coverage/settlement records are not automatically retried. Failed operations remain for controlled/manual resolution. The worker does not close monthly obligations, choose a cutoff time, transition an active contract into normal settlement, calculate the unresolved 3% lost-fund-return amount, or release frozen bank principal during early cancellation.

## Inbox retry exhaustion

The credit-application identity consumer now has `RabbitMq:MaxDeliveryAttempts`. Repeated indeterminate/processing failures are bounded. At exhaustion, the inbox record is marked processed and a non-sensitive `identity-verification.review-required.v1` outbox event is persisted in the same PostgreSQL save operation. The normal transactional outbox publishes that event to RabbitMQ, where `RabbitMq:IdentityReviewQueue` is bound for controlled review.

The review event contains only message id, source event type, reason code, and attempt count. It does not copy the original payload, identity document data, OTPs, tokens, bank data, or account numbers.

## Operational configuration

Defaults are conservative:

- financial reconciliation polling is disabled until explicitly enabled by deployment configuration;
- poll interval: 30 seconds;
- reconciliation batch size: 32;
- identity consumer maximum attempts: 5;
- review queue: `charkhoone.identity-verification.review`.

These are operational controls, not business-policy deadlines. No schema migration is required by this phase.
