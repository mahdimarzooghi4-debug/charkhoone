# Staging release promotion evidence

This promotion packet binds the exact release SHA to release CI, the real staging database rehearsal, application/API smoke evidence, Worker HTTP liveness evidence, and provider deployment evidence.

It does not deploy anything, does not contact staging by itself, and does not make the production promotion decision.

## Required evidence

For one full 40-character release SHA, collect:

1. Real staging database rehearsal `summary.txt`.
2. Full application-smoke evidence directory.
3. The same message-broker provider evidence and metadata files used during application smoke.
4. The same Worker provider/deployment evidence file used during application smoke.
5. The same Worker deployment evidence metadata sidecar used during application smoke.
6. The staging target manifest used by rehearsal/smoke.
7. `release-ci-evidence.txt` from the successful CI run for the same SHA.
8. The application smoke's `staging-target-binding.sha256` record.
9. An exact repository checkout at that SHA.

The application smoke must now prove Worker HTTP health. Its summary must contain:

- `worker_release_sha=matched-operator-platform-evidence`
- `worker_http_release_header=matched`
- `worker_http_liveness=passed`
- `worker_http_readiness=passed`
- `worker_http_identity=matched`
- `worker_deployment_evidence=identity-and-raw-hash-verified`
- `worker_deployment_metadata=hash-recorded`

Its HTTP status evidence must include both `worker_health_live=200` and `worker_health_ready=200`.

## Promotion packet validation

`scripts/staging/build-promotion-packet.sh` rejects the packet unless:

- release CI, database rehearsal, and application smoke all refer to the same SHA,
- database rehearsal summary, application smoke summary, and target-hash record contain one identical staging target fingerprint,
- database rehearsal passed migration/readiness/query-plan gates,
- application smoke passed API auth/readiness checks,
- Worker HTTP liveness, release header, and service identity were all validated,
- message-broker evidence and metadata are byte-for-byte the same files whose SHA-256 values were recorded at smoke time,
- message-broker provider/scope/resource identity matches the target manifest,
- Worker deployment evidence is byte-for-byte the same file whose SHA-256 was recorded at smoke time,
- Worker deployment metadata is byte-for-byte the same sidecar whose SHA-256 was recorded at smoke time,
- Worker provider/scope/resource identity matches the target manifest,
- Worker metadata target fingerprint and git SHA match the promotion target and release SHA.

The generated `promotion-readiness.txt` records:

- `worker_http_release_header=validated`
- `worker_http_liveness=validated`
- `worker_http_readiness=validated`
- `worker_http_identity=validated`
- `database_provider_evidence_hashes=validated`
- `message_broker_evidence_hash_binding=matched`
- `message_broker_metadata_hash_binding=matched`
- `message_broker_provider_identity=matched-target-manifest`
- `worker_deployment_evidence_hash_binding=matched`
- `worker_deployment_metadata_hash_binding=matched`
- `worker_provider_identity=matched-target-manifest`
- `staging_target_binding=matched-across-database-and-application`
- `staging_target_binding_sha256=<sha256>`
- `promotion_decision=human-required`
- `deployment_action=none`

The packet stores hashes and normalized results only; it does not copy raw credentials or external evidence.

## Worker health boundary

Worker `/health/live` remains an independent host/process liveness check. Worker `/health/ready` separately proves current reachability of PostgreSQL and enabled RabbitMQ plus configuration readiness of external adapters required by enabled Worker features. It does not prove external provider reachability or provider provenance; provider deployment evidence remains separately required and hash-bound.

## CI validation

`.github/workflows/staging-release-ops-validation.yml` runs without staging secrets. It:

- syntax-checks all staging shell scripts,
- builds a promotion packet from synthetic evidence,
- proves Worker HTTP liveness evidence is mandatory,
- proves cross-target database/application evidence is rejected,
- proves post-smoke Worker raw evidence and metadata tampering are rejected,
- validates canonical staging target manifest semantics,
- validates backup/restore/message-broker/Worker provider-evidence identity binding semantics.

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
