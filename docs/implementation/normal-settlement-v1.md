# Normal contract settlement v1

This slice implements the technical settlement path for a contract that has already entered `SettlementPending` after normal maturity.

## Implemented

- Returns the exact persisted frozen bank principal to the bank through an independent external adapter with a stable idempotency key.
- Returns the residual tenant contribution to the tenant through a separate independent external adapter.
- Requires exact confirmed rial amount plus an external reference before either leg is accepted as successful.
- Treats indeterminate external results as query/reconciliation work, not failure or success.
- Does not automatically retry a definitive external failure.
- Keeps the original `FrozenPrincipal` row immutable as historical evidence; normal return is represented by the settlement/external-transaction records.
- Recognizes the already-frozen principal in dedicated ledger accounts when the normal bank-return leg is confirmed, using the persisted freeze amount/time, then posts the return as a balanced reversing journal.
- Posts the tenant residual as a balanced journal against the existing tenant-contribution ledger.
- A zero tenant residual is represented as `NotRequired` and does not create a zero-value external transaction or journal entry.
- Finalizes `SettlementPending -> Settled` only after both required transfer legs are complete.
- Blocks settlement while monthly obligations remain open/missed or coverage transfers are unresolved.
- Returns the residual tenant contribution to the tenant after all open lost-fund-return exposures are resolved. Historical finalized lost-fund-return rows do not block normal maturity.

## Explicitly not implemented

- Any early-cancellation release or settlement of frozen bank principal.
- Production behavior for bank/fund transfer providers. Both normal-settlement adapters default to unavailable; development mock success requires explicit configuration.
- A public HTTP endpoint. This slice establishes the application/infrastructure settlement service and persistence first.

## Maturity entry

`Active -> SettlementPending` is now prepared by the idempotent normal-maturity lifecycle and reconciliation-worker orchestration documented in `docs/implementation/normal-maturity-lifecycle-v1.md`. The settlement service itself still requires `SettlementPending` and does not infer maturity.

## Stakeholder completion evidence

Normal maturity finalization now requires the confirmed historical fund-freeze identity and emits owner, tenant, bank and fund notification requests plus `lease-contract.normal-settlement-financially-completed.v1` in the same transaction that moves the contract to `Settled`. Delivery semantics are documented in `docs/implementation/normal-settlement-notification-delivery-v1.md`.

The generated EF Core migration for this slice is version-controlled after model tests/build pass. It is not evidence that the migration has been applied to a live staging or production PostgreSQL database.
