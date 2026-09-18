# Monthly due lifecycle orchestration v1

This phase makes provisioned monthly obligations advance when their trusted due timestamp is reached.

## Trusted cutoff

The only automatic due cutoff is the persisted `MonthlyObligationRow.DueAtUtc` copied from the immutable contract schedule snapshot.

The worker does not derive a cutoff from:

- contract creation time
- server-local midnight
- Gregorian month boundaries
- an inferred Persian-calendar clock
- bank interest text

Only an `Open` obligation with `DueAtUtc <= worker time` is a due-lifecycle candidate.

## Payment reconciliation is a query, not a transfer

At due time, an unstarted `PaymentInstructionStatus.Created` instruction is passed to the existing `IPaymentReconciliationService`.

That service calls `IExternalPaymentReconciliationAdapter.QueryAsync`.

This phase does not initiate a debit, card charge, bank transfer, or automatic payment. It queries trusted external payment status.

Existing `Pending`, `Unknown`, and `ReconciliationRequired` transactions remain handled by the existing payment-reconciliation worker path. The due lifecycle starts only instructions that are still `Created`, avoiding two provider queries for the same instruction in one worker pass.

## Exact provider semantics

Existing reconciliation rules remain authoritative:

- exact confirmed amount + nonblank external reference => `Succeeded`
- definitive provider failure => `Failed`
- unavailable, indeterminate, or mismatched confirmation => `Unknown`

An indeterminate provider never becomes a missed payment automatically. The obligation remains `Open` and `CloseAsync` returns `ReconciliationRequired`.

The default unavailable production-like adapter therefore remains fail-closed and never manufactures success or delinquency.

## Older arrears and the new terminal state

The existing policy rejects a newer tenant payment while real older tenant debt remains outstanding.

Previously, a due newer instruction could remain `Created` forever:

- reconciliation rejected it because older arrears existed
- monthly close treated `Created` as unresolved
- the newer month could never become `Missed`
- consecutive delinquency could stop advancing

This phase adds the terminal internal status:

`PaymentInstructionStatus.ArrearsBlocked`

It means:

> this due instruction was not started because the tenant had older unsettled debt.

It does **not** mean that an external provider returned failure.

Only `Created -> ArrearsBlocked` is allowed, and the state is terminal.

When `CloseAsync` processes a due month with real older debt, any still-`Created` instructions are transitioned to `ArrearsBlocked` in the same database transaction with:

- audit action `payment_blocked_by_older_arrears`
- outbox event `payment-instruction.arrears-blocked.v1`

The month can then close `Missed` while preserving oldest-debt-first payment policy.

Manual reconciliation of an `ArrearsBlocked` instruction returns `ArrearsOutstanding` and never contacts the external payment provider.

## Coverage

`ArrearsBlocked` is coverable in the same way as an unpaid terminal `Failed` or `Reversed` component.

That allows Charkhoone to continue its contractual owner/bank coverage obligation even though the tenant is barred from starting a newer payment before older arrears are fully settled.

Frozen bank principal remains excluded from coverage.

Coverage still requires the existing tenant-contribution balance, exact external coverage confirmation, ledger posting, and lost-fund-return rules.

## Three consecutive missed months

Because arrears-blocked due months can now close `Missed`, the existing consecutive-month calculation continues across newer months.

The third consecutive `Missed`/`Covered` tenant month still latches:

- `CancellationRequired = true`
- contract transition to `CancellationPending`
- audit `contract_cancellation_required`
- outbox `lease-contract.cancellation-required.v1`

No new cancellation threshold is introduced.

## Worker ordering

A financial worker pass now runs the relevant stages in this order:

1. lease funding lifecycle
2. monthly schedule provisioning
3. retry already-started payment reconciliation
4. process due monthly obligations
5. discover and run coverage from newly closed `Missed` months
6. discover cancellation candidates from newly latched delinquency
7. cancellation bank-principal processing
8. normal maturity and normal settlement

This ordering lets newly persisted state be consumed in the same worker pass instead of waiting for the next poll.

## Explicit non-goals

This phase does not:

- auto-transfer tenant money
- treat an unavailable provider as failed
- change the all-or-nothing repayment rule
- permit newer payments while older real debt exists
- use frozen bank principal for delinquency
- change the three-month cancellation threshold
- change Lost Fund Return terms
- invent a new due timestamp or timezone
