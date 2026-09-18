# Tenant contribution worker orchestration v1

This phase closes the worker handoff between an application that is already `ApprovedFunded` and the existing lease-funding lifecycle.

## Problem

The bank/fund principal flow can persist:

- an `ApprovedFunded` credit application
- exact funding allocation
- confirmed frozen bank principal
- immutable trusted contract terms

For a positive tenant contribution, the lease lifecycle can only advance to `AwaitingCompletion` until the existing tenant-contribution funding service confirms and posts the tenant money.

Before this phase, the financial worker never called that service. A separate caller was required to make progress.

## Worker ordering

The financial worker now runs this ordering at the beginning of each pass:

1. reconcile eligible positive tenant-contribution funding
2. advance lease-funding lifecycle
3. provision the monthly schedule for newly active contracts
4. continue existing payment / coverage / arrears / cancellation / maturity / settlement work

This allows a real provider confirmation to produce, in one worker pass:

`ApprovedFunded application -> confirmed tenant contribution -> balanced journal -> Active lease -> 12-month schedule`

## Candidate safety

A tenant-contribution candidate is selected only when all of the following are true:

- application status is `ApprovedFunded`
- application applicant is the lease tenant
- contract is `Draft`, `AwaitingFunding`, or `AwaitingCompletion`
- allocation requires a positive tenant contribution
- confirmed principal-freeze evidence exists
- frozen principal bank, amount, and fund reference match the allocation/freeze
- principal-freeze provider, fund reference, and external reference are nonblank
- no tenant contribution has already been posted
- either no tenant-contribution attempt exists yet, or the existing attempt is still `Pending` / `Unknown` with exact contract, amount, operation, and IRR binding

A terminal `Failed` attempt is not automatically retried.

A malformed or partially terminal attempt is not treated as a fresh candidate.

## Provider boundary

The worker does not invent success.

It delegates to the existing `ITenantContributionFundingService`, which queries the configured fund adapter.

Production/release configuration remains fail-closed unless a real fund adapter is configured.

No frozen bank principal is spent or moved by this orchestration.

## Same-pass lease activation

After contribution reconciliation, the worker re-queries lease-funding candidates.

If the contribution was confirmed, the existing lease lifecycle independently validates:

- allocation binding
- confirmed frozen bank principal
- confirmed tenant-contribution external transaction
- fund reference
- balanced posted contribution journal
- immutable trusted contract terms/schedule

Only then can the contract reach `Active`.

The existing schedule-provisioning phase can then materialize all 12 trusted months in the same worker pass.

## PostgreSQL evidence

A real isolated PostgreSQL worker integration test proves:

- exactly one eligible positive contribution is discovered
- the fund adapter receives the exact persisted tenant-contribution amount
- principal freeze is not queried again
- the external transaction becomes succeeded with IRR and provider reference
- tenant contribution is persisted
- the contribution journal is balanced
- the lease performs all three funding transitions to `Active`
- the trusted 12-month schedule is provisioned in the same pass
- the next worker pass does not requery the fund or requeue lease funding

No schema migration, staging, production, or real provider is involved.

## Next boundary

The application/contract financial bootstrap is now continuously orchestrated from trusted bank funding through active lease schedule materialization.

Remaining production gaps are external-provider connectivity and environment/promotion evidence rather than a missing internal funding handoff.
