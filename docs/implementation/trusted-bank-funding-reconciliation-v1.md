# Trusted bank-funding reconciliation v1

This phase makes the existing bank-approval/fund-principal workflow applicant-owned and binds it back to the immutable contract and persisted eligibility evidence.

## Public trigger

An authenticated applicant may call:

`POST /api/v1/credit-applications/{applicationId}/bank-funding/reconcile`

The endpoint has no monetary request body.

The caller cannot provide:

- maximum eligible loan
- approved bank amount
- tenant contribution
- fund principal amount

## Trusted input chain

Before bank contact, the service requires exact agreement between:

- authenticated applicant and credit application
- credit application and one lease contract
- application and contract bank-plan id/version
- the exact persisted 12-month plan version
- immutable Persian contract terms
- the approved 3% rent/deposit full-deposit equivalent
- completed valid credit eligibility
- eligibility full-deposit equivalent and the immutable snapshot
- eligibility maximum loan and a fresh recomputation from the persisted external sub-grade

An existing bank-approval row with a different eligibility ceiling returns `Conflict`; the value is never silently overwritten.

An existing funding allocation must also exactly match the trusted application, contract, plan, bank, full-deposit equivalent, eligibility ceiling, approved amount, and tenant-contribution equation.

## Bank decision evidence

The bank receives only the persisted trusted maximum eligible loan and exact selected plan.

A terminal approved amount must be:

- positive
- whole rial
- no greater than the eligibility ceiling
- no greater than the full-deposit equivalent
- accompanied by a nonblank external reference

A decline is terminal only when it also has a nonblank external reference.

Malformed or reference-less terminal responses become local `Indeterminate`; they cannot approve or reject the applicant.

The tenant contribution remains:

`full deposit equivalent - bank approved loan`

using the existing authoritative allocation calculator.

## Fund freeze evidence

After a valid bank approval, the fund receives exactly the persisted bank-approved principal.

A freeze is confirmed only with both:

- nonblank fund reference
- nonblank external reference

Otherwise the flow remains indeterminate.

Frozen bank principal remains separate from tenant contribution and is not made available for delinquency coverage.

## PostgreSQL evidence

Real PostgreSQL integration tests prove:

- trusted eligibility and immutable contract evidence drive the bank request
- exact approved principal and tenant contribution are persisted
- confirmed principal freeze advances the application to `ApprovedFunded`
- exact replay does not call bank or fund again
- mismatched persisted bank-approval ceiling fails closed before provider calls
- the endpoint is applicant-owned
- the default unavailable bank adapter stays indeterminate and creates no allocation

No database migration, staging, production, or real provider is involved.

## Next boundary

After `ApprovedFunded`, the existing lease-funding lifecycle consumes the persisted funding allocation, frozen-principal evidence, and tenant-contribution funding evidence.

The next orchestration gap is automatically connecting eligible application funding evidence to that lease lifecycle without introducing synthetic provider success.
