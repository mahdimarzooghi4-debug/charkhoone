#!/usr/bin/env bash
set -euo pipefail

: "${CHARKHOONE_DATABASE_CONNECTION:?target database connection is required}"
: "${CHARKHOONE_DATABASE_ENVIRONMENT:?target environment is required}"

environment_name="${CHARKHOONE_DATABASE_ENVIRONMENT,,}"
case "$environment_name" in
  staging|production) ;;
  *) echo 'CHARKHOONE_DATABASE_ENVIRONMENT must be staging or production' >&2; exit 1 ;;
esac

[[ ${CHARKHOONE_ALLOW_DATABASE_READINESS_AUDIT:-false} == true ]] || {
  echo 'Set CHARKHOONE_ALLOW_DATABASE_READINESS_AUDIT=true after confirming the target.' >&2
  exit 1
}

command -v psql >/dev/null 2>&1 || { echo 'psql is required' >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo 'python3 is required' >&2; exit 1; }

output_root="${CHARKHOONE_DATABASE_EVIDENCE_DIR:-artifacts/database/target-readiness}"
output_dir="$output_root/$environment_name"
mkdir -p "$output_dir"

run_read_only() {
  local script=$1
  local output=$2
  {
    echo 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;'
    echo "SET LOCAL statement_timeout = '30s';"
    cat "$script"
    echo 'COMMIT;'
  } | psql "$CHARKHOONE_DATABASE_CONNECTION" -X -q -A -t -F $'\t' \
      -v ON_ERROR_STOP=1 > "$output"
  test -s "$output"
}

run_read_only scripts/database/audit-financial-integrity.sql "$output_dir/financial-integrity.tsv"
python3 scripts/database/verify-integrity-audit.py "$output_dir/financial-integrity.tsv"

run_read_only scripts/database/runtime-role-audit.sql "$output_dir/runtime-role.tsv"
python3 scripts/database/verify-runtime-role.py "$output_dir/runtime-role.tsv"

run_read_only scripts/database/runtime-observability.sql "$output_dir/runtime-observability.tsv"
run_read_only scripts/database/pitr-evidence.sql "$output_dir/pitr-evidence.tsv"

{
  printf 'environment=%s\n' "$environment_name"
  printf 'financial_integrity=passed\n'
  printf 'runtime_role=passed\n'
  printf 'runtime_observability=captured\n'
  printf 'pitr_sql_evidence=captured-provider-native-proof-still-required\n'
  date -u '+captured_at_utc=%Y-%m-%dT%H:%M:%SZ'
} > "$output_dir/summary.txt"

printf 'Target database readiness evidence captured in %s\n' "$output_dir"
printf 'Connection string was not printed. Provider-native PITR/restore evidence remains required.\n'
