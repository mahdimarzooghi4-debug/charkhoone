#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

: "${CHARKHOONE_EXPECTED_GIT_SHA:?expected release git SHA is required}"

[[ ${CHARKHOONE_ALLOW_STAGING_PROMOTION_PACKET:-false} == true ]] || {
  echo 'Set CHARKHOONE_ALLOW_STAGING_PROMOTION_PACKET=true only after collecting the release evidence set.' >&2
  exit 1
}

for command_name in flock mktemp chmod mv rm git sha256sum awk grep date mkdir tr python3; do
  command -v "$command_name" >/dev/null 2>&1 || { echo "$command_name is required" >&2; exit 1; }
done

expected_sha="${CHARKHOONE_EXPECTED_GIT_SHA,,}"
if [[ ! "$expected_sha" =~ ^[0-9a-f]{40}$ ]]; then
  echo 'CHARKHOONE_EXPECTED_GIT_SHA must be a full 40-character hexadecimal git SHA.' >&2
  exit 1
fi

# Once the target SHA and explicit opt-in are valid, every new attempt
# invalidates prior completion, including failures in subsequent input checks.
source "$ROOT_DIR/scripts/staging/evidence-attempt.sh"
output_root="${CHARKHOONE_STAGING_PROMOTION_PACKET_DIR:-artifacts/staging/promotion-packet}"
begin_evidence_attempt "$output_root/$expected_sha" 'promotion-readiness.txt'

: "${CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY:?database rehearsal summary path is required}"
: "${CHARKHOONE_STAGING_APPLICATION_SMOKE_DIR:?application smoke evidence directory is required}"
: "${CHARKHOONE_STAGING_MESSAGE_BROKER_EVIDENCE:?message broker provider evidence path is required}"
: "${CHARKHOONE_STAGING_MESSAGE_BROKER_EVIDENCE_METADATA:?message broker evidence metadata path is required}"
: "${CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE:?worker deployment evidence path is required}"
: "${CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE_METADATA:?worker deployment evidence metadata path is required}"
: "${CHARKHOONE_STAGING_TARGET_MANIFEST:?staging target manifest path is required}"
: "${CHARKHOONE_RELEASE_CI_EVIDENCE:?release CI evidence path is required}"

actual_sha="$(git rev-parse HEAD | tr '[:upper:]' '[:lower:]')"
if [[ "$actual_sha" != "$expected_sha" ]]; then
  echo 'Checked-out git SHA does not match CHARKHOONE_EXPECTED_GIT_SHA; packet generation blocked.' >&2
  exit 1
fi

# Hold a shared lock throughout validation and hashing. A smoke writer cannot
# replace the completion marker or its artifact set while the packet consumes it.
[[ -d "$CHARKHOONE_STAGING_APPLICATION_SMOKE_DIR" ]] || {
  echo 'Application smoke evidence directory does not exist.' >&2
  exit 1
}
exec {application_lock_fd}>"$CHARKHOONE_STAGING_APPLICATION_SMOKE_DIR/.evidence.lock"
flock --shared --nonblock "$application_lock_fd" || {
  echo 'Application smoke evidence is being written; packet generation blocked.' >&2
  exit 1
}

application_summary="$CHARKHOONE_STAGING_APPLICATION_SMOKE_DIR/summary.txt"
application_statuses="$CHARKHOONE_STAGING_APPLICATION_SMOKE_DIR/http-statuses.txt"
application_database_hash="$CHARKHOONE_STAGING_APPLICATION_SMOKE_DIR/database-rehearsal-summary.sha256"
application_broker_hash="$CHARKHOONE_STAGING_APPLICATION_SMOKE_DIR/message-broker-evidence.sha256"
application_broker_metadata_hash="$CHARKHOONE_STAGING_APPLICATION_SMOKE_DIR/message-broker-evidence-metadata.sha256"
application_worker_hash="$CHARKHOONE_STAGING_APPLICATION_SMOKE_DIR/worker-deployment-evidence.sha256"
application_worker_metadata_hash="$CHARKHOONE_STAGING_APPLICATION_SMOKE_DIR/worker-deployment-evidence-metadata.sha256"
application_target_hash="$CHARKHOONE_STAGING_APPLICATION_SMOKE_DIR/staging-target-binding.sha256"

for evidence_path in \
  "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" \
  "$application_summary" \
  "$application_statuses" \
  "$application_database_hash" \
  "$application_broker_hash" \
  "$application_broker_metadata_hash" \
  "$application_worker_hash" \
  "$application_worker_metadata_hash" \
  "$application_target_hash" \
  "$CHARKHOONE_STAGING_MESSAGE_BROKER_EVIDENCE" \
  "$CHARKHOONE_STAGING_MESSAGE_BROKER_EVIDENCE_METADATA" \
  "$CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE" \
  "$CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE_METADATA" \
  "$CHARKHOONE_STAGING_TARGET_MANIFEST" \
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
require_line "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" 'staging_target_database_name_match=true'
require_line "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" 'migration_runtime_roles_distinct=true'
require_line "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" 'migration_runtime_database_name_match=true'
require_line "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" 'provider_backup_evidence=identity-and-raw-hash-verified'
require_line "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" 'provider_restore_evidence=identity-and-raw-hash-verified'
for provider_hash_key in \
  provider_backup_raw_sha256 \
  provider_backup_metadata_sha256 \
  provider_restore_raw_sha256 \
  provider_restore_metadata_sha256; do
  provider_hash_value="$(awk -F= -v wanted="$provider_hash_key" '$1 == wanted { sub(/^[^=]*=/, ""); print; exit }' "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" | tr '[:upper:]' '[:lower:]')"
  if [[ ! "$provider_hash_value" =~ ^[0-9a-f]{64}$ ]]; then
    echo "Database rehearsal provider evidence hash is missing or malformed: $provider_hash_key" >&2
    exit 1
  fi
done
require_line "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" 'migration=completed'
require_line "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" 'post_migration_readiness=passed'
require_line "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" 'query_plan_evidence=captured-on-operator-confirmed-representative-dataset'
require_line "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" 'promotion_decision=not-made-by-script'

require_line "$application_summary" 'environment=staging'
require_line "$application_summary" "git_sha=$expected_sha"
require_line "$application_summary" 'staging_target_api_url=matched'
require_line "$application_summary" 'staging_target_worker_health_url=matched'
require_line "$application_summary" 'smoke_runner_git_sha=matched'
require_line "$application_summary" 'api_release_header=matched'
require_line "$application_summary" 'api_liveness=passed'
require_line "$application_summary" 'api_readiness=passed'
require_line "$application_summary" 'anonymous_contract_auth_boundary=401'
require_line "$application_summary" 'authenticated_contract_read=passed'
require_line "$application_summary" 'authenticated_contract_audit_read=passed'
require_line "$application_summary" 'database_rehearsal=matched-release-and-passed'
require_line "$application_summary" 'message_broker_evidence=identity-and-raw-hash-verified'
require_line "$application_summary" 'message_broker_metadata=hash-recorded'
require_line "$application_summary" 'worker_release_sha=matched-operator-platform-evidence'
require_line "$application_summary" 'worker_http_release_header=matched'
require_line "$application_summary" 'worker_http_liveness=passed'
require_line "$application_summary" 'worker_http_identity=matched'
require_line "$application_summary" 'worker_deployment_evidence=identity-and-raw-hash-verified'
require_line "$application_summary" 'worker_deployment_metadata=hash-recorded'
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
require_line "$application_statuses" 'worker_health_live=200'

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

database_target_hash="$(awk -F= '$1 == "staging_target_binding_sha256" { sub(/^[^=]*=/, ""); print; exit }' "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" | tr '[:upper:]' '[:lower:]')"
application_summary_target_hash="$(awk -F= '$1 == "staging_target_binding_sha256" { sub(/^[^=]*=/, ""); print; exit }' "$application_summary" | tr '[:upper:]' '[:lower:]')"
recorded_target_hash="$(read_recorded_hash "$application_target_hash")"
if [[ ! "$database_target_hash" =~ ^[0-9a-f]{64}$ || "$application_summary_target_hash" != "$database_target_hash" || "$recorded_target_hash" != "$database_target_hash" ]]; then
  echo 'Staging target identity does not match across database and application evidence.' >&2
  exit 1
fi

broker_provider_info="$(python3 scripts/staging/verify-provider-evidence.py \
  --manifest "$CHARKHOONE_STAGING_TARGET_MANIFEST" \
  --metadata "$CHARKHOONE_STAGING_MESSAGE_BROKER_EVIDENCE_METADATA" \
  --raw-evidence "$CHARKHOONE_STAGING_MESSAGE_BROKER_EVIDENCE" \
  --kind message-broker-deployment)"
verified_broker_target_hash="$(printf '%s\n' "$broker_provider_info" | awk -F= '$1 == "provider_evidence_target_binding_sha256" { sub(/^[^=]*=/, ""); print; exit }')"
verified_broker_raw_hash="$(printf '%s\n' "$broker_provider_info" | awk -F= '$1 == "provider_evidence_raw_sha256" { sub(/^[^=]*=/, ""); print; exit }')"
verified_broker_metadata_hash="$(printf '%s\n' "$broker_provider_info" | awk -F= '$1 == "provider_evidence_metadata_sha256" { sub(/^[^=]*=/, ""); print; exit }')"
if [[ "$verified_broker_target_hash" != "$database_target_hash" ]]; then
  echo 'Message broker provider evidence target identity does not match the promotion target.' >&2
  exit 1
fi

worker_provider_info="$(python3 scripts/staging/verify-provider-evidence.py \
  --manifest "$CHARKHOONE_STAGING_TARGET_MANIFEST" \
  --metadata "$CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE_METADATA" \
  --raw-evidence "$CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE" \
  --kind worker-deployment \
  --expected-git-sha "$expected_sha")"
verified_worker_target_hash="$(printf '%s\n' "$worker_provider_info" | awk -F= '$1 == "provider_evidence_target_binding_sha256" { sub(/^[^=]*=/, ""); print; exit }')"
verified_worker_raw_hash="$(printf '%s\n' "$worker_provider_info" | awk -F= '$1 == "provider_evidence_raw_sha256" { sub(/^[^=]*=/, ""); print; exit }')"
verified_worker_metadata_hash="$(printf '%s\n' "$worker_provider_info" | awk -F= '$1 == "provider_evidence_metadata_sha256" { sub(/^[^=]*=/, ""); print; exit }')"
if [[ "$verified_worker_target_hash" != "$database_target_hash" ]]; then
  echo 'Worker provider evidence target identity does not match the promotion target.' >&2
  exit 1
fi

actual_database_hash="$(sha256sum "$CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY" | awk '{print $1}')"
recorded_database_hash="$(read_recorded_hash "$application_database_hash")"
if [[ "$actual_database_hash" != "$recorded_database_hash" ]]; then
  echo 'Application smoke evidence does not bind to the supplied database rehearsal summary.' >&2
  exit 1
fi

actual_broker_hash="$(sha256sum "$CHARKHOONE_STAGING_MESSAGE_BROKER_EVIDENCE" | awk '{print $1}')"
recorded_broker_hash="$(read_recorded_hash "$application_broker_hash")"
actual_broker_metadata_hash="$(sha256sum "$CHARKHOONE_STAGING_MESSAGE_BROKER_EVIDENCE_METADATA" | awk '{print $1}')"
recorded_broker_metadata_hash="$(read_recorded_hash "$application_broker_metadata_hash")"
if [[ "$actual_broker_hash" != "$recorded_broker_hash" || "$actual_broker_hash" != "$verified_broker_raw_hash" ]]; then
  echo 'Application smoke evidence does not bind to the supplied message broker evidence.' >&2
  exit 1
fi
if [[ "$actual_broker_metadata_hash" != "$recorded_broker_metadata_hash" || "$actual_broker_metadata_hash" != "$verified_broker_metadata_hash" ]]; then
  echo 'Application smoke evidence does not bind to the supplied message broker metadata.' >&2
  exit 1
fi

actual_worker_hash="$(sha256sum "$CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE" | awk '{print $1}')"
recorded_worker_hash="$(read_recorded_hash "$application_worker_hash")"
actual_worker_metadata_hash="$(sha256sum "$CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE_METADATA" | awk '{print $1}')"
recorded_worker_metadata_hash="$(read_recorded_hash "$application_worker_metadata_hash")"
if [[ "$actual_worker_hash" != "$recorded_worker_hash" || "$actual_worker_hash" != "$verified_worker_raw_hash" ]]; then
  echo 'Application smoke evidence does not bind to the supplied worker deployment evidence.' >&2
  exit 1
fi
if [[ "$actual_worker_metadata_hash" != "$recorded_worker_metadata_hash" || "$actual_worker_metadata_hash" != "$verified_worker_metadata_hash" ]]; then
  echo 'Application smoke evidence does not bind to the supplied worker deployment metadata.' >&2
  exit 1
fi


manifest="$attempt_dir/evidence-manifest.tsv"
{
  printf 'evidence\tsha256\n'
  printf 'database_rehearsal_summary\t%s\n' "$actual_database_hash"
  printf 'application_smoke_summary\t%s\n' "$(sha256sum "$application_summary" | awk '{print $1}')"
  printf 'application_smoke_http_statuses\t%s\n' "$(sha256sum "$application_statuses" | awk '{print $1}')"
  printf 'application_database_hash_record\t%s\n' "$(sha256sum "$application_database_hash" | awk '{print $1}')"
  printf 'application_broker_hash_record\t%s\n' "$(sha256sum "$application_broker_hash" | awk '{print $1}')"
  printf 'application_broker_metadata_hash_record\t%s\n' "$(sha256sum "$application_broker_metadata_hash" | awk '{print $1}')"
  printf 'message_broker_evidence\t%s\n' "$actual_broker_hash"
  printf 'message_broker_evidence_metadata\t%s\n' "$actual_broker_metadata_hash"
  printf 'application_worker_hash_record\t%s\n' "$(sha256sum "$application_worker_hash" | awk '{print $1}')"
  printf 'application_worker_metadata_hash_record\t%s\n' "$(sha256sum "$application_worker_metadata_hash" | awk '{print $1}')"
  printf 'application_target_hash_record\t%s\n' "$(sha256sum "$application_target_hash" | awk '{print $1}')"
  printf 'worker_deployment_evidence\t%s\n' "$actual_worker_hash"
  printf 'worker_deployment_evidence_metadata\t%s\n' "$actual_worker_metadata_hash"
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
  printf 'database_provider_evidence_hashes=validated\n'
  printf 'message_broker_evidence_hash_binding=matched\n'
  printf 'message_broker_metadata_hash_binding=matched\n'
  printf 'message_broker_provider_identity=matched-target-manifest\n'
  printf 'staging_target_binding=matched-across-database-and-application\n'
  printf 'staging_target_binding_sha256=%s\n' "$database_target_hash"
  printf 'worker_deployment_evidence_hash_binding=matched\n'
  printf 'worker_deployment_metadata_hash_binding=matched\n'
  printf 'worker_provider_identity=matched-target-manifest\n'
  printf 'worker_http_release_header=validated\n'
  printf 'worker_http_liveness=validated\n'
  printf 'worker_http_identity=validated\n'
  printf 'financial_mutations=not-exercised-by-smoke\n'
  printf 'credentials=not-collected\n'
  printf 'raw_external_evidence=not-copied-into-packet\n'
  printf 'promotion_decision=human-required\n'
  printf 'deployment_action=none\n'
  date -u '+completed_at_utc=%Y-%m-%dT%H:%M:%SZ'
} > "$attempt_dir/promotion-readiness.txt"

publish_evidence_attempt

printf 'Promotion evidence packet generated at %s\n' "$output_dir"
printf 'The packet records hashes and normalized checks only; it does not deploy or approve promotion.\n'
