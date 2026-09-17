#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEPENDABOT = ROOT / ".github" / "dependabot.yml"
DRIFT_WORKFLOW = ROOT / ".github" / "workflows" / "base-image-drift.yml"
DRIFT_SCRIPT = ROOT / "scripts" / "release" / "check-base-image-drift.sh"
GOVERNANCE_WORKFLOW = ROOT / ".github" / "workflows" / "repository-governance.yml"

failures: list[str] = []


def require(condition: bool, message: str) -> None:
    if not condition:
        failures.append(message)


def read(path: Path) -> str:
    require(path.is_file(), f"missing required file: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8") if path.is_file() else ""


dependabot = read(DEPENDABOT)
require(re.search(r"^version:\s*2\s*$", dependabot, flags=re.MULTILINE) is not None, "Dependabot config must use version 2")
require(dependabot.count("package-ecosystem:") == 4, "Dependabot config must contain exactly four update entries")

expected_entries = [
    ("nuget", "/"),
    ("npm", "/apps/web"),
    ("npm", "/apps/mobile"),
    ("github-actions", "/"),
]
for ecosystem, directory in expected_entries:
    pattern = (
        rf'- package-ecosystem:\s*"{re.escape(ecosystem)}"\s*\n'
        rf'\s+directory:\s*"{re.escape(directory)}"\s*\n'
        rf'\s+schedule:\s*\n'
        rf'\s+interval:\s*"weekly"'
    )
    require(
        re.search(pattern, dependabot, flags=re.MULTILINE) is not None,
        f"missing weekly Dependabot entry for {ecosystem} at {directory}",
    )

for prohibited in ("docker", "ignore:", "groups:", "target-branch:"):
    require(prohibited not in dependabot, f"Dependabot baseline must not contain {prohibited!r}")

workflow = read(DRIFT_WORKFLOW)
for token in (
    "schedule:",
    "workflow_dispatch:",
    "permissions:\n  contents: read",
    "name: base-image-drift-check",
    "continue-on-error: true",
    "bash scripts/release/check-base-image-drift.sh artifacts/base-image-drift",
    "if: ${{ always() }}",
    "actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02",
    "DRIFT_OUTCOME: ${{ steps.drift.outcome }}",
    'test "$DRIFT_OUTCOME" = success',
):
    require(token in workflow, f"base-image drift workflow missing required token: {token}")

require("pull_request:" not in workflow, "base-image drift workflow must not be a merge gate")
require("push:" not in workflow, "base-image drift workflow must be scheduled/manual only")
require(not re.search(r"^\s+name:\s+.*-gate\s*$", workflow, flags=re.MULTILINE), "base-image drift job must not introduce a required gate name")
require(not re.search(r"^\s+[A-Za-z0-9_-]+:\s*write\s*$", workflow, flags=re.MULTILINE), "base-image drift workflow must remain read-only")
for match in re.finditer(r"^\s*-?\s*uses:\s*([^\s#]+)", workflow, flags=re.MULTILINE):
    ref = match.group(1)
    require(re.fullmatch(r"[^@\s]+@[0-9a-f]{40}", ref) is not None, f"base-image drift action is not pinned to a full SHA: {ref}")

script = read(DRIFT_SCRIPT)
for token in (
    "set -euo pipefail",
    "scripts/release/resolve-base-image-digests.sh",
    "resolved-base-images.lock",
    "changes.tsv",
    "diff.txt",
    "summary.txt",
    "drift_detected=no",
    "drift_detected=yes",
    "repository_mutation=not-performed",
    "promotion_decision=not-made-by-script",
    "exit 1",
    "exit 2",
):
    require(token in script, f"base-image drift script missing required token: {token}")

for prohibited in ("git push", "gh pr create", "curl -X POST", "curl --request POST"):
    require(prohibited not in script, f"base-image drift script must not mutate external state: {prohibited}")

governance = read(GOVERNANCE_WORKFLOW)
for token in (
    "python3 scripts/release/verify-dependency-upstream-intake.py",
    "bash -n scripts/release/check-base-image-drift.sh",
):
    require(token in governance, f"repository governance workflow missing dependency-intake validation token: {token}")

if failures:
    for failure in failures:
        print(f"dependency upstream intake verification failed: {failure}", file=sys.stderr)
    raise SystemExit(1)

print("dependency upstream intake contract verified")
