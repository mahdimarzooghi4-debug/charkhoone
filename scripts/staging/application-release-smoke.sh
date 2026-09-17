#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

: "${CHARKHOONE_STAGING_API_BASE_URL:?staging API base URL is required}"
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

for command_name in git curl sha256sum awk grep sed date tr; do
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

request() {
  local name=$1
  local path=$2
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

  status="$(curl "${args[@]}" "$base_url$path")"
  if [[ "$status" != "$expected_status" ]]; then
    printf '%s expected HTTP %s but received %s.\n' "$name" "$expected_status" "$status" >&2
    exit 1
  fi
  printf '%s=%s\n' "$name" "$status" >> "$output_dir/http-statuses.txt"
}

rm -f "$output_dir/http-statuses.txt"
request api_root '/api/v1' 200 false

release_sha="$(awk 'BEGIN { IGNORECASE=1 } /^X-Charkhoone-Release-Sha:/ { value=$0; sub(/^[^:]+:[[:space:]]*/, "", value); gsub(/\r/, "", value); print value }' "$temp_dir/api_root.headers" | tail -n 1)"
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

request health_live '/health/live' 200 false
request health_ready '/health/ready' 200 false
request anonymous_contract "/api/v1/contracts/$CHARKHOONE_STAGING_CONTRACT_ID" 401 false
request authenticated_contract "/api/v1/contracts/$CHARKHOONE_STAGING_CONTRACT_ID" 200 true
request authenticated_audit "/api/v1/contracts/$CHARKHOONE_STAGING_CONTRACT_ID/audit-events?page=1&pageSize=1" 200 true

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
  printf 'worker_health_probe=not-available-worker-has-no-http-health-surface\n'
  printf 'financial_mutations=not-exercised\n'
  printf 'response_bodies=not-retained\n'
  printf 'access_token=not-retained\n'
  printf 'promotion_decision=not-made-by-script\n'
  date -u '+completed_at_utc=%Y-%m-%dT%H:%M:%SZ'
} > "$output_dir/summary.txt"

printf 'Staging application release smoke passed; evidence is in %s\n' "$output_dir"
printf 'No financial mutation endpoint was invoked and no response body or access token was retained.\n'
