# Monthly schedule provisioning v1

This phase materializes the immutable 12-month contract schedule into payment-processing rows.

## Source of truth

Provisioning consumes only the trusted snapshot introduced by
`trusted-contract-terms-snapshot-v1`.

It does not derive or recalculate:

- Persian-calendar due dates
- owner monthly payment amounts
- bank-interest amounts
- owner beneficiary identity
- bank beneficiary identity

The exact persisted snapshot values are copied into monthly obligations and payment instructions.

## Atomic contract-level provisioning

`IMonthlyScheduleProvisioningService` provisions one active lease contract in a single database transaction.

Before creating any missing month, the service validates every already-existing monthly obligation for that contract against the immutable snapshot.

For each existing month it requires exact equality for:

- contract month number
- obligation due timestamp
- component count
- component kind
- payment-instruction due timestamp
- beneficiary id
- amount in rial
- deterministic payment-instruction idempotency key

If any existing month differs, no missing month is inserted.

## Repair-safe partial state

A contract may already contain a correct subset of months, for example from an earlier explicit monthly-obligation call.

If every existing month exactly matches the snapshot, provisioning preserves those rows and creates only the missing months.

The final result still contains exactly months 1 through 12 from the snapshot.

Payment instruction idempotency remains:

`monthly-obligation:{contractId}:{contractMonthNumber}:{componentKind}:v1`

using the same convention as the existing monthly-obligation service.

## Conflict quarantine

A mismatch returns `Conflict` and writes, at most once:

- audit action `monthly_schedule_provisioning_conflict`
- outbox event `lease-contract.monthly-schedule-provisioning-review-required.v1`

The worker excludes contracts with this conflict evidence from blind automatic retry. They require explicit review rather than repeatedly mutating or retrying a contradictory financial schedule.

## Successful terminal evidence

When all twelve months are materialized and match the snapshot, the service writes, exactly once:

- audit action `monthly_schedule_provisioned`
- outbox event `lease-contract.monthly-schedule-provisioned.v1`

The event binds the contract, trusted source reference, snapshot capture timestamp, exact twelve due timestamps, exact beneficiaries, and exact owner/bank amounts.

Replay after successful provisioning returns `AlreadyProvisioned` and creates no duplicate obligations, payment instructions, audits, or terminal event.

## Delinquency state

Provisioning ensures the contract has a zeroed `ContractDelinquencyRow` if one does not already exist.

It does not close any obligation, mark any month missed, reconcile any payment, or invoke coverage.

Those existing workflows remain independent.

## Worker ordering

The financial reconciliation worker runs schedule provisioning immediately after the lease-funding lifecycle.

Therefore a funding-complete `Draft` contract can, in one worker pass:

1. advance through funding lifecycle to `Active`
2. materialize its trusted 12-month schedule
3. expose payment instructions for later tenant payment reconciliation

Provisioning itself does not create external transactions and does not call any external adapter.

## Deliberate non-goals

This phase does not:

- recalculate bank interest
- calculate landlord rent from a different formula
- create synthetic external payment confirmations
- auto-close due months
- change arrears ordering
- change coverage, cancellation, or normal-settlement policy
- add a public contract-terms mutation endpoint
