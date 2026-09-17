"""Validate the exact read-only audit result contract; no credentials or row data."""
import pathlib
import sys

EXPECTED = {
    "journal_balance", "journal_line_sides", "canonical_currency", "blank_idempotency_key",
    "frozen_principal_orphan", "contract_application_orphan", "allocation_contribution_equation",
    "frozen_allocation_mismatch", "contribution_allocation_mismatch", "component_obligation_mismatch",
    "coverage_relationship_mismatch", "lost_return_coverage_mismatch", "unvalidated_constraint", "invalid_index",
}

def verify(text):
    result = {}
    for line in text.splitlines():
        code, count = line.split("\t")
        if code in result:
            raise ValueError(f"Duplicate audit check: {code}")
        result[code] = int(count)
    if set(result) != EXPECTED:
        raise ValueError("Incomplete or unexpected audit check set")
    failures = {code: count for code, count in result.items() if count != 0}
    if failures:
        raise ValueError(f"Integrity violations: {failures}")
    return len(result)

if __name__ == "__main__":
    count = verify(pathlib.Path(sys.argv[1]).read_text())
    print(f"{count} integrity checks passed: {pathlib.Path(sys.argv[1]).name}")
