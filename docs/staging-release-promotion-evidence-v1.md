# Staging release promotion evidence v1

## Purpose

This phase turns the existing staging database rehearsal and application smoke evidence into a single SHA-bound promotion handoff.

It does **not** deploy the API or Worker, approve a production promotion, or claim that staging has been exercised when the required external evidence is absent.

The repository still has no application deployment workflow. Deployment-platform actions remain external to this phase.

## Release identity

Every evidence input must refer to the same full 40-character git SHA.

The release checkout used to run the staging application smoke and the promotion packet builder must itself be at that exact SHA. `scripts/staging/application-release-smoke.sh` now blocks when `git rev-parse HEAD` differs from `CHARKHOONE_EXPECTED_GIT_SHA`.

The deployed API must expose that SHA through `X-Charkhoone-Release-Sha`, as introduced by the previous staging application smoke phase.

The Worker still has no HTTP health surface. Worker deployment evidence therefore proves only the operator/platform evidence supplied to the smoke runner and its release-SHA binding. It must not be described as a Worker health check.

## Canonical CI evidence

The main `ci` workflow now emits a `release-evidence` job only after the backend, web, and mobile jobs all succeed.

The uploaded artifact is named:

```text
release-ci-evidence-<git-sha>
```

It contains `release-ci-evidence.txt` in this exact machine-readable shape:

```text
environment=ci
git_sha=<full-40-character-sha>
workflow=ci
conclusion=success
backend=success
web=success
mobile_typecheck=success
mobile_build=not-claimed
```

`mobile_build=not-claimed` is intentional. The current mobile CI job installs dependencies and runs typecheck; it does not build a mobile application package.

The promotion packet validates this file's content and SHA. The operator must still obtain it from the successful GitHub Actions run for the same release SHA rather than recreating it manually.

## Required evidence

Before building a promotion packet, collect all of the following for one release SHA:

1. The real staging database rehearsal `summary.txt` from `scripts/database/staging-rehearsal.sh`.
2. The full application-smoke evidence directory produced by `scripts/staging/application-release-smoke.sh` for the same SHA.
3. The same Worker deployment-platform evidence file used by the application smoke.
4. `release-ci-evidence.txt` downloaded from the successful `ci` run for the same SHA.
5. An exact repository checkout at the same SHA.

The application-smoke evidence directory is expected to contain:

```text
summary.txt
http-statuses.txt
database-rehearsal-summary.sha256
worker-deployment-evidence.sha256
```

The promotion builder recomputes the database-summary and Worker-evidence hashes and requires them to match the hashes recorded when the application smoke ran. This prevents silently swapping those inputs after smoke completion.

## Build the promotion packet

Run from the exact release checkout:

```bash
export CHARKHOONE_EXPECTED_GIT_SHA='<full-release-sha>'
export CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY='<path-to-database-rehearsal-summary.txt>'
export CHARKHOONE_STAGING_APPLICATION_SMOKE_DIR='<path-to-application-smoke-evidence-directory>'
export CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE='<path-to-worker-provider-evidence>'
export CHARKHOONE_RELEASE_CI_EVIDENCE='<path-to-release-ci-evidence.txt>'
export CHARKHOONE_ALLOW_STAGING_PROMOTION_PACKET=true

bash scripts/staging/build-promotion-packet.sh
```

Optional output root:

```bash
export CHARKHOONE_STAGING_PROMOTION_PACKET_DIR='<output-root>'
```

Default output:

```text
artifacts/staging/promotion-packet/<git-sha>/
```

## Packet contents

The builder writes only normalized checks and hashes. It deliberately does not copy raw external evidence into the packet.

`evidence-manifest.tsv` contains SHA-256 hashes for:

- database rehearsal summary,
- application smoke summary,
- application smoke HTTP status evidence,
- the application smoke's database-hash record,
- the application smoke's Worker-hash record,
- Worker deployment evidence,
- release CI evidence.

`promotion-readiness.txt` records:

- exact source-checkout SHA match,
- release CI evidence validation,
- database rehearsal validation,
- application smoke validation,
- database-summary hash binding,
- Worker deployment-evidence hash binding,
- the explicit limitation that Worker health is not proven,
- that the smoke did not exercise financial mutations,
- that credentials were not collected into the packet,
- that the script performed no deployment,
- that the promotion decision remains human-required.

## Human promotion review

A generated packet is necessary evidence, not an approval. Before any production promotion, the reviewer must independently verify the provenance of the referenced external evidence and the release process used by the actual deployment platform.

At minimum, confirm:

- the GitHub Actions `ci` run for the packet SHA completed successfully and is the source of `release-ci-evidence.txt`,
- the staging database rehearsal was a real authorized staging run, not CI PostgreSQL,
- provider-native backup/PITR and restore-drill evidence referenced by the database rehearsal is authentic and current for the intended release window,
- API and Worker were deployed from the same release SHA,
- the application smoke was run against the intended staging environment after deployment,
- the Worker deployment evidence is reviewed separately because no Worker HTTP health probe exists,
- unresolved business policy has not been introduced through deployment configuration or manual data operations.

The packet must not be interpreted as an automatic go/no-go decision.

## CI validation for this tooling

`.github/workflows/staging-release-ops-validation.yml` runs without staging secrets. It:

- parses every `scripts/staging/*.sh` file with `bash -n`,
- builds a promotion packet from synthetic evidence,
- verifies the positive SHA/hash-bound case,
- mutates Worker evidence after the synthetic smoke record and verifies that packet generation fails.

This workflow validates the evidence tooling only. It does not contact staging or production.

## Explicit non-goals and policy boundaries

This phase does not:

- create or configure a deployment platform,
- deploy API, Worker, web, or mobile artifacts,
- apply a database migration to staging or production,
- turn CI PostgreSQL into staging evidence,
- claim Worker health from deployment evidence,
- exercise financial mutation endpoints during staging smoke,
- invent the undefined 3% lost-fund-return day-count/rounding/partial-allocation formula,
- invent partial-payment allocation policy,
- invent early-cancellation Frozen Principal release timing,
- reinterpret an external `Unknown` transaction as `Failed` or authorize blind retry.
