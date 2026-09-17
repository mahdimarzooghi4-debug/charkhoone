#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

: "${CHARKHOONE_STAGING_API_BASE_URL:?staging API base URL is required}"
: "${CHARKHOONE_STAGING_WORKER_HEALTH_URL:?staging Worker health URL is required}"
: "${CHARKHOONE_EXPECTED_GIT_SHA:?expected release git SHA is required}"
: "${CHARKHOONE_STAGING_ACCESS_TOKEN_FILE:?path to staging access-token file is required}"
: "${CHARKHOONE_STAGING_CONTRACT_ID:?an accessible staging contract id is required}"
: "${CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY:?path to the completed database rehearsal summary is required}"
: "${CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE:?path to deployment-platform worker evidence is required}"
: "${CHARKHOONE_STAGING_WORKER_GIT_SHA:?worker deployed git SHA is required}"

[[ ${CHARKHOONE_ALLOW_STAGING_APPLICATION_SMOKE:-false} == true ]] || {
  echo 'Set CHARKHOONE_ALLOW_STAGING_APPLICATION_SMOKE=true only after confirming the staging target and read-only smoke identity.' >&2
  exit 1
}

for command_name in git curl sha256sum awk grep sed date tr python3; do
  command -v "$command_name" >/dev/null 2>&1 || { echo "$command_name is required" >&2; exit 1; }
done

expected_sha="${CHARKHOONE_EXPECTED_GIT_SHA,,}"
if [[ ! "$expected_sha" =~ ^[0-9a-f]{40}$ ]]; then
  echo 'CHARKHOONE_EXPECTED_GIT_SHA must be a full 40-character hexadecimal git SHA.' >&2
  exit 1
fi

actual_sha="$(git rev-parse HEAD | tr '[:upper:]' '[:lower:]')"
if [[ "$actual_sha" != "$expected_sha" ]]; then
  echo 'Checked-out git SHA does not match CHARKHOONE_EXPECTED_GIT_SHA; application smoke blocked.' >&2
  exit 1
fi

worker_sha="${CHARKHOONE_STAGING_WORKER_GIT_SHA,,}"
if [[ "$worker_sha" != "$expected_sha" ]]; then
  echo 'Worker deployment SHA does not match the expected release SHA; smoke blocked.' >&2
  exit 1
fi

base_url="${CHARKHOONE_STAGING_API_BASE_URL%/}"
if [[ ! "$base_url" =~ ^https:// ]]; then
  echo 'CHARKHOONE_STAGING_API_BASE_URL must use HTTPS.' >&2
  exit 1
fi

worker_health_url="$CHARKHOONE_STAGING_WORKER_HEALTH_URL"
python3 - "$worker_health_url" <<'PY'
import sys
from urllib.parse import urlsplit

raw = sys.argv[1]
parsed = urlsplit(raw)
if parsed.username is not None or parsed.password is not None:
    raise SystemExit("Worker health URL must not contain URL credentials.")
if parsed.query or parsed.fragment:
    raise SystemExit("Worker health URL must not contain a query string or fragment.")
if parsed.path != "/health/live":
    raise SystemExit("Worker health URL path must be exactly /health/live.")
if parsed.scheme == "https":
    if not parsed.hostname:
        raise SystemExit("Worker health HTTPS URL must contain a hostname.")
elif parsed.scheme == "http":
    if parsed.hostname not in {"127.0.0.1", "localhost", "::1"}:
        raise SystemExit("Plain HTTP Worker health URL is allowed only through a loopback/tunnel endpoint.")
else:
    raise SystemExit("Worker health URL must use HTTPS, or HTTP only on loopback.")
PY

if [[ ! "$CHARKHOONE_STAGING_CONTRACT_ID" =~ ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$ ]]; then
  echo 'CHARKHOONE_STAGING_CONTRACT_ID must be a GUID.' >&2
  exit 1
fi

for evidence_path in \
  "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" \
  "$CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE" \
  "$CHARKHOONE_STAGING_ACCESS_TOKEN_FILE"; do
  [[ -f "$evidence_path" && -s "$evidence_path" ]] || {
    echo "Required staging input is missing or empty: $evidence_path" >&2
    exit 1
  }
done

if ! grep -Fxq 'environment=staging' "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" \
  || ! grep -Fxq "git_sha=$expected_sha" "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" \
  || ! grep -Fxq 'migration=completed' "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" \
  || ! grep -Fxq 'post_migration_readiness=passed' "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY"; then
  echo 'Database rehearsal summary is incomplete or does not match the expected release SHA.' >&2
  exit 1
fi

IFS= read -r access_token < "$CHARKHOONE_STAGING_ACCESS_TOKEN_FILE"
if [[ -z "$access_token" ]]; then
  echo 'Staging access-token file did not contain a token on its first line.' >&2
  exit 1
fi

output_root="${CHARKHOONE_STAGING_EVIDENCE_DIR:-artifacts/staging/application-smoke}"
output_dir="$output_root/$expected_sha"
mkdir -p "$output_dir"

sha256sum "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" | awk '{print $1}' > "$output_dir/database-rehearsal-summary.sha256"
sha256sum "$CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE" | awk '{print $1}' > "$output_dir/worker-deployment-evidence.sha256"

temp_dir="$(mktemp -d)"
trap 'rm -rf "$temp_dir"' EXIT
chmod 700 "$temp_dir"
auth_header="$temp_dir/auth-header.txt"
printf 'Authorization: Bearer %s\n' "$access_token" > "$auth_header"
chmod 600 "$auth_header"
unset access_token

connect_timeout="${CHARKHOONE_SMOKE_CONNECT_TIMEOUT_SECONDS:-10}"
max_time="${CHARKHOONE_SMOKE_MAX_TIME_SECONDS:-30}"
if [[ ! "$connect_timeout" =~ ^[1-9][0-9]*$ || ! "$max_time" =~ ^[1-9][0-9]*$ ]]; then
  echo 'Smoke transport timeout values must be positive whole seconds.' >&2
  exit 1
fi

request_url() {
  local name=$1
  local url=$2
  local expected_status=$3
  local authenticated=$4
  local headers="$temp_dir/$name.headers"
  local body="$temp_dir/$name.body"
  local status

  local -a args=(
    --silent
    --show-error
    --request GET
    --output "$body"
    --dump-header "$headers"
    --write-out '%{http_code}'
    --connect-timeout "$connect_timeout"
    --max-time "$max_time"
    --header 'Accept: application/json'
  )
  if [[ "$authenticated" == true ]]; then
    args+=(--header "@$auth_header")
  fi

  status="$(curl "${args[@]}" "$url")"
  if [[ "$status" != "$expected_status" ]]; then
    printf '%s expected HTTP %s but received %s.\n' "$name" "$expected_status" "$status" >&2
    exit 1
  fi
  printf '%s=%s\n' "$name" "$status" >> "$output_dir/http-statuses.txt"
}

request_api() {
  local name=$1
  local path=$2
  local expected_status=$3
  local authenticated=$4
  request_url "$name" "$base_url$path" "$expected_status" "$authenticated"
}

read_release_header() {
  local headers=$1
  awk 'BEGIN { IGNORECASE=1 } /^X-Charkhoone-Release-Sha:/ { value=$0; sub(/^[^:]+:[[:space:]]*/, "", value); gsub(/\r/, "", value); print value }' "$headers" | tail -n 1
}

rm -f "$output_dir/http-statuses.txt"
request_api api_root '/api/v1' 200 false

release_sha="$(read_release_header "$temp_dir/api_root.headers")"
if [[ "${release_sha,,}" != "$expected_sha" ]]; then
  echo 'API release identity header is missing or does not match the expected release SHA.' >&2
  exit 1
fi

grep -Eiq '^X-Content-Type-Options:[[:space:]]*nosniff\r?$' "$temp_dir/api_root.headers" || {
  echo 'API root is missing the expected X-Content-Type-Options security header.' >&2
  exit 1
}
grep -Eiq '^Cache-Control:.*no-store' "$temp_dir/api_root.headers" || {
  echo 'API root is missing the expected no-store cache policy.' >&2
  exit 1
}

request_api health_live '/health/live' 200 false
request_api health_ready '/health/ready' 200 false
request_api anonymous_contract "/api/v1/contracts/$CHARKHOONE_STAGING_CONTRACT_ID" 401 false
request_api authenticated_contract "/api/v1/contracts/$CHARKHOONE_STAGING_CONTRACT_ID" 200 true
request_api authenticated_audit "/api/v1/contracts/$CHARKHOONE_STAGING_CONTRACT_ID/audit-events?page=1&pageSize=1" 200 true

request_url worker_health_live "$worker_health_url" 200 false
worker_release_sha="$(read_release_header "$temp_dir/worker_health_live.headers")"
if [[ "${worker_release_sha,,}" != "$expected_sha" ]]; then
  echo 'Worker release identity header is missing or does not match the expected release SHA.' >&2
  exit 1
fi
python3 - "$temp_dir/worker_health_live.body" <<'PY'
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as handle:
    payload = json.load(handle)
if payload.get("service") != "Charkhoone.Worker":
    raise SystemExit("Worker liveness response service identity did not match Charkhoone.Worker.")
if payload.get("status") != "live":
    raise SystemExit("Worker liveness response status did not equal live.")
PY

{
  printf 'environment=staging\n'
  printf 'git_sha=%s\n' "$expected_sha"
  printf 'smoke_runner_git_sha=matched\n'
  printf 'api_release_header=matched\n'
  printf 'api_liveness=passed\n'
  printf 'api_readiness=passed\n'
  printf 'anonymous_contract_auth_boundary=401\n'
  printf 'authenticated_contract_read=passed\n'
  printf 'authenticated_contract_audit_read=passed\n'
  printf 'database_rehearsal=matched-release-and-passed\n'
  printf 'worker_release_sha=matched-operator-platform-evidence\n'
  printf 'worker_http_release_header=matched\n'
  printf 'worker_http_liveness=passed\n'
  printf 'worker_http_identity=matched\n'
  printf 'worker_deployment_evidence=hash-recorded\n'
  printf 'financial_mutations=not-exercised\n'
  printf 'response_bodies=not-retained\n'
  printf 'access_token=not-retained\n'
  printf 'promotion_decision=not-made-by-script\n'
  date -u '+completed_at_utc=%Y-%m-%dT%H:%M:%SZ'
} > "$output_dir/summary.txt"

printf 'Staging application release smoke passed; evidence is in %s\n' "$output_dir"
printf 'API and Worker release identity/liveness were verified without exercising financial mutation endpoints.\n'
printf 'No response body or access token was retained.\n'
