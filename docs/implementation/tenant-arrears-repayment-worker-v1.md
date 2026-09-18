# Tenant arrears repayment worker orchestration v1

This phase operationalizes the already-approved all-or-nothing tenant arrears repayment path without creating a new payment provider flow.

## Source of truth

The worker consumes only an already-persisted `ExternalTransactionRow` whose evidence is:

- `AggregateType == LeaseContract`
- `OperationType == tenant_contribution_replenishment`
- `Status == Succeeded`
- positive whole-rial amount already persisted by the trusted integration
- `Currency == IRR`
- non-empty external reference
- an `Active` contract
- no latched cancellation requirement
- no existing replenishment row for the same external transaction

The worker does not manufacture provider success, initiate a debit, or contact a payment provider.

## Exact financial policy

The worker delegates the candidate to the existing
`ITenantContributionCoverageService.PostConfirmedReplenishmentAsync` path.

That existing financial boundary remains authoritative:

- no partial payment
- no over-payment
- principal is restored oldest contractual month first
- Lost Fund Return is simple 3% monthly and non-compounding
- the Lost Fund Return cutoff is the persisted successful external transaction timestamp
- decimal precision is retained until the final whole-rial Lost Fund Return boundary
- the confirmed external amount must equal exact outstanding principal plus exact Lost Fund Return
- frozen bank principal is never used
- once cancellation is required, normal arrears repayment is rejected

This phase does not change cancellation settlement or normal settlement policy.

## Worker ordering

A financial worker pass now runs the relevant stages in this order:

1. lease funding lifecycle
2. monthly schedule provisioning
3. retry already-started monthly payment reconciliation
4. process due monthly obligations
5. cover newly missed obligations from tenant contribution
6. finalize confirmed tenant arrears repayments
7. discover and run cancellation settlement
8. cancellation bank-principal processing
9. normal maturity and normal settlement

Running repayment after coverage lets a trusted successful repayment restore the principal withdrawn by coverage in the same worker pass. Running it before cancellation discovery does not bypass the three-missed-month rule: `PostConfirmedReplenishmentAsync` still rejects contracts whose cancellation requirement is already latched.

## Idempotency

A successful posting creates one `TenantContributionReplenishmentRow` bound one-to-one to the succeeded external transaction.

Later worker passes exclude external transactions that already have that row, so the ledger posting, Lost Fund Return finalization, audit, and outbox evidence are not repeated.

## Evidence boundary

The PostgreSQL integration test uses a disposable real PostgreSQL database and persists:

- successful historical coverage principal
- one open Lost Fund Return exposure
- one exact succeeded replenishment external transaction

It proves the worker posts the exact principal plus Lost Fund Return journal, finalizes the exposure at the successful transaction timestamp, restores only principal to tenant contribution, and does not requeue the transaction on the next pass.

No staging, production, or real external provider is contacted.
