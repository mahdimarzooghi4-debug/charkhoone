# Supply-chain evidence

This phase produces SHA-bound software composition evidence without inventing a vulnerability release policy.

## Scope

The `supply-chain-evidence` workflow generates CycloneDX JSON SBOMs for six targets:

- backend source dependency graph after .NET restore/build
- web source dependency graph from the npm lockfile/install
- mobile source dependency graph from the npm lockfile/install
- API container image
- Worker container image
- Web container image

Each SBOM is scanned with Grype and the raw JSON result is retained. `summary.tsv` contains component counts and vulnerability counts by reported severity for review. Those counts are evidence only; they are not a pass/fail release verdict because no approved severity threshold is defined in this repository.

## Tool identity

`deploy/supply-chain-tools.lock` pins the exact Syft and Grype versions and SHA-256 values of their official Linux amd64 release archives. `scripts/release/install-supply-chain-tools.sh` downloads only those versioned GitHub release assets, verifies the archive digest before extraction, and checks the installed tool version. Mutable `latest` URLs and installer-pipe patterns are intentionally not used.

The current pinned tools are Syft `1.52.0` and Grype `0.119.0`.

## Vulnerability database

Grype's vulnerability database is time-varying upstream data. Each workflow run updates the database once, records `grype db status -o json`, then disables automatic database updates for the six scans so all findings in that run use one database snapshot. The local database cache itself is removed before artifact upload.

This provides evidence of which database metadata was used but does not claim historical reproducibility across different run dates. A future control may archive or independently pin the Grype database if that becomes a release requirement.

## Evidence binding

The capture script rejects a checkout whose full Git SHA differs from `CHARKHOONE_RELEASE_SHA` and verifies that each locally built container carries the same `org.opencontainers.image.revision` label. The evidence manifest records hashes for the supply-chain tool lock, central .NET package versions, both npm lockfiles, the base-image lock, local image IDs, all SBOMs, all vulnerability reports, the Grype database status, and the generated summary.

The evidence explicitly records:

- `vulnerability_policy_gate=not-defined`
- findings are evidence rather than a release verdict
- signed attestation is not claimed
- SLSA provenance is not claimed
- registry push and deployment are not performed
- staging and production are not contacted

## Local reproduction

On Linux amd64 with Docker, .NET 10, Node `22.13.1`, npm, Python 3, curl, tar, and sha256sum available:

```bash
dotnet restore Charkhoone.slnx
dotnet build Charkhoone.slnx --configuration Release --no-restore
(cd apps/web && npm ci --no-audit --no-fund)
(cd apps/mobile && npm ci --no-audit --no-fund)

export SHA="$(git rev-parse HEAD)"
docker build --build-arg VCS_REF="$SHA" -f src/Charkhoone.Api/Dockerfile -t "charkhoone-api:$SHA" .
docker build --build-arg VCS_REF="$SHA" -f src/Charkhoone.Worker/Dockerfile -t "charkhoone-worker:$SHA" .
docker build --build-arg VCS_REF="$SHA" -f apps/web/Dockerfile -t "charkhoone-web:$SHA" apps/web

export CHARKHOONE_RELEASE_SHA="$SHA"
export CHARKHOONE_API_IMAGE="charkhoone-api:$SHA"
export CHARKHOONE_WORKER_IMAGE="charkhoone-worker:$SHA"
export CHARKHOONE_WEB_IMAGE="charkhoone-web:$SHA"
export CHARKHOONE_SUPPLY_CHAIN_BIN_DIR="$PWD/.tools/supply-chain"

bash scripts/release/install-supply-chain-tools.sh
bash scripts/release/capture-supply-chain-evidence.sh
```

No customer data or connection strings are required by this workflow.
