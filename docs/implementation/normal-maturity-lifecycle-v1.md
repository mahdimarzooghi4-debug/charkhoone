# Normal maturity lifecycle v1

Normal settlement no longer requires an operator or caller to pre-set `SettlementPending`.

This phase adds an idempotent lifecycle service plus worker orchestration for the normal 12-month contract path.

## Maturity source of truth

The current persistence model does not store a separate lease end-date field. It does store the contractual monthly schedule as `MonthlyObligationRow` records with:

- `ContractMonthNumber` limited by the payment policy to 1 through 12
- persisted `DueAtUtc`
- closed status and `ClosedAtUtc`

The maturity service consumes that persisted schedule. It does not derive maturity from `CreatedAtUtc`, and it does not recompute Persian/Jalali calendar dates in the worker. The trusted monthly schedule remains the calendar boundary produced upstream from the contract's Jalali terms.

## Eligibility

An `Active` contract may move to `SettlementPending` only when all of the following hold:

- exactly 12 monthly obligations exist
- month numbers are exactly 1 through 12
- the final month's persisted due time is not in the future
- every month is closed as `Paid` or `Covered`
- the final month has an immutable close timestamp
- delinquency has not reached the three-consecutive-miss cancellation threshold
- every covered month has confirmed coverage evidence
- no coverage transfer remains non-succeeded
- no open Lost Fund Return exposure remains
- no cancellation settlement or normal settlement row already exists

The service locks the lease-contract row before evaluating and changing state.

## Transition evidence

Successful maturity writes, in one database transaction:

- contract state `Active -> SettlementPending`
- workflow transition evidence
- audit action `contract_entered_normal_settlement_pending`
- outbox event `lease-contract.normal-settlement-pending.v1`

Replay for a contract already in `SettlementPending` or `Settled` returns `AlreadyPrepared` without duplicating transition, audit, or outbox evidence.

## Worker ordering

`FinancialReconciliationWorker` now performs maturity preparation after payment/coverage/cancellation reconciliation work for the batch, then re-queries `SettlementPending` contracts.

That ordering allows a final monthly payment closed during the same worker pass to become eligible for maturity, and a newly matured contract can then be offered to `INormalSettlementService` in that same pass.

The release configuration continues to control whether the financial reconciliation worker is enabled. This phase does not contact any external provider and introduces no schema migration.
