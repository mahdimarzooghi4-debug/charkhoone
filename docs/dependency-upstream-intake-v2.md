# Dependency Upstream Intake V2

## Purpose

This phase hardens dependency update intake after validating the first real Dependabot wave against Charkhoone's existing immutable dependency contracts. It does not auto-merge dependency changes, grant write-scoped workflow permissions, define a vulnerability-severity release threshold, push images, deploy, or decide promotion.

## Dependabot scope

`.github/dependabot.yml` keeps weekly update intake for three ecosystems:

- NuGet from the repository root.
- npm for `apps/web`.
- npm for `apps/mobile`, with `versioning-strategy: lockfile-only`.

GitHub Actions and Docker are intentionally excluded from direct Dependabot updates because both are governed by synchronized immutable lock files that a standalone Dependabot PR does not update atomically.

Mobile uses lockfile-only updates because current CI installs and typechecks the Expo/React Native application but does not perform a native Android or iOS build. Manifest-level React, React Native, Expo, or toolchain upgrades therefore require a deliberate compatibility change with appropriate validation rather than an unattended version bump.

## CI dependency drift

`.github/workflows/ci-dependency-drift.yml` is scheduled weekly and can be run manually. It has `contents: read` only. The workflow runs `scripts/release/check-ci-dependency-drift.sh`, which resolves the identities produced by `scripts/release/resolve-ci-dependencies.sh` and compares them with `deploy/ci-dependencies.lock`.

The resolver keeps the already approved action major lines explicit:

- `actions/checkout` v5
- `actions/setup-dotnet` v5
- `actions/setup-node` v4
- `actions/upload-artifact` v4
- `postgres:17-alpine`

A changed SHA or PostgreSQL digest inside those approved lines is reported as drift with hashes, a diff, and a machine-readable summary. The workflow uploads evidence even when drift or resolution failure is detected and then fails closed. It does not modify repository files or create a pull request.

An action major-version upgrade is a policy change, not a freshness refresh. It must update the resolver, `deploy/ci-dependencies.lock`, all synchronized workflow pins, and pass the normal repository governance, CI, container, and supply-chain gates together.

## Base-image drift

The V1 base-image drift workflow remains unchanged in role: it compares registry-resolved image identities with `deploy/base-images.lock` using read-only evidence and no repository mutation.

## Evidence from the first Dependabot wave

After V1 merged, GitHub accepted the Dependabot configuration and opened update PRs. A direct `actions/checkout` update changed workflow pins without changing `deploy/ci-dependencies.lock`; repository governance, CI, container, and supply-chain workflows all failed on that PR as designed. V2 removes the GitHub Actions ecosystem from Dependabot so that known-invalid PR shape is no longer generated.

The initial mobile Dependabot wave also proposed manifest-level React Native, React, TypeScript, and native-library updates. Because the current mobile gate is typecheck-only, V2 restricts future mobile Dependabot changes to lockfile-only updates inside the existing manifest constraints.

## Current mobile vulnerability boundary

The two known mobile findings remain visible rather than suppressed:

- `expo-router -> query-string -> decode-uri-component@0.2.2` (`GHSA-vcc3-ghjq-m6fr`).
- `expo-splash-screen -> @expo/config-plugins -> xcode -> uuid@7.0.3` (`GHSA-w5hq-g745-h8pq`).

No forced install, override, or incompatible Expo downgrade/upgrade is introduced to hide them. Compatible upstream resolution remains subject to the existing dependency and release gates.

## Explicit non-claims

This phase does not claim GitHub branch protection or ruleset enforcement is active, does not claim any Dependabot PR is safe merely because it exists, does not claim a native mobile build has run, and does not contact staging or production.
