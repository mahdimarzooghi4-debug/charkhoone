#!/usr/bin/env bash
set -euo pipefail

output_path="${1:-deploy/base-images.lock}"
mkdir -p "$(dirname "$output_path")"

accept='application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json'

read_digest_header() {
  awk 'BEGIN { IGNORECASE=1 } /^Docker-Content-Digest:/ { gsub("\r", "", $2); print $2; exit }'
}

require_digest() {
  local description="$1"
  local digest="$2"
  if [[ ! "$digest" =~ ^sha256:[0-9a-f]{64}$ ]]; then
    echo "Could not resolve manifest digest for ${description}" >&2
    exit 1
  fi
}

resolve_mcr() {
  local key="$1" repository="$2" tag="$3" digest
  digest="$(curl --fail --silent --show-error \
    --dump-header - --output /dev/null \
    -H "Accept: $accept" \
    "https://mcr.microsoft.com/v2/${repository}/manifests/${tag}" | read_digest_header)"
  require_digest "mcr.microsoft.com/${repository}:${tag}" "$digest"
  printf '%s=mcr.microsoft.com/%s:%s@%s\n' "$key" "$repository" "$tag" "$digest"
}

resolve_dockerhub() {
  local key="$1" repository="$2" tag="$3" token digest
  token="$(curl --fail --silent --show-error \
    "https://auth.docker.io/token?service=registry.docker.io&scope=repository:${repository}:pull" \
    | python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])')"
  digest="$(curl --fail --silent --show-error \
    --dump-header - --output /dev/null \
    -H "Authorization: Bearer ${token}" \
    -H "Accept: $accept" \
    "https://registry-1.docker.io/v2/${repository}/manifests/${tag}" | read_digest_header)"
  require_digest "${repository}:${tag}" "$digest"
  printf '%s=%s:%s@%s\n' "$key" "${repository#library/}" "$tag" "$digest"
}

resolve_gcr() {
  local key="$1" repository="$2" tag="$3" digest
  digest="$(curl --fail --silent --show-error \
    --dump-header - --output /dev/null \
    -H "Accept: $accept" \
    "https://gcr.io/v2/${repository}/manifests/${tag}" | read_digest_header)"
  require_digest "gcr.io/${repository}:${tag}" "$digest"
  printf '%s=gcr.io/%s:%s@%s\n' "$key" "$repository" "$tag" "$digest"
}

{
  echo '# Generated from registry manifest metadata.'
  echo '# Keep Dockerfiles/Compose pinned to these exact immutable references.'
  resolve_mcr DOTNET_SDK 'dotnet/sdk' '10.0'
  resolve_mcr DOTNET_ASPNET 'dotnet/aspnet' '10.0-noble-chiseled-extra'
  resolve_mcr DOTNET_RUNTIME 'dotnet/runtime' '10.0-noble-chiseled-extra'
  resolve_dockerhub NODE_BUILD 'library/node' '22-alpine'
  resolve_gcr WEB_NODE_RUNTIME 'distroless/nodejs22-debian13' 'nonroot'
  resolve_dockerhub NGINX_RUNTIME 'library/nginx' '1.29-alpine'
} > "$output_path"

cat "$output_path"
