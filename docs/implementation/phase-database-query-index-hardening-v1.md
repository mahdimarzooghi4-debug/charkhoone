# Database query/index hardening v1

This phase hardens PostgreSQL indexes for query shapes already present in Charkhoone. It does not invent new financial behavior and it does not encode unresolved business policy.

## Query paths reviewed

The review covered:

- financial reconciliation payment candidate selection;
- missed monthly obligations eligible for tenant-contribution coverage;
- cancellation-pending and settlement-pending contract candidate selection;
- outbox dequeue ordering with unprocessed-message filtering;
- contract financial detail reads;
- contract audit pagination with optional action filtering;
- unresolved lost-fund-return exposure reads;
- external transaction lookups used by payment reconciliation attention/read models.

## Index changes

The EF model now contains indexes that align with those query predicates and orderings, including:

- lease-contract status + updated timestamp + id;
- monthly-obligation status + due timestamp + id;
- monthly-obligation + coverage status;
- partial outbox index on unprocessed rows ordered by occurrence + id;
- partial lost-fund-return index on unresolved exposures;
- ordered contract audit indexes, including the optional action filter;
- payment-reconciliation candidate index on unresolved external transactions;
- external transaction aggregate lookup ordered by updated timestamp + id.

The payment reconciliation candidate index is partial for the exact persisted discriminator/status values used by the worker. The general external-transaction aggregate lookup remains separate for contract detail/read-model access.

## Migrations

The schema changes were generated with `dotnet ef` rather than handwritten migration code:

- `AddDatabaseQueryIndexes`
- `AddDatabaseQueryIndexRefinements`

The refinement migration replaces the broader external-transaction reconciliation index with a partial candidate index and adds the separate ordered aggregate lookup. Historical migrations were not edited.

The temporary migration-generation workflows were removed after generation.

## Verification

- persistence model tests assert the expected index shapes;
- PostgreSQL integration tests apply the full migration chain;
- PostgreSQL integration tests query `pg_indexes` to verify the production partial-index predicates exist after migration;
- CI production-readiness checks still verify there are no pending EF model changes and that the full idempotent migration SQL can be generated.

## Deliberate boundaries

This phase does not claim measured production query-plan improvements. Actual production/staging plan review still requires representative row counts and `EXPLAIN (ANALYZE, BUFFERS)` in a safe non-production or staging environment. Small CI databases are not a valid source for planner-performance conclusions.

No staging or production database is migrated by this phase.
