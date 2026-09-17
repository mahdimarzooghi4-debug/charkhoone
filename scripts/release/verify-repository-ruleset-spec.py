#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SPEC_PATH = ROOT / "deploy" / "repository-ruleset-main.json"

EXPECTED_NAME = "charkhoone-main-release-gates"
EXPECTED_BRANCH = "refs/heads/main"
EXPECTED_APP_ID = 15368
EXPECTED_CHECKS = [
    "repository-governance-gate",
    "release-ci-gate",
    "container-release-gate",
    "supply-chain-evidence-gate",
    "mobile-export-build-gate",
]

failures: list[str] = []


def require(condition: bool, message: str) -> None:
    if not condition:
        failures.append(message)


try:
    spec = json.loads(SPEC_PATH.read_text(encoding="utf-8"))
except (OSError, json.JSONDecodeError) as exc:
    print(f"invalid repository ruleset spec: {exc}", file=sys.stderr)
    raise SystemExit(1)

require(spec.get("name") == EXPECTED_NAME, f"ruleset name must be {EXPECTED_NAME}")
require(spec.get("target") == "branch", "ruleset target must be branch")
require(spec.get("enforcement") == "active", "ruleset enforcement must be active")
require("bypass_actors" not in spec or spec.get("bypass_actors") == [], "ruleset must not define bypass actors")

ref_name = spec.get("conditions", {}).get("ref_name", {})
require(ref_name.get("include") == [EXPECTED_BRANCH], "ruleset must target only refs/heads/main")
require(ref_name.get("exclude") == [], "ruleset ref exclusions must be empty")

rules = spec.get("rules")
require(isinstance(rules, list), "ruleset rules must be a list")
by_type: dict[str, list[dict]] = {}
if isinstance(rules, list):
    for rule in rules:
        if isinstance(rule, dict) and isinstance(rule.get("type"), str):
            by_type.setdefault(rule["type"], []).append(rule)

require(
    set(by_type) == {"deletion", "non_fast_forward", "pull_request", "required_status_checks"},
    "ruleset must contain exactly deletion, non_fast_forward, pull_request, and required_status_checks rules",
)
for rule_type, entries in by_type.items():
    require(len(entries) == 1, f"ruleset rule {rule_type} must appear exactly once")

pull = (by_type.get("pull_request") or [{}])[0].get("parameters", {})
require(
    pull.get("allowed_merge_methods") == ["merge", "squash", "rebase"],
    "pull_request rule must preserve all repository merge methods",
)
require(
    pull.get("dismiss_stale_reviews_on_push") is False,
    "dismiss_stale_reviews_on_push must remain false until review policy is defined",
)
require(
    pull.get("require_code_owner_review") is False,
    "require_code_owner_review must remain false until review policy is defined",
)
require(
    pull.get("require_last_push_approval") is False,
    "require_last_push_approval must remain false until review policy is defined",
)
require(
    pull.get("required_approving_review_count") == 0,
    "required_approving_review_count must remain 0 until organization policy is defined",
)
require(
    pull.get("required_review_thread_resolution") is False,
    "required_review_thread_resolution must remain false until review policy is defined",
)

status = (by_type.get("required_status_checks") or [{}])[0].get("parameters", {})
require(status.get("do_not_enforce_on_create") is False, "required status checks must apply without create bypass")
require(
    status.get("strict_required_status_checks_policy") is True,
    "required status checks must use strict/up-to-date policy",
)
checks = status.get("required_status_checks")
require(isinstance(checks, list), "required_status_checks must be a list")
if isinstance(checks, list):
    contexts = [entry.get("context") for entry in checks if isinstance(entry, dict)]
    require(contexts == EXPECTED_CHECKS, "required status check contexts must exactly match stable release gates")
    require(
        all(entry.get("integration_id") == EXPECTED_APP_ID for entry in checks if isinstance(entry, dict)),
        f"all required status checks must be bound to GitHub Actions app id {EXPECTED_APP_ID}",
    )

if failures:
    for failure in failures:
        print(f"repository ruleset spec verification failed: {failure}", file=sys.stderr)
    raise SystemExit(1)

print("repository ruleset spec verified")
