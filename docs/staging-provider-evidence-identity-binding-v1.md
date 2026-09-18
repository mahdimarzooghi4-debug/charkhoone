# Staging provider evidence identity binding v1

## Purpose

This contract binds operator-supplied provider evidence to the same staging target identity used by the database rehearsal, application smoke, and promotion packet.

Raw provider exports remain separate files. A non-secret JSON metadata sidecar identifies what the raw evidence is supposed to prove and cryptographically binds to the exact raw file by SHA-256.

This is an identity/integrity check. It is not a cryptographic attestation from the cloud provider and does not replace human verification of provider-native screenshots, exports, audit logs, backup/PITR records, or deployment records.

## Evidence kinds

Supported kinds are:

- `database-backup`
- `database-restore`
- `message-broker-deployment`
- `worker-deployment`

For backup and restore evidence, the sidecar component identity refers to the protected/source staging database declared in the target manifest. A restore drill may use a separate disposable restore target; that restore target is still documented by the raw provider evidence and operator review.

For message-broker deployment evidence, the sidecar identity refers to the `message_broker` resource declared in the staging target manifest and hash-binds the exact raw provider evidence. Broker evidence is not tied to a release git SHA because the broker infrastructure is not necessarily redeployed per application release.

For Worker deployment evidence, the sidecar identity refers to the Worker resource declared in the staging target manifest and also binds the exact release git SHA.

## Metadata schema

Database backup/restore and message-broker deployment metadata contain exactly:

- `schema_version: 1`
- `environment: "staging"`
- `evidence_kind`
- `staging_target_binding_sha256`
- `provider`
- `scope_id`
- `resource_id`
- `raw_evidence_sha256`

Worker deployment metadata contains the same fields plus:

- `git_sha`

Unknown fields are rejected. This deliberately prevents credentials, tokens, connection strings, private keys, or arbitrary secrets from being smuggled into the accepted metadata schema.

The provider/scope/resource tuple must exactly match the corresponding component in `CHARKHOONE_STAGING_TARGET_MANIFEST`.

## Verifier

`scripts/staging/verify-provider-evidence.py`:

1. validates the staging target manifest,
2. validates the exact metadata schema and requested evidence kind,
3. recomputes the canonical staging target fingerprint,
4. compares provider/scope/resource identity to the target manifest,
5. streams the raw evidence file and computes SHA-256,
6. requires the metadata raw-evidence hash to match,
7. for Worker deployment, requires the metadata git SHA to equal the exact release SHA,
8. emits normalized hash evidence without printing raw provider content or credentials.

Successful output includes:

- `provider_evidence_component_identity=matched`
- `provider_evidence_target_binding_sha256=<sha256>`
- `provider_evidence_raw_sha256=<sha256>`
- `provider_evidence_metadata_sha256=<sha256>`
- `provider_evidence_git_sha=matched` for Worker deployment

## Database rehearsal

Real staging database rehearsal now additionally requires:

- `CHARKHOONE_STAGING_BACKUP_EVIDENCE_METADATA`
- `CHARKHOONE_STAGING_RESTORE_EVIDENCE_METADATA`

Backup and restore identity/hash binding is verified before any migration is run.

The rehearsal records both raw-evidence and metadata hashes and writes:

- `provider_backup_evidence=identity-and-raw-hash-verified`
- `provider_restore_evidence=identity-and-raw-hash-verified`

The existing Npgsql/psql target binding, database-name match, distinct database roles, provider evidence requirements, migration checks, readiness checks, and query-plan checks remain unchanged.

## Application smoke

Application smoke additionally requires:

- `CHARKHOONE_STAGING_MESSAGE_BROKER_EVIDENCE`
- `CHARKHOONE_STAGING_MESSAGE_BROKER_EVIDENCE_METADATA`
- `CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE_METADATA`

Message-broker provider evidence is verified against the `message_broker` target identity and exact raw evidence file before the first HTTP request. Worker provider evidence is then verified against the target manifest, exact raw deployment evidence file, and expected release SHA before the first HTTP request.

Smoke evidence records the raw deployment evidence hash and metadata hash independently. A provider/resource mismatch, wrong release SHA, or raw-evidence tamper therefore fails before API/Worker smoke traffic.

## Promotion packet

Promotion packet additionally requires:

- `CHARKHOONE_STAGING_TARGET_MANIFEST`
- `CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE_METADATA`

It re-runs the Worker provider evidence verifier and requires:

- current raw Worker evidence hash == smoke-time raw hash,
- current Worker metadata hash == smoke-time metadata hash,
- provider component identity == target manifest,
- metadata target fingerprint == database/application promotion target,
- metadata release SHA == exact promotion release SHA.

The packet records normalized hashes only and does not copy raw provider evidence.

## Security boundary

A valid metadata sidecar proves that the operator supplied a self-consistent identity declaration and that it hash-binds to one exact raw evidence file.

It does **not** prove that:

- the raw file was genuinely produced by the provider,
- the provider account itself is trustworthy,
- a screenshot/export has not been fabricated before hashing,
- backup retention/PITR policy is sufficient,
- a restore drill was operationally representative,
- staging is production-equivalent,
- promotion is safe.

Those remain provider-native evidence and human review responsibilities.

## CI fixtures

CI uses synthetic local files only. It verifies that:

- backup, restore, message-broker, and Worker deployment metadata succeed when fully matched,
- target fingerprint mismatch fails,
- provider resource mismatch fails,
- raw evidence tamper fails,
- wrong Worker git SHA fails,
- production metadata fails,
- unknown/secret fields fail,
- message-broker metadata mismatch blocks smoke before curl,
- Worker metadata mismatch blocks smoke before curl,
- promotion rejects raw broker/Worker evidence or metadata tampering.

CI does not contact a provider, staging, or production.
