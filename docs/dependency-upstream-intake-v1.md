# Dependency Upstream Intake V1

## Purpose

This phase makes dependency freshness visible without granting unattended mutation or promotion authority. It does not define a vulnerability-severity release threshold and it does not auto-merge dependency changes.

## Dependabot scope

`.github/dependabot.yml` monitors four lock-aware ecosystems on a weekly cadence:

- NuGet from the repository root.
- npm for `apps/web`.
- npm for `apps/mobile`.
- GitHub Actions from the repository root.

Docker is intentionally excluded. Charkhoone keeps a custom synchronized `deploy/base-images.lock`; changing a Dockerfile independently would violate the immutable base-image contract. Base-image freshness is therefore handled by a separate read-only drift check.

Dependabot PRs are ordinary pull requests. They do not bypass tests, review, or the four stable release gates. GitHub-side branch/ruleset enforcement is still an external administrator action and is not claimed to be active by this phase.

## Base-image drift check

`.github/workflows/base-image-drift.yml` runs weekly and can also be started manually. It has `contents: read` only. The workflow resolves current registry manifests using `scripts/release/resolve-base-image-digests.sh`, compares them with `deploy/base-images.lock`, uploads evidence even when drift is found, and then fails if the comparison did not pass.

Evidence contains public image references, lock hashes, a diff, and a machine-readable summary. The check does not push commits, create pull requests, update image pins, push images, deploy, or decide promotion.

If drift is reported, an operator must review the changed images, update all synchronized pins coherently, and let the existing container and supply-chain workflows rebuild, smoke-test, and scan the resulting images before merge.

## Current upstream vulnerability boundary

The two known mobile findings remain visible rather than suppressed:

- `expo-router -> query-string -> decode-uri-component@0.2.2` (`GHSA-vcc3-ghjq-m6fr`).
- `expo-splash-screen -> @expo/config-plugins -> xcode -> uuid@7.0.3` (`GHSA-w5hq-g745-h8pq`).

The current npm audit path proposes incompatible Expo changes, so this phase does not introduce forced installs or dependency overrides. A future compatible upstream update can arrive through the normal Dependabot/PR validation path.

## Explicit non-claims

This phase does not claim that Dependabot has already opened any PR, that GitHub branch protection is enabled, that staging or production was contacted, that an image was pushed to a registry, or that any release was deployed.
