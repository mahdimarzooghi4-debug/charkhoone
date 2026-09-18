# Pilot payment operations V1

This slice closes the synthetic/empty Admin Payments gap with a protected read-only payment queue over the real PostgreSQL model.

## API

The endpoint is:

`GET /api/v1/pilot/payments`

It inherits the existing Pilot Operations authorization boundary:

- Pilot operations must be explicitly enabled.
- the caller must have an authenticated OIDC `sub`.
- the exact subject must be present in `PilotOperations:AllowedSubjects`.
- there is no local password, role fallback, applicant impersonation, or static operator credential.

Query parameters:

- `status=<PaymentInstructionStatus>` is optional.
- `page` defaults to 1.
- `pageSize` defaults to 50 and cannot exceed 200.

## Persisted data

Each queue item is assembled from persisted:

- payment instruction
- monthly obligation
- monthly obligation component
- lease contract
- credit-application binding when present
- latest matching external transaction for `PaymentInstruction/payment_reconciliation`

The queue exposes:

- payment instruction id
- monthly obligation id
- contract id
- credit application id when bound
- contract month number
- component kind
- beneficiary id
- exact amount in rial
- payment-instruction status
- latest external-transaction id/status/provider/reference/reason when present
- due and update timestamps

No total count is invented.

## Financial precision

The API serializes `amountRial` as invariant decimal text rather than a JSON number.

The web keeps that value as a string and only inserts display separators. It never converts the authoritative amount through JavaScript floating-point arithmetic.

This slice does not alter any financial policy: no partial payment, oldest-debt-first allocation, originally-recorded reversal amounts, frozen-principal isolation, delinquency thresholds, Lost Fund Return, cancellation, or normal settlement rules are changed.

## Mutation boundary

This endpoint is read-only.

It does not add controls for:

- creating a payment
- marking a payment successful/failed
- editing an amount
- changing a beneficiary
- fabricating provider evidence
- posting journal entries
- reversing ledger entries
- settling a contract

Existing authoritative services remain the only mutation path.

## Admin web

`/admin/payments` now reads the protected payment queue server-side using the same incoming real OIDC bearer boundary as Admin Cases.

The page renders only persisted values and page-scoped metrics. A payment linked to a credit application links directly to the real Admin Case detail.

There is no synthetic payment dataset or fallback record.

## PostgreSQL evidence

`PilotOperationsIntegrationTests` seeds a real PostgreSQL payment graph containing:

- tenant and owner users
- credit application
- active lease contract
- monthly obligation
- payment instruction
- obligation component
- external payment-reconciliation transaction

The test proves the protected endpoint returns the real relational binding, status/provider evidence, exact decimal text, and rejects an invalid payment-status filter.

The test removes all seeded rows afterward.

## External boundary

No real bank, fund, payment provider, OIDC tenant, staging environment, or production system is contacted by this slice.
