# Delinquency chronology hardening v1

This phase prevents monthly-obligation closure order from corrupting the persisted consecutive-miss streak.

## Rules enforced

- Closing a month is blocked while any earlier existing monthly obligation for the same contract is still `Open`.
- If persisted history already contains a later closed month while an earlier target month is still open, automatic closure is blocked rather than mutating delinquency counters on top of inconsistent history.
- `Covered` is treated as a closed month for chronology. Coverage does not rewrite the tenant's original miss or reset delinquency history.
- The existing rule remains unchanged: a fully paid forward/current month can reset the consecutive-miss counter, while prior debt remains historical.
- The existing three-consecutive-miss cancellation latch remains unchanged.
- This phase does not invent missing contract-month obligations, contract duration, day-count, partial-payment allocation, or lost-fund-return calculation rules.

`IMonthlyObligationService` is now implemented through a chronology guard which delegates actual closing and all accounting/workflow mutations to the existing `EfPaymentService` only after the chronology check passes.

No database schema or migration change is required.
