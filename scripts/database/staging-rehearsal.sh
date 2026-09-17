#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

: "${CHARKHOONE_STAGING_MIGRATION_CONNECTION:?Npgsql staging migration connection is required}"
: "${CHARKHOONE_STAGING_MIGRATION_PSQL_CONNECTION:?psql-compatible staging migration conninfo/URI is required}"
: "${CHARKHOONE_STAGING_RUNTIME_PSQL_CONNECTION:?psql-compatible staging runtime conninfo/URI is required}"
: "${CHARKHOONE_STAGING_BACKUP_EVIDENCE:?path to provider-native backup/PITR evidence is required}"
: "${CHARKHOONE_STAGING_RESTORE_EVIDENCE:?path to provider-native restore-drill evidence is required}"
: "${CHARKHOONE_EXPECTED_GIT_SHA:?expected release git SHA is required}"

[[ ${CHARKHOONE_ALLOW_STAGING_REHEARSAL:-false} == true ]] || {
  echo 'Set CHARKHOONE_ALLOW_STAGING_REHEARSAL=true after independently confirming the staging target.' >&2
  exit 1
}
[[ ${CHARKHOONE_QUERY_PLAN_DATASET_CONFIRMED_REPRESENTATIVE:-false} == true ]] || {
  echo 'Set CHARKHOONE_QUERY_PLAN_DATASET_CONFIRMED_REPRESENTATIVE=true only after confirming representative staging volume/distribution.' >&2
  exit 1
}

for command_name in git psql python3 sha256sum dotnet dotnet-ef; do
  command -v "$command_name" >/dev/null 2>&1 || { echo "$command_name is required" >&2; exit 1; }
done

for evidence_path in "$CHARKHOONE_STAGING_BACKUP_EVIDENCE" "$CHARKHOONE_STAGING_RESTORE_EVIDENCE"; do
  [[ -f "$evidence_path" && -s "$evidence_path" ]] || {
    echo "Required staging provider evidence is missing or empty: $evidence_path" >&2
    exit 1
  }
done

actual_sha="$(git rev-parse HEAD)"
if [[ "$actual_sha" != "$CHARKHOONE_EXPECTED_GIT_SHA" ]]; then
  echo 'Checked-out git SHA does not match CHARKHOONE_EXPECTED_GIT_SHA; rehearsal blocked.' >&2
  exit 1
fi

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

output_root="${CHARKHOONE_DATABASE_EVIDENCE_DIR:-artifacts/database/staging-rehearsal}"
output_dir="$output_root/$actual_sha"
mkdir -p "$output_dir/pre-migration"

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

sha256sum "$CHARKHOONE_STAGING_BACKUP_EVIDENCE" | awk '{print $1}' > "$output_dir/provider-backup-evidence.sha256"
sha256sum "$CHARKHOONE_STAGING_RESTORE_EVIDENCE" | awk '{print $1}' > "$output_dir/provider-restore-evidence.sha256"

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
  printf 'connection_formats=separate-npgsql-migration-and-psql-evidence-connections\n'
  printf 'migration_runtime_roles_distinct=true\n'
  printf 'migration_runtime_database_name_match=true\n'
  printf 'pre_migration_runtime_role=passed\n'
  printf 'pre_migration_observability=captured\n'
  printf 'pre_migration_pitr_sql_evidence=captured-provider-native-proof-separate\n'
  printf 'provider_backup_evidence=operator-supplied-hash-recorded\n'
  printf 'provider_restore_evidence=operator-supplied-hash-recorded\n'
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
