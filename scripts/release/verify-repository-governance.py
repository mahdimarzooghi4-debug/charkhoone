#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
POLICY_PATH = ROOT / "deploy" / "repository-governance.json"
WORKFLOWS_DIR = ROOT / ".github" / "workflows"

EXPECTED_CHECKS = [
    "repository-governance-gate",
    "release-ci-gate",
    "container-release-gate",
    "supply-chain-evidence-gate",
    "mobile-export-build-gate",
]
EXPECTED_CHECKS_CSV = ",".join(EXPECTED_CHECKS)

REQUIRED_RULES = {
    "require_pull_request": True,
    "require_status_checks_to_pass": True,
    "require_branch_up_to_date": True,
    "block_force_pushes": True,
    "block_branch_deletion": True,
}

failures: list[str] = []


def require(condition: bool, message: str) -> None:
    if not condition:
        failures.append(message)


def read(path: str) -> str:
    target = ROOT / path
    require(target.is_file(), f"missing required file: {path}")
    return target.read_text(encoding="utf-8") if target.is_file() else ""


try:
    policy = json.loads(POLICY_PATH.read_text(encoding="utf-8"))
except (OSError, json.JSONDecodeError) as exc:
    print(f"invalid repository governance policy: {exc}", file=sys.stderr)
    raise SystemExit(1)

require(policy.get("schema_version") == 1, "repository governance schema_version must be 1")
require(policy.get("protected_branch") == "main", "protected_branch must be main")
require(
    policy.get("required_status_checks") == EXPECTED_CHECKS,
    "required_status_checks must exactly match the approved stable gate names",
)
require(
    policy.get("review_approval_count") == "organization-policy-not-defined",
    "review approval count must remain explicitly undefined until organization policy exists",
)
for key, expected in REQUIRED_RULES.items():
    require(policy.get("rules", {}).get(key) is expected, f"governance rule {key} must be {expected}")

workflow_texts: dict[str, str] = {}
for workflow in sorted(WORKFLOWS_DIR.glob("*.yml")):
    text = workflow.read_text(encoding="utf-8")
    relative = workflow.relative_to(ROOT).as_posix()
    workflow_texts[relative] = text

    require("pull_request_target:" not in text, f"{relative}: pull_request_target is prohibited")
    require(
        not re.search(r"^\s+[A-Za-z0-9_-]+:\s*write\s*$", text, flags=re.MULTILINE),
        f"{relative}: write-scoped workflow permission is prohibited by the current governance baseline",
    )

    for match in re.finditer(r"^\s*-?\s*uses:\s*([^\s#]+)", text, flags=re.MULTILINE):
        ref = match.group(1)
        if ref.startswith("./"):
            continue
        require(
            re.fullmatch(r"[^@\s]+@[0-9a-f]{40}", ref) is not None,
            f"{relative}: action reference is not pinned to a full commit SHA: {ref}",
        )

required_workflows = {
    ".github/workflows/ci.yml": [
        "pull_request:",
        "permissions:\n  contents: read",
        "  release-evidence:\n    name: release-ci-gate",
        "needs: [backend, web, mobile]",
        "if: ${{ always() }}",
        "BACKEND_RESULT: ${{ needs.backend.result }}",
        "WEB_RESULT: ${{ needs.web.result }}",
        "MOBILE_RESULT: ${{ needs.mobile.result }}",
        'test "$BACKEND_RESULT" = success',
        'test "$WEB_RESULT" = success',
        'test "$MOBILE_RESULT" = success',
    ],
    ".github/workflows/container-images.yml": [
        "pull_request:",
        "permissions:\n  contents: read",
        "  container-release-evidence:\n    name: container-release-gate",
        "if: ${{ always() }}",
        "BASE_IMAGE_PINS_RESULT: ${{ needs.base-image-pins.result }}",
        "API_IMAGE_RESULT: ${{ needs.api-image.result }}",
        "WORKER_IMAGE_RESULT: ${{ needs.worker-image.result }}",
        "WEB_IMAGE_RESULT: ${{ needs.web-image.result }}",
        'test "$BASE_IMAGE_PINS_RESULT" = success',
        'test "$API_IMAGE_RESULT" = success',
        'test "$WORKER_IMAGE_RESULT" = success',
        'test "$WEB_IMAGE_RESULT" = success',
    ],
    ".github/workflows/supply-chain-evidence.yml": [
        "pull_request:",
        "permissions:\n  contents: read",
        "  evidence:\n    name: supply-chain-evidence-gate",
    ],
    ".github/workflows/repository-governance.yml": [
        "pull_request:",
        "permissions:\n  contents: read",
        "  governance:\n    name: repository-governance-gate",
        f"required_status_checks={EXPECTED_CHECKS_CSV}",
    ],
    ".github/workflows/mobile-export-build.yml": [
        "pull_request:",
        "permissions:\n  contents: read",
        "  mobile-export-build:\n    name: mobile-export-build-gate",
        "npx expo export --platform android --output-dir dist/android",
        "npx expo export --platform ios --output-dir dist/ios",
        "android_production_export=success",
        "ios_production_export=success",
        "mobile-export-evidence-${{ github.sha }}",
    ],
}

for path, tokens in required_workflows.items():
    text = workflow_texts.get(path) or read(path)
    require("paths:" not in text, f"{path}: required gate workflow must not be path-filtered")
    for token in tokens:
        require(token in text, f"{path}: missing governance token: {token}")

staging = workflow_texts.get(".github/workflows/staging-release-ops-validation.yml") or read(
    ".github/workflows/staging-release-ops-validation.yml"
)
for token in (
    "pull_request:",
    "permissions:\n  contents: read",
    '"scripts/staging/**"',
    "scripts/staging/ci-promotion-packet-fixture.sh",
):
    require(token in staging, f"staging release validation is missing required token: {token}")

all_gate_names = []
for text in workflow_texts.values():
    all_gate_names.extend(re.findall(r"^\s+name:\s+([A-Za-z0-9_-]+-gate)\s*$", text, flags=re.MULTILINE))
require(sorted(all_gate_names) == sorted(EXPECTED_CHECKS), "workflow gate names must exactly match repository-governance.json")

if failures:
    for failure in failures:
        print(f"governance verification failed: {failure}", file=sys.stderr)
    raise SystemExit(1)

print("repository governance contract verified")
