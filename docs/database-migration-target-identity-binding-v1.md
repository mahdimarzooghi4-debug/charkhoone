# Database migration target identity binding V1

This phase hardens staging rehearsal so the Npgsql connection passed to EF Core migration execution is cryptographically/synchronously bound to the separate psql connection used for migration evidence.

It does not add or modify a schema migration, does not contact staging or production in CI, and does not claim that any real provider target has been rehearsed.

## Previous gap

The rehearsal previously verified that the migration psql connection and runtime psql connection reported the same database name, but the Npgsql-form migration connection passed to `dotnet ef database update --connection ...` was not independently proven to resolve to that same PostgreSQL target.

A typo, stale secret, DNS alias mistake, or separately managed connection variable could therefore allow psql evidence to describe one target while EF migrations were sent to another.

## Binding protocol

`scripts/database/verify-target-identity.sh` now establishes a live cross-driver proof before migrations are allowed:

1. `NpgsqlTargetProof` opens the exact `CHARKHOONE_STAGING_MIGRATION_CONNECTION` with the Npgsql driver.
2. The Npgsql session acquires a random 62-bit PostgreSQL advisory lock and keeps the session open.
3. A separate psql session connects with `CHARKHOONE_STAGING_MIGRATION_PSQL_CONNECTION` and attempts the same advisory lock.
4. The psql session must observe that the lock is already held. This proves both sessions reached the same PostgreSQL advisory-lock namespace for the same database rather than merely reporting similar host/database text.
5. The two live sessions must also hash to the same `current_database()` and `session_user` values. A different database or migration role fails closed.
6. Connection strings, raw database names, and raw role names are not written to evidence. Evidence contains only SHA-256 identity hashes and boolean proof results.
7. The Npgsql advisory lock is released before the rehearsal proceeds.

The proof deliberately does not require raw host strings or `inet_server_addr()` to be equal. Different network aliases or interfaces can still lead to the same PostgreSQL instance; the advisory-lock handshake is the authoritative binding. Endpoint hashes are retained only as non-secret diagnostics.

## CI semantics

`ci-target-identity.sh` uses the disposable PostgreSQL service and proves three cases:

- same database + same migration role: accepted;
- same server but different database: rejected;
- same database but different migration role: rejected.

These tests exercise real Npgsql and real psql connections. They are semantic CI evidence only and are not staging/production target evidence.

## Staging rehearsal integration

`staging-rehearsal.sh` runs the target identity verifier before migration history capture, pre-migration audits, or `migrate.sh`. A failed identity proof therefore blocks the migration path before EF Core can modify the target.

A successful staging rehearsal summary records:

`migration_npgsql_psql_target_identity=verified-by-advisory-lock-database-role-binding`

This statement is only emitted after a real target handshake succeeds during that rehearsal. It is not emitted by CI as a staging claim.

## Operational prerequisites

The repository solution now includes the small `NpgsqlTargetProof` console project. Restore the checked-in solution dependencies before running the staging rehearsal so the helper can execute with `--no-restore`. The existing `dotnet-ef`, psql, provider backup/restore evidence, exact Git SHA, runtime-role audit, readiness audit, and representative query-plan requirements remain unchanged.

## Non-claims

This phase does not:

- perform a real staging database rehearsal;
- deploy the API, Worker, Web, or Mobile application;
- prove provider-native backup/PITR configuration;
- identify a deployment provider;
- change database grants or ownership;
- encode any unresolved financial policy.
