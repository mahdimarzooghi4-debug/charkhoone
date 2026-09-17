#!/usr/bin/env python3
from __future__ import annotations

import argparse
import pathlib
import re
import sys

SHA_RE = re.compile(r"^[0-9a-f]{40}$")


def parse_summary(path: pathlib.Path) -> dict[str, str]:
    if not path.is_file() or path.stat().st_size == 0:
        raise ValueError(f"required summary is missing or empty: {path}")
    values: dict[str, str] = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values


def require(values: dict[str, str], key: str, expected: str, label: str) -> None:
    actual = values.get(key)
    if actual != expected:
        raise ValueError(f"{label}: {key} must be {expected!r}, got {actual!r}")


def require_file(path: pathlib.Path, label: str) -> None:
    if not path.is_file() or path.stat().st_size == 0:
        raise ValueError(f"{label} is missing or empty: {path}")


def require_sha_evidence(path: pathlib.Path, expected_sha: str, label: str) -> None:
    require_file(path, label)
    text = path.read_text(encoding="utf-8", errors="replace")
    if expected_sha not in text:
        raise ValueError(f"{label} does not contain the expected release SHA")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Verify Charkhoone staging/CI release-gate evidence without making a promotion decision."
    )
    parser.add_argument("--environment", choices=("staging", "ci"), required=True)
    parser.add_argument("--expected-sha", required=True)
    parser.add_argument("--database-rehearsal-dir", type=pathlib.Path, required=True)
    parser.add_argument("--application-summary", type=pathlib.Path, required=True)
    parser.add_argument("--api-release-evidence", type=pathlib.Path, required=True)
    parser.add_argument("--worker-release-evidence", type=pathlib.Path, required=True)
    args = parser.parse_args()

    if not SHA_RE.fullmatch(args.expected_sha):
        print("expected SHA must be a lowercase 40-character git SHA", file=sys.stderr)
        return 2

    try:
        db_summary_path = args.database_rehearsal_dir / "summary.txt"
        db = parse_summary(db_summary_path)
        app = parse_summary(args.application_summary)

        require(db, "environment", args.environment, "database rehearsal")
        require(db, "git_sha", args.expected_sha, "database rehearsal")
        require(db, "migration_runtime_roles_distinct", "true", "database rehearsal")
        require(db, "migration_runtime_database_name_match", "true", "database rehearsal")
        require(db, "pre_migration_runtime_role", "passed", "database rehearsal")
        require(db, "provider_backup_evidence", "operator-supplied-hash-recorded", "database rehearsal")
        require(db, "provider_restore_evidence", "operator-supplied-hash-recorded", "database rehearsal")
        require(db, "migration", "completed", "database rehearsal")
        require(db, "post_migration_readiness", "passed", "database rehearsal")
        require(
            db,
            "query_plan_evidence",
            "captured-on-operator-confirmed-representative-dataset",
            "database rehearsal",
        )
        require(db, "promotion_decision", "not-made-by-script", "database rehearsal")

        for name in (
            "provider-backup-evidence.sha256",
            "provider-restore-evidence.sha256",
            "migrations-idempotent.sha256",
            "migrations-after.txt",
        ):
            require_file(args.database_rehearsal_dir / name, f"database rehearsal {name}")

        require(app, "environment", args.environment, "application smoke")
        require(app, "git_sha", args.expected_sha, "application smoke")
        require(app, "api_liveness", "passed", "application smoke")
        require(app, "api_readiness", "passed", "application smoke")
        require(app, "api_descriptor", "passed", "application smoke")
        require(app, "unauthenticated_contract_rejected", "passed", "application smoke")
        require(app, "authenticated_contract_read", "passed", "application smoke")
        require(app, "authenticated_contract_audit_read", "passed", "application smoke")
        require(app, "api_release_evidence", "hash-recorded-and-sha-matched", "application smoke")
        require(app, "worker_release_evidence", "hash-recorded-and-sha-matched", "application smoke")
        require(app, "response_bodies_persisted", "false", "application smoke")
        require(app, "promotion_decision", "not-made-by-script", "application smoke")

        require_sha_evidence(args.api_release_evidence, args.expected_sha, "API release evidence")
        require_sha_evidence(args.worker_release_evidence, args.expected_sha, "Worker release evidence")
    except ValueError as exc:
        print(f"release gate blocked: {exc}", file=sys.stderr)
        return 1

    print(
        f"release gate evidence verified for environment={args.environment} sha={args.expected_sha}; "
        "promotion decision remains external"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
