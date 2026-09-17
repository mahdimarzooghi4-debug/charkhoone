# Database staging rehearsal and query-plan evidence v1

This phase turns the remaining staging-only database gates into executable, reviewable tooling. It does **not** claim that staging or production was contacted from CI.

## Scope

The phase adds two guarded paths:

1. `scripts/database/capture-query-plans.sh` captures query-plan and cardinality evidence for the database query shapes already used by the application and workers.
2. `scripts/database/staging-rehearsal.sh` orchestrates a real staging-only database rehearsal once authorized credentials and provider evidence are supplied.

No schema migration is introduced by this phase.

## Query-plan evidence

The plan suite covers:

- payment reconciliation candidate selection;
- tenant-contribution coverage candidate selection;
- cancellation settlement candidate selection;
- normal settlement candidate selection;
- Outbox chronological dequeue;
- contract monthly-obligation reads;
- contract audit pagination with and without an action filter;
- external-transaction idempotency lookup;
- journal idempotency lookup;
- Inbox idempotency lookup;
- unresolved lost-fund-return exposure count.

The runtime queries were copied from the current worker/read-service shapes rather than invented benchmark SQL.

`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` is used only for SELECTs under `default_transaction_read_only=on`. The exact Outbox `FOR UPDATE SKIP LOCKED` shape is captured with non-executing `EXPLAIN (FORMAT JSON)` so the evidence run does not acquire row locks. A second analyzed Outbox read-path plan keeps the index/order path observable without locking staging rows.

The script does not emit customer rows or the database connection string. Plan artifacts can still contain table/index names and SQL predicates, so they remain operational evidence and should follow normal artifact access controls.

## Representative-data gate

A staging plan run is blocked unless the operator explicitly sets:

```text
CHARKHOONE_QUERY_PLAN_DATASET_CONFIRMED_REPRESENTATIVE=true
```

This is intentionally not inferred from a made-up row-count threshold. The evidence includes table/candidate cardinalities so reviewers can judge whether the operator's representativeness assertion is credible for the expected workload.

CI may run the same SQL in `compatibility:ci` mode against disposable PostgreSQL. That validates SQL/parser compatibility only and is marked `dataset_representative=false-ci-compatibility-only`; it is not staging performance evidence.

## Staging migration rehearsal

`staging-rehearsal.sh` requires all of the following before applying checked-in migrations:

- explicit opt-in `CHARKHOONE_ALLOW_STAGING_REHEARSAL=true`;
- exact checked-out release SHA matching `CHARKHOONE_EXPECTED_GIT_SHA`;
- a dedicated staging migration connection;
- a distinct staging runtime connection;
- operator-supplied, non-empty provider-native backup/PITR evidence;
- operator-supplied, non-empty provider-native restore-drill evidence;
- an operator-confirmed representative staging dataset.

The runner records hashes of the provider evidence rather than copying its content, generates and hashes the idempotent migration SQL, records migration history before and after, invokes the guarded staging migration runner, runs post-migration financial/runtime-role readiness checks, and captures the query-plan suite.

The migration and runtime role names and connection strings are not printed. The runner verifies that the two database identities are distinct and point to the same database name.

## Deliberate boundaries

A successful database rehearsal is still **not** a production promotion decision. Review must also include:

- application/API smoke evidence using the released build and authorized staging identities;
- human review of query plans and cardinalities;
- provider-native PITR/restore evidence quality and recency;
- measured lock waits, query latency, pool utilization, and alert thresholds under representative load;
- migration duration/lock impact assessment for the actual staging dataset.

No hard latency, row-count, index-choice, or buffer threshold is invented here because those limits depend on production SLOs and representative workload measurements.

## Financial-policy boundary

This phase does not encode or benchmark any undefined financial policy. The lost-fund-return day-count/rounding/partial-allocation formula, partial-payment allocation, and early-cancellation Frozen Principal release timing remain unresolved. External `Unknown` remains reconciliation-only and is not treated as `Failed` or blindly retried.
