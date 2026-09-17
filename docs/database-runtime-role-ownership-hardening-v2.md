# Database runtime role ownership hardening V2

This phase closes a DDL-bypass gap in the PostgreSQL runtime-role release gate. It changes audit/readiness controls only; it does not add or edit an EF Core migration and does not change staging or production privileges automatically.

## Threat model

The immutable financial ledger is enforced partly by PostgreSQL triggers and trigger functions. A runtime identity that owns the database, the `public` schema, application tables, or application functions can have DDL authority that is inappropriate for API/Worker execution. Table `TRUNCATE` can destroy data without row-level `DELETE` semantics, and table `TRIGGER` permits creating triggers. Object ownership can also permit altering or disabling trigger protection.

The deployment/migration identity is therefore separate from the API/Worker runtime identity. Ownership and DDL privileges belong to controlled migration/administration paths, not the long-lived application runtime role.

## Stable audit contract

`scripts/database/runtime-role-audit.sql` now emits exactly 13 stable check codes. Every count must be zero for the runtime role:

- `role_superuser`
- `role_create_role`
- `role_create_db`
- `role_replication`
- `role_bypass_rls`
- `database_create_privilege`
- `public_schema_create_privilege`
- `database_owner`
- `public_schema_owner`
- `application_table_owner`
- `application_function_owner`
- `application_table_truncate_privilege`
- `application_table_trigger_privilege`

Ownership checks use PostgreSQL role membership rather than only direct owner-name equality so membership in an owning role is also rejected. Application tables are regular/partitioned tables in `public`. Application functions are non-extension functions in `public`; this includes the checked-in journal guard functions while excluding extension-managed functions.

The audit does not prohibit ordinary application DML such as the reviewed `SELECT`/`INSERT`/`UPDATE`/`DELETE` privileges required by the product. Those permissions must still be granted narrowly by the platform/database administrator.

## CI semantics

`scripts/database/ci-runtime-role-audit.sh` runs only against the disposable GitHub Actions PostgreSQL service after the migration/test schema exists. It proves three cases:

1. a restricted runtime role produces all 13 checks at zero and passes the verifier;
2. granting `TRUNCATE` and `TRIGGER` on an application table produces violations and is rejected;
3. making the runtime role owner of a public table and non-extension public function produces ownership violations and is rejected.

These CI results prove query/verifier semantics only. They are not staging or production role evidence.

The existing `ci-runtime-evidence.sh` continues to query as the disposable PostgreSQL superuser for compatibility/diagnostic evidence and explicitly labels that output as non-production evidence.

## Staging and production release gate

`scripts/database/target-readiness.sh` already runs `runtime-role-audit.sql` through `verify-runtime-role.py` while connected with `CHARKHOONE_DATABASE_CONNECTION`. After this phase, the same target-readiness command therefore fails closed if any of the 13 checks is non-zero.

Run it using the exact API/Worker runtime identity, not the migration/admin identity. A passing disposable-CI audit cannot substitute for this target check.

No script in this phase changes ownership or grants automatically. If a target fails, correct ownership/grants using the provider-approved administrative path, record the change, and rerun the read-only readiness audit.

## Ledger guard functions in scope

The current trigger migration creates these non-extension functions in `public`:

- `charkhoone_reject_posted_ledger_mutation()`
- `charkhoone_reject_sealed_journal_line_insert()`
- `charkhoone_validate_and_seal_journal()`

The runtime identity must not own them directly or through an owning-role membership. The audit intentionally discovers all non-extension public functions rather than hard-coding only these three names so future application functions receive the same ownership protection.

## Claims and non-claims

This phase claims checked-in detection, verifier enforcement, and disposable-CI semantics. It does not claim that any staging/production role has been audited yet, that provider grants were changed, or that a provider-specific deployment was executed.
