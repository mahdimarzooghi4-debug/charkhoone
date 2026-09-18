# Staging target identity binding v1

## Purpose

This contract prevents database rehearsal, API/Worker smoke, and promotion evidence from being combined across different staging targets.

It does not prove that a provider export is authentic. Provider-native backup, restore, and deployment provenance still require operator review. The binding guarantees that all Charkhoone release tooling in this repository refers to one declared non-secret target identity.

## Target manifest

A real staging run must provide `CHARKHOONE_STAGING_TARGET_MANIFEST`.

Use `deploy/staging-target-manifest.example.json` as the shape. Do not commit a real environment manifest unless its provider resource identifiers are intentionally public operational metadata.

Required components:

- database
- message broker
- API
- Worker

Each component records a provider slug, a provider scope/account/workspace identifier, and a provider resource identifier. Database also records the exact PostgreSQL database name. API records its HTTPS base URL. Worker records its exact `/health/live` URL.

The manifest deliberately has no fields for passwords, tokens, connection strings, private keys, or bearer credentials. Unknown keys are rejected.

## Canonical fingerprint

`scripts/staging/verify-target-manifest.py` validates the manifest and canonicalizes it before hashing. JSON whitespace and key ordering therefore do not change the identity fingerprint.

The verifier emits:

- `staging_target_binding_sha256=<sha256>`
- `database_name=<declared database>`
- `api_base_url=<normalized HTTPS URL>`
- `worker_health_url=<validated health URL>`

Remote Worker health URLs must use HTTPS. Plain HTTP is accepted only for loopback/tunnel addresses. URL credentials, query strings, fragments, and ambiguous surrounding whitespace are rejected.

## Database rehearsal binding

`scripts/database/staging-rehearsal.sh` validates the manifest before opening a PostgreSQL session.

The resolved migration/runtime database must match the manifest's exact `database_name`. The rehearsal records the canonical target hash in:

`pre-migration/staging-target-binding.sha256`

and in its summary as:

`staging_target_binding_sha256=<sha256>`

`staging_target_database_name_match=true`

Existing Npgsql/psql advisory-lock target proof and distinct migration/runtime-role checks remain required.

## Application smoke binding

`scripts/staging/application-release-smoke.sh` validates the same manifest before the first HTTP request.

The supplied API base URL and Worker health URL must exactly match the normalized manifest values. The supplied database rehearsal summary must contain the same target fingerprint and successful database-name match.

The smoke evidence records:

- the canonical target hash,
- API target URL match,
- Worker target health URL match,
- existing API/Worker release-SHA and health checks.

A target mismatch fails before curl is invoked.

## Promotion binding

`scripts/staging/build-promotion-packet.sh` requires one target identity across:

- the database rehearsal summary,
- the application smoke summary,
- the application smoke's independent target-hash record.

A mismatch fails closed. Successful promotion evidence records:

`staging_target_binding=matched-across-database-and-application`

and the canonical target fingerprint.

## Security boundary

This manifest is an identity declaration, not a secret store and not a substitute for provider-native evidence.

It does not:

- create or mutate cloud resources,
- authenticate to a provider,
- prove that backup/restore evidence belongs to the declared provider resource,
- prove Worker dependency readiness,
- contact staging or production from CI,
- make a promotion decision.

Provider-native backup/PITR, restore, and deployment evidence remain separately required and human-reviewed.

## CI fixtures

The staging validation workflow verifies:

- canonical hashes are stable across JSON formatting/key order,
- resource identity changes produce a different hash,
- production manifests, unknown keys, URL credentials, unsafe remote HTTP, query strings, and connection-string-shaped resource IDs are rejected,
- a database rehearsal target mismatch blocks application smoke before HTTP,
- cross-target promotion evidence is rejected.
