#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOCK_FILE="${ROOT}/deploy/supply-chain-tools.lock"
BIN_DIR="${CHARKHOONE_SUPPLY_CHAIN_BIN_DIR:-${ROOT}/.tools/supply-chain}"

fail() {
  printf 'supply-chain-tool-install-error: %s\n' "$*" >&2
  exit 1
}

read_lock_value() {
  local key="$1"
  local count value
  count="$(grep -c "^${key}=" "$LOCK_FILE" || true)"
  [[ "$count" == "1" ]] || fail "expected exactly one ${key} entry in ${LOCK_FILE}"
  value="$(grep "^${key}=" "$LOCK_FILE" | cut -d= -f2-)"
  [[ -n "$value" ]] || fail "empty ${key} value"
  printf '%s' "$value"
}

[[ -f "$LOCK_FILE" ]] || fail "missing ${LOCK_FILE}"
[[ "$(uname -s)" == "Linux" ]] || fail "only Linux is supported by the pinned CI tool archives"
case "$(uname -m)" in
  x86_64|amd64) ;;
  *) fail "only linux/amd64 is supported by the pinned CI tool archives" ;;
esac

for command_name in curl sha256sum tar install python3; do
  command -v "$command_name" >/dev/null || fail "${command_name} is required"
done

SYFT_VERSION="$(read_lock_value SYFT_VERSION)"
SYFT_SHA256="$(read_lock_value SYFT_LINUX_AMD64_SHA256)"
GRYPE_VERSION="$(read_lock_value GRYPE_VERSION)"
GRYPE_SHA256="$(read_lock_value GRYPE_LINUX_AMD64_SHA256)"

[[ "$SYFT_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail "invalid SYFT_VERSION"
[[ "$GRYPE_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail "invalid GRYPE_VERSION"
[[ "$SYFT_SHA256" =~ ^[0-9a-f]{64}$ ]] || fail "invalid SYFT_LINUX_AMD64_SHA256"
[[ "$GRYPE_SHA256" =~ ^[0-9a-f]{64}$ ]] || fail "invalid GRYPE_LINUX_AMD64_SHA256"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$BIN_DIR"

download_verified_archive() {
  local name="$1"
  local version="$2"
  local expected_sha="$3"
  local url archive
  archive="${tmp}/${name}.tar.gz"
  url="https://github.com/anchore/${name}/releases/download/v${version}/${name}_${version}_linux_amd64.tar.gz"

  curl --proto '=https' --tlsv1.2 --fail --location --silent --show-error \
    --output "$archive" "$url"
  printf '%s  %s\n' "$expected_sha" "$archive" | sha256sum --check --status \
    || fail "${name} archive SHA-256 mismatch"

  tar -xzf "$archive" -C "$tmp" "$name"
  install -m 0755 "${tmp}/${name}" "${BIN_DIR}/${name}"
}

download_verified_archive syft "$SYFT_VERSION" "$SYFT_SHA256"
download_verified_archive grype "$GRYPE_VERSION" "$GRYPE_SHA256"

installed_syft="$("${BIN_DIR}/syft" version -o json | python3 -c 'import json,sys; print(json.load(sys.stdin)["version"])')"
installed_grype="$("${BIN_DIR}/grype" version -o json | python3 -c 'import json,sys; print(json.load(sys.stdin)["version"])')"

[[ "${installed_syft#v}" == "$SYFT_VERSION" ]] || fail "installed Syft version mismatch"
[[ "${installed_grype#v}" == "$GRYPE_VERSION" ]] || fail "installed Grype version mismatch"

printf 'syft_version=%s\n' "$SYFT_VERSION"
printf 'grype_version=%s\n' "$GRYPE_VERSION"
printf 'tool_archives_sha256_verified=true\n'
