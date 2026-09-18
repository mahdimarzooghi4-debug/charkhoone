# Trusted credit-eligibility reconciliation v1

This phase removes caller-controlled full-deposit-equivalent input from credit eligibility.

## Public boundary

An authenticated applicant may call:

`POST /api/v1/credit-applications/{applicationId}/credit-eligibility/reconcile`

The endpoint has no monetary request body.

The application service now requires the authenticated internal applicant id and resolves the full-deposit equivalent exclusively from persisted trusted evidence.

## Trusted amount source

Before creating or retrying a credit-grade assessment, the service requires:

- the application has an exact selected bank plan id/version
- the exact 12-month plan version still exists
- exactly one lease contract is bound to the same application
- the contract tenant is the application applicant
- the contract carries the same bank plan id/version
- an immutable Persian-calendar contract-terms snapshot exists
- the snapshot has nonblank trusted source/beneficiary references
- cash deposit, rent and full-deposit equivalent are whole rial values
- `FullDepositCalculator` reproduces the persisted full-deposit equivalent exactly
- exactly 12 immutable schedule rows exist with month numbers 1..12, strictly increasing due timestamps, and valid whole-rial components

No HTTP or internal caller supplies `FullDepositEquivalentRial` to `ICreditEligibilityService` anymore.

## Assessment immutability

The deterministic assessment remains:

`credit-grade:{applicationId}:v1`

If an existing assessment carries a full-deposit-equivalent amount different from the immutable contract snapshot, reconciliation returns `Conflict`.

The service does not silently overwrite the amount and does not contact the credit-grade provider.

This closes the previous path where an internal caller could retry eligibility with a different amount.

## External credit result

After trusted-source validation, the existing credit-grade adapter behavior remains unchanged.

- valid supported grade => calculate the authoritative loan ratio and maximum eligible loan; transition to `DecisionReady`
- unknown/invalid/unsupported result => transition from `ExternalChecksPending` to `ExternalCheckIndeterminate`
- retry from `ExternalCheckIndeterminate` remains allowed
- completed exact replay => `AlreadyEvaluated` without another provider call

The eligibility outbox event now explicitly includes the trusted `fullDepositEquivalentRial`.

## Ownership

The credit application is selected together with the authenticated applicant id.

Another authenticated user receives not-found semantics and cannot cause a credit-grade call for someone else's application.

## PostgreSQL evidence

Real PostgreSQL integration tests prove:

- a valid grade uses the immutable contract snapshot amount
- the approved 3% rent/deposit equivalence feeds the exact persisted eligibility amount
- maximum eligible loan is computed from that amount and the authoritative credit-grade policy
- exact replay does not call the external adapter again
- a pre-existing mismatched eligibility amount fails closed as conflict and is not overwritten
- the public reconcile endpoint is applicant-owned
- the default unavailable credit-grade adapter produces an indeterminate result while preserving the trusted amount

No database migration, staging, production, or real provider contact is involved.

## Next boundary

After this phase, a valid credit result leaves the application at `DecisionReady`.

The next gap is the decision/bank-approval handoff: it must consume the persisted eligibility assessment and exact selected plan without accepting a caller-supplied eligible-loan amount or inventing a bank decision.
