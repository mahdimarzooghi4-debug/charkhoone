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
- Blocks normal residual release when a `LostFundReturn` exposure exists. The 3% day-count, rounding, replenishment allocation, calculation, and collection policy is still undefined, so this slice does not guess a receivable or release tenant funds around that unresolved obligation.

## Explicitly not implemented

- Determining the business date/event that moves an active contract into `SettlementPending`; this service requires that lifecycle state to already be established.
- Any early-cancellation release or settlement of frozen bank principal.
- Lost-fund-return day-count, daily accrual, rounding, partial replenishment/payment allocation, receivable posting, or collection.
- Production behavior for bank/fund transfer providers. Both normal-settlement adapters default to unavailable; development mock success requires explicit configuration.
- A public HTTP endpoint. This slice establishes the application/infrastructure settlement service and persistence first.

The generated EF Core migration for this slice is version-controlled after model tests/build pass. It is not evidence that the migration has been applied to a live staging or production PostgreSQL database.
