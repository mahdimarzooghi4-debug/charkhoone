#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APPS = ("web", "mobile")
LOCK_ROOT_KEYS = (
    "name",
    "version",
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
    "engines",
)
EXPECTED_NODE_VERSION = "22.13.1"
TEMP_RESOLVER = ROOT / ".github/workflows/resolve-mobile-lock.yml"


def fail(message: str) -> None:
    print(f"node dependency lock verification failed: {message}", file=sys.stderr)
    raise SystemExit(1)


def load_json(path: Path) -> dict:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        fail(f"missing required file: {path.relative_to(ROOT)}")
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path.relative_to(ROOT)}: {exc}")
    if not isinstance(value, dict):
        fail(f"expected JSON object in {path.relative_to(ROOT)}")
    return value


def verify_manifest_lock_pair(app: str) -> str:
    app_dir = ROOT / "apps" / app
    package_path = app_dir / "package.json"
    lock_path = app_dir / "package-lock.json"
    package = load_json(package_path)
    lock = load_json(lock_path)

    if lock.get("lockfileVersion") != 3:
        fail(f"apps/{app}/package-lock.json must use lockfileVersion 3")
    packages = lock.get("packages")
    if not isinstance(packages, dict) or not isinstance(packages.get(""), dict):
        fail(f"apps/{app}/package-lock.json is missing packages[''] metadata")
    lock_root = packages[""]

    for key in LOCK_ROOT_KEYS:
        manifest_value = package.get(key)
        lock_value = lock_root.get(key)
        if manifest_value is None:
            if lock_value not in (None, {}):
                fail(f"apps/{app}: package-lock root unexpectedly defines {key}")
        elif lock_value != manifest_value:
            fail(f"apps/{app}: package.json and package-lock.json disagree on {key}")

    digest = hashlib.sha256(lock_path.read_bytes()).hexdigest()
    return digest


def verify_install_surfaces() -> None:
    workflows_dir = ROOT / ".github/workflows"
    if TEMP_RESOLVER.exists():
        fail("temporary resolve-mobile-lock workflow must not remain in the final tree")

    workflow_paths = sorted(workflows_dir.glob("*.yml")) + sorted(workflows_dir.glob("*.yaml"))
    for path in workflow_paths:
        text = path.read_text(encoding="utf-8")
        if re.search(r"\bnpm\s+install\b", text):
            fail(f"mutable npm install found in workflow {path.relative_to(ROOT)}")
        if "legacy-peer-deps" in text:
            fail(f"legacy peer dependency bypass found in workflow {path.relative_to(ROOT)}")

    ci_path = workflows_dir / "ci.yml"
    ci_text = ci_path.read_text(encoding="utf-8")
    if ci_text.count("run: npm ci --no-audit --no-fund") < 2:
        fail("ci.yml must use npm ci for both web and mobile installs")
    if ci_text.count(f"node-version: {EXPECTED_NODE_VERSION}") < 2:
        fail(f"ci.yml must pin web and mobile Node to {EXPECTED_NODE_VERSION}")

    dockerfiles = sorted(ROOT.rglob("Dockerfile"))
    for path in dockerfiles:
        text = path.read_text(encoding="utf-8")
        if re.search(r"\bnpm\s+install\b", text):
            fail(f"mutable npm install found in Dockerfile {path.relative_to(ROOT)}")
        if "legacy-peer-deps" in text:
            fail(f"legacy peer dependency bypass found in Dockerfile {path.relative_to(ROOT)}")

    web_dockerfile = ROOT / "apps/web/Dockerfile"
    if "RUN npm ci --no-audit --no-fund" not in web_dockerfile.read_text(encoding="utf-8"):
        fail("apps/web/Dockerfile must install from package-lock.json with npm ci")


def main() -> None:
    digests = {app: verify_manifest_lock_pair(app) for app in APPS}
    verify_install_surfaces()
    for app, digest in digests.items():
        print(f"apps/{app}/package-lock.json sha256={digest}")
    print("node dependency lock verification passed")


if __name__ == "__main__":
    main()
