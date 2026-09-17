# Lost Fund Return Tracking v1

This phase captures the raw accounting facts required by the approved lost-fund-return rule without inventing the unresolved calculation policy.

## Implemented

- Every newly confirmed `CoveragePayment` that actually debits tenant contribution creates exactly one `LostFundReturn` exposure at the same EF Core save boundary.
- The exposure records contract, coverage payment, withdrawn rial amount, the approved monthly rate of `3%`, withdrawal time, and calculation-period start.
- Existing confirmed `TenantContributionReplenishment` rows remain the authoritative raw records for replenishment amount and replenishment time.
- `ReplacedAtUtc`, `CalculationPeriodEndUtc`, `CalculationPolicyVersion`, and `CalculatedReturnRial` are deliberately nullable and are not populated automatically in this phase.
- `CoveragePaymentId` is unique so repeated persistence cannot create duplicate exposure rows for the same coverage.
- The lost-fund-return record has no frozen-principal field and no journal link. Frozen bank principal remains outside this flow.

## Intentionally deferred

The specification defines a monthly 3% lost return but does not yet define day-count, rounding, or partial-payment/replenishment allocation. Because the allocation rule is unresolved, this phase does not pair replenishments to specific coverage exposures and does not infer a replacement date or calculation-period end for an exposure.

No lost-return amount is calculated, no receivable is posted, and no journal entry is created until a versioned calculation/allocation policy is approved.

## Persistence

The EF Core model adds `lost_fund_returns`. A generated migration must be produced from the verified model and committed before this phase is considered migration-complete. The migration is not considered applied to staging or production unless an actual database deployment is separately observed.
