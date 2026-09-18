# Lease funding lifecycle v1

This phase makes the existing lease-contract funding state machine executable from persisted financial evidence.

Before this phase, `LeaseContractWorkflow` defined:

`Draft -> AwaitingFunding -> AwaitingCompletion -> Active`

but no application/infrastructure service advanced persisted contracts through those states. Monthly obligations are valid only for `Active` contracts, so the missing lifecycle made the payment schedule depend on manually pre-seeded contract state.

## Evidence-driven convergence

`ILeaseFundingLifecycleService` locks the lease-contract row and advances only as far as persisted evidence allows.

### Draft -> AwaitingFunding

Requires a funding allocation that is bound to the same credit application and contract, with:

- positive bank-approved principal
- non-negative tenant contribution
- exact allocation equation:
  `bank approved principal + tenant contribution = full deposit equivalent`
- bank-plan id/version matching the contract snapshot

### AwaitingFunding -> AwaitingCompletion

Requires:

- credit application status `ApprovedFunded`
- immutable frozen-principal evidence matching bank id and approved amount
- confirmed historical fund-principal freeze
- persisted fund reference matching the immutable frozen principal

An `ApprovedFunded` application with missing or mismatched principal/freeze evidence fails closed as inconsistent state.

### AwaitingCompletion -> Active

For a positive tenant contribution, activation requires the existing tenant-funding workflow evidence:

- tenant-contribution row for the same allocation and exact amount
- tenant-contribution funding row
- matching external transaction with operation `tenant_contribution_funding`
- exact rial amount and IRR currency
- external status `Succeeded`
- matching tenant/funding fund reference
- the posted tenant-contribution journal bound to that external transaction

An in-flight tenant-funding external transaction in `Pending` or `Unknown` is treated as not ready, not as corruption.

For a zero tenant contribution, no synthetic zero-value external transaction, tenant-contribution row, or journal is created or required. Any conflicting tenant-funding evidence in that zero-contribution path fails closed.

## Atomic lifecycle evidence

Each applied transition writes, in the same database transaction:

- workflow-transition history
- contract audit evidence
- a durable outbox event

Events:

- `lease-contract.awaiting-funding.v1`
- `lease-contract.awaiting-completion.v1`
- `lease-contract.activated.v1`

Audit actions:

- `contract_entered_awaiting_funding`
- `contract_entered_awaiting_completion`
- `contract_activated`

A fully funded Draft contract may safely converge through all three transitions in one call. Replay after activation returns `AlreadyActivated` without duplicating evidence.

## Worker orchestration

`FinancialReconciliationWorker` discovers `Draft`, `AwaitingFunding`, and `AwaitingCompletion` contracts that have a funding allocation and runs the lifecycle before payment reconciliation.

This ordering means a contract that becomes financially complete can become `Active` before payment candidates are evaluated in the same worker pass.

## Explicitly still separate

This phase does not invent lease calendar terms, monthly rent, bank-interest amounts, beneficiaries, or a monthly schedule. Those values are not currently persisted on the lease-contract row.

The next schedule-provisioning phase must consume an explicit trusted contract-terms/schedule snapshot rather than derive dates from `CreatedAtUtc` or parse opaque bank `InterestTerms`.

No schema migration and no external provider call are introduced by this lifecycle phase.
