#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import sys
from collections import Counter
from pathlib import Path

EXPECTED = (
    "backend-source",
    "web-source",
    "mobile-source",
    "api-image",
    "worker-image",
    "web-image",
)
SEVERITIES = ("Critical", "High", "Medium", "Low", "Negligible", "Unknown")


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def read_json(path: Path) -> dict:
    if not path.is_file() or path.stat().st_size == 0:
        fail(f"Missing or empty evidence file: {path}")
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"Invalid JSON in {path}: {exc}")
    if not isinstance(value, dict):
        fail(f"Expected JSON object in {path}")
    return value


def main() -> None:
    if len(sys.argv) != 2:
        fail("usage: verify-supply-chain-artifacts.py <evidence-dir>")
    root = Path(sys.argv[1])
    if not root.is_dir():
        fail(f"Evidence directory does not exist: {root}")

    rows: list[dict[str, str | int]] = []
    for name in EXPECTED:
        sbom_path = root / "sbom" / f"{name}.cdx.json"
        scan_path = root / "vulnerability" / f"{name}.grype.json"
        sbom = read_json(sbom_path)
        scan = read_json(scan_path)

        if sbom.get("bomFormat") != "CycloneDX":
            fail(f"{sbom_path} is not a CycloneDX SBOM")
        spec_version = sbom.get("specVersion")
        if not isinstance(spec_version, str) or not spec_version:
            fail(f"{sbom_path} is missing CycloneDX specVersion")
        components = sbom.get("components")
        if not isinstance(components, list) or not components:
            fail(f"{sbom_path} must contain at least one component")

        matches = scan.get("matches")
        ignored = scan.get("ignoredMatches", [])
        if not isinstance(matches, list):
            fail(f"{scan_path} is missing the Grype matches array")
        if not isinstance(ignored, list):
            fail(f"{scan_path} has a malformed ignoredMatches array")

        counts: Counter[str] = Counter()
        for match in matches:
            if not isinstance(match, dict):
                fail(f"{scan_path} contains a malformed vulnerability match")
            vulnerability = match.get("vulnerability")
            if not isinstance(vulnerability, dict):
                fail(f"{scan_path} contains a match without vulnerability metadata")
            severity = vulnerability.get("severity")
            if not isinstance(severity, str) or severity not in SEVERITIES:
                severity = "Unknown"
            counts[severity] += 1

        row: dict[str, str | int] = {
            "artifact": name,
            "cyclonedx_spec_version": spec_version,
            "component_count": len(components),
            "vulnerability_match_count": len(matches),
            "ignored_match_count": len(ignored),
        }
        for severity in SEVERITIES:
            row[f"{severity.lower()}_count"] = counts[severity]
        rows.append(row)

    db_status = read_json(root / "grype-db-status.json")
    if not db_status:
        fail("Grype database status evidence is empty")

    summary = root / "summary.tsv"
    fieldnames = list(rows[0].keys())
    with summary.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, delimiter="\t")
        writer.writeheader()
        writer.writerows(rows)

    print("supply-chain-artifacts=valid")
    print(f"artifact_count={len(rows)}")
    print("vulnerability_policy_gate=not-defined")


if __name__ == "__main__":
    main()
