# Database integrity enforcement v2

This phase turns the highest-confidence findings from the prior read-only integrity audit into database-enforced invariants. It is intentionally limited to rules already established by the domain and application behavior. It does not define unresolved financial policy.

## Enforcement added

### Posted journal integrity

PostgreSQL now enforces the journal boundary independently of EF Core:

- `journal_lines` must contain exactly one positive side and one zero side; debit and credit values must be finite.
- A newly inserted journal is checked by `DEFERRABLE INITIALLY DEFERRED` constraint triggers at transaction commit. It must have at least two lines, positive totals, and equal total debit and credit.
- Existing journals are checked for the same balance condition before trigger protection is installed. Migration aborts with a check violation if the existing ledger is not clean.
- Existing journals are sealed in the internal `journal_entry_seals` database table. The table is implementation state for the database guard, not a domain aggregate or EF entity.
- After a journal is committed, raw SQL cannot update or delete its header, update or delete any line, append another line, or remove/update its seal. Corrections continue to use a new reversal journal entry.
- `CharkhooneDbContext` also rejects tracked journal header/line updates and deletes as defense in depth. The PostgreSQL triggers remain authoritative for direct SQL or any caller that bypasses EF tracking.
- The journal-line foreign key no longer cascades journal deletion; it uses restrictive delete behavior.

The deferred trigger design preserves the existing valid posting flow, where the journal header and its lines are inserted in the same database transaction before commit.

### Deterministic row and relationship invariants

The database now rejects:

- non-IRR ledger-account or external-transaction currency;
- zero/negative/non-finite financial amounts where the existing flow requires a positive amount;
- whitespace-only persisted idempotency keys for verification, eligibility, bank approval, principal freeze, external transaction, journal and payment instruction operations;
- funding allocations whose persisted bank-approved loan and tenant contribution do not add up to the full-deposit equivalent, or whose approved loan exceeds the eligibility/full-deposit bounds;
- self-reversal journals and journals posted before their occurrence time;
- Frozen Principal rows without an existing lease contract;
- lease contracts that reference a non-existent credit application.

The Frozen Principal-to-contract and contract-to-credit-application relationships use restrictive deletes. Existing financial history cannot disappear through those relationships.

## Migration provenance

The schema changes were generated from the EF model with the pinned EF CLI (`dotnet-ef` 10.0.12):

- `AddDatabaseIntegrityEnforcementV2` contains the EF-modeled checks, foreign keys and delete-behavior change.
- `AddJournalLedgerTriggers` was first scaffolded as a real empty `dotnet ef` migration and then intentionally customized with PostgreSQL trigger/function SQL. The trigger SQL is handwritten PostgreSQL inside an EF-generated migration shell; it is not represented as EF-generated SQL.

No historical migration is edited. The temporary migration-scaffolding workflow is removed after both generated migrations exist.

## Verification

PostgreSQL integration tests exercise the database boundary directly, not only the application path. They prove that:

- a balanced journal commits and receives a seal;
- an unbalanced journal is rejected at transaction commit;
- invalid journal-line shapes are rejected by CHECK constraints;
- non-IRR currency, blank journal idempotency and orphan Frozen Principal writes are rejected;
- direct SQL journal header updates/deletes are rejected;
- direct SQL journal-line updates/deletes/appends are rejected after posting;
- all expected user triggers are installed and the balance triggers are deferrable and initially deferred;
- configured EF foreign keys and unique indexes exist in migrated PostgreSQL;
- the existing 14-code read-only financial audit remains clean.

CI also retains migration-from-zero, idempotent migration SQL generation, backup/clean-restore, restored-database smoke tests, source/restored integrity audits, and schema metadata evidence.

## Deployment boundary

Before an authorized staging upgrade, run the existing read-only financial integrity audit against the target and require zero violations. Do not auto-repair financial history. If the migration preflight rejects existing journals, investigate using audit and provider evidence; posted corrections use reversal entries.

This repository phase does not apply a migration to staging or production and does not claim that it did. CI PostgreSQL is disposable integration infrastructure, not staging.

Runtime-role privileges still need to be validated in the target environment so the application role cannot disable triggers or perform DDL. Backup/PITR settings, restore objectives, production cardinality query plans, connection-pool sizing and lock-wait observability also require environment evidence rather than source-code assertions.

## Explicit policy exclusions

This phase does not introduce or infer:

- the 3% lost-fund-return day-count, rounding or partial-allocation formula;
- partial-payment allocation policy;
- early-cancellation Frozen Principal release timing;
- any retry rule that converts an external `Unknown` outcome into `Failed` or permits blind re-execution.

Frozen principal remains separate from tenant-delinquency coverage. No constraint in this phase changes settlement ownership or cancellation policy.
