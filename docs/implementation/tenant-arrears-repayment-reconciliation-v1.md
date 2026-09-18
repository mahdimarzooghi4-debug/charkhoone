# Tenant arrears repayment reconciliation v1

This phase makes the existing all-or-nothing tenant arrears repayment path executable without inventing provider success.

## Public and worker entry points

An authenticated tenant may call:

`POST /api/v1/contracts/{contractId}/arrears-repayment/reconcile`

The same service is used by the financial worker to retry already-started repayment transactions whose external status remains `Pending` or `Unknown`.

The worker does not open a repayment attempt by itself. A new attempt begins only through an explicit tenant request.

## Exact amount at the real success cutoff

A repayment quote contains:

- all outstanding confirmed coverage principal
- simple 3% monthly Lost Fund Return on each still-open exposure
- the exact total at the quote timestamp

A provider response is accepted as successful only when it supplies:

- `Confirmed`
- a positive confirmed rial amount
- a nonblank external reference
- the actual `SucceededAtUtc`
- a success timestamp no earlier than the local transaction creation time and no later than the reconciliation observation time

Charkhoone then independently recalculates all outstanding principal and Lost Fund Return at that exact `SucceededAtUtc`.

The response becomes `Succeeded` only if:

`confirmed amount == all outstanding principal + Lost Fund Return at SucceededAtUtc`

A provider saying "Confirmed" with a mismatched amount or invalid timestamp becomes local `Unknown`, with no replenishment journal and no Lost Fund Return finalization.

## No partial payment

The existing posting boundary remains authoritative.

After exact external confirmation, `PostConfirmedReplenishmentAsync` still requires the transaction to clear the complete outstanding principal plus the complete Lost Fund Return. It restores principal oldest contractual month first and recognizes Lost Fund Return separately as fund income.

Frozen bank principal remains outside this path.

## Idempotency and retries

The first attempt receives a deterministic idempotency key derived from:

- contract id
- ordered outstanding coverage references
- contractual month/component order
- exact outstanding principal amounts

At most one unposted `Pending`, `Unknown`, or `Succeeded` repayment transaction is allowed for a contract.

An indeterminate response stays queryable. The worker retries that same external transaction rather than creating another one.

A definitive provider failure is terminal and is not automatically retried.

After a succeeded external transaction is posted, the existing replenishment row prevents duplicate accounting. A later, genuinely new coverage cycle produces a different outstanding-set fingerprint and may start a new repayment attempt.

## Provider boundary

The release configuration uses `ExternalAdapters:ArrearsRepayment:Mode=Unavailable`.

The unavailable adapter always returns `Indeterminate`. DevelopmentMock is rejected outside Development.

No staging, production, or real provider endpoint is contacted by this phase.

## PostgreSQL evidence

Real PostgreSQL integration tests prove:

- exact confirmation posts principal plus simple Lost Fund Return
- the provider success timestamp becomes the Lost Fund Return cutoff
- only principal is restored to tenant contribution
- the repayment journal remains balanced
- replay does not call the provider or post again
- a one-rial confirmed-amount mismatch remains `Unknown`
- mismatch creates no replenishment and leaves Lost Fund Return open
