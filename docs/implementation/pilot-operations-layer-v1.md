# Pilot operations layer v1

This phase turns the existing static admin concept into a real backend operations boundary for controlled pilot use.

It does not create bank, fund, identity, payment, or settlement success manually.

## Authorization

Pilot operations are disabled by default.

They are reachable only when:

- `PilotOperations:Enabled=true`
- the authenticated OIDC token contains a nonblank `sub`
- that exact subject is present in `PilotOperations:AllowedSubjects`

There is no fallback role, local password, development bypass, or applicant-to-operator promotion.

If pilot operations are not explicitly enabled and allowlisted, authenticated callers receive 403.

Example environment binding for one operator:

```text
PilotOperations__Enabled=true
PilotOperations__AllowedSubjects__0=<exact-oidc-subject>
```

Additional operators use indexes 1, 2, and so on.

## API

The protected group is:

`/api/v1/pilot`

### Case queue

`GET /api/v1/pilot/cases`

Optional query parameters:

- `status=<CreditApplicationStatus>`
- `page` (default 1)
- `pageSize` (default 50, maximum 200)

The queue reads persisted application, lease, verification, credit, bank, fund, and tenant-contribution state from PostgreSQL.

It exposes internal UUIDs and financial/provider evidence needed by an authorized operator, but it does not expose the user's OIDC subject.

### Case detail

`GET /api/v1/pilot/cases/{applicationId}`

Returns:

- application and lease state
- exact selected plan binding
- verification attempts and provider references
- credit eligibility snapshot
- bank approval evidence
- funding allocation
- principal-freeze evidence
- tenant-contribution funding/external-transaction evidence
- up to 50 recent application audit events
- a suggested safe reconciliation operation when one can be inferred

### Reconcile

`POST /api/v1/pilot/cases/{applicationId}/reconcile`

Body:

```json
{
  "operation": "Identity",
  "reason": "Operator retry after provider timeout."
}
```

Supported operations:

- `Identity`
- `PropertyContract`
- `CreditEligibility`
- `BankFunding`
- `TenantContributionFunding`

The endpoint is rate-limited as a sensitive mutation.

The operator cannot supply:

- an application status
- an approved loan amount
- a contribution amount
- a fund balance
- a credit grade
- a provider success flag
- a ledger value

The request only delegates to the existing authoritative service for that operation. Existing state/evidence validation and idempotency remain authoritative.

## Audit

Every authorized reconciliation request against an existing case writes:

- aggregate type `CreditApplication`
- action `pilot_operator_reconcile_requested`
- actor `pilot:<oidc-subject>`
- operation and human reason
- UTC occurrence timestamp

The request audit is written before invoking the external reconciliation boundary, so a provider exception or indeterminate result does not erase the fact that an operator requested the retry.

Underlying domain services continue to emit their own workflow/audit/outbox records.

## Fail-closed behavior

Invalid operations, conflicting trusted evidence, and invalid workflow states are not overridden by the pilot API.

When real providers are not connected, the existing unavailable adapters remain authoritative and return indeterminate/fail-closed outcomes.

This API is therefore operational control, not a synthetic provider.

## PostgreSQL/API evidence

Real PostgreSQL integration coverage proves:

- pilot endpoints are forbidden when the feature is disabled
- a non-allowlisted authenticated subject is forbidden
- an allowlisted operator can list and inspect a real persisted case
- an allowlisted operator can request a named identity reconciliation
- the real identity service performs the workflow transition
- provider evidence is persisted
- the operator request is independently audited
- no operator user row is required and no applicant ownership is impersonated

No schema migration, staging, production, or real external provider is involved.

## Next boundary

The existing web admin pages are currently static/mock views.

After this backend boundary is merged, the next internal pilot step is to connect those admin screens to the protected pilot API and then add a configurable scenario/load harness for cohort testing. The cohort size is a runtime input; it is not hard-coded to 2,000.
