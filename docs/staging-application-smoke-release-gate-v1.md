# Staging application smoke and release gate

> Current contract: Worker HTTP health integration V2 supersedes the original Worker limitation in this document.

This gate is operator-run after a real staging database rehearsal and deployment. CI validates the tooling only; it does not contact staging or production.

## Required release identity

API and Worker must be deployed from the same full 40-character git SHA. Both services must return that SHA in the `X-Charkhoone-Release-Sha` response header.

Required inputs include:

- `CHARKHOONE_STAGING_API_BASE_URL`: HTTPS staging API base URL.
- `CHARKHOONE_STAGING_WORKER_HEALTH_URL`: exact Worker `/health/live` URL.
- `CHARKHOONE_EXPECTED_GIT_SHA`: exact release SHA.
- `CHARKHOONE_STAGING_ACCESS_TOKEN_FILE`: read-only staging token file.
- `CHARKHOONE_STAGING_CONTRACT_ID`: existing staging contract accessible to the smoke identity.
- `CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY`: completed database rehearsal summary for the same SHA.
- `CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE`: non-empty provider deployment evidence whose hash is retained.
- `CHARKHOONE_STAGING_WORKER_GIT_SHA`: provider/operator-reported Worker release SHA.
- `CHARKHOONE_ALLOW_STAGING_APPLICATION_SMOKE=true`: explicit operator opt-in.

Remote Worker health URLs must use HTTPS. Plain HTTP is allowed only for loopback endpoints such as a provider tunnel bound to `127.0.0.1`, `localhost`, or `::1`. URL credentials, query strings, fragments, and paths other than `/health/live` are rejected.

## Read-only checks

The smoke runner performs GET-only checks:

1. API `/api/v1` returns 200, security/cache headers, and the exact release SHA.
2. API `/health/live` returns 200.
3. API `/health/ready` returns 200, exercising PostgreSQL and RabbitMQ readiness.
4. Anonymous contract read returns 401.
5. Authenticated contract read returns 200.
6. Authenticated audit-event read returns 200.
7. Worker `/health/live` returns 200.
8. Worker response carries the exact release SHA header.
9. Worker JSON identifies `service=Charkhoone.Worker` and `status=live`.

No financial mutation endpoint is invoked. Response bodies and the access token remain temporary and are not copied into evidence.

## Evidence

The application-smoke summary records:

- API release identity/liveness/readiness,
- database rehearsal binding,
- Worker deployment SHA binding,
- Worker HTTP release-header match,
- Worker HTTP liveness success,
- Worker service identity match,
- hash binding to provider deployment evidence,
- no financial mutations,
- no retained response bodies or token,
- no automatic promotion decision.

The Worker endpoint is a process/host liveness signal only. It does not claim PostgreSQL, RabbitMQ, or external-provider readiness for Worker background processing.

## Execution boundary

A passing smoke does not prove provider provenance by itself and is not production approval. Real staging still requires actual provider credentials, deployment evidence, database backup/PITR and restore evidence, and human promotion review.

Undefined financial policies remain intentionally unresolved: the exact 3% lost-fund return formula, partial-payment allocation, and early-cancellation frozen-principal release timing are not encoded or exercised.
