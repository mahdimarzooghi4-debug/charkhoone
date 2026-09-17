#!/usr/bin/env python3
import csv
import json
import pathlib
import sys

ANALYZE_PLANS = [
    "payment-reconciliation-candidates",
    "coverage-candidates",
    "cancellation-candidates",
    "normal-settlement-candidates",
    "outbox-dequeue-read-path",
    "contract-obligations",
    "contract-audit-page",
    "contract-audit-action-page",
    "external-transaction-idempotency",
    "journal-idempotency",
    "inbox-idempotency",
    "lost-fund-return-open-count",
]
STATIC_PLANS = ["outbox-dequeue-lock-shape"]
EXPECTED_CARDINALITY_METRICS = {
    "lease_contracts",
    "monthly_obligations",
    "payment_instructions",
    "external_transactions",
    "coverage_payments",
    "cancellation_settlements",
    "normal_settlements",
    "outbox_messages",
    "audit_events",
    "lost_fund_returns",
    "payment_reconciliation_candidates",
    "coverage_candidates",
    "cancellation_candidates",
    "normal_settlement_candidates",
    "pending_outbox",
    "lease_contract_audit_events",
    "open_lost_fund_return_exposures",
}


def fail(message: str) -> None:
    raise SystemExit(message)


def load_plan(path: pathlib.Path, require_execution: bool) -> dict:
    if not path.is_file() or path.stat().st_size == 0:
        fail(f"missing or empty plan evidence: {path}")
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON plan evidence {path}: {exc}")
    if not isinstance(payload, list) or len(payload) != 1 or not isinstance(payload[0], dict):
        fail(f"unexpected EXPLAIN JSON envelope: {path}")
    document = payload[0]
    if not isinstance(document.get("Plan"), dict):
        fail(f"missing root Plan object: {path}")
    if require_execution:
        for key in ("Planning Time", "Execution Time"):
            value = document.get(key)
            if not isinstance(value, (int, float)) or value < 0:
                fail(f"missing or invalid {key} in {path}")
    return document


def read_cardinality(path: pathlib.Path) -> dict[str, int]:
    if not path.is_file() or path.stat().st_size == 0:
        fail(f"missing cardinality evidence: {path}")
    metrics: dict[str, int] = {}
    with path.open(encoding="utf-8", newline="") as handle:
        reader = csv.reader(handle, delimiter="\t")
        for row in reader:
            if len(row) != 2:
                fail(f"invalid cardinality row in {path}: {row}")
            name, raw_value = row
            try:
                value = int(raw_value)
            except ValueError:
                fail(f"non-integer cardinality value for {name}: {raw_value}")
            if value < 0:
                fail(f"negative cardinality value for {name}: {value}")
            metrics[name] = value
    missing = EXPECTED_CARDINALITY_METRICS - metrics.keys()
    if missing:
        fail(f"missing cardinality metrics: {', '.join(sorted(missing))}")
    return metrics


def main() -> None:
    if len(sys.argv) != 2:
        fail("usage: verify-query-plan-evidence.py <evidence-directory>")
    evidence_dir = pathlib.Path(sys.argv[1])
    rows: list[tuple[str, str, str, str, str, str]] = []

    for name in ANALYZE_PLANS:
        document = load_plan(evidence_dir / f"{name}.json", require_execution=True)
        root = document["Plan"]
        rows.append((
            name,
            "analyze",
            str(root.get("Node Type", "unknown")),
            str(document["Planning Time"]),
            str(document["Execution Time"]),
            str(root.get("Actual Rows", "unknown")),
        ))

    for name in STATIC_PLANS:
        document = load_plan(evidence_dir / f"{name}.json", require_execution=False)
        root = document["Plan"]
        rows.append((name, "static", str(root.get("Node Type", "unknown")), "", "", ""))

    metrics = read_cardinality(evidence_dir / "cardinality.tsv")

    summary_path = evidence_dir / "plan-summary.tsv"
    with summary_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, delimiter="\t", lineterminator="\n")
        writer.writerow(["plan", "mode", "root_node", "planning_ms", "execution_ms", "actual_rows"])
        writer.writerows(rows)

    cardinality_summary = evidence_dir / "cardinality-summary.tsv"
    with cardinality_summary.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, delimiter="\t", lineterminator="\n")
        writer.writerow(["metric", "value"])
        for name in sorted(metrics):
            writer.writerow([name, metrics[name]])

    print(f"verified {len(rows)} query plans and {len(metrics)} cardinality metrics")
    print("No performance winner/threshold is inferred; staging interpretation remains an operator review gate.")


if __name__ == "__main__":
    main()
