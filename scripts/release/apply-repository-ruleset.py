#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, NoReturn

ROOT = Path(__file__).resolve().parents[2]
SPEC_PATH = ROOT / "deploy" / "repository-ruleset-main.json"
API_VERSION = "2026-03-10"


def fail(message: str) -> NoReturn:
    print(f"repository ruleset apply failed: {message}", file=sys.stderr)
    raise SystemExit(1)


def request(method: str, url: str, token: str, payload: dict[str, Any] | None = None) -> Any:
    data = None if payload is None else json.dumps(payload, separators=(",", ":")).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": API_VERSION,
            "User-Agent": "charkhoone-repository-enforcement",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            body = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        fail(f"GitHub API {method} {url} returned HTTP {exc.code}: {detail}")
    except urllib.error.URLError as exc:
        fail(f"GitHub API request failed: {exc}")
    return json.loads(body) if body else None


def rule_map(payload: dict[str, Any]) -> dict[str, dict[str, Any]]:
    rules = payload.get("rules")
    if not isinstance(rules, list):
        fail("ruleset response has no rules list")
    result: dict[str, dict[str, Any]] = {}
    for rule in rules:
        if not isinstance(rule, dict) or not isinstance(rule.get("type"), str):
            fail("ruleset response contains malformed rule")
        if rule["type"] in result:
            fail(f"ruleset response contains duplicate rule type {rule['type']}")
        result[rule["type"]] = rule
    return result


def verify_ruleset(actual: dict[str, Any], expected: dict[str, Any]) -> None:
    if actual.get("name") != expected.get("name"):
        fail("live ruleset name mismatch")
    if actual.get("target") != "branch":
        fail("live ruleset target mismatch")
    if actual.get("enforcement") != "active":
        fail("live ruleset is not active")
    if actual.get("conditions", {}).get("ref_name") != expected.get("conditions", {}).get("ref_name"):
        fail("live ruleset branch targeting mismatch")

    expected_rules = rule_map(expected)
    actual_rules = rule_map(actual)
    if set(actual_rules) != set(expected_rules):
        fail(f"live ruleset rule types mismatch: {sorted(actual_rules)}")

    for simple_type in ("deletion", "non_fast_forward"):
        if actual_rules[simple_type].get("type") != simple_type:
            fail(f"live ruleset missing {simple_type}")

    expected_pull = expected_rules["pull_request"].get("parameters", {})
    actual_pull = actual_rules["pull_request"].get("parameters", {})
    for key, value in expected_pull.items():
        if actual_pull.get(key) != value:
            fail(f"live pull_request parameter mismatch for {key}")

    expected_status = expected_rules["required_status_checks"].get("parameters", {})
    actual_status = actual_rules["required_status_checks"].get("parameters", {})
    for key in ("do_not_enforce_on_create", "strict_required_status_checks_policy"):
        if actual_status.get(key) != expected_status.get(key):
            fail(f"live required_status_checks parameter mismatch for {key}")
    if actual_status.get("required_status_checks") != expected_status.get("required_status_checks"):
        fail("live required status check set or source binding mismatch")


def main() -> None:
    token = os.environ.get("GITHUB_ADMIN_TOKEN", "").strip()
    repository = os.environ.get("GITHUB_REPOSITORY", "").strip()
    if not token:
        fail("GITHUB_ADMIN_TOKEN is required; use a fine-grained token with repository Administration: write")
    if not repository or repository.count("/") != 1:
        fail("GITHUB_REPOSITORY must be set to owner/repo")

    try:
        expected = json.loads(SPEC_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        fail(f"cannot read ruleset spec: {exc}")

    owner, repo = repository.split("/", 1)
    base = f"https://api.github.com/repos/{urllib.parse.quote(owner)}/{urllib.parse.quote(repo)}"
    rulesets = request("GET", f"{base}/rulesets?includes_parents=false", token)
    if not isinstance(rulesets, list):
        fail("unexpected rulesets response")

    matches = [
        item
        for item in rulesets
        if isinstance(item, dict)
        and item.get("name") == expected["name"]
        and item.get("source_type") == "Repository"
    ]
    if len(matches) > 1:
        fail(f"multiple repository rulesets named {expected['name']} exist")

    if matches:
        ruleset_id = matches[0].get("id")
        if not isinstance(ruleset_id, int):
            fail("existing ruleset has no numeric id")
        request("PUT", f"{base}/rulesets/{ruleset_id}", token, expected)
        action = "updated"
    else:
        created = request("POST", f"{base}/rulesets", token, expected)
        ruleset_id = created.get("id") if isinstance(created, dict) else None
        if not isinstance(ruleset_id, int):
            fail("created ruleset response has no numeric id")
        action = "created"

    live = request("GET", f"{base}/rulesets/{ruleset_id}?includes_parents=false", token)
    if not isinstance(live, dict):
        fail("unexpected live ruleset response")
    verify_ruleset(live, expected)

    effective_rules = request("GET", f"{base}/rules/branches/main", token)
    if not isinstance(effective_rules, list):
        fail("unexpected effective branch rules response")
    effective_types = {entry.get("type") for entry in effective_rules if isinstance(entry, dict)}
    expected_types = {"deletion", "non_fast_forward", "pull_request", "required_status_checks"}
    missing = sorted(expected_types - effective_types)
    if missing:
        fail(f"main is missing effective rules: {missing}")

    status_rule = next(rule for rule in expected["rules"] if rule["type"] == "required_status_checks")
    evidence_dir = ROOT / "artifacts" / "repository-governance"
    evidence_dir.mkdir(parents=True, exist_ok=True)
    evidence = {
        "repository": repository,
        "branch": "main",
        "ruleset_id": ruleset_id,
        "ruleset_name": expected["name"],
        "enforcement": live.get("enforcement"),
        "effective_rule_types": sorted(effective_types),
        "required_status_checks": [
            item["context"] for item in status_rule["parameters"]["required_status_checks"]
        ],
        "required_check_integration_id": 15368,
        "strict_required_status_checks_policy": True,
        "review_approval_count": "organization-policy-not-defined",
        "action": action,
    }
    (evidence_dir / "live-enforcement.json").write_text(
        json.dumps(evidence, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(f"repository ruleset {action} and live enforcement verified: id={ruleset_id}")


if __name__ == "__main__":
    main()
