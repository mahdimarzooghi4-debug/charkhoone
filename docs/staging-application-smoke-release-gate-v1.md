# Staging application smoke and release gate v1

This phase closes the application-level staging gate that remains after the database rehearsal. It does not claim that staging or production was contacted from CI.

## Release identity

The API reads an optional full git SHA from `Release:GitSha` (environment form: `Release__GitSha`). When configured, every API response includes the normalized SHA in `X-Charkhoone-Release-Sha`.

Configured values must be full 40-character hexadecimal git SHAs. Invalid configured values fail application startup. The setting is optional so existing environments are not silently assigned an invented release identity; however, the staging smoke gate requires the header and therefore requires the staging deployment to provide it.

## Guarded staging smoke

Run `scripts/staging/application-release-smoke.sh` only after the database staging rehearsal for the exact same release has completed.

Required inputs:

- `CHARKHOONE_STAGING_API_BASE_URL`: HTTPS staging API base URL.
- `CHARKHOONE_EXPECTED_GIT_SHA`: full release SHA expected in the API release header and prior database rehearsal.
- `CHARKHOONE_STAGING_ACCESS_TOKEN_FILE`: a file containing an authorized staging access token on its first line. The token is used only for read-only contract requests and is not retained in evidence.
- `CHARKHOONE_STAGING_CONTRACT_ID`: an existing staging contract accessible to the smoke identity.
- `CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY`: `summary.txt` produced by the completed database rehearsal for the same SHA.
- `CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE`: non-empty provider/platform deployment evidence for the Worker release. The script records only its SHA-256 hash.
- `CHARKHOONE_STAGING_WORKER_GIT_SHA`: Worker release SHA reported by the deployment process; it must exactly match the expected release SHA.
- `CHARKHOONE_ALLOW_STAGING_APPLICATION_SMOKE=true`: explicit operator opt-in after confirming the target and the read-only smoke identity.

Example shape (placeholders only):

```bash
Release__GitSha='<full-release-sha>' # set on the deployed API, not on the smoke client

CHARKHOONE_STAGING_API_BASE_URL='https://staging-api.example.invalid' \
CHARKHOONE_EXPECTED_GIT_SHA='<full-release-sha>' \
CHARKHOONE_STAGING_ACCESS_TOKEN_FILE='/secure/path/staging-smoke.token' \
CHARKHOONE_STAGING_CONTRACT_ID='<accessible-contract-guid>' \
CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY='/secure/evidence/database/<sha>/summary.txt' \
CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE='/secure/evidence/worker-deployment.txt' \
CHARKHOONE_STAGING_WORKER_GIT_SHA='<full-release-sha>' \
CHARKHOONE_ALLOW_STAGING_APPLICATION_SMOKE=true \
scripts/staging/application-release-smoke.sh
```

The transport guard defaults to a 10-second connect timeout and 30-second total request timeout. These are safety bounds for a smoke runner, not application latency SLOs. Operators may override them with `CHARKHOONE_SMOKE_CONNECT_TIMEOUT_SECONDS` and `CHARKHOONE_SMOKE_MAX_TIME_SECONDS`.

## Read-only checks

The runner performs only GET requests:

1. `/api/v1` must return 200, defensive cache/security headers, and the exact expected `X-Charkhoone-Release-Sha`.
2. `/health/live` must return 200.
3. `/health/ready` must return 200, which exercises the existing PostgreSQL and RabbitMQ readiness checks.
4. anonymous `GET /api/v1/contracts/{id}` must return 401, proving the protected route is not accidentally public.
5. authenticated `GET /api/v1/contracts/{id}` must return 200 for the operator-selected staging contract.
6. authenticated `GET /api/v1/contracts/{id}/audit-events?page=1&pageSize=1` must return 200.

No payment reconciliation, funding, settlement reconciliation, cancellation, contribution, credit-application mutation, or other financial mutation endpoint is invoked.

Response bodies are temporary and deleted when the runner exits. The evidence directory retains only status outcomes, the release SHA, hashes of prerequisite evidence, and the final summary. The bearer token is never copied into the evidence directory.

## Database rehearsal binding

The supplied database rehearsal summary must contain all of:

- `environment=staging`
- `git_sha=<expected release sha>`
- `migration=completed`
- `post_migration_readiness=passed`

This prevents application smoke evidence for one release from being paired with a database rehearsal for another release.

## Worker boundary

The current Worker is a generic host with background services and has no HTTP health endpoint. This phase deliberately does not invent a public Worker probe or pretend API readiness proves Worker health.

Instead, the release gate requires platform/deployment evidence plus an explicitly reported Worker git SHA matching the API/database release. That evidence still requires human review. A future Worker health surface should only be introduced with an explicit deployment/monitoring design rather than solely to satisfy this script.

## CI versus real staging

CI verifies the API release-identity behavior through integration tests and runs the normal PostgreSQL-backed backend suite. It does not possess or use staging credentials and does not execute this script against staging.

A real staging smoke remains an operator-run gate after deployment and database rehearsal. A passing smoke is evidence for review, not an automatic production promotion decision.

## Financial-policy boundary

This phase does not resolve or exercise undefined financial policy. In particular, it does not encode the lost-fund-return day-count/rounding/partial-allocation formula, partial-payment allocation, or early-cancellation Frozen Principal release timing. External `Unknown` remains a reconciliation state and is not converted to `Failed` or blindly retried.
