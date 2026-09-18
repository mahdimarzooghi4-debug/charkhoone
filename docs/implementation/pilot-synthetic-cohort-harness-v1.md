# Configurable synthetic pilot cohort harness v1

This phase adds a repeatable cohort/scenario harness for exercising the real Charkhoone application, contract, funding, accounting, and schedule services against PostgreSQL without contacting real external providers.

The cohort size is runtime input. There is no hard-coded 2,000-case requirement.

## Safety boundary

The operator runner is `scripts/pilot/run-synthetic-cohort.sh`.

It refuses to run unless all of the following are true:

- `CHARKHOONE_ALLOW_PILOT_COHORT=true`
- a dedicated PostgreSQL connection is supplied in `CHARKHOONE_PILOT_POSTGRES`
- the database name starts with `charkhoone_pilot_`
- `CHARKHOONE_PILOT_DATABASE_CONFIRMATION` exactly matches that database name
- cohort size is between 1 and 100,000
- concurrency is between 1 and 256

Known integration/default/protected database names are explicitly rejected. The target verifier never prints the connection string or password.

## Runtime inputs

Required:

```text
CHARKHOONE_ALLOW_PILOT_COHORT=true
CHARKHOONE_PILOT_POSTGRES=Host=...;Database=charkhoone_pilot_<name>;Username=...;Password=...
CHARKHOONE_PILOT_DATABASE_CONFIRMATION=charkhoone_pilot_<name>
CHARKHOONE_PILOT_COHORT_SIZE=<N>
```

Optional:

```text
CHARKHOONE_PILOT_COHORT_CONCURRENCY=8
CHARKHOONE_PILOT_COHORT_SCENARIOS=happy,identity-needs-documents,credit-indeterminate,bank-declined,fund-indeterminate,tenant-contribution-indeterminate
CHARKHOONE_PILOT_COHORT_RUN_ID=<safe run id>
CHARKHOONE_PILOT_COHORT_EVIDENCE_DIR=artifacts/pilot-cohort
```

If scenarios are omitted, all supported scenarios are distributed round-robin.

## Scenario coverage

The harness supports:

- `happy`: full draft -> identity -> public plan -> trusted property -> A1 credit -> bank approval -> frozen principal -> tenant contribution -> balanced journal -> Active lease -> 12 obligations.
- `identity-needs-documents`: stops at `NeedsDocuments`.
- `credit-indeterminate`: stops at `ExternalCheckIndeterminate`.
- `bank-declined`: reference-bound decline stops at `Rejected`.
- `fund-indeterminate`: approved allocation but unconfirmed principal freeze stops at `ExternalCheckIndeterminate`.
- `tenant-contribution-indeterminate`: bank principal completes but the lease stops at `AwaitingCompletion`, never `Active`.

Cases use independent EF Core contexts with configurable maximum parallelism.

## Evidence

Each explicit run writes `<evidence-root>/<run-id>/summary.json` with the run id, requested/completed counts, concurrency, per-scenario counts, and UTC start/end timestamps. No database credentials are written.

## CI evidence

Normal CI executes one case for each supported scenario against real PostgreSQL, proving the scenario runner and financial lifecycle assertions without creating a large load.

CI also syntax-checks the pilot runner and validates fail-closed database-target guards.

## Boundary

All external responses in this harness are synthetic implementations scoped only to the integration-test harness. No real identity, bank, fund, payment, staging, or production provider is contacted.

This is functional cohort/concurrency testing, not a substitute for provider load testing or final production capacity/SLO testing.
