# Mobile Export Build & Release Evidence V1

## Purpose

This phase adds an actual production export validation path for the Expo mobile application on both Android and iOS. It closes the gap where CI only typechecked the mobile source, while preserving precise claims about what has and has not been built.

## What is built

The `mobile-export-build` workflow first verifies the checked-in mobile API/OIDC runtime boundary, installs dependencies from `apps/mobile/package-lock.json`, runs TypeScript typechecking, and executes:

- `expo export --platform android`
- `expo export --platform ios`

Both commands run with `CI=1` and must produce non-empty output directories.

For each platform, CI records a sorted SHA-256 manifest of every exported file. A SHA-bound summary records the exact Git commit, file counts, Node version, runtime-wiring verification, typecheck result, and platform export result.

The runtime-wiring verification proves source-level invariants for the mobile public OIDC client: code + PKCE, SecureStore use, no client secret, constrained API origin/path behavior, and removal of the old synthetic values from the primary authenticated screens. It does not authenticate against a real OIDC provider.

## Stable gate

The job/check name is:

`mobile-export-build-gate`

The workflow runs on feature-branch pushes, pull requests targeting `main`, and pushes to `main`.

## Evidence artifact

Each successful run uploads:

`mobile-export-evidence-<git-sha>`

with:

- `mobile-export-evidence.txt`
- `android-files.sha256`
- `ios-files.sha256`

The artifact is retained for 30 days.

## Claim boundaries

A successful Expo production export proves that Metro/Expo can resolve and bundle the current application source and assets for the Android and iOS platforms under the locked Node/npm dependency graph.

It does **not** prove or claim:

- an Android APK/AAB was compiled;
- an iOS IPA was compiled;
- native Gradle/Xcode compilation succeeded;
- a signed mobile artifact exists;
- Play Store or App Store submission readiness;
- EAS credentials, keystores, provisioning profiles, or signing identities were used.

The existing `release-ci-evidence.txt` line `mobile_build=not-claimed` remains intentionally unchanged because that evidence contract refers to a native mobile application build. The new mobile export artifact is a separate, narrower claim.

## Validation history

Before the permanent workflow was added, a temporary analysis workflow executed the same Android and iOS production exports against the current lockfile. Both platform exports, typecheck, output verification, and evidence upload succeeded. The temporary analysis workflow was removed before the final branch state.

## Remaining mobile dependency findings

The existing two Medium transitive mobile dependency findings remain visible. This phase does not suppress or override them and does not force an incompatible Expo dependency upgrade.
