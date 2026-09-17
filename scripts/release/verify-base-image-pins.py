#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LOCK = ROOT / "deploy" / "base-images.lock"
EXPECTED_KEYS = {
    "DOTNET_SDK",
    "DOTNET_ASPNET",
    "DOTNET_RUNTIME",
    "NODE_BUILD",
    "WEB_NODE_RUNTIME",
    "NGINX_RUNTIME",
}
PINNED_REF = re.compile(r"^[^\s@]+(?::[^\s@]+)?@sha256:[0-9a-f]{64}$")


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
            fail(f"Malformed base-image lock line: {raw}")
        key, value = line.split("=", 1)
        if key in values:
            fail(f"Duplicate base-image lock key: {key}")
        if not PINNED_REF.fullmatch(value):
            fail(f"Base image {key} is not pinned by sha256 digest: {value}")
        values[key] = value

    if set(values) != EXPECTED_KEYS:
        fail(
            "Unexpected base-image lock keys: "
            f"expected={sorted(EXPECTED_KEYS)} actual={sorted(values)}"
        )
    return values


def dockerfile_from_refs(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    if re.search(r"^#\s*syntax=", text, flags=re.MULTILINE | re.IGNORECASE):
        fail(f"Mutable Dockerfile frontend directive is not allowed: {path.relative_to(ROOT)}")
    refs: list[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.upper().startswith("FROM "):
            parts = stripped.split()
            if len(parts) < 2:
                fail(f"Malformed FROM line in {path.relative_to(ROOT)}: {line}")
            refs.append(parts[1])
    for ref in refs:
        if not PINNED_REF.fullmatch(ref):
            fail(f"Unpinned FROM reference in {path.relative_to(ROOT)}: {ref}")
    return refs


def main() -> None:
    lock = load_lock()

    expected_dockerfiles = {
        ROOT / "src" / "Charkhoone.Api" / "Dockerfile": [
            lock["DOTNET_SDK"],
            lock["DOTNET_ASPNET"],
        ],
        ROOT / "src" / "Charkhoone.Worker" / "Dockerfile": [
            lock["DOTNET_SDK"],
            lock["DOTNET_RUNTIME"],
        ],
        ROOT / "apps" / "web" / "Dockerfile": [
            lock["NODE_BUILD"],
            lock["NODE_BUILD"],
            lock["WEB_NODE_RUNTIME"],
        ],
    }

    for path, expected in expected_dockerfiles.items():
        actual = dockerfile_from_refs(path)
        if actual != expected:
            fail(
                f"Base-image drift in {path.relative_to(ROOT)}: "
                f"expected={expected} actual={actual}"
            )

    compose = (ROOT / "deploy" / "compose.release.yaml").read_text(encoding="utf-8")
    expected_nginx = f"    image: {lock['NGINX_RUNTIME']}"
    if expected_nginx not in compose.splitlines():
        fail("Release Compose Nginx image does not match NGINX_RUNTIME lock entry")

    print("base-image-lock=valid")
    for key in sorted(lock):
        print(f"{key}={lock[key]}")


if __name__ == "__main__":
    main()
