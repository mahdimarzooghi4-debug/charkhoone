#!/usr/bin/env bash
set -euo pipefail

: "${CHARKHOONE_DATABASE_CONNECTION:?target database connection is required}"
: "${CHARKHOONE_DATABASE_ENVIRONMENT:?database environment is required}"

purpose="${CHARKHOONE_QUERY_PLAN_EVIDENCE_PURPOSE:-staging}"
environment_name="${CHARKHOONE_DATABASE_ENVIRONMENT,,}"
case "$purpose:$environment_name" in
  staging:staging) ;;
  compatibility:ci) ;;
  *)
    echo 'Query-plan evidence supports staging:staging or compatibility:ci only.' >&2
    exit 1
    ;;
esac

[[ ${CHARKHOONE_ALLOW_QUERY_PLAN_EVIDENCE:-false} == true ]] || {
  echo 'Set CHARKHOONE_ALLOW_QUERY_PLAN_EVIDENCE=true after confirming the target.' >&2
  exit 1
}

if [[ "$purpose" == staging && ${CHARKHOONE_QUERY_PLAN_DATASET_CONFIRMED_REPRESENTATIVE:-false} != true ]]; then
  echo 'Staging plan evidence requires CHARKHOONE_QUERY_PLAN_DATASET_CONFIRMED_REPRESENTATIVE=true.' >&2
  exit 1
fi

command -v psql >/dev/null 2>&1 || { echo 'psql is required' >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo 'python3 is required' >&2; exit 1; }

batch_size="${CHARKHOONE_QUERY_PLAN_BATCH_SIZE:-32}"
statement_timeout_ms="${CHARKHOONE_QUERY_PLAN_STATEMENT_TIMEOUT_MS:-30000}"
[[ "$batch_size" =~ ^[1-9][0-9]*$ ]] || { echo 'CHARKHOONE_QUERY_PLAN_BATCH_SIZE must be a positive integer.' >&2; exit 1; }
[[ "$statement_timeout_ms" =~ ^[1-9][0-9]*$ ]] || { echo 'CHARKHOONE_QUERY_PLAN_STATEMENT_TIMEOUT_MS must be a positive integer.' >&2; exit 1; }

output_root="${CHARKHOONE_DATABASE_EVIDENCE_DIR:-artifacts/database/query-plans}"
output_dir="$output_root/$environment_name"
mkdir -p "$output_dir"

pgoptions="${PGOPTIONS:-}"
pgoptions="${pgoptions:+$pgoptions }-c default_transaction_read_only=on -c statement_timeout=${statement_timeout_ms}"

capture_analyze() {
  local name=$1
  local sql
  sql=$(cat)
  printf 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)\n%s;\n' "$sql" \
    | env PGOPTIONS="$pgoptions" psql "$CHARKHOONE_DATABASE_CONNECTION" -X -q -A -t -v ON_ERROR_STOP=1 \
    > "$output_dir/$name.json"
  test -s "$output_dir/$name.json"
}

capture_static() {
  local name=$1
  local sql
  sql=$(cat)
  printf 'EXPLAIN (FORMAT JSON)\n%s;\n' "$sql" \
    | env PGOPTIONS="$pgoptions" psql "$CHARKHOONE_DATABASE_CONNECTION" -X -q -A -t -v ON_ERROR_STOP=1 \
    > "$output_dir/$name.json"
  test -s "$output_dir/$name.json"
}

capture_analyze payment-reconciliation-candidates <<SQL
SELECT p."Id", c."TenantUserId"
FROM payment_instructions p
JOIN monthly_obligations o ON p."ObligationId" = o."Id"
JOIN lease_contracts c ON o."ContractId" = c."Id"
JOIN external_transactions e ON p."Id" = e."AggregateId"
WHERE e."AggregateType" = 'PaymentInstruction'
  AND e."OperationType" = 'payment_reconciliation'
  AND e."Status" IN ('Pending', 'Unknown')
  AND p."Status" IN ('Pending', 'Unknown', 'ReconciliationRequired')
ORDER BY e."UpdatedAtUtc", e."Id"
LIMIT $batch_size
SQL

capture_analyze coverage-candidates <<SQL
SELECT o."Id"
FROM monthly_obligations o
WHERE o."Status" = 'Missed'
  AND NOT EXISTS (
      SELECT 1
      FROM coverage_payments cp
      WHERE cp."MonthlyObligationId" = o."Id"
        AND cp."Status" = 'Failed')
ORDER BY o."DueAtUtc", o."Id"
LIMIT $batch_size
SQL

capture_analyze cancellation-candidates <<SQL
SELECT c."Id"
FROM lease_contracts c
WHERE c."Status" = 'CancellationPending'
  AND NOT EXISTS (
      SELECT 1
      FROM cancellation_settlements s
      WHERE s."ContractId" = c."Id"
        AND s."Status" = 'Failed')
ORDER BY c."UpdatedAtUtc", c."Id"
LIMIT $batch_size
SQL

capture_analyze normal-settlement-candidates <<SQL
SELECT c."Id"
FROM lease_contracts c
WHERE c."Status" = 'SettlementPending'
  AND NOT EXISTS (
      SELECT 1
      FROM normal_settlements s
      WHERE s."ContractId" = c."Id"
        AND (s."BankPrincipalStatus" = 'Failed' OR s."TenantResidualStatus" = 'Failed'))
ORDER BY c."UpdatedAtUtc", c."Id"
LIMIT $batch_size
SQL

capture_analyze outbox-dequeue-read-path <<SQL
SELECT *
FROM outbox_messages
WHERE "ProcessedAtUtc" IS NULL
ORDER BY "OccurredAtUtc", "Id"
LIMIT $batch_size
SQL

capture_static outbox-dequeue-lock-shape <<SQL
SELECT *
FROM outbox_messages
WHERE "ProcessedAtUtc" IS NULL
ORDER BY "OccurredAtUtc", "Id"
FOR UPDATE SKIP LOCKED
LIMIT $batch_size
SQL

capture_analyze contract-obligations <<'SQL'
WITH representative AS (
    SELECT "ContractId"
    FROM monthly_obligations
    GROUP BY "ContractId"
    ORDER BY count(*) DESC
    LIMIT 1
)
SELECT o.*
FROM monthly_obligations o
WHERE o."ContractId" = (SELECT "ContractId" FROM representative)
ORDER BY o."ContractMonthNumber"
SQL

capture_analyze contract-audit-page <<'SQL'
WITH representative AS (
    SELECT "AggregateId"
    FROM audit_events
    WHERE "AggregateType" = 'LeaseContract'
    GROUP BY "AggregateId"
    ORDER BY count(*) DESC
    LIMIT 1
)
SELECT a."Id", a."ActorId", a."Action", a."Reason", a."OccurredAtUtc"
FROM audit_events a
WHERE a."AggregateType" = 'LeaseContract'
  AND a."AggregateId" = (SELECT "AggregateId" FROM representative)
ORDER BY a."OccurredAtUtc" DESC, a."Id" DESC
LIMIT 100
SQL

capture_analyze contract-audit-action-page <<'SQL'
WITH representative AS (
    SELECT "AggregateId", "Action"
    FROM audit_events
    WHERE "AggregateType" = 'LeaseContract'
    GROUP BY "AggregateId", "Action"
    ORDER BY count(*) DESC
    LIMIT 1
)
SELECT a."Id", a."ActorId", a."Action", a."Reason", a."OccurredAtUtc"
FROM audit_events a
WHERE a."AggregateType" = 'LeaseContract'
  AND a."AggregateId" = (SELECT "AggregateId" FROM representative)
  AND a."Action" = (SELECT "Action" FROM representative)
ORDER BY a."OccurredAtUtc" DESC, a."Id" DESC
LIMIT 100
SQL

capture_analyze external-transaction-idempotency <<'SQL'
SELECT e.*
FROM external_transactions e
WHERE e."IdempotencyKey" = (
    SELECT "IdempotencyKey"
    FROM external_transactions
    ORDER BY "IdempotencyKey"
    LIMIT 1)
SQL

capture_analyze journal-idempotency <<'SQL'
SELECT j.*
FROM journal_entries j
WHERE j."IdempotencyKey" = (
    SELECT "IdempotencyKey"
    FROM journal_entries
    ORDER BY "IdempotencyKey"
    LIMIT 1)
SQL

capture_analyze inbox-idempotency <<'SQL'
SELECT i.*
FROM inbox_messages i
WHERE i."MessageId" = (
    SELECT "MessageId"
    FROM inbox_messages
    ORDER BY "MessageId"
    LIMIT 1)
SQL

capture_analyze lost-fund-return-open-count <<'SQL'
WITH representative AS (
    SELECT "ContractId"
    FROM lost_fund_returns
    WHERE "CalculatedReturnRial" IS NULL
    GROUP BY "ContractId"
    ORDER BY count(*) DESC
    LIMIT 1
)
SELECT count(*)
FROM lost_fund_returns l
WHERE l."ContractId" = (SELECT "ContractId" FROM representative)
  AND l."CalculatedReturnRial" IS NULL
SQL

env PGOPTIONS="$pgoptions" psql "$CHARKHOONE_DATABASE_CONNECTION" -X -q -A -t -F $'\t' -v ON_ERROR_STOP=1 \
  -f scripts/database/query-plan-cardinality.sql > "$output_dir/cardinality.tsv"
test -s "$output_dir/cardinality.tsv"

python3 scripts/database/verify-query-plan-evidence.py "$output_dir"

{
  printf 'environment=%s\n' "$environment_name"
  printf 'purpose=%s\n' "$purpose"
  if [[ "$purpose" == staging ]]; then
    printf 'dataset_representative=operator-confirmed\n'
  else
    printf 'dataset_representative=false-ci-compatibility-only\n'
  fi
  printf 'batch_size=%s\n' "$batch_size"
  printf 'statement_timeout_ms=%s\n' "$statement_timeout_ms"
  printf 'outbox_locking_plan=static-only-no-row-lock-acquired\n'
  date -u '+captured_at_utc=%Y-%m-%dT%H:%M:%SZ'
} > "$output_dir/capture-summary.txt"

printf 'Query-plan evidence captured in %s\n' "$output_dir"
printf 'Connection string and customer rows were not emitted.\n'
printf 'No performance threshold or promotion decision was inferred by this script.\n'
