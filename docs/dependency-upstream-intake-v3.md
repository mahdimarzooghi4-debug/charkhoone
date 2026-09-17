# Dependency Upstream Intake V3

## Purpose

This phase hardens dependency update intake after validating the first real Dependabot wave against Charkhoone's immutable dependency contracts. It does not auto-merge dependency changes, grant write-scoped workflow permissions, define a vulnerability-severity release threshold, push images, deploy, or decide promotion.

## Dependabot scope

`.github/dependabot.yml` keeps weekly update intake for three ecosystems:

- NuGet from the repository root.
- npm for `apps/web`.
- npm for `apps/mobile`, with `versioning-strategy: lockfile-only`.

GitHub Actions and Docker are intentionally excluded from direct Dependabot updates because both are governed by synchronized immutable lock files that a standalone Dependabot PR does not update atomically.

Mobile remains lockfile-only even though the repository now runs TypeScript validation plus Android and iOS Expo production exports. Those exports are valuable JavaScript/bundle evidence, but they are not native APK/AAB/IPA builds and do not exercise signing, Gradle/Xcode compilation, provisioning, or device/runtime compatibility. Manifest-level React, React Native, Expo, or native-toolchain upgrades therefore require a deliberate compatibility change with appropriate validation rather than an unattended version bump.

## CI dependency drift

`.github/workflows/ci-dependency-drift.yml` is scheduled weekly and can be run manually. It has `contents: read` only. The workflow runs `scripts/release/check-ci-dependency-drift.sh`, which resolves the identities produced by `scripts/release/resolve-ci-dependencies.sh` and compares them with `deploy/ci-dependencies.lock`.

The resolver keeps the already approved dependency lines explicit:

- `actions/checkout` v5
- `actions/setup-dotnet` v5
- `actions/setup-node` v4
- `actions/upload-artifact` v4
- `postgres:17-alpine`

A changed SHA or PostgreSQL digest inside those approved lines is reported as drift with hashes, a diff, and a machine-readable summary. The workflow uploads evidence even when drift or resolution failure is detected and then fails closed. It does not modify repository files or create a pull request.

An action major-version upgrade is a policy change, not a freshness refresh. It must update the resolver, `deploy/ci-dependencies.lock`, all synchronized workflow pins, and pass the normal repository governance, release CI, container, supply-chain, and mobile-export gates together.

## Base-image drift

The existing base-image drift workflow remains unchanged in role: it compares registry-resolved image identities with `deploy/base-images.lock` using read-only evidence and no repository mutation.

## Evidence from the first Dependabot wave

The first direct GitHub Actions Dependabot wave demonstrated an invalid update shape for this repository: a workflow action ref could move without the synchronized `deploy/ci-dependencies.lock` moving in the same change. The repository's immutable-pin verification correctly rejected that shape. V3 removes the GitHub Actions ecosystem from Dependabot and keeps freshness detection in the read-only CI dependency drift workflow instead.

The first mobile wave also proposed manifest-level React Native, React, TypeScript, and native-library updates. The current mobile gate is stronger than it was at that time because Android and iOS Expo production exports now run, but native platform builds are still not part of the repository gate. Lockfile-only intake therefore remains the accurate automated boundary.

## Governance evidence correction

`repository-governance` evidence now records all five stable required checks, including `mobile-export-build-gate`, and the static governance verifier requires that exact evidence string. This closes a drift where the policy had five stable checks but the emitted governance evidence still listed four.

## Current mobile vulnerability boundary

Known mobile findings remain visible rather than being suppressed. This phase does not use forced installs, peer-dependency bypasses, or incompatible Expo changes to hide them. Compatible upstream resolution remains subject to the repository's dependency and release gates.

## Explicit non-claims

This phase does not claim GitHub branch protection or ruleset enforcement is active, does not claim any Dependabot PR is safe merely because it exists, does not claim a native mobile binary build has run, and does not contact staging or production.
