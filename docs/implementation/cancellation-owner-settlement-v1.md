# Cancellation owner settlement v1

This phase implements the early-cancellation residual transfer required after three consecutive missed contractual months.

## Implemented

- Cancellation settlement starts only for a contract already in `CancellationPending` with `CancellationRequired = true`.
- Settlement is blocked while any contractual month is still `Missed` or any coverage transfer remains `Pending`/`Unknown`; Charkhoone coverage must be resolved first.
- The transferable residual is calculated only from the tenant contribution ledger: initial contribution + confirmed replenishments - confirmed coverage.
- Frozen bank principal is intentionally absent from the calculation, persistence relationship graph, external transfer request, and journal posting.
- A single `CancellationSettlement` is allowed per contract.
- The external owner transfer uses one stable idempotency key per contract and an independent adapter. The production default is unavailable; the development mock is enabled only by configuration.
- `Indeterminate` or confirmation mismatch stays unknown and does not post the journal or finish cancellation.
- A definitive failed transfer is terminal in this slice and is not automatically retried.
- A confirmed transfer must match the exact expected rial amount and contain an external reference.
- Before ledger posting, the tenant-contribution balance is rechecked under the contribution lock. A changed balance or missing ledger accounts requires manual reconciliation rather than guessing.
- Confirmed transfer posts a balanced journal entry: debit tenant-contribution balance / credit fund-held tenant-contribution asset.
- After a successful residual settlement, the contract moves `CancellationPending -> Cancelled`, with workflow transition, audit event, cancellation outbox event, and a separate owner-notification-requested event.
- If the residual is exactly zero, cancellation completes without manufacturing an external zero-value transfer or journal entry; the zero amount is still persisted on the settlement.

## Intentionally not implemented

- No release, debit, or settlement of frozen bank principal. Early-cancellation bank-principal timing remains external-policy dependent.
- No lost-fund-return accrual implementation. The 3% monthly basis exists as a business rule, but day-count, rounding, and partial-payment allocation remain undefined.
- No automatic retry after a definitive external failure.
- No public API route is introduced in this slice; the application service is ready for a later authenticated orchestration layer.

## Migration

The EF Core migration for `cancellation_settlements` must be generated from the verified model and committed before this phase is considered complete.
