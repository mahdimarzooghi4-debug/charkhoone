#!/usr/bin/env python3
"""Offline fixtures for provider-evidence identity binding."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[2]
VERIFY_TARGET = ROOT / "scripts/staging/verify-target-manifest.py"
VERIFY_PROVIDER = ROOT / "scripts/staging/verify-provider-evidence.py"
SHA = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip().lower()


def write_json(path: Path, value: dict) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=True), encoding="utf-8")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def target_manifest() -> dict:
    return {
        "schema_version": 1,
        "environment": "staging",
        "database": {
            "provider": "fixture-db",
            "scope_id": "workspace-a",
            "resource_id": "postgres-a",
            "database_name": "charkhoone_staging",
        },
        "message_broker": {
            "provider": "fixture-mq",
            "scope_id": "workspace-a",
            "resource_id": "rabbitmq-a",
        },
        "api": {
            "provider": "fixture-compute",
            "scope_id": "workspace-a",
            "resource_id": "api-a",
            "base_url": "https://api.staging.example.invalid",
        },
        "worker": {
            "provider": "fixture-compute",
            "scope_id": "workspace-a",
            "resource_id": "worker-a",
            "health_url": "https://worker.staging.example.invalid/health/live",
        },
    }


def target_hash(path: Path) -> str:
    result = subprocess.run(
        ["python3", str(VERIFY_TARGET), str(path)],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=True,
        timeout=10,
    )
    records = dict(line.split("=", 1) for line in result.stdout.splitlines() if "=" in line)
    return records["staging_target_binding_sha256"]


def metadata(kind: str, target: str, raw: Path) -> dict:
    component = target_manifest()["worker" if kind == "worker-deployment" else "database"]
    value = {
        "schema_version": 1,
        "environment": "staging",
        "evidence_kind": kind,
        "staging_target_binding_sha256": target,
        "provider": component["provider"],
        "scope_id": component["scope_id"],
        "resource_id": component["resource_id"],
        "raw_evidence_sha256": sha256(raw),
    }
    if kind == "worker-deployment":
        value["git_sha"] = SHA
    return value


def run(
    manifest: Path,
    meta: Path,
    raw: Path,
    kind: str,
    *,
    expect_success: bool,
    expected_git_sha: str | None = None,
) -> subprocess.CompletedProcess[str]:
    command = [
        "python3",
        str(VERIFY_PROVIDER),
        "--manifest",
        str(manifest),
        "--metadata",
        str(meta),
        "--raw-evidence",
        str(raw),
        "--kind",
        kind,
    ]
    if expected_git_sha is not None:
        command += ["--expected-git-sha", expected_git_sha]
    result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True, timeout=10)
    if expect_success:
        assert result.returncode == 0, result.stderr
        assert "provider_evidence_component_identity=matched" in result.stdout
        assert f"provider_evidence_raw_sha256={sha256(raw)}" in result.stdout
        assert "provider_evidence_metadata_sha256=" in result.stdout
    else:
        assert result.returncode != 0, result.stdout
    return result


with tempfile.TemporaryDirectory(prefix="charkhoone-provider-evidence-") as raw_temp:
    temp = Path(raw_temp)
    manifest = temp / "target.json"
    write_json(manifest, target_manifest())
    binding = target_hash(manifest)

    for kind in ("database-backup", "database-restore", "worker-deployment"):
        raw_file = temp / f"{kind}.txt"
        raw_file.write_text(f"synthetic {kind} provider evidence\n", encoding="utf-8")
        meta_file = temp / f"{kind}.json"
        good = metadata(kind, binding, raw_file)
        write_json(meta_file, good)

        git_sha = SHA if kind == "worker-deployment" else None
        result = run(
            manifest,
            meta_file,
            raw_file,
            kind,
            expect_success=True,
            expected_git_sha=git_sha,
        )
        if kind == "worker-deployment":
            assert "provider_evidence_git_sha=matched" in result.stdout

        wrong_target = dict(good)
        wrong_target["staging_target_binding_sha256"] = "b" * 64
        write_json(meta_file, wrong_target)
        run(manifest, meta_file, raw_file, kind, expect_success=False, expected_git_sha=git_sha)

        wrong_resource = dict(good)
        wrong_resource["resource_id"] = "different-resource"
        write_json(meta_file, wrong_resource)
        run(manifest, meta_file, raw_file, kind, expect_success=False, expected_git_sha=git_sha)

        write_json(meta_file, good)
        raw_file.write_text(f"tampered synthetic {kind} provider evidence\n", encoding="utf-8")
        run(manifest, meta_file, raw_file, kind, expect_success=False, expected_git_sha=git_sha)
        raw_file.write_text(f"synthetic {kind} provider evidence\n", encoding="utf-8")

        production = dict(good)
        production["environment"] = "production"
        write_json(meta_file, production)
        run(manifest, meta_file, raw_file, kind, expect_success=False, expected_git_sha=git_sha)

        extra_secret = dict(good)
        extra_secret["access_token"] = "must-not-be-accepted"
        write_json(meta_file, extra_secret)
        run(manifest, meta_file, raw_file, kind, expect_success=False, expected_git_sha=git_sha)

        if kind == "worker-deployment":
            write_json(meta_file, good)
            run(
                manifest,
                meta_file,
                raw_file,
                kind,
                expect_success=False,
                expected_git_sha="0" * 40,
            )

print("Provider evidence identity fixtures passed; provider_contacted=no; staging_contacted=no; production_contacted=no")
