# Trusted property-contract registration v1

This phase makes `PropertyContractPending` executable without allowing an applicant to author authoritative owner, property, rent, beneficiary, or payment-schedule data.

## Public trigger, trusted data source

An authenticated applicant may call:

`POST /api/v1/credit-applications/{applicationId}/property-contract/reconcile`

The endpoint contains no property-contract mutation body.

The applicant only asks Charkhoone to reconcile trusted evidence. The authoritative data must come from `IExternalPropertyContractEvidenceAdapter`.

The release configuration is explicitly fail-closed:

`ExternalAdapters:PropertyContract:Mode=Unavailable`

No real registry/provider endpoint is implemented or contacted in this phase.

## Evidence required for confirmation

A confirmed adapter result must provide:

- an existing Charkhoone owner user id
- a non-empty property id
- Persian contract start year/month/day
- cash deposit in rial
- monthly rent in rial
- owner beneficiary id
- bank beneficiary id
- exactly twelve schedule months
- exact `DueAtUtc`, owner-payment rial, and bank-interest rial per month
- a nonblank trusted external/source reference

Before any contract row is created, the service validates the same approved monetary/calendar shape required by the immutable terms boundary:

- canonical rial amounts
- whole nonnegative cash deposit/rent and schedule components
- positive full-deposit equivalent using the approved 3% rent/deposit equivalence
- valid Persian-calendar start date
- month numbers exactly 1..12
- strictly increasing due timestamps
- at least one positive component per month

`ILeaseContractTermsService` remains the authoritative snapshot writer and revalidates the command before accepting it.

## Durable reconciliation

The existing `verification_requests` table is reused with:

- type `PropertyContract`
- deterministic key `property-contract:{applicationId}:v1`

No schema migration is needed.

`Indeterminate` evidence leaves the application at `PropertyContractPending` and creates no lease contract.

`NeedsDocuments` moves the credit workflow to `NeedsDocuments` using the existing resumable workflow path.

A confirmed result first creates or validates one draft lease contract bound to:

- the applicant as tenant
- the trusted owner
- the trusted property
- the exact already-selected bank plan id/version
- the same credit application

The verification request stays `PendingSnapshot` until the immutable terms snapshot is successfully captured. This prevents a confirmed request from becoming terminal before its contractual source of truth exists.

Only after snapshot capture succeeds does one transaction:

- mark the verification request `Confirmed`
- transition `PropertyContractPending -> ExternalChecksPending`
- write audit action `property_contract_registered`
- emit `credit-application.property-contract-registered.v1`

## Idempotency and recovery

A completed replay reads the confirmed verification request, exact contract binding, and immutable terms snapshot and returns `AlreadyRegistered` without calling the provider again.

If a process stops after draft contract creation but before snapshot/final transition, the request is nonterminal and can be reconciled again with the same provider request id.

Conflicting persisted contract identity or source evidence fails closed.

## PostgreSQL evidence

Real PostgreSQL integration tests prove:

- confirmed trusted evidence creates exactly one draft lease contract
- the immutable Persian-calendar terms/schedule snapshot is captured
- full-deposit equivalent is the approved 3% calculation
- the credit application advances to `ExternalChecksPending`
- workflow/audit/outbox evidence is written once
- exact replay does not call the adapter again
- an unmapped owner remains indeterminate and creates no contract
- another authenticated user cannot reconcile someone else's application
- the default unavailable adapter remains indeterminate and creates no contract

No staging, production, real provider, or new database migration is involved.

## Next boundary

After this phase, the application has a trusted full-deposit-equivalent source and is ready for the existing credit-eligibility service.

The next gap is orchestration of `ExternalChecksPending` into credit-grade evaluation/reconciliation using that persisted immutable snapshot, without accepting a caller-supplied full-deposit-equivalent amount.
