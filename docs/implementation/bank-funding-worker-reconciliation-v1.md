# Bank/fund worker reconciliation v1

This phase lets the financial worker continue bank/fund operations that have already been durably started, without allowing the worker to initiate a fresh bank approval.

## Candidate boundary

The worker never selects a plain `DecisionReady` application.

A bank-approval reconciliation candidate must have:

- `BankApprovalPending` or resumable `ExternalCheckIndeterminate`
- no funding allocation yet
- an existing deterministic bank-approval row
- persisted bank-approval status `Indeterminate`
- applicant/tenant identity agreement

A fund-freeze reconciliation candidate must have:

- `FundingPending` or resumable `ExternalCheckIndeterminate`
- an existing funding allocation
- an existing approved bank-approval row whose approved amount matches the allocation
- a nonblank bank external reference
- an existing principal-freeze row with status `Indeterminate`
- applicant/tenant identity agreement

Therefore the worker only resumes durable evidence. It does not manufacture a new bank request from `DecisionReady`.

## Same-pass convergence

Bank/fund reconciliation now runs before tenant-contribution funding.

When a previously started bank approval returns a real valid approval, the existing bank-funding service:

1. persists the exact bank-approved amount
2. computes tenant contribution from the trusted full-deposit equivalent
3. starts/queries the principal-freeze phase
4. requires real confirmed fund reference and external reference before `ApprovedFunded`

The worker can then, in the same pass:

1. reconcile the positive tenant contribution
2. advance the lease funding lifecycle to `Active`
3. provision the trusted 12-month schedule

All financial validation remains delegated to the existing authoritative services.

## Crash recovery

The durable candidate rules cover the two important pre-provider crash/retry windows:

- bank-approval row exists while the application remains `BankApprovalPending`
- principal-freeze row exists while the application remains `FundingPending`

They also cover the same operations after an indeterminate provider response moved the application to `ExternalCheckIndeterminate`.

## PostgreSQL evidence

Real isolated PostgreSQL worker tests prove:

- a previously started bank approval is reconciled by the worker
- a valid bank response and confirmed fund freeze can converge to `ApprovedFunded`
- the exact positive tenant contribution can be confirmed and posted in the same pass
- the lease becomes `Active` and its 12-month schedule is provisioned
- a second pass does not call bank/fund again
- a previously started fund freeze is reconciled without calling the bank adapter
- a fresh `DecisionReady` application with no bank-approval row is ignored by the worker

No schema migration, staging, production, or real provider is involved.

## Remaining internal boundary

After this phase, the main missing runtime-hardening slice is Worker dependency readiness: the Worker currently exposes liveness evidence, while staging documentation explicitly says that endpoint does not prove PostgreSQL, RabbitMQ, or required external-adapter readiness.

That readiness work can be implemented without inventing provider success.

## Production boundary

Production readiness still separately requires real deployment/operator evidence:

- production-capable external provider/OIDC integrations and credentials for the workflows that will be enabled
- real staging rehearsal/application/provider evidence for the exact release SHA
- live GitHub main-ruleset enforcement verified with administration-authorized reads
- native signed Android/iOS build and store/signing evidence if mobile-store release is in scope
