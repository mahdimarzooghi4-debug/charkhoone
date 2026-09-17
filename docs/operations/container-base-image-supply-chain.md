# Container base-image supply chain

Charkhoone release containers use immutable registry manifest digests for every checked-in base image. Tags remain in the references for readability, but the `@sha256:...` digest is the build identity.

## Locked inputs

`deploy/base-images.lock` is the canonical lock for:

- .NET SDK used to publish API and Worker;
- ASP.NET Core runtime used by API;
- .NET runtime used by Worker;
- Node runtime used by all Web build/runtime stages;
- Nginx runtime used by the release Compose contract.

The Dockerfiles do not use an external `# syntax=` frontend because the current Dockerfiles require no frontend-specific features. This avoids adding another mutable build image outside the lock.

## Verification

Run:

```bash
python3 scripts/release/verify-base-image-pins.py
```

The verifier fails closed when:

- the lock is malformed, incomplete, duplicated, or not digest-pinned;
- any Dockerfile `FROM` reference is not pinned by SHA-256;
- Dockerfile references drift from the lock;
- the release Compose Nginx image drifts from the lock;
- a Dockerfile reintroduces a mutable syntax frontend directive.

The `container-images` GitHub Actions workflow runs this verification before any application image build. Its SHA-bound evidence includes the SHA-256 of `deploy/base-images.lock` and a copy of the lock itself.

## Refresh procedure

Base-image rotation is an explicit reviewed source change, not an automatic deployment action.

1. Run `scripts/release/resolve-base-image-digests.sh` from the repository root. The script queries registry manifest metadata and writes multi-platform manifest digests to `deploy/base-images.lock`.
2. Review the changed upstream tags/digests and upstream release/security notes as appropriate for the release.
3. Update the matching Dockerfile `FROM` references and release Compose Nginx reference to exactly match the new lock.
4. Run `python3 scripts/release/verify-base-image-pins.py`.
5. Require the normal project CI plus `container-images` build/smoke workflow on the exact commit before merge.

Refreshing a digest does not itself prove an upstream image is vulnerability-free. This phase establishes immutable/reviewable base-image identity; it does not invent a vulnerability-severity release policy and does not claim image signing, registry provenance, or a deployed artifact signature.

## Deployment boundary

Application image references supplied to `deploy/compose.release.yaml` must themselves be immutable references from the selected registry. No registry has been selected in the repository, and the current CI still does not push images or deploy staging/production.
