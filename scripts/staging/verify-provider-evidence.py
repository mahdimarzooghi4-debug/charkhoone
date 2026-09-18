#!/usr/bin/env python3
"""Bind operator-supplied provider evidence to one declared staging target."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import re
from pathlib import Path

HASH_RE = re.compile(r"^[0-9a-f]{64}$")
GIT_SHA_RE = re.compile(r"^[0-9a-f]{40}$")
PROVIDER_RE = re.compile(r"^[a-z0-9][a-z0-9._-]{0,63}$")
BASE_KEYS = {
    "schema_version",
    "environment",
    "evidence_kind",
    "staging_target_binding_sha256",
    "provider",
    "scope_id",
    "resource_id",
    "raw_evidence_sha256",
}
KINDS = {"database-backup", "database-restore", "worker-deployment"}


def fail(message: str) -> "NoReturn":
    raise SystemExit(message)


def sha256_file(path: Path) -> str:
    try:
        with path.open("rb") as handle:
            digest = hashlib.sha256()
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                digest.update(chunk)
    except OSError as exc:
        fail(f"Could not read evidence file: {exc}")
    return digest.hexdigest()


def load_target_module():
    path = Path(__file__).with_name("verify-target-manifest.py")
    spec = importlib.util.spec_from_file_location("charkhoone_target_manifest", path)
    if spec is None or spec.loader is None:
        fail("Could not load staging target manifest verifier.")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def canonical_target_hash(normalized: dict[str, object]) -> str:
    canonical = json.dumps(
        normalized,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=True,
    ).encode("ascii")
    return hashlib.sha256(canonical).hexdigest()


def require_identifier(value: object, field: str) -> str:
    if not isinstance(value, str):
        fail(f"{field} must be a string.")
    normalized = value.strip()
    if normalized != value or not normalized or len(normalized) > 256:
        fail(f"{field} must contain 1-256 characters without surrounding whitespace.")
    if any(ord(ch) < 32 or ord(ch) == 127 for ch in normalized):
        fail(f"{field} must not contain control characters.")
    if "://" in normalized:
        fail(f"{field} must be an identifier, not a URL or connection string.")
    return normalized


def load_metadata(path: Path, expected_kind: str) -> dict[str, str | int]:
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        fail(f"Could not read valid UTF-8 provider evidence metadata JSON: {exc}")
    if not isinstance(raw, dict):
        fail("Provider evidence metadata must be a JSON object.")

    expected_keys = set(BASE_KEYS)
    if expected_kind == "worker-deployment":
        expected_keys.add("git_sha")
    if set(raw) != expected_keys:
        missing = sorted(expected_keys - set(raw))
        extra = sorted(set(raw) - expected_keys)
        fail(f"Provider evidence metadata keys are invalid; missing={missing}, extra={extra}.")

    if raw.get("schema_version") != 1:
        fail("Provider evidence metadata schema_version must equal 1.")
    if raw.get("environment") != "staging":
        fail("Provider evidence metadata environment must equal staging.")
    if raw.get("evidence_kind") != expected_kind:
        fail("Provider evidence metadata kind does not match the requested evidence kind.")

    provider = raw.get("provider")
    if not isinstance(provider, str) or not PROVIDER_RE.fullmatch(provider):
        fail("Provider evidence metadata provider is invalid.")
    scope_id = require_identifier(raw.get("scope_id"), "scope_id")
    resource_id = require_identifier(raw.get("resource_id"), "resource_id")

    target_hash = raw.get("staging_target_binding_sha256")
    raw_hash = raw.get("raw_evidence_sha256")
    if not isinstance(target_hash, str) or not HASH_RE.fullmatch(target_hash):
        fail("staging_target_binding_sha256 must be a lowercase SHA-256 value.")
    if not isinstance(raw_hash, str) or not HASH_RE.fullmatch(raw_hash):
        fail("raw_evidence_sha256 must be a lowercase SHA-256 value.")

    result: dict[str, str | int] = dict(raw)
    result["scope_id"] = scope_id
    result["resource_id"] = resource_id
    if expected_kind == "worker-deployment":
        git_sha = raw.get("git_sha")
        if not isinstance(git_sha, str) or not GIT_SHA_RE.fullmatch(git_sha):
            fail("Worker deployment metadata git_sha must be a full lowercase 40-character git SHA.")
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--metadata", required=True, type=Path)
    parser.add_argument("--raw-evidence", required=True, type=Path)
    parser.add_argument("--kind", required=True, choices=sorted(KINDS))
    parser.add_argument("--expected-git-sha")
    args = parser.parse_args()

    if not args.raw_evidence.is_file() or args.raw_evidence.stat().st_size == 0:
        fail("Raw provider evidence is missing or empty.")
    if not args.metadata.is_file() or args.metadata.stat().st_size == 0:
        fail("Provider evidence metadata is missing or empty.")

    target_module = load_target_module()
    normalized = target_module.load_and_normalize(args.manifest)
    target_hash = canonical_target_hash(normalized)
    metadata = load_metadata(args.metadata, args.kind)

    component_name = "worker" if args.kind == "worker-deployment" else "database"
    component = normalized[component_name]
    assert isinstance(component, dict)

    if metadata["staging_target_binding_sha256"] != target_hash:
        fail("Provider evidence metadata target fingerprint does not match the staging target manifest.")
    if (
        metadata["provider"] != component["provider"]
        or metadata["scope_id"] != component["scope_id"]
        or metadata["resource_id"] != component["resource_id"]
    ):
        fail("Provider evidence metadata component identity does not match the staging target manifest.")

    raw_hash = sha256_file(args.raw_evidence)
    if metadata["raw_evidence_sha256"] != raw_hash:
        fail("Provider evidence metadata does not hash-bind to the supplied raw evidence file.")

    metadata_hash = sha256_file(args.metadata)

    if args.kind == "worker-deployment":
        expected_git_sha = (args.expected_git_sha or "").lower()
        if not GIT_SHA_RE.fullmatch(expected_git_sha):
            fail("--expected-git-sha is required for worker-deployment and must be a full git SHA.")
        if metadata["git_sha"] != expected_git_sha:
            fail("Worker deployment metadata git SHA does not match the expected release SHA.")
        print("provider_evidence_git_sha=matched")

    print(f"provider_evidence_kind={args.kind}")
    print(f"provider_evidence_target_binding_sha256={target_hash}")
    print("provider_evidence_component_identity=matched")
    print(f"provider_evidence_raw_sha256={raw_hash}")
    print(f"provider_evidence_metadata_sha256={metadata_hash}")


if __name__ == "__main__":
    main()
