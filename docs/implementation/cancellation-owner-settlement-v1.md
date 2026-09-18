# Cancellation owner settlement v2

This phase implements the financial settlement for a contract that has already entered `CancellationPending`.

## Financial rule

Successful coverage has already removed the covered principal from tenant contribution. Cancellation therefore does **not** debit that principal a second time.

At cancellation:

1. derive the immutable cancellation cutoff from the single workflow transition into `CancellationPending`;
2. calculate every still-open lost-fund-return exposure at the fixed 3% monthly simple rate on the 365-day basis, using that cutoff;
3. deduct the resulting whole-rial lost-fund-return total from the posted tenant-contribution balance;
4. transfer only the remaining tenant contribution to the owner;
5. never use frozen bank principal for tenant delinquency or lost-fund-return settlement.

The cancellation split is:

`owner_residual = posted_tenant_contribution - open_lost_fund_return`

The service fails closed if the financial split cannot be reproduced exactly or if the tenant contribution is insufficient.

## Ledger treatment

When an owner residual exists, the confirmed cancellation settlement posts one balanced journal:

- debit tenant-contribution balance for the full pre-settlement tenant contribution;
- credit fund-held tenant-contribution asset for the amount externally transferred to the owner;
- credit lost-fund-return income for the contractual return retained by the fund.

If owner residual is zero but lost-fund-return is positive, no zero-value external transfer is manufactured. The internal journal debits tenant-contribution balance and credits lost-fund-return income.

If both amounts are zero, no journal or external transfer is manufactured.

Frozen bank principal is absent from the calculation and journal.

## Determinism and idempotency

The lost-fund-return cutoff is the immutable `CancellationPending` workflow-transition timestamp, not worker execution time. An indeterminate owner transfer reconciled later therefore does not increase the tenant obligation.

The owner external transfer and cancellation journal use v2 idempotency keys.

A confirmed external owner transfer is accepted only for the exact frozen owner-residual amount and a valid external reference. If the current financial split can no longer reproduce that amount, the settlement becomes reconciliation work instead of guessing.

Open lost-fund-return rows are finalized only when the cancellation financial journal is posted. Their calculation period ends at the cancellation cutoff. `ReplacedAtUtc` remains null because cancellation consumes tenant contribution rather than replenishing the withdrawn principal.

## Lifecycle

Settlement requires `CancellationPending` and a single corresponding workflow transition. The settlement service does not require delinquency as the cancellation reason, so the same financial settlement can support any separately approved lifecycle path that enters `CancellationPending`.

All missed monthly obligations must first be covered, and coverage transfers cannot remain `Pending` or `Unknown`.

After successful financial settlement the contract moves `CancellationPending -> Cancelled`, with workflow history, audit events, outbox evidence, owner-notification request, and tenant-notification request. The tenant notification carries the immutable cancellation cutoff plus the tenant-contribution, lost-fund-return, and owner-residual split so downstream messaging does not reconstruct financial semantics.

## Separate bank principal policy

Early cancellation does not release, debit, or settle frozen bank principal in this owner-settlement service. After cancellation is completed, the dedicated `ICancellationBankPrincipalSettlementService` returns the exact persisted frozen principal to the bank with an independent external transaction and journal. See `docs/implementation/cancellation-bank-principal-settlement-v1.md`.

## Normal maturity is different

This cancellation rule must not be reused for normal maturity. At normal contract end, frozen principal returns to the bank and the remaining tenant contribution returns to the tenant.
