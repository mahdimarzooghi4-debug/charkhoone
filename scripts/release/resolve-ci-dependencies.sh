#!/usr/bin/env bash
set -euo pipefail

output_path="${1:-deploy/ci-dependencies.lock}"
mkdir -p "$(dirname "$output_path")"

resolve_action() {
  local key="$1"
  local repository="$2"
  local tag="$3"
  local json sha type
  json="$(curl --fail --silent --show-error \
    -H 'Accept: application/vnd.github+json' \
    "https://api.github.com/repos/${repository}/git/ref/tags/${tag}")"
  sha="$(printf '%s' "$json" | python3 -c 'import json,sys; print(json.load(sys.stdin)["object"]["sha"])')"
  type="$(printf '%s' "$json" | python3 -c 'import json,sys; print(json.load(sys.stdin)["object"]["type"])')"
  if [[ "$type" != commit || ! "$sha" =~ ^[0-9a-f]{40}$ ]]; then
    echo "Expected ${repository}@${tag} to resolve directly to a commit SHA" >&2
    exit 1
  fi
  printf '%s=%s@%s\n' "$key" "$repository" "$sha"
}

resolve_postgres() {
  local token digest
  local accept='application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json'
  token="$(curl --fail --silent --show-error \
    'https://auth.docker.io/token?service=registry.docker.io&scope=repository:library/postgres:pull' \
    | python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])')"
  digest="$(curl --fail --silent --show-error \
    --dump-header - --output /dev/null \
    -H "Authorization: Bearer ${token}" \
    -H "Accept: ${accept}" \
    'https://registry-1.docker.io/v2/library/postgres/manifests/17-alpine' \
    | awk 'BEGIN { IGNORECASE=1 } /^Docker-Content-Digest:/ { gsub("\r", "", $2); print $2; exit }')"
  if [[ ! "$digest" =~ ^sha256:[0-9a-f]{64}$ ]]; then
    echo 'Could not resolve postgres:17-alpine manifest digest' >&2
    exit 1
  fi
  printf 'CI_POSTGRES=postgres:17-alpine@%s\n' "$digest"
}

{
  echo '# Generated from GitHub tag refs and Docker Registry manifest metadata.'
  echo '# Workflow uses and CI service images must match these immutable identities.'
  resolve_action ACTIONS_CHECKOUT actions/checkout v5
  resolve_action ACTIONS_SETUP_DOTNET actions/setup-dotnet v5
  resolve_action ACTIONS_SETUP_NODE actions/setup-node v4
  resolve_action ACTIONS_UPLOAD_ARTIFACT actions/upload-artifact v4
  resolve_postgres
} > "$output_path"

cat "$output_path"
