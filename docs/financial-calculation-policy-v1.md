# Financial calculation policy v1

## Canonical money unit

- Backend, database, ledger, transfer, debt, settlement, and contract calculations use Iranian rial (IRR).
- One rial is the smallest contractual/payable/postable unit.
- Decimal precision may be retained while a formula is being evaluated.
- At the final money boundary, any positive fractional rial is discarded downward with `decimal.Floor`.
- Posted journal entries, funding resources, frozen principal, and tenant-contribution balances must use whole rials.
- A reversal uses the exact amount of the original posted entry; the business formula is not recalculated during reversal.

Example:

`103,205,500.73 IRR -> 103,205,500 IRR`

## Three-percent rent/deposit equivalence

The approved equivalence is:

`monthly_rent_rial = full_deposit_rial * 0.03`

`full_deposit_rial = monthly_rent_rial / 0.03`

For a mixed cash-deposit + monthly-rent contract, full-deposit equivalent is:

`cash_deposit_rial + monthly_rent_rial / 0.03`

The exact decimal calculation is evaluated first and the final result is floored only at the whole-rial boundary.

Authoritative example:

- monthly rent: 9,000,000 toman = 90,000,000 rial
- equivalent full deposit: 300,000,000 toman = 3,000,000,000 rial

## Persian-calendar rent charging

Rent is contractual monthly rent.

A complete Persian (Jalali) calendar month is charged as exactly one monthly rent amount, regardless of whether that Persian month has 29, 30, or 31 days.

A partial Persian month is day-counted on an annual 365-day basis:

`exact_partial_rent = monthly_rent * 12 * chargeable_days / 365`

Both start day and end day are included.

For an initial partial month, when the end day is omitted, the end is the last day of that Persian calendar month.

Example for Persian year 1402, month 12:

- Esfand 1402 has 29 days.
- A contract starting on day 25 charges days 25, 26, 27, 28, 29: five chargeable days.
- With monthly rent 90,000,000 rial, the exact decimal value is evaluated and the payable amount is 14,794,520 rial after flooring the fractional rial.

From the next complete Persian month, the exact contractual monthly rent is charged rather than recalculating a full month from its number of days.

The same partial-month calculator can be used for an explicit inclusive start/end range inside one Persian month when a partial terminal period is required by a separately approved workflow.

## Calculation vs storage boundary

`Money` may represent an intermediate decimal calculation. This is deliberate so formulas do not lose precision during their internal steps.

The following are final money boundaries and must be whole rial:

- rent/deposit conversion outputs,
- prorated payable rent,
- maximum eligible loan,
- bank-approved loan used in funding allocation,
- tenant contribution,
- frozen principal,
- tenant-contribution balance inputs,
- journal debit/credit lines.

Database-level whole-rial constraints are a separate hardening layer; this policy establishes the domain rule first.

## Explicit non-goals

This policy does not define or change the separate `LostFundReturnTerms` calculation. That concept remains independent from the 3% rent/deposit equivalence and must not inherit this formula by assumption.

This policy also does not yet implement the newly approved all-or-nothing arrears rule. That payment-state change is intentionally handled in the next isolated phase so calculation correctness and payment workflow correctness can be verified separately.
