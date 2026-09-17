#!/usr/bin/env bash
set -euo pipefail
[[ ${GITHUB_ACTIONS:-} == true && ${CI:-} == true ]] || { echo 'CI-only audit wrapper'; exit 1; }
: "${POSTGRES_CONTAINER_ID:?PostgreSQL service container required}"
mkdir -p artifacts/database/integrity-audit
for database in charkhoone_integration charkhoone_restore_drill; do
  report="artifacts/database/integrity-audit/${database}.tsv"
  {
    echo 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;'
    echo "SET LOCAL statement_timeout = '30s';"
    cat scripts/database/audit-financial-integrity.sql
    echo 'COMMIT;'
  } | docker exec -i "$POSTGRES_CONTAINER_ID" psql -X -q -A -t -F $'\t' \
      -v ON_ERROR_STOP=1 -U postgres -d "$database" > "$report"
  {
    echo 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;'
    echo "SET LOCAL statement_timeout = '30s';"
    cat scripts/database/audit-constraint-catalog.sql
    echo 'COMMIT;'
  } | docker exec -i "$POSTGRES_CONTAINER_ID" psql -X -q -A -t -F $'\t' \
      -v ON_ERROR_STOP=1 -U postgres -d "$database" \
      > "artifacts/database/integrity-audit/${database}-catalog.tsv"
  # A missing/empty result is a failure, not a clean audit.
  python3 scripts/database/verify-integrity-audit.py "$report"
done
