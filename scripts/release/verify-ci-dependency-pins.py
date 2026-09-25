#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LOCK = ROOT / "deploy" / "ci-dependencies.lock"
WORKFLOWS = ROOT / ".github" / "workflows"
TEMP_RESOLVER = WORKFLOWS / "resolve-ci-dependencies.yml"
EXPECTED_KEYS = {
    "ACTIONS_CHECKOUT",
    "ACTIONS_SETUP_DOTNET",
    "ACTIONS_SETUP_NODE",
    "ACTIONS_SETUP_JAVA",
    "ACTIONS_UPLOAD_ARTIFACT",
    "CI_POSTGRES",
}
ACTION_REF = re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+@[0-9a-f]{40}$")
POSTGRES_REF = re.compile(r"^postgres:17-alpine@sha256:[0-9a-f]{64}$")
USES = re.compile(r"^\s*-?\s*uses:\s*([^\s#]+)")
POSTGRES_IMAGE = re.compile(r"^\s*image:\s*(postgres:[^\s#]+)")


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def load_lock() -> dict[str, str]:
    values: dict[str, str] = {}
    for raw in LOCK.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            fail(f"Malformed CI dependency lock line: {raw}")
        key, value = line.split("=", 1)
        if key in values:
            fail(f"Duplicate CI dependency lock key: {key}")
        values[key] = value

    if set(values) != EXPECTED_KEYS:
        fail(
            "Unexpected CI dependency lock keys: "
            f"expected={sorted(EXPECTED_KEYS)} actual={sorted(values)}"
        )

    for key in sorted(EXPECTED_KEYS - {"CI_POSTGRES"}):
        if not ACTION_REF.fullmatch(values[key]):
            fail(f"Action {key} is not pinned to a full commit SHA: {values[key]}")
    if not POSTGRES_REF.fullmatch(values["CI_POSTGRES"]):
        fail(f"CI_POSTGRES is not pinned to the approved tag plus sha256 digest: {values['CI_POSTGRES']}")
    return values


def main() -> None:
    if TEMP_RESOLVER.exists():
        fail("Temporary write-enabled CI dependency resolver must not exist in the final tree")

    lock = load_lock()
    allowed_actions = {value for key, value in lock.items() if key.startswith("ACTIONS_")}
    seen_actions: set[str] = set()
    postgres_refs: list[tuple[Path, str]] = []

    workflow_paths = sorted(WORKFLOWS.glob("*.yml")) + sorted(WORKFLOWS.glob("*.yaml"))
    if not workflow_paths:
        fail("No GitHub Actions workflows found")

    for path in workflow_paths:
        for line in path.read_text(encoding="utf-8").splitlines():
            uses_match = USES.match(line)
            if uses_match:
                ref = uses_match.group(1)
                if ref.startswith("./"):
                    continue
                if not ACTION_REF.fullmatch(ref):
                    fail(f"Mutable or malformed external action in {path.relative_to(ROOT)}: {ref}")
                if ref not in allowed_actions:
                    fail(
                        f"External action is not represented by deploy/ci-dependencies.lock "
                        f"in {path.relative_to(ROOT)}: {ref}"
                    )
                seen_actions.add(ref)

            image_match = POSTGRES_IMAGE.match(line)
            if image_match:
                postgres_refs.append((path, image_match.group(1)))

    missing = allowed_actions - seen_actions
    if missing:
        fail(f"Locked actions are not used by any persistent workflow: {sorted(missing)}")

    if len(postgres_refs) != 1:
        fail(f"Expected exactly one PostgreSQL CI service image, found {len(postgres_refs)}")
    postgres_path, postgres_ref = postgres_refs[0]
    if postgres_ref != lock["CI_POSTGRES"]:
        fail(
            f"PostgreSQL CI service image drift in {postgres_path.relative_to(ROOT)}: "
            f"expected={lock['CI_POSTGRES']} actual={postgres_ref}"
        )

    print("ci-dependency-lock=valid")
    for key in sorted(lock):
        print(f"{key}={lock[key]}")


if __name__ == "__main__":
    main()
