#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

[[ ${CHARKHOONE_ALLOW_PILOT_COHORT:-false} == true ]] || {
  echo 'Set CHARKHOONE_ALLOW_PILOT_COHORT=true only for an approved synthetic pilot cohort run.' >&2
  exit 1
}

: "${CHARKHOONE_PILOT_POSTGRES:?dedicated pilot PostgreSQL connection is required}"
: "${CHARKHOONE_PILOT_DATABASE_CONFIRMATION:?exact pilot database name confirmation is required}"
: "${CHARKHOONE_PILOT_COHORT_SIZE:?pilot cohort size is required}"

for command_name in dotnet python3 date; do
  command -v "$command_name" >/dev/null 2>&1 || { echo "$command_name is required" >&2; exit 1; }
done

python3 scripts/pilot/verify-cohort-target.py

if [[ ! "$CHARKHOONE_PILOT_COHORT_SIZE" =~ ^[1-9][0-9]*$ ]]   || (( CHARKHOONE_PILOT_COHORT_SIZE > 100000 )); then
  echo 'CHARKHOONE_PILOT_COHORT_SIZE must be between 1 and 100000.' >&2
  exit 1
fi

concurrency="${CHARKHOONE_PILOT_COHORT_CONCURRENCY:-8}"
if [[ ! "$concurrency" =~ ^[1-9][0-9]*$ ]] || (( concurrency > 256 )); then
  echo 'CHARKHOONE_PILOT_COHORT_CONCURRENCY must be between 1 and 256.' >&2
  exit 1
fi

run_id="${CHARKHOONE_PILOT_COHORT_RUN_ID:-$(date -u '+%Y%m%dT%H%M%SZ')-$(python3 - <<'PY'
import uuid
print(uuid.uuid4().hex[:12])
PY
)}"

evidence_root="${CHARKHOONE_PILOT_COHORT_EVIDENCE_DIR:-artifacts/pilot-cohort}"

export CHARKHOONE_RUN_PILOT_COHORT=true
export CHARKHOONE_INTEGRATION_POSTGRES="$CHARKHOONE_PILOT_POSTGRES"
export ConnectionStrings__Postgres="$CHARKHOONE_PILOT_POSTGRES"
export CHARKHOONE_PILOT_COHORT_CONCURRENCY="$concurrency"
export CHARKHOONE_PILOT_COHORT_RUN_ID="$run_id"
export CHARKHOONE_PILOT_COHORT_EVIDENCE_DIR="$evidence_root"

dotnet test tests/Charkhoone.Api.IntegrationTests/Charkhoone.Api.IntegrationTests.csproj   --configuration Release   --filter FullyQualifiedName~PilotSyntheticCohortHarnessTests.ExternalCohort_RunConfiguredSize

summary="$evidence_root/$run_id/summary.json"
[[ -s "$summary" ]] || {
  echo "Pilot cohort run completed without the expected summary: $summary" >&2
  exit 1
}

printf 'Synthetic pilot cohort completed.\n'
printf 'run_id=%s\n' "$run_id"
printf 'cohort_size=%s\n' "$CHARKHOONE_PILOT_COHORT_SIZE"
printf 'concurrency=%s\n' "$concurrency"
printf 'summary=%s\n' "$summary"
printf 'real_external_providers_contacted=no\n'
