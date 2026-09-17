# Database backup/restore drill and integrity verification

CI runs this drill after the regular PostgreSQL integration tests have migrated and populated `charkhoone_integration`. Those tests create funded tenant contributions, posted double-entry journals, frozen bank principal, unknown payment reconciliation transactions and high-precision rial values. A dedicated SQL fixture adds pending and processed outbox/inbox records. There is no production data or provider connection.

## Recovery path

`scripts/database/ci-backup-restore.sh` requires GitHub Actions CI and its explicit PostgreSQL service container ID. It uses the PostgreSQL 17 service's own `pg_dump`, `createdb`, `pg_restore`, and `psql`, avoiding client/server version mismatch. Database names are fixed. The source has no concurrent test/API/worker writers during capture.

1. Require nonempty financial and messaging fixtures and verify source integrity.
2. Capture an exact, sorted representation of every public table, including EF migration history and full numeric values, plus constraints and indexes. Partial-index predicates are reparsed by PostgreSQL through a temporary view before comparison because dump/restore can change array-cast expression rendering without changing meaning. The predicate is retained, not removed from verification.
3. Make a custom-format logical dump, including schema and data.
4. Create a separate database from `template0`. An existing target causes failure; the script never drops or overwrites databases.
5. Restore with `--exit-on-error --single-transaction`, without owner/ACL restoration.
6. Compare the restored manifest byte-for-byte, scan actual foreign keys, verify validated constraints and valid indexes, and check each journal's debit/credit balance.
7. Run four dedicated smoke tests using only restored fixtures, with no migration or reseeding: applied migration chain and authenticated contract read; query/reconciliation of an existing Unknown payment twice; contribution replay without external adapter calls or posted-ledger/frozen-principal changes; messaging state and duplicate rejection for inbox/outbox IDs and external/journal idempotency keys.

The restored tests are skipped during normal tests and enabled explicitly in the dedicated CI step. Any missing required fixture fails the drill. Unique-constraint probes use transactions which are rolled back. Unknown external outcomes remain Unknown with development-only indeterminate responses; there is no blind transfer retry.

## Evidence and limits

CI uploads `database-restore-drill-<SHA>` with the measured `pg_restore` elapsed milliseconds, integrity summary and smoke-test TRX. The timer includes the Docker exec/stream invocation but excludes dump, database creation and subsequent verification. Temporary dumps and full data manifests are removed and never uploaded. A timing file alone does not prove success: require the complete backend job and smoke tests to pass at the exact commit SHA.

This is a small-fixture logical recovery check, not a production RTO/RPO commitment, physical backup/PITR drill, capacity benchmark, provider reconciliation exercise or restore of roles/grants. Production backup storage, encryption, retention, representative volume, WAL/PITR, credentials and operational recovery objectives still require real environment configuration and separate drills. No staging/production migration or restore is executed here.

No EF schema change or migration is introduced. No unresolved lost-fund-return/day-count/rounding/partial-payment or early-cancellation principal-release policy is encoded.
