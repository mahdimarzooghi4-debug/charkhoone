# Admin pilot web v1

This slice connects the existing admin case screens to the protected Pilot Operations API introduced in PR #105.

It deliberately does not create a local admin authentication system and does not invent payment/provider data.

## Runtime boundary

The web runtime needs:

- `CHARKHOONE_API_BASE_URL`: absolute API origin, for example an internal API service origin.
- `CHARKHOONE_ADMIN_OIDC_LOGIN_URL`: optional absolute OIDC login entrypoint. In production it must be HTTPS.

The admin web never mints an operator token.

For protected case reads and reconciliation, it requires an incoming `Authorization: Bearer ...` header from the real OIDC/reverse-proxy boundary and forwards only that bearer value to `/api/v1/pilot`.

The API remains authoritative for:

- JWT validation
- exact `sub` allowlisting
- pilot feature enablement
- workflow state validation
- provider/evidence validation
- idempotency
- audit
- rate limiting

There is no local password, role fallback, development operator bypass, applicant impersonation, or static operator credential.

## Case queue

`/admin/cases` now reads:

`GET /api/v1/pilot/cases`

The UI renders only persisted identifiers and state returned by the API.

The previous synthetic names, case numbers, partner names, payment labels, and global counts are removed.

Metrics are explicitly scoped to the currently returned API page.

Pagination is based on the backend `page` / `pageSize` contract. Because Pilot V1 does not return a total count, the UI does not invent one.

## Case detail

`/admin/cases/{applicationId}` now reads:

`GET /api/v1/pilot/cases/{applicationId}`

It shows real persisted:

- application and contract status
- selected plan binding
- applicant / owner / property identifiers
- verification requests and provider references
- credit eligibility
- bank approval
- funding allocation
- fund-principal freeze
- tenant-contribution funding
- recent audit events
- backend-suggested reconciliation operation

Pilot enum values used by the web are serialized by the pilot endpoint as stable string names rather than implicit numeric enum values.

## Reconciliation

The only mutation exposed by the web is the backend-supported named reconcile request.

The HTML form can submit only:

- the backend-suggested operation
- a required human reason, maximum 1000 characters

The server route validates the operation allowlist, reason, same-origin POST, application UUID, and incoming bearer header before forwarding JSON to:

`POST /api/v1/pilot/cases/{applicationId}/reconcile`

The web does not expose controls for direct mutation of:

- application status
- contract status
- credit grade
- approved loan amount
- tenant contribution amount
- fund balance
- provider success
- ledger values

## Financial display

The admin web does not calculate or transform authoritative financial amounts.

Persisted monetary evidence is shown as rial.

This slice does not change any financial policy, including:

- full precision decimal accounting
- final-boundary flooring only
- reversal by originally recorded amount
- 3% rent/deposit equivalence
- no partial payment
- oldest-debt-first allocation
- three consecutive missed months cancellation-pending rule
- frozen bank principal isolation
- Lost Fund Return coverage and simple 3% monthly non-compounding calculation
- exact principal + Lost Fund Return normal repayment
- existing cancellation and normal settlement rules

## Payments page

The follow-up Pilot Payment Operations V1 slice adds a protected, read-only payment queue:

`GET /api/v1/pilot/payments`

`/admin/payments` now renders persisted payment instructions, monthly-obligation/component binding, contract/application binding, exact rial amount text, and the latest persisted external payment-reconciliation evidence.

The page does not expose manual payment creation, status overrides, provider-result overrides, ledger posting, reversal, or settlement mutations. Reconciliation remains governed by the existing authoritative payment workflows and public/user endpoints.

## PostgreSQL evidence

`PilotOperationsIntegrationTests` now includes a real PostgreSQL/API test for the admin queue contract.

It proves that an allowlisted operator:

- receives deterministic status-filtered pagination from persisted PostgreSQL applications
- receives string application state and suggested reconciliation operation values consumed by the web
- receives the real applicant/application UUIDs
- receives 404 for a non-existent application instead of any mock/fallback case

The test cleans up its seeded rows.

## External boundary

This slice does not contact or configure:

- a real bank
- a real fund
- a real identity/credit/property/payment provider
- a real OIDC tenant
- staging or production servers
- mobile signing services

Production use still requires those external credentials/evidence and the existing release gates.
