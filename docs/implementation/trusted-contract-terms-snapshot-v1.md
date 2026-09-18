# Trusted contract terms and schedule snapshot v1

This phase creates the immutable source of truth required before automatic monthly-obligation provisioning.

## Why a snapshot is required

The existing lease-contract row stores workflow identity and status, but it does not store the contractual Persian-calendar start, rent/deposit terms, payment beneficiaries, or exact monthly bank/owner obligations.

Those values must not be inferred from:

- `LeaseContractRow.CreatedAtUtc`
- opaque bank-plan `InterestTerms`
- a guessed landlord-payment formula
- a guessed monthly bank-interest formula

The approved financial policy defines the rent/deposit equivalence and Persian-calendar rent rules, but the approved technical baseline still requires bank and landlord monthly payment amounts to come from a trusted source rather than a newly invented formula.

## Snapshot shape

Each contract can have exactly one `LeaseContractTermsRow`, keyed by contract id.

It records:

- calendar = `Persian`
- Persian start year/month/day
- fixed 12-month term
- cash deposit in rial
- contractual monthly rent in rial
- calculated full-deposit equivalent in rial
- owner beneficiary id
- bank beneficiary id
- trusted source reference
- capture timestamp

Each snapshot owns exactly twelve `LeaseContractScheduleMonthRow` records with:

- contract month number 1 through 12
- exact trusted `DueAtUtc`
- exact owner-payment amount in rial
- exact bank-interest amount in rial

No bank-interest or landlord-payment formula is introduced here.

## Financial binding

The snapshot calculates:

`full deposit equivalent = cash deposit + monthly rent / 0.03`

using the existing authoritative `FullDepositCalculator` and whole-rial boundary.

If a credit-eligibility assessment or funding allocation already exists, its persisted `FullDepositEquivalentRial` must equal the snapshot calculation exactly. A mismatch returns conflict and writes nothing.

PostgreSQL also enforces the same full-deposit equation and whole-rial/nonnegative amount constraints.

## Calendar validation

The start date is validated with .NET `PersianCalendar`, including the actual number of days in the selected Persian month.

The monthly schedule is not regenerated from UTC or Gregorian timestamps in this phase. The trusted registration boundary supplies the exact twelve due timestamps, and they must be strictly increasing.

This avoids silently inventing a timezone or payment-clock convention that has not been approved.

## Immutability and idempotency

A snapshot may be captured only while the contract is:

- `Draft`
- `AwaitingFunding`
- `AwaitingCompletion`

An exact replay returns `Existing`.

Any different replay returns `Conflict`.

After capture, direct updates or deletes of the terms or schedule rows are rejected by the DbContext immutability guard. Contract changes require a separately modeled contract-version/amendment workflow rather than mutation of accepted terms.

Successful capture writes atomically:

- the terms row
- all 12 schedule rows
- audit action `contract_terms_schedule_captured`
- outbox event `lease-contract.terms-schedule-captured.v1`

## Activation gate

`EfLeaseFundingLifecycleService` now requires a valid trusted terms snapshot before `AwaitingCompletion -> Active`.

- missing snapshot => `NotReady`
- malformed or funding-mismatched snapshot => `InvalidState`
- exact snapshot + complete funding evidence => activation may proceed

This means a financially funded contract cannot become active while its monthly contractual source of truth is missing.

## Read API

Authenticated tenant/owner contract detail reads include the immutable terms and all twelve schedule months.

This phase intentionally does **not** add a public terms-capture HTTP endpoint. The repository does not yet define the trusted contract-registration authorization/approval workflow that would make arbitrary participant mutation authoritative.

`ILeaseContractTermsService` is the internal boundary for that future workflow.

## Downstream provisioning

The monthly schedule provisioning phase now consumes this snapshot and materializes all twelve months atomically.

It preserves the exact due times, beneficiaries, owner payments, and bank-interest amounts without recalculation. Exact partial state can be completed idempotently; contradictory existing obligations are quarantined for review.

Neither snapshot capture nor schedule provisioning introduces an external provider call.
