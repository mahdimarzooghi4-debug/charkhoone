#!/usr/bin/env bash
set -euo pipefail

[[ ${GITHUB_ACTIONS:-} == true && ${CI:-} == true ]] || {
  echo 'CI-only target identity semantics validation.' >&2
  exit 1
}
: "${POSTGRES_CONTAINER_ID:?PostgreSQL service container required}"

base_output="artifacts/database/runtime-evidence/target-identity-semantics"
mkdir -p "$base_output"

npgsql_connection='Host=localhost;Port=5432;Database=charkhoone_integration;Username=postgres;Password=postgres'
psql_connection='postgresql://postgres:postgres@localhost:5432/charkhoone_integration'
wrong_database_connection='postgresql://postgres:postgres@localhost:5432/postgres'
other_role='charkhoone_target_probe_other'
other_password='target-probe-ci-only'
other_role_connection="postgresql://$other_role:$other_password@localhost:5432/charkhoone_integration"

psql_admin() {
  docker exec -i "$POSTGRES_CONTAINER_ID" psql -X -q -v ON_ERROR_STOP=1 \
    -U postgres -d charkhoone_integration "$@"
}

cleanup() {
  psql_admin -c "DROP ROLE IF EXISTS $other_role" >/dev/null 2>&1 || true
}
trap cleanup EXIT

CHARKHOONE_STAGING_MIGRATION_CONNECTION="$npgsql_connection" \
CHARKHOONE_STAGING_MIGRATION_PSQL_CONNECTION="$psql_connection" \
CHARKHOONE_DATABASE_TARGET_IDENTITY_EVIDENCE_DIR="$base_output/positive" \
scripts/database/verify-target-identity.sh

test -s "$base_output/positive/summary.txt"
grep -qx 'npgsql_psql_target_binding=passed' "$base_output/positive/summary.txt"

if CHARKHOONE_STAGING_MIGRATION_CONNECTION="$npgsql_connection" \
   CHARKHOONE_STAGING_MIGRATION_PSQL_CONNECTION="$wrong_database_connection" \
   CHARKHOONE_DATABASE_TARGET_IDENTITY_EVIDENCE_DIR="$base_output/wrong-database-negative" \
   scripts/database/verify-target-identity.sh >/dev/null 2>&1; then
  echo 'Target identity verifier unexpectedly accepted a different database.' >&2
  exit 1
fi

psql_admin <<SQL
DROP ROLE IF EXISTS $other_role;
CREATE ROLE $other_role LOGIN PASSWORD '$other_password';
SQL

if CHARKHOONE_STAGING_MIGRATION_CONNECTION="$npgsql_connection" \
   CHARKHOONE_STAGING_MIGRATION_PSQL_CONNECTION="$other_role_connection" \
   CHARKHOONE_DATABASE_TARGET_IDENTITY_EVIDENCE_DIR="$base_output/wrong-role-negative" \
   scripts/database/verify-target-identity.sh >/dev/null 2>&1; then
  echo 'Target identity verifier unexpectedly accepted a different migration role.' >&2
  exit 1
fi

cat > "$base_output/scope.txt" <<'EOF'
scope=disposable-ci-postgres
npgsql_psql_same_database_same_role_positive=passed
npgsql_psql_different_database_negative=rejected
npgsql_psql_different_role_negative=rejected
connection_secrets=ci-fixtures-only-not-recorded-in-evidence
staging_production_evidence=not-claimed
EOF

printf 'Npgsql/psql target identity positive and negative semantics passed.\n'
