# Staging release promotion evidence

This promotion packet binds the exact release SHA to release CI, the real staging database rehearsal, application/API smoke evidence, Worker HTTP liveness evidence, and provider deployment evidence.

It does not deploy anything, does not contact staging by itself, and does not make the production promotion decision.

## Required evidence

For one full 40-character release SHA, collect:

1. Real staging database rehearsal `summary.txt`.
2. Full application-smoke evidence directory.
3. The same Worker provider/deployment evidence file used during application smoke.
4. `release-ci-evidence.txt` from the successful CI run for the same SHA.
5. An exact repository checkout at that SHA.

The application smoke must now prove Worker HTTP health. Its summary must contain:

- `worker_release_sha=matched-operator-platform-evidence`
- `worker_http_release_header=matched`
- `worker_http_liveness=passed`
- `worker_http_identity=matched`
- `worker_deployment_evidence=hash-recorded`

Its HTTP status evidence must include `worker_health_live=200`.

## Promotion packet validation

`scripts/staging/build-promotion-packet.sh` rejects the packet unless:

- release CI, database rehearsal, and application smoke all refer to the same SHA,
- database rehearsal passed migration/readiness/query-plan gates,
- application smoke passed API auth/readiness checks,
- Worker HTTP liveness, release header, and service identity were all validated,
- Worker deployment evidence is byte-for-byte the same file whose SHA-256 was recorded at smoke time.

The generated `promotion-readiness.txt` records:

- `worker_http_release_header=validated`
- `worker_http_liveness=validated`
- `worker_http_identity=validated`
- `worker_deployment_evidence_hash_binding=matched`
- `promotion_decision=human-required`
- `deployment_action=none`

The packet stores hashes and normalized results only; it does not copy raw credentials or external evidence.

## Worker health boundary

Worker `/health/live` is an independent host/process liveness check. It does not assert Worker dependency readiness for PostgreSQL, RabbitMQ, or external adapters. Provider deployment evidence remains separately required and hash-bound.

## CI validation

`.github/workflows/staging-release-ops-validation.yml` runs without staging secrets. It:

- syntax-checks all staging shell scripts,
- builds a promotion packet from synthetic evidence,
- proves Worker HTTP liveness evidence is mandatory,
- proves post-smoke Worker provider evidence tampering is rejected.

This validates tooling semantics only. It does not contact staging or production.

## Human review

Before any production promotion, independently verify:

- release CI provenance for the exact SHA,
- real staging—not CI PostgreSQL—was used,
- provider-native backup/PITR and restore evidence is authentic/current,
- API and Worker were deployed from the exact SHA,
- Worker HTTP liveness was measured against the intended staging Worker,
- deployment-platform evidence is authentic,
- unresolved financial policy was not introduced through configuration or manual data operations.

The packet is necessary evidence, not an automatic go/no-go decision.

## Rerun and reader/writer consistency

An opted-in packet attempt with a valid target SHA invalidates any previous `promotion-readiness.txt` before validating release inputs. A failure cannot leave the prior packet's completion marker in place. New hashes/normalized checks are staged privately; the readiness marker is atomically renamed last. A previous `evidence-manifest.tsv` without the readiness marker is incomplete evidence and must not be used to approve promotion.

The packet builder holds a shared lock on the application smoke evidence directory while checking and hashing it, preventing a cooperating smoke writer from replacing that evidence mid-read. It holds an exclusive lock on its own output directory for the attempt. A concurrent writer/reader conflict fails closed. Operator-supplied external evidence must remain stable; these locks do not lock provider files or attest provider truth. Already generated packets are historical records and are not automatically revoked when a later smoke attempt fails; an operator must collect a fresh successful packet for the intended attempt.

The CI packet fixture now verifies missing Worker proof and tampered provider evidence invalidate previous readiness, and that a held smoke writer lock blocks packet creation. The staging validation workflow also runs on matching `main` pushes, allowing post-merge verification. No deployment, credentials, live ruleset enforcement, staging contact or production contact is implied by these synthetic tests.
