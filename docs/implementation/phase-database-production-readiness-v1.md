# Database production readiness v1

This phase begins the PostgreSQL production-hardening track after the core backend financial/auth/reconciliation slices.

## CI guarantees added

The backend CI job now:

- exposes the PostgreSQL integration connection through the standard application connection-string key for EF tooling;
- installs the pinned EF CLI version explicitly;
- runs `dotnet ef migrations has-pending-model-changes` after build/test to detect EF model drift that lacks a migration;
- generates the full idempotent migration SQL from checked-in migrations;
- verifies that generated SQL is non-empty and migration-history aware;
- syntax-checks the guarded database operation scripts.

The existing PostgreSQL integration tests still apply the checked-in migration chain to the ephemeral CI database. This phase does not apply anything to staging or production.

## Operator tooling

- `scripts/database/generate-idempotent-sql.sh` generates reviewable SQL without applying it.
- `scripts/database/migrate.sh` requires explicit environment and migration confirmation, never prints the connection string, and adds a stronger acknowledgement gate for production.
- `docs/operations/postgres-production-readiness.md` defines backup/PITR, restore-drill, staging-first migration, post-migration verification, forward-fix rollback, and query/index review requirements.

## Deliberate boundaries

No schema change is introduced in this slice. Query-plan/index hardening follows separately so indexes can be reviewed against the actual reconciliation/read paths and generated with a real `dotnet ef` migration.

Undefined financial policy is not encoded in database defaults, triggers, or migration scripts.
