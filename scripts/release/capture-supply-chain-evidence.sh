#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EVIDENCE_DIR="${CHARKHOONE_SUPPLY_CHAIN_EVIDENCE_DIR:-${ROOT}/artifacts/supply-chain}"
BIN_DIR="${CHARKHOONE_SUPPLY_CHAIN_BIN_DIR:-${ROOT}/.tools/supply-chain}"
EXPECTED_SHA="${CHARKHOONE_RELEASE_SHA:-}"
API_IMAGE="${CHARKHOONE_API_IMAGE:-}"
WORKER_IMAGE="${CHARKHOONE_WORKER_IMAGE:-}"
WEB_IMAGE="${CHARKHOONE_WEB_IMAGE:-}"

case "$EVIDENCE_DIR" in
  /*) ;;
  *) EVIDENCE_DIR="${ROOT}/${EVIDENCE_DIR}" ;;
esac
case "$BIN_DIR" in
  /*) ;;
  *) BIN_DIR="${ROOT}/${BIN_DIR}" ;;
esac

fail() {
  printf 'supply-chain-evidence-error: %s\n' "$*" >&2
  exit 1
}

[[ "$EXPECTED_SHA" =~ ^[0-9a-f]{40}$ ]] || fail "CHARKHOONE_RELEASE_SHA must be a full Git SHA"
actual_sha="$(git -C "$ROOT" rev-parse HEAD)"
[[ "$actual_sha" == "$EXPECTED_SHA" ]] || fail "checked-out SHA does not match CHARKHOONE_RELEASE_SHA"

for command_name in docker npm dotnet python3 sha256sum; do
  command -v "$command_name" >/dev/null || fail "${command_name} is required"
done
[[ -x "${BIN_DIR}/syft" ]] || fail "pinned Syft binary is missing"
[[ -x "${BIN_DIR}/grype" ]] || fail "pinned Grype binary is missing"
[[ -n "$API_IMAGE" && -n "$WORKER_IMAGE" && -n "$WEB_IMAGE" ]] || fail "all three image tags are required"

for image in "$API_IMAGE" "$WORKER_IMAGE" "$WEB_IMAGE"; do
  docker image inspect "$image" >/dev/null 2>&1 || fail "required local image is missing"
  revision="$(docker image inspect "$image" --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}')"
  [[ "$revision" == "$EXPECTED_SHA" ]] || fail "image revision label does not match release SHA"
done

rm -rf "$EVIDENCE_DIR"
mkdir -p "$EVIDENCE_DIR/sbom" "$EVIDENCE_DIR/vulnerability" "$EVIDENCE_DIR/metadata"

export SYFT_CHECK_FOR_APP_UPDATE=false

"${BIN_DIR}/syft" "dir:${ROOT}/src" \
  -o "cyclonedx-json=${EVIDENCE_DIR}/sbom/backend-source.cdx.json"

(
  cd "${ROOT}/apps/web"
  npm sbom --sbom-format=cyclonedx --sbom-type=application \
    > "${EVIDENCE_DIR}/sbom/web-source.cdx.json"
)

# npm 10.9.2 rejects Expo's installed optional peer override while `npm ci`
# succeeds from the committed lockfile. Catalog the same lockfile-backed install
# with Syft instead of weakening npm peer validation with bypass flags.
"${BIN_DIR}/syft" "dir:${ROOT}/apps/mobile" \
  -o "cyclonedx-json=${EVIDENCE_DIR}/sbom/mobile-source.cdx.json"

"${BIN_DIR}/syft" "docker:${API_IMAGE}" \
  -o "cyclonedx-json=${EVIDENCE_DIR}/sbom/api-image.cdx.json"
"${BIN_DIR}/syft" "docker:${WORKER_IMAGE}" \
  -o "cyclonedx-json=${EVIDENCE_DIR}/sbom/worker-image.cdx.json"
"${BIN_DIR}/syft" "docker:${WEB_IMAGE}" \
  -o "cyclonedx-json=${EVIDENCE_DIR}/sbom/web-image.cdx.json"

export GRYPE_DB_CACHE_DIR="${EVIDENCE_DIR}/.grype-db-cache"
export GRYPE_DB_VALIDATE_BY_HASH_ON_START=true
export GRYPE_DB_AUTO_UPDATE=true
"${BIN_DIR}/grype" db update
"${BIN_DIR}/grype" db status -o json > "${EVIDENCE_DIR}/grype-db-status.json"
export GRYPE_DB_AUTO_UPDATE=false

for name in backend-source web-source mobile-source api-image worker-image web-image; do
  "${BIN_DIR}/grype" "sbom:${EVIDENCE_DIR}/sbom/${name}.cdx.json" \
    -o json > "${EVIDENCE_DIR}/vulnerability/${name}.grype.json"
done

python3 "${ROOT}/scripts/release/verify-supply-chain-artifacts.py" "$EVIDENCE_DIR"

tool_lock_sha="$(sha256sum "${ROOT}/deploy/supply-chain-tools.lock" | awk '{print $1}')"
packages_props_sha="$(sha256sum "${ROOT}/Directory.Packages.props" | awk '{print $1}')"
web_lock_sha="$(sha256sum "${ROOT}/apps/web/package-lock.json" | awk '{print $1}')"
mobile_lock_sha="$(sha256sum "${ROOT}/apps/mobile/package-lock.json" | awk '{print $1}')"
base_images_sha="$(sha256sum "${ROOT}/deploy/base-images.lock" | awk '{print $1}')"
api_image_id="$(docker image inspect "$API_IMAGE" --format '{{.Id}}')"
worker_image_id="$(docker image inspect "$WORKER_IMAGE" --format '{{.Id}}')"
web_image_id="$(docker image inspect "$WEB_IMAGE" --format '{{.Id}}')"
generated_utc="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"

{
  printf 'release_sha=%s\n' "$EXPECTED_SHA"
  printf 'generated_utc=%s\n' "$generated_utc"
  printf 'supply_chain_tool_lock_sha256=%s\n' "$tool_lock_sha"
  printf 'directory_packages_props_sha256=%s\n' "$packages_props_sha"
  printf 'web_package_lock_sha256=%s\n' "$web_lock_sha"
  printf 'mobile_package_lock_sha256=%s\n' "$mobile_lock_sha"
  printf 'base_images_lock_sha256=%s\n' "$base_images_sha"
  printf 'api_image_id=%s\n' "$api_image_id"
  printf 'worker_image_id=%s\n' "$worker_image_id"
  printf 'web_image_id=%s\n' "$web_image_id"
  printf 'vulnerability_database_mode=live-update-then-frozen-for-run\n'
  printf 'vulnerability_policy_gate=not-defined\n'
  printf 'findings_are_evidence_not_release_verdict=true\n'
  printf 'signed_attestation=not-claimed\n'
  printf 'slsa_provenance=not-claimed\n'
  printf 'registry_push=not-performed\n'
  printf 'deployment=not-performed\n'
  printf 'staging_contacted=no\n'
  printf 'production_contacted=no\n'
} > "${EVIDENCE_DIR}/metadata/evidence-manifest.txt"

for path in "${EVIDENCE_DIR}"/sbom/*.json "${EVIDENCE_DIR}"/vulnerability/*.json \
            "${EVIDENCE_DIR}/grype-db-status.json" "${EVIDENCE_DIR}/summary.tsv"; do
  sha256sum "$path"
done | sed "s#${EVIDENCE_DIR}/##" > "${EVIDENCE_DIR}/metadata/artifact-sha256.txt"

rm -rf "${EVIDENCE_DIR}/.grype-db-cache"
printf 'supply_chain_evidence=complete\n'
printf 'release_sha=%s\n' "$EXPECTED_SHA"
printf 'vulnerability_policy_gate=not-defined\n'
