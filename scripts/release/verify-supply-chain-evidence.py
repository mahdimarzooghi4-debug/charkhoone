#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LOCK = ROOT / "deploy" / "supply-chain-tools.lock"
WORKFLOW = ROOT / ".github" / "workflows" / "supply-chain-evidence.yml"
INSTALLER = ROOT / "scripts" / "release" / "install-supply-chain-tools.sh"
CAPTURE = ROOT / "scripts" / "release" / "capture-supply-chain-evidence.sh"
RUNTIME = ROOT / "scripts" / "release" / "verify-supply-chain-artifacts.py"
EXPECTED_KEYS = {
    "SYFT_VERSION",
    "SYFT_LINUX_AMD64_SHA256",
    "GRYPE_VERSION",
    "GRYPE_LINUX_AMD64_SHA256",
}
VERSION = re.compile(r"^[0-9]+\.[0-9]+\.[0-9]+$")
SHA256 = re.compile(r"^[0-9a-f]{64}$")


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def require(path: Path) -> str:
    if not path.is_file():
        fail(f"Missing required supply-chain file: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def load_lock() -> dict[str, str]:
    values: dict[str, str] = {}
    for raw in require(LOCK).splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            fail(f"Malformed supply-chain lock line: {raw}")
        key, value = line.split("=", 1)
        if key in values:
            fail(f"Duplicate supply-chain lock key: {key}")
        values[key] = value

    if set(values) != EXPECTED_KEYS:
        fail(
            "Unexpected supply-chain lock keys: "
            f"expected={sorted(EXPECTED_KEYS)} actual={sorted(values)}"
        )
    for key in ("SYFT_VERSION", "GRYPE_VERSION"):
        if not VERSION.fullmatch(values[key]):
            fail(f"{key} must be an exact semantic version")
    for key in ("SYFT_LINUX_AMD64_SHA256", "GRYPE_LINUX_AMD64_SHA256"):
        if not SHA256.fullmatch(values[key]):
            fail(f"{key} must be a lowercase SHA-256 digest")
    return values


def main() -> None:
    lock = load_lock()
    workflow = require(WORKFLOW)
    installer = require(INSTALLER)
    capture = require(CAPTURE)
    require(RUNTIME)

    if "permissions:\n  contents: read" not in workflow:
        fail("Supply-chain workflow must use read-only contents permission")
    for token in (
        "scripts/release/install-supply-chain-tools.sh",
        "scripts/release/capture-supply-chain-evidence.sh",
        "scripts/release/verify-supply-chain-evidence.py",
        "actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02",
        "if-no-files-found: error",
    ):
        if token not in workflow:
            fail(f"Supply-chain workflow missing contract: {token}")

    combined = "\n".join((workflow, installer, capture))
    for token in (
        "releases/latest",
        "/latest/",
        "get.anchore.io",
        "curl | sh",
        "curl|sh",
        "--legacy-peer-deps",
        "--fail-on",
        "--audit-level",
    ):
        if token in combined:
            fail(f"Forbidden mutable or policy-bypassing token: {token}")

    for token in (
        "https://github.com/anchore/${name}/releases/download/v${version}/",
        "sha256sum --check --status",
    ):
        if token not in installer:
            fail(f"Pinned installer missing contract: {token}")

    for token in (
        "npm sbom --sbom-format=cyclonedx --sbom-type=application",
        '"${BIN_DIR}/syft" "dir:${ROOT}/apps/mobile"',
        "mobile-source.cdx.json",
        "cyclonedx-json",
        "grype\" db update",
        "grype\" db status -o json",
        "GRYPE_DB_AUTO_UPDATE=false",
        "vulnerability_policy_gate=not-defined",
        "signed_attestation=not-claimed",
        "staging_contacted=no",
        "production_contacted=no",
    ):
        if token not in capture:
            fail(f"Capture script missing behavior: {token}")

    if "CHARKHOONE_RELEASE_SHA" not in capture or "git -C \"$ROOT\" rev-parse HEAD" not in capture:
        fail("Capture script must bind evidence to checked-out Git SHA")

    print("supply-chain-evidence-config=valid")
    print(f"syft_version={lock['SYFT_VERSION']}")
    print(f"grype_version={lock['GRYPE_VERSION']}")
    print("web_source_sbom=npm-cyclonedx")
    print("mobile_source_sbom=syft-lockfile-backed-install")
    print("vulnerability_policy_gate=not-defined")


if __name__ == "__main__":
    main()
