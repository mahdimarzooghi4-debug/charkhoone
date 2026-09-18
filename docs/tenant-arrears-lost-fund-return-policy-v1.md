# Tenant arrears and lost fund return policy v1

## Scope

This policy applies when Charkhoone covers an unpaid contractual obligation from the tenant contribution held in the fund.

Frozen bank principal is never used for tenant delinquency coverage.

## Lost fund return

When tenant-contribution principal is withdrawn for coverage, the tenant owes:

1. the exact withdrawn principal; and
2. the contractual return the fund lost while that principal was unavailable.

The tenant's contractual rate is fixed at **3% per month**. Actual fund performance does not affect this rate. If the fund earns 10% or any other return, the tenant still owes only the contractual 3% calculation.

The return is **simple, never compounded**. Accrued return does not itself earn additional contractual return.

The formula is:

`exact_lost_return = withdrawn_principal * 0.03 * 12 * elapsed_days / 365`

Elapsed days are derived from the exact UTC duration between the coverage withdrawal timestamp and the confirmed repayment timestamp. Fractional days are retained in the decimal calculation.

The final payable lost return is floored to the nearest whole rial only after the complete formula is evaluated.

Policy version:

`lost-fund-return-simple-3pct-365-v1`

## Repayment cutoff

The lost-return calculation stops at the timestamp at which the trusted external repayment transaction was recorded as successful. Later worker or ledger-posting delay does not increase the tenant's debt.

The journal may therefore be posted later, but its economic occurrence timestamp is the confirmed repayment timestamp.

## All-or-nothing repayment

Before the third consecutive missed contractual month causes cancellation, a tenant repayment must equal exactly:

`all outstanding covered principal + all accrued lost fund return`

Partial payments are rejected. Over-payments are rejected.

Principal allocation is oldest contractual month first, then component order.

If historical data contains a partial replenishment for which the exact lost-return cutoff cannot be proven, the automated path fails closed instead of reconstructing a financial result by assumption.

## Ledger treatment

A successful arrears repayment is one external payment but has separate accounting effects:

- debit the fund-held asset for the total received amount;
- credit tenant-contribution balance only for restored principal;
- credit lost-fund-return income for the accrued contractual return.

The lost-fund-return amount never becomes tenant contribution. Therefore it cannot later be returned to the tenant or transferred to the owner as tenant-contribution residual.

The replenishment row's `AmountRial` represents restored principal. The external transaction amount represents total cash received.

## Cancellation threshold

The existing rule remains: three consecutive missed contractual months require cancellation.

Once cancellation is required, the normal tenant arrears repayment path is closed. Pending or indeterminate external transactions that were initiated earlier must still be reconciled rather than blindly abandoned or retried.

How open lost-fund-return exposure is treated inside final cancellation settlement is a separate cancellation-settlement policy and must not be inferred by this document.
