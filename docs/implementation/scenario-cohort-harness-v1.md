# Scenario / Cohort Harness V1

This harness provides a configurable internal-pilot cohort runner over the existing real PostgreSQL integration boundary.

It does not create a parallel simulator and does not invent provider outcomes outside the authoritative services already used by the application.

## Runtime inputs

The cohort size is a runtime input.

Use either:

- `--cases <count>`
- `CHARKHOONE_SCENARIO_CASE_COUNT=<count>`

No cohort size such as 2,000 is hard-coded.

The runner distributes the requested total case count round-robin across the selected scenarios. The total count must be at least the number of selected scenarios so every selected scenario is actually executed.

Supported scenario selection is also runtime-configurable:

`--scenarios success,indeterminate,retry,decline,needs-documents,payment,delinquency,cancellation,maturity`

With no `--scenarios` argument, all nine built-in scenarios run.

## Safety boundary

The harness requires both:

- an explicit `CHARKHOONE_INTEGRATION_POSTGRES` connection string
- `CHARKHOONE_SCENARIO_ALLOW_POSTGRES=true`

This prevents an accidental fallback to an implicit database target.

The configured database must be disposable integration/pilot-test infrastructure. The harness writes scenario data and must never be pointed at staging or production.

The connection string is inherited through the environment and is not written to the JSON report.

## Scenario contracts

The harness maps each scenario to a PostgreSQL-backed integration test that exercises the existing authoritative application/domain services.

- `success`: trusted eligibility, bank approval, principal freeze, and idempotent replay
- `indeterminate`: unavailable external credit provider, trusted amount retained, application remains reconcilable
- `retry`: indeterminate bank decision, later retry succeeds, replay does not call providers again
- `decline`: authoritative bank decline moves the application to rejected without funding allocation or fund call
- `needs-documents`: property evidence requires documents, state persists, and no contract is synthesized
- `payment`: exact confirmed monthly payment components close the obligation and replay does not requery
- `delinquency`: oldest-debt chronology and the third consecutive missed month latch cancellation
- `cancellation`: cancellation settlement covers Lost Fund Return from tenant contribution and leaves frozen bank principal untouched
- `maturity`: a complete 12-month schedule enters normal maturity exactly once

The three coverage gaps that were not already explicit single integration tests are implemented in `ScenarioCohortCoverageIntegrationTests`: retry, decline, and needs-documents.

## Running

Example with the default nine-case cohort:

```bash
export CHARKHOONE_INTEGRATION_POSTGRES='Host=localhost;Port=5432;Database=charkhoone_scenario;Username=postgres;Password=...'
export CHARKHOONE_SCENARIO_ALLOW_POSTGRES=true
python3 scripts/pilot/run-scenario-cohort.py
```

Example with an exact runtime cohort size of 37:

```bash
python3 scripts/pilot/run-scenario-cohort.py --cases 37
```

Example selecting only retry, payment, and delinquency with 30 total cases:

```bash
python3 scripts/pilot/run-scenario-cohort.py \
  --cases 30 \
  --scenarios retry,payment,delinquency
```

Use `--list` to inspect the scenario contracts without connecting to PostgreSQL.

## Result evidence

The default report is:

`artifacts/pilot-scenario-cohort/summary.json`

It records:

- schema version
- exact git SHA when available
- requested total case count
- selected scenario names
- actual per-scenario case counts
- PostgreSQL evidence boundary marker
- pass/fail count
- duration
- the exact integration-test contract for each scenario
- per-case sequence, scenario-local case number, exit code, and duration

It intentionally does not contain database credentials or external-provider secrets.

The process exits nonzero when the build fails, configuration is unsafe, or any scenario case fails.

## What this proves

A successful cohort run proves that the selected authoritative service paths repeatedly pass against a real PostgreSQL integration database under the checked-out code and locked test dependencies.

It is useful for internal-pilot confidence, regression testing, retry/idempotency checks, and controlled cohort expansion.

It is not a production load test and does not prove:

- real bank/fund/provider availability
- real OIDC behavior
- real message-broker durability or throughput
- staging/production deployment health
- latency/SLO capacity
- native mobile signing or store readiness

Those remain separate launch requirements.
