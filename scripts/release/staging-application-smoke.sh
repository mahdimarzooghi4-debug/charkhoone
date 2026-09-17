#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

: "${CHARKHOONE_APPLICATION_SMOKE_ENVIRONMENT:?application smoke environment is required (staging or ci)}"
: "${CHARKHOONE_STAGING_API_BASE_URL:?staging API base URL is required}"
: "${CHARKHOONE_STAGING_API_BEARER_TOKEN:?staging API bearer token is required}"
: "${CHARKHOONE_STAGING_SMOKE_CONTRACT_ID:?accessible staging contract id is required}"
: "${CHARKHOONE_EXPECTED_GIT_SHA:?expected release git SHA is required}"
: "${CHARKHOONE_STAGING_DATABASE_REHEARSAL_DIR:?database rehearsal evidence directory is required}"
: "${CHARKHOONE_STAGING_API_RELEASE_EVIDENCE:?API release provenance evidence path is required}"
: "${CHARKHOONE_STAGING_WORKER_RELEASE_EVIDENCE:?Worker release provenance evidence path is required}"

environment_name="${CHARKHOONE_APPLICATION_SMOKE_ENVIRONMENT,,}"
case "$environment_name" in
  staging)
    [[ ${CHARKHOONE_ALLOW_STAGING_APPLICATION_SMOKE:-false} == true ]] || {
      echo 'Set CHARKHOONE_ALLOW_STAGING_APPLICATION_SMOKE=true after independently confirming the staging target.' >&2
      exit 1
    }
    ;;
  ci)
    [[ ${CHARKHOONE_ALLOW_APPLICATION_SMOKE_COMPATIBILITY:-false} == true ]] || {
      echo 'Set CHARKHOONE_ALLOW_APPLICATION_SMOKE_COMPATIBILITY=true for disposable CI compatibility execution.' >&2
      exit 1
    }
    ;;
  *)
    echo 'CHARKHOONE_APPLICATION_SMOKE_ENVIRONMENT must be staging or ci.' >&2
    exit 1
    ;;
esac

for command_name in git curl python3 sha256sum; do
  command -v "$command_name" >/dev/null 2>&1 || { echo "$command_name is required" >&2; exit 1; }
done

actual_sha="$(git rev-parse HEAD)"
if [[ "$actual_sha" != "$CHARKHOONE_EXPECTED_GIT_SHA" ]]; then
  echo 'Checked-out git SHA does not match CHARKHOONE_EXPECTED_GIT_SHA; application smoke blocked.' >&2
  exit 1
fi

python3 - "$CHARKHOONE_EXPECTED_GIT_SHA" "$CHARKHOONE_STAGING_SMOKE_CONTRACT_ID" <<'PY'
import re
import sys
import uuid
sha, contract_id = sys.argv[1:]
if not re.fullmatch(r"[0-9a-f]{40}", sha):
    raise SystemExit("expected SHA must be a lowercase 40-character git SHA")
try:
    uuid.UUID(contract_id)
except ValueError as exc:
    raise SystemExit("staging smoke contract id must be a UUID") from exc
PY

api_base_url="${CHARKHOONE_STAGING_API_BASE_URL%/}"
python3 - "$api_base_url" "$environment_name" <<'PY'
import sys
from urllib.parse import urlparse
url, environment = sys.argv[1:]
parsed = urlparse(url)
if not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment:
    raise SystemExit("API base URL must be an origin-style URL without credentials, query, or fragment")
if environment == "staging":
    if parsed.scheme != "https":
        raise SystemExit("staging application smoke requires an HTTPS API base URL")
elif environment == "ci":
    if parsed.scheme != "http" or parsed.hostname not in {"127.0.0.1", "localhost"}:
        raise SystemExit("CI compatibility smoke only permits local HTTP targets")
PY

for evidence_path in \
  "$CHARKHOONE_STAGING_API_RELEASE_EVIDENCE" \
  "$CHARKHOONE_STAGING_WORKER_RELEASE_EVIDENCE"; do
  [[ -f "$evidence_path" && -s "$evidence_path" ]] || {
    echo "Required release evidence is missing or empty: $evidence_path" >&2
    exit 1
  }
  grep -Fq "$CHARKHOONE_EXPECTED_GIT_SHA" "$evidence_path" || {
    echo "Release evidence does not contain the expected git SHA: $evidence_path" >&2
    exit 1
  }
done

db_summary="$CHARKHOONE_STAGING_DATABASE_REHEARSAL_DIR/summary.txt"
[[ -f "$db_summary" && -s "$db_summary" ]] || {
  echo 'Database rehearsal summary is missing or empty.' >&2
  exit 1
}
for required_line in \
  "environment=$environment_name" \
  "git_sha=$CHARKHOONE_EXPECTED_GIT_SHA" \
  'migration=completed' \
  'post_migration_readiness=passed' \
  'query_plan_evidence=captured-on-operator-confirmed-representative-dataset' \
  'promotion_decision=not-made-by-script'; do
  grep -Fxq "$required_line" "$db_summary" || {
    echo "Database rehearsal summary is missing required evidence: $required_line" >&2
    exit 1
  }
done

output_root="${CHARKHOONE_APPLICATION_EVIDENCE_DIR:-artifacts/release/application-smoke}"
output_dir="$output_root/$environment_name/$actual_sha"
mkdir -p "$output_dir"

body_file="$(mktemp)"
auth_config="$(mktemp)"
chmod 600 "$auth_config"
cleanup() {
  rm -f "$body_file" "$auth_config"
}
trap cleanup EXIT
printf 'header = "Authorization: Bearer %s"\n' "$CHARKHOONE_STAGING_API_BEARER_TOKEN" > "$auth_config"

checks_file="$output_dir/checks.tsv"
: > "$checks_file"

request() {
  local label=$1
  local expected_status=$2
  local url=$3
  local authenticated=$4
  local result
  if [[ "$authenticated" == true ]]; then
    result="$(curl --silent --show-error --location --max-redirs 0 \
      --connect-timeout 10 --max-time 30 \
      --config "$auth_config" \
      --output "$body_file" \
      --write-out $'%{http_code}\t%{time_total}' \
      "$url")"
  else
    result="$(curl --silent --show-error --location --max-redirs 0 \
      --connect-timeout 10 --max-time 30 \
      --output "$body_file" \
      --write-out $'%{http_code}\t%{time_total}' \
      "$url")"
  fi
  local status="${result%%$'\t'*}"
  local duration="${result#*$'\t'}"
  printf '%s\t%s\t%s\n' "$label" "$status" "$duration" >> "$checks_file"
  if [[ "$status" != "$expected_status" ]]; then
    echo "$label returned HTTP $status; expected $expected_status" >&2
    exit 1
  fi
}

request api_liveness 200 "$api_base_url/health/live" false
request api_readiness 200 "$api_base_url/health/ready" false
request api_descriptor 200 "$api_base_url/api/v1" false
python3 - "$body_file" <<'PY'
import json
import sys
with open(sys.argv[1], encoding="utf-8") as handle:
    payload = json.load(handle)
if payload.get("service") != "Charkhoone.Api" or payload.get("apiVersion") != "v1" or payload.get("status") != "ready":
    raise SystemExit("API descriptor payload does not match Charkhoone.Api v1 ready contract")
PY

contract_url="$api_base_url/api/v1/contracts/$CHARKHOONE_STAGING_SMOKE_CONTRACT_ID"
request unauthenticated_contract_rejected 401 "$contract_url" false
request authenticated_contract_read 200 "$contract_url" true
python3 - "$body_file" "$CHARKHOONE_STAGING_SMOKE_CONTRACT_ID" <<'PY'
import json
import sys
with open(sys.argv[1], encoding="utf-8") as handle:
    payload = json.load(handle)
if str(payload.get("contractId", "")).lower() != sys.argv[2].lower():
    raise SystemExit("authenticated contract response does not match requested contract id")
if "monthlyObligations" not in payload or "paymentsRequiringReconciliation" not in payload:
    raise SystemExit("authenticated contract response is missing financial read-model collections")
PY

request authenticated_contract_audit_read 200 \
  "$contract_url/audit-events?page=1&pageSize=1" true
python3 - "$body_file" <<'PY'
import json
import sys
with open(sys.argv[1], encoding="utf-8") as handle:
    payload = json.load(handle)
if payload.get("page") != 1 or payload.get("pageSize") != 1 or "items" not in payload or "totalCount" not in payload:
    raise SystemExit("authenticated contract audit response does not match the expected paging contract")
PY

api_evidence_hash="$(sha256sum "$CHARKHOONE_STAGING_API_RELEASE_EVIDENCE" | awk '{print $1}')"
worker_evidence_hash="$(sha256sum "$CHARKHOONE_STAGING_WORKER_RELEASE_EVIDENCE" | awk '{print $1}')"
printf '%s\n' "$api_evidence_hash" > "$output_dir/api-release-evidence.sha256"
printf '%s\n' "$worker_evidence_hash" > "$output_dir/worker-release-evidence.sha256"

summary="$output_dir/summary.txt"
{
  printf 'environment=%s\n' "$environment_name"
  printf 'git_sha=%s\n' "$actual_sha"
  printf 'api_liveness=passed\n'
  printf 'api_readiness=passed\n'
  printf 'api_descriptor=passed\n'
  printf 'unauthenticated_contract_rejected=passed\n'
  printf 'authenticated_contract_read=passed\n'
  printf 'authenticated_contract_audit_read=passed\n'
  printf 'api_release_evidence=hash-recorded-and-sha-matched\n'
  printf 'worker_release_evidence=hash-recorded-and-sha-matched\n'
  printf 'response_bodies_persisted=false\n'
  printf 'latency_threshold_applied=false-observation-only\n'
  printf 'promotion_decision=not-made-by-script\n'
  date -u '+completed_at_utc=%Y-%m-%dT%H:%M:%SZ'
} > "$summary"

python3 scripts/release/verify-staging-release-gate.py \
  --environment "$environment_name" \
  --expected-sha "$actual_sha" \
  --database-rehearsal-dir "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_DIR" \
  --application-summary "$summary" \
  --api-release-evidence "$CHARKHOONE_STAGING_API_RELEASE_EVIDENCE" \
  --worker-release-evidence "$CHARKHOONE_STAGING_WORKER_RELEASE_EVIDENCE"

printf 'Application smoke evidence captured in %s\n' "$output_dir"
printf 'Response bodies, bearer token, and release-evidence contents were not persisted by this runner.\n'
printf 'Successful evidence verification does not make a production promotion decision.\n'
