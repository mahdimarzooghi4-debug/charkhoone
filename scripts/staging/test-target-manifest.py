#!/usr/bin/env python3
"""Offline fixtures for the staging target manifest contract."""

from __future__ import annotations

import copy
import json
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[2]
VERIFIER = ROOT / "scripts/staging/verify-target-manifest.py"


def base_manifest() -> dict:
    return {
        "schema_version": 1,
        "environment": "staging",
        "database": {
            "provider": "fixture-db",
            "scope_id": "workspace-a",
            "resource_id": "postgres-cluster-a",
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
            "resource_id": "api-service-a",
            "base_url": "https://api.staging.example.invalid/",
        },
        "worker": {
            "provider": "fixture-compute",
            "scope_id": "workspace-a",
            "resource_id": "worker-service-a",
            "health_url": "https://worker.staging.example.invalid/health/live",
        },
    }


def run_manifest(path: Path, expect_success: bool = True) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        ["python3", str(VERIFIER), str(path)],
        cwd=ROOT,
        text=True,
        capture_output=True,
        timeout=10,
    )
    if expect_success:
        assert result.returncode == 0, result.stderr
    else:
        assert result.returncode != 0, result.stdout
    return result


def fingerprint(result: subprocess.CompletedProcess[str]) -> str:
    records = dict(line.split("=", 1) for line in result.stdout.splitlines() if "=" in line)
    value = records.get("staging_target_binding_sha256", "")
    assert len(value) == 64 and all(ch in "0123456789abcdef" for ch in value)
    return value


with tempfile.TemporaryDirectory(prefix="charkhoone-target-manifest-") as raw:
    temp = Path(raw)
    first = temp / "first.json"
    first.write_text(json.dumps(base_manifest(), indent=2), encoding="utf-8")
    first_result = run_manifest(first)
    first_hash = fingerprint(first_result)
    assert "api_base_url=https://api.staging.example.invalid" in first_result.stdout
    assert "worker_health_url=https://worker.staging.example.invalid/health/live" in first_result.stdout

    reordered = temp / "reordered.json"
    reordered.write_text(
        json.dumps(base_manifest(), sort_keys=True, separators=(",", ":")),
        encoding="utf-8",
    )
    assert fingerprint(run_manifest(reordered)) == first_hash

    changed = base_manifest()
    changed["worker"]["resource_id"] = "worker-service-b"
    changed_path = temp / "changed.json"
    changed_path.write_text(json.dumps(changed), encoding="utf-8")
    assert fingerprint(run_manifest(changed_path)) != first_hash

    invalid_cases = []

    production = base_manifest()
    production["environment"] = "production"
    invalid_cases.append(production)

    extra_key = base_manifest()
    extra_key["secret"] = "must-not-be-accepted"
    invalid_cases.append(extra_key)

    api_http = base_manifest()
    api_http["api"]["base_url"] = "http://api.example.invalid"
    invalid_cases.append(api_http)

    api_credentials = base_manifest()
    api_credentials["api"]["base_url"] = "https://user:pass@api.example.invalid"
    invalid_cases.append(api_credentials)

    worker_remote_http = base_manifest()
    worker_remote_http["worker"]["health_url"] = "http://worker.example.invalid/health/live"
    invalid_cases.append(worker_remote_http)

    worker_query = base_manifest()
    worker_query["worker"]["health_url"] = "https://worker.example.invalid/health/live?token=no"
    invalid_cases.append(worker_query)

    connection_string_resource = base_manifest()
    connection_string_resource["database"]["resource_id"] = "postgres://user:pass@host/db"
    invalid_cases.append(connection_string_resource)

    for index, manifest in enumerate(invalid_cases):
        path = temp / f"invalid-{index}.json"
        path.write_text(json.dumps(manifest), encoding="utf-8")
        run_manifest(path, expect_success=False)

print("Staging target manifest fixtures passed; provider_contacted=no; staging_contacted=no; production_contacted=no")
