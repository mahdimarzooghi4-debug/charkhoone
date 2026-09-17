# Delinquency chronology hardening v1

This phase removes order-dependent delinquency mutation from monthly-obligation closure.

## Chronological closure invariant

An open contractual month can close only when every existing earlier month for the same contract is already closed and no later existing month has already been closed. This keeps the persisted closed-month sequence chronological without inventing a scheduling cutoff or requiring months that do not yet exist in persistence.

If the invariant is not satisfied, `CloseAsync` returns `InvalidState` without mutating the obligation or delinquency record. Payment reconciliation can still confirm an individual external payment; however, it does not auto-close that month until the chronological invariant is satisfied.

## Consecutive-miss derivation

The persisted current streak is recomputed from closed contractual-month status, newest to oldest, rather than blindly incrementing or resetting a counter:

- `Missed` counts as a tenant miss.
- `Covered` also counts as a tenant miss because Charkhoone coverage does not rewrite tenant delinquency.
- `Paid` breaks the current consecutive chain.
- older debt statuses are not changed when a later current month is paid.
- `Open` is not a valid input to the closed-month calculation.

Three consecutive tenant-miss months still latch cancellation and transition the active contract to `CancellationPending`. Once cancellation is latched, this phase does not introduce any behavior that clears it.

## Explicit non-goals

This phase does not define a payment cutoff time, partial-payment allocation, a contract duration beyond the existing model, the 3% lost-fund-return calculation, or early-cancellation frozen-principal release. No schema change or migration is required.

PostgreSQL integration coverage verifies out-of-order closure rejection, `Covered` counting as a tenant miss, three-month cancellation, and current-month full payment resetting only the current streak while preserving older debt statuses.
