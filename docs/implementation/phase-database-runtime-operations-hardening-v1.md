# Database runtime operations hardening v1

This phase hardens the PostgreSQL runtime boundary after schema integrity enforcement. It adds source-controlled connection policy, client telemetry, and read-only operational evidence without claiming that CI is staging or that a managed provider has configured PITR correctly.

## Runtime connection boundary

API and Worker now use named `NpgsqlDataSource` instances instead of passing the raw connection string directly to EF Core. The stable pool names are `Charkhoone.Api.Postgres` and `Charkhoone.Worker.Postgres`; an environment-supplied PostgreSQL `Application Name` remains authoritative when present.

`DatabaseRuntimeOptions` reads existing connection-string values as the baseline and allows bounded `Database:Runtime` overrides for connection/command/cancellation timeouts, pool size, idle lifetime/pruning, absolute connection lifetime and keepalive. It rejects unsafe unbounded connection/command timeouts, impossible min/max pool relationships, and `No Reset On Close`.

The `.env.example` exposes explicit values matching the current Npgsql defaults. They are examples and compatibility defaults, not production capacity recommendations. Production sizing must use observed concurrency, database connection limits, latency, transaction duration and failover behavior.

## PostgreSQL telemetry

OpenTelemetry now subscribes to:

- Npgsql command tracing through the Npgsql OpenTelemetry instrumentation;
- the `Npgsql` meter for operation/pool metrics;
- the existing Charkhoone custom meter, runtime metrics and HTTP instrumentation.

Explicit data-source names keep pool metric dimensions stable and non-secret instead of allowing a connection string to become the fallback pool name.

## Read-only operational evidence

Three SQL files are checked in:

- `runtime-observability.sql`: connection capacity, application/session state, lock-wait and idle-transaction counts, oldest transaction age, and per-table dead-row/autovacuum/autoanalyze statistics. It intentionally emits no SQL text, bind values or customer rows.
- `runtime-role-audit.sql`: seven stable least-privilege checks for the exact application role. Production/staging runtime-role evidence requires zero violations.
- `pitr-evidence.sql`: server WAL/archive diagnostics. It is explicitly diagnostic; provider-native backup retention, recovery window and successful point-in-time restore evidence are still required.

`ci-runtime-evidence.sh` runs all three queries against disposable CI PostgreSQL solely to prove syntax/compatibility and create non-sensitive artifacts. CI connects as `postgres`, so its runtime-role output is deliberately labelled compatibility-only and is not a passing application-role audit.

## Runtime role boundary

The application role is expected to be separate from the migration/deployment identity and must not be superuser, role creator, database creator, replication-enabled, BYPASSRLS-enabled, or able to create objects in the application database/public schema. The target deployment must run `runtime-role-audit.sql` using the exact API/Worker database role and retain zero-violation evidence.

The migration identity may need additional DDL privileges for reviewed EF migrations; those privileges should not be carried by the long-lived application process.

## Maintenance and query-plan boundary

Autovacuum/autoanalyze stays enabled by default. Source code does not invent universal dead-row, lock-wait, transaction-age or pool-saturation thresholds; alerts require staging/production baselines and SLOs. Routine `VACUUM FULL` is not prescribed because it takes stronger locks and should be an evidence-driven intervention.

Representative-volume `EXPLAIN (ANALYZE, BUFFERS)` remains an environment-backed gate. The small CI database verifies correctness and migration behavior, not production query latency or planner choices.

## Evidence still external to the repository

The following cannot be truthfully completed without an authorized staging/managed-database environment and are therefore release blockers rather than source-code claims:

- migration rehearsal on the real staging topology using the reviewed SQL/migration identity;
- runtime-role audit using the exact application credentials/role;
- provider-native PITR retention/recovery-window verification and a measured point-in-time restore;
- representative-volume query-plan capture and regression review;
- measured pool sizing, lock/transaction alert thresholds and database-capacity headroom.

The repository provides executable gates for these checks but does not pretend they have been run on staging or production.

## Financial policy boundary

No financial policy changes are introduced. In particular, this phase does not define the 3% lost-fund-return day-count/rounding/partial-allocation formula, partial-payment allocation, or early-cancellation Frozen Principal release timing. External `Unknown` outcomes remain query/reconcile-only and are not blindly retried.
