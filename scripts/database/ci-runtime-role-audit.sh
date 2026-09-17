#!/usr/bin/env bash
set -euo pipefail

[[ ${GITHUB_ACTIONS:-} == true && ${CI:-} == true ]] || { echo 'CI-only runtime role audit semantics'; exit 1; }
: "${POSTGRES_CONTAINER_ID:?PostgreSQL service container required}"

role=charkhoone_runtime_audit_ci
database=charkhoone_integration
output_dir=artifacts/database/runtime-evidence/runtime-role-semantics
mkdir -p "$output_dir"

psql_admin() {
  docker exec -i "$POSTGRES_CONTAINER_ID" psql -X -q -A -t -F $'\t' \
    -v ON_ERROR_STOP=1 -U postgres -d "$database" "$@"
}

psql_admin <<SQL
DROP ROLE IF EXISTS $role;
CREATE ROLE $role NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
SQL

cleanup() {
  psql_admin >/dev/null 2>&1 <<SQL || true
RESET ROLE;
REVOKE TRUNCATE, TRIGGER ON TABLE public.journal_entries FROM $role;
DROP TABLE IF EXISTS public.runtime_role_owner_fixture;
DROP FUNCTION IF EXISTS public.charkhoone_runtime_role_owner_fixture();
DROP ROLE IF EXISTS $role;
SQL
}
trap cleanup EXIT

run_audit() {
  local output=$1
  {
    printf 'SET ROLE %s;\n' "$role"
    cat scripts/database/runtime-role-audit.sql
    printf 'RESET ROLE;\n'
  } | psql_admin > "$output"
  test -s "$output"
}

positive="$output_dir/restricted-role.tsv"
run_audit "$positive"
python3 scripts/database/verify-runtime-role.py "$positive"

psql_admin <<SQL
GRANT TRUNCATE, TRIGGER ON TABLE public.journal_entries TO $role;
SQL

privileged="$output_dir/ddl-privilege-negative.tsv"
run_audit "$privileged"
grep -Eq $'^application_table_truncate_privilege\t[1-9][0-9]*$' "$privileged"
grep -Eq $'^application_table_trigger_privilege\t[1-9][0-9]*$' "$privileged"
if python3 scripts/database/verify-runtime-role.py "$privileged" >/dev/null 2>&1; then
  echo 'runtime role verifier unexpectedly accepted TRUNCATE/TRIGGER privileges' >&2
  exit 1
fi

psql_admin <<SQL
REVOKE TRUNCATE, TRIGGER ON TABLE public.journal_entries FROM $role;
CREATE TABLE public.runtime_role_owner_fixture (id integer);
ALTER TABLE public.runtime_role_owner_fixture OWNER TO $role;
CREATE FUNCTION public.charkhoone_runtime_role_owner_fixture()
RETURNS integer
LANGUAGE sql
AS 'SELECT 1';
ALTER FUNCTION public.charkhoone_runtime_role_owner_fixture() OWNER TO $role;
SQL

owner="$output_dir/ownership-negative.tsv"
run_audit "$owner"
grep -Eq $'^application_table_owner\t[1-9][0-9]*$' "$owner"
grep -Eq $'^application_function_owner\t[1-9][0-9]*$' "$owner"
if python3 scripts/database/verify-runtime-role.py "$owner" >/dev/null 2>&1; then
  echo 'runtime role verifier unexpectedly accepted application object ownership' >&2
  exit 1
fi

cat > "$output_dir/scope.txt" <<'EOF'
scope=disposable-ci-postgres
restricted_role_positive_audit=passed
truncate_trigger_negative_audit=rejected
application_object_owner_negative_audit=rejected
staging_production_evidence=not-claimed
EOF

printf 'Runtime role ownership and DDL bypass audit semantics passed.\n'
