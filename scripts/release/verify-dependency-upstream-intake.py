#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEPENDABOT = ROOT / ".github" / "dependabot.yml"
BASE_DRIFT_WORKFLOW = ROOT / ".github" / "workflows" / "base-image-drift.yml"
BASE_DRIFT_SCRIPT = ROOT / "scripts" / "release" / "check-base-image-drift.sh"
CI_DRIFT_WORKFLOW = ROOT / ".github" / "workflows" / "ci-dependency-drift.yml"
CI_DRIFT_SCRIPT = ROOT / "scripts" / "release" / "check-ci-dependency-drift.sh"
CI_RESOLVER = ROOT / "scripts" / "release" / "resolve-ci-dependencies.sh"
GOVERNANCE_WORKFLOW = ROOT / ".github" / "workflows" / "repository-governance.yml"

failures: list[str] = []


def require(condition: bool, message: str) -> None:
    if not condition:
        failures.append(message)


def read(path: Path) -> str:
    require(path.is_file(), f"missing required file: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8") if path.is_file() else ""


def require_weekly_entry(text: str, ecosystem: str, directory: str) -> None:
    pattern = (
        rf'- package-ecosystem:\s*"{re.escape(ecosystem)}"\s*\n'
        rf'\s+directory:\s*"{re.escape(directory)}"\s*\n'
        rf'\s+schedule:\s*\n'
        rf'\s+interval:\s*"weekly"'
    )
    require(
        re.search(pattern, text, flags=re.MULTILINE) is not None,
        f"missing weekly Dependabot entry for {ecosystem} at {directory}",
    )


def verify_read_only_drift_workflow(path: Path, job_name: str, command: str) -> None:
    text = read(path)
    for token in (
        "schedule:",
        "workflow_dispatch:",
        "permissions:\n  contents: read",
        f"name: {job_name}",
        "continue-on-error: true",
        command,
        "if: ${{ always() }}",
        "actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02",
        "DRIFT_OUTCOME: ${{ steps.drift.outcome }}",
        'test "$DRIFT_OUTCOME" = success',
    ):
        require(token in text, f"{path.name} missing required token: {token}")

    require("pull_request:" not in text, f"{path.name} must not be a merge gate")
    require("push:" not in text, f"{path.name} must be scheduled/manual only")
    require(
        not re.search(r"^\s+name:\s+.*-gate\s*$", text, flags=re.MULTILINE),
        f"{path.name} job must not introduce a required gate name",
    )
    require(
        not re.search(r"^\s+[A-Za-z0-9_-]+:\s*write\s*$", text, flags=re.MULTILINE),
        f"{path.name} must remain read-only",
    )
    for match in re.finditer(r"^\s*-?\s*uses:\s*([^\s#]+)", text, flags=re.MULTILINE):
        ref = match.group(1)
        require(
            re.fullmatch(r"[^@\s]+@[0-9a-f]{40}", ref) is not None,
            f"{path.name} action is not pinned to a full SHA: {ref}",
        )


def verify_drift_script(path: Path, resolver: str, resolved_name: str) -> None:
    text = read(path)
    for token in (
        "set -euo pipefail",
        resolver,
        resolved_name,
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
        require(token in text, f"{path.name} missing required token: {token}")
    for prohibited in ("git push", "gh pr create", "curl -X POST", "curl --request POST"):
        require(prohibited not in text, f"{path.name} must not mutate external state: {prohibited}")


dependabot = read(DEPENDABOT)
require(
    re.search(r"^version:\s*2\s*$", dependabot, flags=re.MULTILINE) is not None,
    "Dependabot config must use version 2",
)
require(dependabot.count("package-ecosystem:") == 3, "Dependabot config must contain exactly three update entries")
require_weekly_entry(dependabot, "nuget", "/")
require_weekly_entry(dependabot, "npm", "/apps/web")
require_weekly_entry(dependabot, "npm", "/apps/mobile")
require(
    re.search(
        r'- package-ecosystem:\s*"npm"\s*\n'
        r'\s+directory:\s*"/apps/mobile"\s*\n'
        r'\s+schedule:\s*\n'
        r'\s+interval:\s*"weekly"\s*\n'
        r'\s+versioning-strategy:\s*"lockfile-only"',
        dependabot,
        flags=re.MULTILINE,
    )
    is not None,
    "mobile Dependabot entry must be lockfile-only",
)
for prohibited in ("github-actions", "docker", "ignore:", "groups:", "target-branch:"):
    require(prohibited not in dependabot, f"Dependabot baseline must not contain {prohibited!r}")

verify_read_only_drift_workflow(
    BASE_DRIFT_WORKFLOW,
    "base-image-drift-check",
    "bash scripts/release/check-base-image-drift.sh artifacts/base-image-drift",
)
verify_read_only_drift_workflow(
    CI_DRIFT_WORKFLOW,
    "ci-dependency-drift-check",
    "bash scripts/release/check-ci-dependency-drift.sh artifacts/ci-dependency-drift",
)
verify_drift_script(
    BASE_DRIFT_SCRIPT,
    "scripts/release/resolve-base-image-digests.sh",
    "resolved-base-images.lock",
)
verify_drift_script(
    CI_DRIFT_SCRIPT,
    "scripts/release/resolve-ci-dependencies.sh",
    "resolved-ci-dependencies.lock",
)

resolver = read(CI_RESOLVER)
for token in (
    "resolve_action ACTIONS_CHECKOUT actions/checkout v5",
    "resolve_action ACTIONS_SETUP_DOTNET actions/setup-dotnet v5",
    "resolve_action ACTIONS_SETUP_NODE actions/setup-node v4",
    "resolve_action ACTIONS_UPLOAD_ARTIFACT actions/upload-artifact v4",
    "resolve_postgres",
):
    require(token in resolver, f"CI resolver approved-major contract missing: {token}")

governance = read(GOVERNANCE_WORKFLOW)
for token in (
    "python3 scripts/release/verify-dependency-upstream-intake.py",
    "bash -n scripts/release/check-base-image-drift.sh",
    "bash -n scripts/release/check-ci-dependency-drift.sh",
    "ci_dependency_drift_workflow_sha256=",
    "ci_dependency_drift_script_sha256=",
):
    require(token in governance, f"repository governance workflow missing dependency-intake validation token: {token}")

if failures:
    for failure in failures:
        print(f"dependency upstream intake verification failed: {failure}", file=sys.stderr)
    raise SystemExit(1)

print("dependency upstream intake contract verified")
