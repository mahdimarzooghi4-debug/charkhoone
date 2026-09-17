#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

: "${CHARKHOONE_EXPECTED_GIT_SHA:?expected release git SHA is required}"
: "${CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY:?database rehearsal summary path is required}"
: "${CHARKHOONE_STAGING_APPLICATION_SMOKE_DIR:?application smoke evidence directory is required}"
: "${CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE:?worker deployment evidence path is required}"
: "${CHARKHOONE_RELEASE_CI_EVIDENCE:?release CI evidence path is required}"

[[ ${CHARKHOONE_ALLOW_STAGING_PROMOTION_PACKET:-false} == true ]] || {
  echo 'Set CHARKHOONE_ALLOW_STAGING_PROMOTION_PACKET=true only after collecting the release evidence set.' >&2
  exit 1
}

for command_name in git sha256sum awk grep date mkdir tr; do
  command -v "$command_name" >/dev/null 2>&1 || { echo "$command_name is required" >&2; exit 1; }
done

expected_sha="${CHARKHOONE_EXPECTED_GIT_SHA,,}"
if [[ ! "$expected_sha" =~ ^[0-9a-f]{40}$ ]]; then
  echo 'CHARKHOONE_EXPECTED_GIT_SHA must be a full 40-character hexadecimal git SHA.' >&2
  exit 1
fi

actual_sha="$(git rev-parse HEAD | tr '[:upper:]' '[:lower:]')"
if [[ "$actual_sha" != "$expected_sha" ]]; then
  echo 'Checked-out git SHA does not match CHARKHOONE_EXPECTED_GIT_SHA; packet generation blocked.' >&2
  exit 1
fi

application_summary="$CHARKHOONE_STAGING_APPLICATION_SMOKE_DIR/summary.txt"
application_statuses="$CHARKHOONE_STAGING_APPLICATION_SMOKE_DIR/http-statuses.txt"
application_database_hash="$CHARKHOONE_STAGING_APPLICATION_SMOKE_DIR/database-rehearsal-summary.sha256"
application_worker_hash="$CHARKHOONE_STAGING_APPLICATION_SMOKE_DIR/worker-deployment-evidence.sha256"

for evidence_path in \
  "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" \
  "$application_summary" \
  "$application_statuses" \
  "$application_database_hash" \
  "$application_worker_hash" \
  "$CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE" \
  "$CHARKHOONE_RELEASE_CI_EVIDENCE"; do
  [[ -f "$evidence_path" && -s "$evidence_path" ]] || {
    echo "Required release evidence is missing or empty: $evidence_path" >&2
    exit 1
  }
done

require_line() {
  local file=$1
  local expected=$2
  grep -Fxq "$expected" "$file" || {
    printf 'Required evidence line is missing: %s\n' "$expected" >&2
    exit 1
  }
}

require_line "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" 'environment=staging'
require_line "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" "git_sha=$expected_sha"
require_line "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" 'migration_runtime_roles_distinct=true'
require_line "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" 'migration_runtime_database_name_match=true'
require_line "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" 'provider_backup_evidence=operator-supplied-hash-recorded'
require_line "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" 'provider_restore_evidence=operator-supplied-hash-recorded'
require_line "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" 'migration=completed'
require_line "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" 'post_migration_readiness=passed'
require_line "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" 'query_plan_evidence=captured-on-operator-confirmed-representative-dataset'
require_line "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" 'promotion_decision=not-made-by-script'

require_line "$application_summary" 'environment=staging'
require_line "$application_summary" "git_sha=$expected_sha"
require_line "$application_summary" 'smoke_runner_git_sha=matched'
require_line "$application_summary" 'api_release_header=matched'
require_line "$application_summary" 'api_liveness=passed'
require_line "$application_summary" 'api_readiness=passed'
require_line "$application_summary" 'anonymous_contract_auth_boundary=401'
require_line "$application_summary" 'authenticated_contract_read=passed'
require_line "$application_summary" 'authenticated_contract_audit_read=passed'
require_line "$application_summary" 'database_rehearsal=matched-release-and-passed'
require_line "$application_summary" 'worker_release_sha=matched-operator-platform-evidence'
require_line "$application_summary" 'worker_health_probe=not-available-worker-has-no-http-health-surface'
require_line "$application_summary" 'financial_mutations=not-exercised'
require_line "$application_summary" 'response_bodies=not-retained'
require_line "$application_summary" 'access_token=not-retained'
require_line "$application_summary" 'promotion_decision=not-made-by-script'

require_line "$application_statuses" 'api_root=200'
require_line "$application_statuses" 'health_live=200'
require_line "$application_statuses" 'health_ready=200'
require_line "$application_statuses" 'anonymous_contract=401'
require_line "$application_statuses" 'authenticated_contract=200'
require_line "$application_statuses" 'authenticated_audit=200'

require_line "$CHARKHOONE_RELEASE_CI_EVIDENCE" 'environment=ci'
require_line "$CHARKHOONE_RELEASE_CI_EVIDENCE" "git_sha=$expected_sha"
require_line "$CHARKHOONE_RELEASE_CI_EVIDENCE" 'workflow=ci'
require_line "$CHARKHOONE_RELEASE_CI_EVIDENCE" 'conclusion=success'
require_line "$CHARKHOONE_RELEASE_CI_EVIDENCE" 'backend=success'
require_line "$CHARKHOONE_RELEASE_CI_EVIDENCE" 'web=success'
require_line "$CHARKHOONE_RELEASE_CI_EVIDENCE" 'mobile_typecheck=success'
require_line "$CHARKHOONE_RELEASE_CI_EVIDENCE" 'mobile_build=not-claimed'

read_recorded_hash() {
  local file=$1
  local value
  value="$(awk 'NF { print $1; exit }' "$file" | tr '[:upper:]' '[:lower:]')"
  if [[ ! "$value" =~ ^[0-9a-f]{64}$ ]]; then
    echo "Evidence hash record is malformed: $file" >&2
    exit 1
  fi
  printf '%s' "$value"
}

actual_database_hash="$(sha256sum "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" | awk '{print $1}')"
recorded_database_hash="$(read_recorded_hash "$application_database_hash")"
if [[ "$actual_database_hash" != "$recorded_database_hash" ]]; then
  echo 'Application smoke evidence does not bind to the supplied database rehearsal summary.' >&2
  exit 1
fi

actual_worker_hash="$(sha256sum "$CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE" | awk '{print $1}')"
recorded_worker_hash="$(read_recorded_hash "$application_worker_hash")"
if [[ "$actual_worker_hash" != "$recorded_worker_hash" ]]; then
  echo 'Application smoke evidence does not bind to the supplied worker deployment evidence.' >&2
  exit 1
fi

output_root="${CHARKHOONE_STAGING_PROMOTION_PACKET_DIR:-artifacts/staging/promotion-packet}"
output_dir="$output_root/$expected_sha"
mkdir -p "$output_dir"

manifest="$output_dir/evidence-manifest.tsv"
{
  printf 'evidence\tsha256\n'
  printf 'database_rehearsal_summary\t%s\n' "$actual_database_hash"
  printf 'application_smoke_summary\t%s\n' "$(sha256sum "$application_summary" | awk '{print $1}')"
  printf 'application_smoke_http_statuses\t%s\n' "$(sha256sum "$application_statuses" | awk '{print $1}')"
  printf 'application_database_hash_record\t%s\n' "$(sha256sum "$application_database_hash" | awk '{print $1}')"
  printf 'application_worker_hash_record\t%s\n' "$(sha256sum "$application_worker_hash" | awk '{print $1}')"
  printf 'worker_deployment_evidence\t%s\n' "$actual_worker_hash"
  printf 'release_ci_evidence\t%s\n' "$(sha256sum "$CHARKHOONE_RELEASE_CI_EVIDENCE" | awk '{print $1}')"
} > "$manifest"

{
  printf 'environment=staging\n'
  printf 'git_sha=%s\n' "$expected_sha"
  printf 'source_checkout_sha=matched\n'
  printf 'release_ci_evidence=validated-operator-supplied-summary\n'
  printf 'database_rehearsal=validated\n'
  printf 'application_smoke=validated\n'
  printf 'database_rehearsal_hash_binding=matched\n'
  printf 'worker_deployment_evidence_hash_binding=matched\n'
  printf 'worker_health=not-proven-no-http-health-surface\n'
  printf 'financial_mutations=not-exercised-by-smoke\n'
  printf 'credentials=not-collected\n'
  printf 'raw_external_evidence=not-copied-into-packet\n'
  printf 'promotion_decision=human-required\n'
  printf 'deployment_action=none\n'
  date -u '+completed_at_utc=%Y-%m-%dT%H:%M:%SZ'
} > "$output_dir/promotion-readiness.txt"

printf 'Promotion evidence packet generated at %s\n' "$output_dir"
printf 'The packet records hashes and normalized checks only; it does not deploy or approve promotion.\n'
