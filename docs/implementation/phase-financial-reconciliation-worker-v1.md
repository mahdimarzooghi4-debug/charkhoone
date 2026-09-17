# Financial reconciliation worker v1

This phase adds background reconciliation for financial operations that are already unresolved.

## Scope

- Runs in `Charkhoone.Worker` and is disabled by default until deployment configuration enables it.
- Poll interval and batch size are operational settings; they do not change financial business rules.
- Re-queries payment instructions in `Pending`, `Unknown`, or `ReconciliationRequired`.
- Re-queries coverage payments in `Pending` or `Unknown` through the existing idempotent coverage service.
- Re-queries cancellation settlements in `Pending` or `Unknown`.
- Re-queries normal-settlement legs in `Pending` or `Unknown`.
- Never automatically retries a terminal `Failed` financial operation.
- Never treats an indeterminate external result as success.
- Never creates monthly obligations, changes amounts, invents provider references, or calculates unresolved 3% lost-fund return rules.
- Payment reconciliation derives the tenant identity only from the persisted contract relationship before invoking the existing ownership-checked application service; it does not accept a caller-supplied user id.
- Each item is processed in its own dependency-injection scope so one failing external reconciliation does not poison the rest of the batch.
- OpenTelemetry worker activities contain only low-cardinality operation kind/outcome tags; payloads, tokens, OTPs, account numbers, documents, and financial amounts are not attached.

## Deployment

Configuration keys:

- `FinancialReconciliation:Enabled`
- `FinancialReconciliation:PollMilliseconds`
- `FinancialReconciliation:BatchSize`

The worker remains off by default in the example environment. Production enablement must happen together with the real external adapters and operational monitoring.

No database schema or migration change is required by this phase.
