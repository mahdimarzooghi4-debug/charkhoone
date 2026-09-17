# CI dependency supply chain

Charkhoone pins every external GitHub Action used by persistent workflows to a full 40-character commit SHA and pins the PostgreSQL CI service image to an immutable registry manifest digest.

## Canonical lock

`deploy/ci-dependencies.lock` is the reviewed source of truth for:

- `actions/checkout`;
- `actions/setup-dotnet`;
- `actions/setup-node`;
- `actions/upload-artifact`;
- the `postgres:17-alpine` service image used by backend integration CI.

Readable major/tag names remain only in comments or in the image tag portion; execution identity is the commit SHA or `@sha256:` manifest digest.

## Verification

Run:

```bash
python3 scripts/release/verify-ci-dependency-pins.py
```

The verifier fails closed when the lock is malformed or incomplete, an external `uses:` reference is not a full commit SHA, a workflow introduces an external action not represented by the lock, the PostgreSQL service image drifts from the lock, or the temporary write-enabled resolver workflow is present in the final tree.

Main CI runs this verifier immediately after backend checkout. Container CI also runs it alongside the base-image lock verifier. Release CI evidence records the SHA-256 of the CI dependency lock so dependency identity is bound to the exact release commit.

## Refresh procedure

Dependency rotation is an explicit reviewed source change.

1. Run `scripts/release/resolve-ci-dependencies.sh` from the repository root. It resolves GitHub tag refs through the GitHub API and the PostgreSQL multi-platform manifest digest through Docker Registry metadata.
2. Review upstream action releases and PostgreSQL image/release notes appropriate to the change.
3. Update all matching persistent workflow `uses:` references and the PostgreSQL service image to exactly match the lock.
4. Run `python3 scripts/release/verify-ci-dependency-pins.py` and `python3 scripts/release/verify-base-image-pins.py`.
5. Require normal CI and container-image checks on the exact commit before merge.

The resolver does not automatically modify workflows or deploy anything. A new external action requires an intentional lock/schema update; the verifier rejects it by default.

## Scope and limits

This establishes immutable identities for the current workflow actions and PostgreSQL CI image. It does not claim that a dependency is vulnerability-free, does not invent a vulnerability-severity release threshold, and does not provide artifact signing or deployment provenance by itself.
