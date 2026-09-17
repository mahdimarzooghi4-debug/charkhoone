# Dependency install reproducibility

Charkhoone treats the committed npm lockfiles as release inputs, not generated CI by-products.

## Required state

- `apps/web/package-lock.json` and `apps/mobile/package-lock.json` are committed and use lockfile version 3.
- CI installs web and mobile dependencies with `npm ci --no-audit --no-fund`.
- CI runs web and mobile with Node `22.13.1`.
- The web container installs from its committed lockfile with `npm ci`.
- `scripts/release/verify-node-dependency-locks.py` fails if a manifest and lock root disagree, a lockfile is missing, persistent workflows/Dockerfiles use `npm install`, a legacy-peer bypass is introduced, or the temporary mobile resolver remains.

## Reviewed dependency updates

Use Node `22.13.1` with its bundled npm `10.9.2`, then run:

```bash
bash scripts/release/resolve-node-dependency-locks.sh
```

Review both manifest and lockfile changes. The resolver deliberately regenerates lockfiles with npm, validates fresh installs with `npm ci`, runs typechecks, and then runs the repository verifier.

The mobile manifest explicitly includes `react-dom` `19.2.3` because Expo SDK 57 aligns with React `19.2.3`; this prevents npm from selecting an incompatible newer optional React DOM peer while keeping standard peer-dependency validation enabled.

## Evidence

Release CI records SHA-256 values for the committed web and mobile lockfiles. Container evidence records the web lockfile hash used by the web image build. These hashes bind dependency inputs to a release SHA; they are not an SBOM, package signature, vulnerability scan, or provenance attestation.

## Boundaries

This phase does not publish packages or images, contact staging or production, define a vulnerability severity threshold, or claim that npm registry artifacts are cryptographically signed by their publishers.
