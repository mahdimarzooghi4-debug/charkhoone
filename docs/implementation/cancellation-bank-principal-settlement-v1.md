# Cancellation bank principal settlement v1

This workflow completes the bank-principal leg that is intentionally excluded from Cancellation Settlement V2.

## Preconditions

- the lease contract is already `Cancelled`
- the contract has exactly one completed cancellation settlement
- frozen bank principal exists with a positive rial amount, bank id, and fund reference
- no normal-maturity settlement exists for the same contract

The owner-residual settlement remains independent. Tenant contribution and lost-fund-return accounting are never inputs to this workflow.

## External return

The exact persisted frozen principal is returned to the bank through `IExternalBankPrincipalReturnAdapter`.

The transfer uses:

`cancellation-bank-principal:{contractId}:v1`

A response is accepted only when:

- the provider reports confirmation
- confirmed rial amount exactly equals the persisted frozen principal
- a non-empty external reference is present

A definitive provider failure is terminal for this invocation. Indeterminate or mismatched confirmation stays reconciliation work and does not post a bank-return journal.

## Ledger

The immutable `FrozenPrincipal` row remains historical evidence and is not reduced or deleted.

The workflow reuses the same frozen-principal recognition accounts and recognition idempotency key as normal maturity:

- debit fund-held frozen bank principal
- credit bank principal payable

Recognition key:

`journal:frozen-bank-principal-recognition:{contractId}:v1`

After exact external confirmation, the cancellation return journal reverses those balances:

- debit bank principal payable
- credit fund-held frozen bank principal

Return key:

`journal:cancellation-bank-principal:{contractId}:v1`

The frozen principal never enters owner residual, tenant contribution, delinquency coverage, or lost-fund-return calculations.

## Evidence and notifications

Before the bank return starts, the workflow also requires the historical confirmed fund-freeze record to match the immutable frozen-principal `FundReference`. This preserves the real fund/provider routing identity instead of inventing a notification recipient.

Successful return writes:

- audit action `cancellation_bank_principal_returned`
- outbox `lease-contract.cancellation-bank-principal-returned.v1`
- bank notification request `lease-contract.cancelled-bank-notification-requested.v1`
- fund notification request `lease-contract.cancelled-fund-notification-requested.v1`
- terminal audit action `cancellation_financially_completed`
- terminal outbox `lease-contract.cancellation-financially-completed.v1`

The terminal completion event is written in the same database transaction as the confirmed bank-return journal. Its payload binds tenant, owner, bank, and fund identities to the cancellation-settlement and bank-principal accounting evidence.

Replay validates the persisted external success, recognition journal, and return journal before returning `AlreadyCompleted`; it does not call the provider again.


## Worker orchestration

`FinancialReconciliationWorker` discovers the bank-principal leg only after the owner-side cancellation settlement is terminally completed and the contract is already `Cancelled`.

Eligible candidates:

- have a completed cancellation settlement with a completion timestamp
- have positive persisted frozen bank principal
- do not have a normal-maturity settlement
- do not already have a terminal succeeded or failed `cancellation_bank_principal_return` external transaction

Pending or indeterminate external returns remain candidates so the existing idempotent adapter can be queried again. Succeeded and failed returns are excluded from later batches, so a successful bank return is not sent twice and a definitive failure is not blindly retried.

The worker reports a separate `CancellationBankPrincipalCandidates` batch count and tracing tag, keeping owner cancellation and bank-principal reconciliation operationally distinguishable.

## Provider boundary

This workflow reuses the existing bank-principal return adapter. Production behavior is still fail-closed when that adapter is unavailable or unconfigured. No staging or production provider is contacted by this implementation or its tests.
