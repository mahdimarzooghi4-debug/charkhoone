# Database constraint / integrity audit v1

Baseline: PR #38, `fdb8f709d657256d0868a64c2d164a7da49cd9dc`.

This phase audits enforcement and adds repeatable detection. It does **not** declare the database fully hardened. No schema or EF migration changes are made. All financial policy remains unchanged.

## Findings and enforcement boundaries

| Area | Existing database protection | Gap / follow-up |
| --- | --- | --- |
| Journal identity | PK and unique idempotency key; line-to-journal/account FKs; reversal target FK | No CHECK for line sides or finite amounts; no deferred cross-row balance enforcement |
| Posted journal immutability | Domain posting path creates validated drafts; service replay preserves entries | Direct SQL can update a posted journal and its lines. Deleting a journal cascades to its lines. No DbContext override or database trigger prevents it. This is a production-hardening blocker, not an accepted financial behavior |
| Canonical currency | Currency fields required, length-limited, application defaults to IRR | No DB CHECK constraining currency to IRR |
| Idempotency | Unique indexes on verification, eligibility, bank approval, freeze, external transaction, journal and payment instruction keys | NOT NULL/unique do not prohibit whitespace-only keys. Key uniqueness does not prove safe provider retry or business operation identity |
| Frozen Principal | ContractId primary key, required bank/amount/reference | No FK from frozen_principals.ContractId to lease_contracts.Id; no cross-row equality enforcement against bank-approved allocation. Audit detects orphans and amount/bank mismatches where allocation exists |
| Contract credit application | Nullable CreditApplicationId has unique index | No FK from lease_contracts.CreditApplicationId to credit_applications.Id; non-null orphans are detected |
| Funding allocation | Unique application and contract IDs, application/contract FKs | Tenant contribution equation and nonnegative/finite inputs enforced by application, not DB CHECK. Audit uses actual BankApprovedLoanRial, never theoretical eligibility |
| Tenant contribution | Contract/allocation FKs and uniqueness | Independent FKs do not guarantee contract and amount agree with the referenced allocation |
| Monthly obligations/components | Unique contract/month and obligation/kind, FKs to contracts, obligations, payments | Independent links do not guarantee a component and payment reference the same obligation |
| Coverage and lost-fund-return tracking | Unique payment/coverage links, external/journal links and FKs | Cross-link contract/obligation consistency is not guaranteed by separate FKs; audit checks relationships and original withdrawal amount only |
| Cancellation / normal settlement | Unique contract and transfer/journal links, restrictive FKs | Cross-entity party/amount/status consistency remains service-level. Snapshot audit does not prove correct external settlement or release timing |
| Outbox/inbox | PK deduplication, required fields; outbox jsonb payload | PK guards do not prove exactly-once delivery. Restored messaging and financial replay tests remain in CI |
| Money precision | Persisted rial columns use unscaled numeric | PostgreSQL numeric can represent values outside .NET decimal, including special values. This phase explicitly detects special values in ledger sides and allocation equation inputs; it does not claim a universal monetary range audit |
| Audit/workflow/external aggregate references | Indexed type/ID discriminators | Polymorphic references cannot be repaired by adding an arbitrary FK. Keep a typed relationship design separate from this audit |

Evidence sources: `Persistence/Configurations/*`, `Persistence/CharkhooneDbContext.cs`, `Domain/Finance/Ledger.cs`, `CreditAllocationCalculator.cs`, and PostgreSQL integration tests in `DatabaseIntegrityAuditTests.cs`. CI also exports the migrated schema's constraint, unique-index and user-trigger catalog. Model-to-database tests require each configured FK and unique index to exist and be validated/ready. These existence checks do not assert that every desired business constraint is present.

## Executable audit

`audit-financial-integrity.sql` is SELECT-only. It emits 14 stable check codes with violation counts, no customer identifiers or values. The CI wrapper runs it in explicit read-only, repeatable-read transactions with a 30-second statement timeout on both the migrated/seeded database and the restored database after restored smoke tests. The result verifier rejects missing, duplicate, unexpected, malformed, negative or nonzero counts. The artifact `database-integrity-audit-<SHA>` contains counts and schema metadata only.

An empty table can legitimately yield zero violations: that is not evidence of coverage for every business state. The existing integration fixtures cover funded contributions, journals, frozen principal, monthly obligations and Unknown payment reconciliation. Separate negative tests verify detection of missing journal lines, zero/negative/two-sided/nonfinite lines, wrong currency, blank idempotency and orphan Frozen Principal. They use isolated synthetic rows inside rolled-back transactions. A separate characterization test demonstrates the posted-ledger update/cascade-delete gap; when enforcement is added, replace that test with rejection tests rather than keeping the vulnerability.

For a future authorized staging run, execute the SQL using a read-only role and an explicit read-only repeatable-read transaction. Keep timeout limits and assess table size first; this is a full scan, not a production performance claim. Do not auto-repair reported rows, change posted ledger entries, infer external outcomes, or retry transfers. Investigate with audit/provider evidence; corrections to posted entries use reversal.

## Prioritized remediation before production

1. Posted ledger immutability and valid balanced posting at transaction boundaries: design deferred validation around the existing entry-then-lines write sequence; protect UPDATE/DELETE and cascade paths, concurrency and legitimate reversals. Add raw SQL rejection/concurrency tests. Do not use an immediate header-only CHECK that rejects valid multi-statement posting.
2. Add the concrete missing contract/application/Frozen Principal relationships and deterministic per-row checks (finite valid ledger sides, canonical currency, nonblank idempotency, approved-loan contribution equation) after read-only preflight and remediation planning for existing data. Generate any migration with real `dotnet ef`; never handwrite an EF migration.
3. Evaluate composite relational consistency for contribution, component, coverage and settlement references and safe retention/delete paths. Polymorphic or version-snapshot references require their own design, not invented parents.
4. Re-run backup/restore and audit before an authorized staging rollout. Live production data, runtime-role grants, credentials, backup/PITR and migration deployment evidence are still unavailable.

The audit can be complete while these remediation items remain open. A green CI means the audit and fixtures passed, not that unrestricted SQL cannot violate finance rules. Staging workflow preparation must not be presented as production readiness while the posted-ledger blocker remains.

## Explicitly excluded policy

No formula for lost-fund-return accrual, day-count, rounding or partial allocation is introduced. No partial-payment settlement policy or early-cancellation Frozen Principal release timing is assumed. Unknown external outcomes remain unresolved and query/reconcile only. No real provider call, live staging/production audit, migration or deployment is performed by this phase.
