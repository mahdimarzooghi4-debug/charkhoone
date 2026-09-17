#!/usr/bin/env bash
set -euo pipefail
# CI-only: fixed database names and the PostgreSQL Actions service container.
[[ ${GITHUB_ACTIONS:-} == true && ${CI:-} == true ]] || { echo 'CI-only drill'; exit 1; }
: "${POSTGRES_CONTAINER_ID:?PostgreSQL service container required}"
source_db=charkhoone_integration
restore_db=charkhoone_restore_drill
artifacts=artifacts/database/restore-drill
mkdir -p "$artifacts"
scratch_dir=$(mktemp -d)
trap 'rm -rf "$scratch_dir"' EXIT
pg() { docker exec -i "$POSTGRES_CONTAINER_ID" "$@"; }
psql_db() { pg psql -X -q -v ON_ERROR_STOP=1 -U postgres -d "$1"; }
# This stage runs after the test process has exited; no API/worker writes overlap.
psql_db "$source_db" < scripts/database/drill-message-seed.sql
for database in "$source_db"; do
  psql_db "$database" < scripts/database/drill-integrity.sql
  psql_db "$database" < scripts/database/drill-manifest.sql > "$scratch_dir/source.manifest"
done
pg pg_dump -U postgres -d "$source_db" --format=custom --no-owner --no-acl > "$scratch_dir/backup.dump"
test -s "$scratch_dir/backup.dump"
# Refuse an existing target. Never drop, overwrite, or clean a database.
pg createdb -U postgres --template=template0 "$restore_db"
start_ns=$(date +%s%N)
pg pg_restore -U postgres -d "$restore_db" --exit-on-error --single-transaction --no-owner --no-acl < "$scratch_dir/backup.dump"
end_ns=$(date +%s%N)
restore_ms=$(( (end_ns - start_ns) / 1000000 ))
printf 'CI pg_restore elapsed: %s ms\n' "$restore_ms" | tee "$artifacts/restore-timing.txt"
printf 'Logical CI restore only; not a production RTO/RPO or PITR result.\n' >> "$artifacts/restore-timing.txt"
cat "$artifacts/restore-timing.txt" >> "$GITHUB_STEP_SUMMARY"
psql_db "$restore_db" < scripts/database/drill-manifest.sql > "$scratch_dir/restored.manifest"
cmp "$scratch_dir/source.manifest" "$scratch_dir/restored.manifest"
psql_db "$restore_db" < scripts/database/drill-integrity.sql
printf 'All public table contents, migration history, constraints and indexes match.\n' | tee "$artifacts/integrity.txt"
