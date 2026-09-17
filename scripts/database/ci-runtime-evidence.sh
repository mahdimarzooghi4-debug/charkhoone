#!/usr/bin/env bash
set -euo pipefail

[[ ${GITHUB_ACTIONS:-} == true && ${CI:-} == true ]] || { echo 'CI-only runtime evidence wrapper'; exit 1; }
: "${POSTGRES_CONTAINER_ID:?PostgreSQL service container required}"

mkdir -p artifacts/database/runtime-evidence

database=charkhoone_integration
for script in runtime-observability.sql runtime-role-audit.sql pitr-evidence.sql; do
  report="artifacts/database/runtime-evidence/${script%.sql}.tsv"
  {
    echo 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;'
    echo "SET LOCAL statement_timeout = '30s';"
    cat "scripts/database/$script"
    echo 'COMMIT;'
  } | docker exec -i "$POSTGRES_CONTAINER_ID" psql -X -q -A -t -F $'\t' \
      -v ON_ERROR_STOP=1 -U postgres -d "$database" > "$report"
  test -s "$report"
done

# CI intentionally connects as the PostgreSQL service superuser. The role-audit
# file is compatibility evidence only and MUST NOT be interpreted as a passing
# application-role least-privilege check.
printf '%s\n' \
  'scope=disposable-ci-postgres' \
  'runtime_role_audit=compatibility-only-superuser-not-production-evidence' \
  'pitr_evidence=diagnostic-only-not-provider-retention-proof' \
  > artifacts/database/runtime-evidence/scope.txt
