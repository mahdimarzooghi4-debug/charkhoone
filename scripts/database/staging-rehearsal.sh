#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

: "${CHARKHOONE_STAGING_MIGRATION_CONNECTION:?Npgsql staging migration connection is required}"
: "${CHARKHOONE_STAGING_MIGRATION_PSQL_CONNECTION:?psql-compatible staging migration conninfo/URI is required}"
: "${CHARKHOONE_STAGING_RUNTIME_PSQL_CONNECTION:?psql-compatible staging runtime conninfo/URI is required}"
: "${CHARKHOONE_STAGING_BACKUP_EVIDENCE:?path to provider-native backup/PITR evidence is required}"
: "${CHARKHOONE_STAGING_BACKUP_EVIDENCE_METADATA:?path to backup evidence identity metadata is required}"
: "${CHARKHOONE_STAGING_RESTORE_EVIDENCE:?path to provider-native restore-drill evidence is required}"
: "${CHARKHOONE_STAGING_RESTORE_EVIDENCE_METADATA:?path to restore evidence identity metadata is required}"
: "${CHARKHOONE_STAGING_TARGET_MANIFEST:?path to non-secret staging target manifest is required}"
: "${CHARKHOONE_EXPECTED_GIT_SHA:?expected release git SHA is required}"

[[ ${CHARKHOONE_ALLOW_STAGING_REHEARSAL:-false} == true ]] || {
  echo 'Set CHARKHOONE_ALLOW_STAGING_REHEARSAL=true after independently confirming the staging target.' >&2
  exit 1
}
[[ ${CHARKHOONE_QUERY_PLAN_DATASET_CONFIRMED_REPRESENTATIVE:-false} == true ]] || {
  echo 'Set CHARKHOONE_QUERY_PLAN_DATASET_CONFIRMED_REPRESENTATIVE=true only after confirming representative staging volume/distribution.' >&2
  exit 1
}

for command_name in git psql python3 sha256sum awk dotnet dotnet-ef; do
  command -v "$command_name" >/dev/null 2>&1 || { echo "$command_name is required" >&2; exit 1; }
done

for evidence_path in \
  "$CHARKHOONE_STAGING_BACKUP_EVIDENCE" \
  "$CHARKHOONE_STAGING_BACKUP_EVIDENCE_METADATA" \
  "$CHARKHOONE_STAGING_RESTORE_EVIDENCE" \
  "$CHARKHOONE_STAGING_RESTORE_EVIDENCE_METADATA"; do
  [[ -f "$evidence_path" && -s "$evidence_path" ]] || {
    echo "Required staging provider evidence is missing or empty: $evidence_path" >&2
    exit 1
  }
done
[[ -f "$CHARKHOONE_STAGING_TARGET_MANIFEST" && -s "$CHARKHOONE_STAGING_TARGET_MANIFEST" ]] || {
  echo 'Required staging target manifest is missing or empty.' >&2
  exit 1
}

target_manifest_info="$(python3 scripts/staging/verify-target-manifest.py "$CHARKHOONE_STAGING_TARGET_MANIFEST")"
target_binding_sha="$(printf '%s\n' "$target_manifest_info" | awk -F= '$1 == "staging_target_binding_sha256" { sub(/^[^=]*=/, ""); print; exit }')"
target_database_name="$(printf '%s\n' "$target_manifest_info" | awk -F= '$1 == "database_name" { sub(/^[^=]*=/, ""); print; exit }')"
if [[ ! "$target_binding_sha" =~ ^[0-9a-f]{64}$ || -z "$target_database_name" ]]; then
  echo 'Staging target manifest verifier returned incomplete identity evidence.' >&2
  exit 1
fi

backup_provider_info="$(python3 scripts/staging/verify-provider-evidence.py \
  --manifest "$CHARKHOONE_STAGING_TARGET_MANIFEST" \
  --metadata "$CHARKHOONE_STAGING_BACKUP_EVIDENCE_METADATA" \
  --raw-evidence "$CHARKHOONE_STAGING_BACKUP_EVIDENCE" \
  --kind database-backup)"
restore_provider_info="$(python3 scripts/staging/verify-provider-evidence.py \
  --manifest "$CHARKHOONE_STAGING_TARGET_MANIFEST" \
  --metadata "$CHARKHOONE_STAGING_RESTORE_EVIDENCE_METADATA" \
  --raw-evidence "$CHARKHOONE_STAGING_RESTORE_EVIDENCE" \
  --kind database-restore)"

read_provider_record() {
  local payload=$1
  local key=$2
  printf '%s\n' "$payload" | awk -F= -v wanted="$key" '$1 == wanted { sub(/^[^=]*=/, ""); print; exit }'
}

backup_raw_hash="$(read_provider_record "$backup_provider_info" provider_evidence_raw_sha256)"
backup_metadata_hash="$(read_provider_record "$backup_provider_info" provider_evidence_metadata_sha256)"
restore_raw_hash="$(read_provider_record "$restore_provider_info" provider_evidence_raw_sha256)"
restore_metadata_hash="$(read_provider_record "$restore_provider_info" provider_evidence_metadata_sha256)"
for evidence_hash in "$backup_raw_hash" "$backup_metadata_hash" "$restore_raw_hash" "$restore_metadata_hash"; do
  [[ "$evidence_hash" =~ ^[0-9a-f]{64}$ ]] || {
    echo 'Provider evidence verifier returned an invalid evidence hash.' >&2
    exit 1
  }
done

actual_sha="$(git rev-parse HEAD)"
if [[ "$actual_sha" != "$CHARKHOONE_EXPECTED_GIT_SHA" ]]; then
  echo 'Checked-out git SHA does not match CHARKHOONE_EXPECTED_GIT_SHA; rehearsal blocked.' >&2
  exit 1
fi

output_root="${CHARKHOONE_DATABASE_EVIDENCE_DIR:-artifacts/database/staging-rehearsal}"
output_dir="$output_root/$actual_sha"
mkdir -p "$output_dir/pre-migration"
printf '%s\n' "$target_binding_sha" > "$output_dir/pre-migration/staging-target-binding.sha256"

CHARKHOONE_DATABASE_TARGET_IDENTITY_EVIDENCE_DIR="$output_dir/pre-migration/migration-target-identity" \
scripts/database/verify-target-identity.sh

migration_role="$(psql "$CHARKHOONE_STAGING_MIGRATION_PSQL_CONNECTION" -X -q -A -t -v ON_ERROR_STOP=1 -c 'SELECT current_user')"
runtime_role="$(psql "$CHARKHOONE_STAGING_RUNTIME_PSQL_CONNECTION" -X -q -A -t -v ON_ERROR_STOP=1 -c 'SELECT current_user')"
if [[ -z "$migration_role" || -z "$runtime_role" ]]; then
  echo 'Could not resolve staging database roles.' >&2
  exit 1
fi
if [[ "$migration_role" == "$runtime_role" ]]; then
  echo 'Migration and runtime database identities must be distinct for staging rehearsal.' >&2
  exit 1
fi

migration_database="$(psql "$CHARKHOONE_STAGING_MIGRATION_PSQL_CONNECTION" -X -q -A -t -v ON_ERROR_STOP=1 -c 'SELECT current_database()')"
runtime_database="$(psql "$CHARKHOONE_STAGING_RUNTIME_PSQL_CONNECTION" -X -q -A -t -v ON_ERROR_STOP=1 -c 'SELECT current_database()')"
if [[ "$migration_database" != "$runtime_database" ]]; then
  echo 'Migration and runtime psql connections resolve to different database names; rehearsal blocked.' >&2
  exit 1
fi
if [[ "$migration_database" != "$target_database_name" ]]; then
  echo 'Resolved staging database name does not match the staging target manifest; rehearsal blocked.' >&2
  exit 1
fi

capture_migration_history() {
  local output=$1
  local exists
  exists="$(psql "$CHARKHOONE_STAGING_MIGRATION_PSQL_CONNECTION" -X -q -A -t -v ON_ERROR_STOP=1 \
    -c "SELECT to_regclass('public.\"__EFMigrationsHistory\"') IS NOT NULL")"
  if [[ "$exists" == t ]]; then
    psql "$CHARKHOONE_STAGING_MIGRATION_PSQL_CONNECTION" -X -q -A -t -v ON_ERROR_STOP=1 \
      -c 'SELECT "MigrationId" FROM "__EFMigrationsHistory" ORDER BY "MigrationId"' > "$output"
  else
    printf '<no-migration-history-table>\n' > "$output"
  fi
}

run_runtime_read_only() {
  local script=$1
  local output=$2
  {
    echo 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;'
    echo "SET LOCAL statement_timeout = '30s';"
    cat "$script"
    echo 'COMMIT;'
  } | psql "$CHARKHOONE_STAGING_RUNTIME_PSQL_CONNECTION" -X -q -A -t -F $'\t' \
      -v ON_ERROR_STOP=1 > "$output"
  test -s "$output"
}

capture_migration_history "$output_dir/migrations-before.txt"

run_runtime_read_only scripts/database/runtime-role-audit.sql "$output_dir/pre-migration/runtime-role.tsv"
python3 scripts/database/verify-runtime-role.py "$output_dir/pre-migration/runtime-role.tsv"
run_runtime_read_only scripts/database/runtime-observability.sql "$output_dir/pre-migration/runtime-observability.tsv"
run_runtime_read_only scripts/database/pitr-evidence.sql "$output_dir/pre-migration/pitr-evidence.tsv"

migration_sql="$output_dir/migrations-idempotent.sql"
scripts/database/generate-idempotent-sql.sh "$migration_sql" >/dev/null
sha256sum "$migration_sql" > "$output_dir/migrations-idempotent.sha256"

printf '%s\n' "$backup_raw_hash" > "$output_dir/provider-backup-evidence.sha256"
printf '%s\n' "$backup_metadata_hash" > "$output_dir/provider-backup-evidence-metadata.sha256"
printf '%s\n' "$restore_raw_hash" > "$output_dir/provider-restore-evidence.sha256"
printf '%s\n' "$restore_metadata_hash" > "$output_dir/provider-restore-evidence-metadata.sha256"

CHARKHOONE_DATABASE_CONNECTION="$CHARKHOONE_STAGING_MIGRATION_CONNECTION" \
CHARKHOONE_DATABASE_ENVIRONMENT=staging \
CHARKHOONE_ALLOW_DATABASE_MIGRATION=true \
scripts/database/migrate.sh

capture_migration_history "$output_dir/migrations-after.txt"

CHARKHOONE_DATABASE_CONNECTION="$CHARKHOONE_STAGING_RUNTIME_PSQL_CONNECTION" \
CHARKHOONE_DATABASE_ENVIRONMENT=staging \
CHARKHOONE_ALLOW_DATABASE_READINESS_AUDIT=true \
CHARKHOONE_DATABASE_EVIDENCE_DIR="$output_dir/readiness" \
scripts/database/target-readiness.sh

CHARKHOONE_DATABASE_CONNECTION="$CHARKHOONE_STAGING_RUNTIME_PSQL_CONNECTION" \
CHARKHOONE_DATABASE_ENVIRONMENT=staging \
CHARKHOONE_ALLOW_QUERY_PLAN_EVIDENCE=true \
CHARKHOONE_QUERY_PLAN_EVIDENCE_PURPOSE=staging \
CHARKHOONE_QUERY_PLAN_DATASET_CONFIRMED_REPRESENTATIVE=true \
CHARKHOONE_DATABASE_EVIDENCE_DIR="$output_dir/query-plans" \
scripts/database/capture-query-plans.sh

{
  printf 'environment=staging\n'
  printf 'git_sha=%s\n' "$actual_sha"
  printf 'staging_target_binding_sha256=%s\n' "$target_binding_sha"
  printf 'staging_target_database_name_match=true\n'
  printf 'connection_formats=separate-npgsql-migration-and-psql-evidence-connections\n'
  printf 'migration_npgsql_psql_target_identity=verified-by-advisory-lock-database-role-binding\n'
  printf 'migration_runtime_roles_distinct=true\n'
  printf 'migration_runtime_database_name_match=true\n'
  printf 'pre_migration_runtime_role=passed\n'
  printf 'pre_migration_observability=captured\n'
  printf 'pre_migration_pitr_sql_evidence=captured-provider-native-proof-separate\n'
  printf 'provider_backup_evidence=identity-and-raw-hash-verified\n'
  printf 'provider_backup_raw_sha256=%s\n' "$backup_raw_hash"
  printf 'provider_backup_metadata_sha256=%s\n' "$backup_metadata_hash"
  printf 'provider_restore_evidence=identity-and-raw-hash-verified\n'
  printf 'provider_restore_raw_sha256=%s\n' "$restore_raw_hash"
  printf 'provider_restore_metadata_sha256=%s\n' "$restore_metadata_hash"
  printf 'migration=completed\n'
  printf 'post_migration_readiness=passed\n'
  printf 'query_plan_evidence=captured-on-operator-confirmed-representative-dataset\n'
  printf 'application_smoke=still-required-outside-this-database-only-runner\n'
  printf 'promotion_decision=not-made-by-script\n'
  date -u '+completed_at_utc=%Y-%m-%dT%H:%M:%SZ'
} > "$output_dir/summary.txt"

printf 'Staging database rehearsal completed; evidence is in %s\n' "$output_dir"
printf 'Connection strings and database role names were not printed.\n'
printf 'Application/API smoke evidence and human review remain required before promotion.\n'
