#!/usr/bin/env python3
"""Run the real smoke script with a local curl stand-in; never contact a provider."""
import fcntl
import hashlib
import json
import os
from pathlib import Path
import signal
import subprocess
import tempfile
import time

ROOT = Path(__file__).resolve().parents[2]
SHA = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
SMOKE = ["bash", "scripts/staging/application-release-smoke.sh"]

with tempfile.TemporaryDirectory(prefix="charkhoone-evidence-test-") as raw:
    temp = Path(raw)
    bin_dir = temp / "bin"
    bin_dir.mkdir()
    fake = bin_dir / "curl"
    fake.write_text('''#!/usr/bin/env python3
import json, os, pathlib, sys, time
args = sys.argv[1:]
assert args[args.index("--request") + 1] == "GET"
body = pathlib.Path(args[args.index("--output") + 1])
headers = pathlib.Path(args[args.index("--dump-header") + 1])
name = body.stem
scenario = os.environ.get("SMOKE_FIXTURE_SCENARIO", "success")
pathlib.Path(os.environ["SMOKE_FIXTURE_CURL_CALLED"]).touch()
if scenario == "hold" and name == "worker_health_live":
    pathlib.Path(os.environ["SMOKE_FIXTURE_WAITING"]).touch()
    while True: time.sleep(0.1)
if scenario == name: sys.exit(7)
headers.write_text("HTTP/1.1 200 OK\\r\\nX-Charkhoone-Release-Sha: " + os.environ["CHARKHOONE_EXPECTED_GIT_SHA"] + "\\r\\nX-Content-Type-Options: nosniff\\r\\nCache-Control: no-store\\r\\n\\r\\n")
if name == "worker_health_ready":
    body.write_text(json.dumps({
        "service": "Charkhoone.Worker",
        "status": "ready",
        "checks": {
            "postgres": "healthy",
            "rabbitmq": "healthy",
            "external-adapters": "healthy",
        },
    }))
else:
    body.write_text(json.dumps({"service": "Charkhoone.Worker", "status": "live"}))
sys.stdout.write("401" if name == "anonymous_contract" else "200")
''')
    fake.chmod(0o755)
    token = temp / "token"
    token.write_text("synthetic-not-a-real-token\n")
    target_manifest = temp / "target-manifest.json"
    target_manifest.write_text(json.dumps({
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
            "base_url": "https://api.invalid",
        },
        "worker": {
            "provider": "fixture-compute",
            "scope_id": "workspace-a",
            "resource_id": "worker-a",
            "health_url": "https://worker.invalid/health/live",
        },
    }), encoding="utf-8")
    target_output = subprocess.check_output(
        ["python3", "scripts/staging/verify-target-manifest.py", str(target_manifest)],
        cwd=ROOT, text=True)
    target_hash = dict(line.split("=", 1) for line in target_output.splitlines())["staging_target_binding_sha256"]
    database = temp / "database.txt"
    database.write_text(
        f"environment=staging\ngit_sha={SHA}\nstaging_target_binding_sha256={target_hash}\n"
        "staging_target_database_name_match=true\n"
        "provider_backup_evidence=identity-and-raw-hash-verified\n"
        f"provider_backup_raw_sha256={'a' * 64}\n"
        f"provider_backup_metadata_sha256={'b' * 64}\n"
        "provider_restore_evidence=identity-and-raw-hash-verified\n"
        f"provider_restore_raw_sha256={'c' * 64}\n"
        f"provider_restore_metadata_sha256={'d' * 64}\n"
        "migration=completed\npost_migration_readiness=passed\n")
    broker = temp / "broker.txt"
    broker.write_text("synthetic-message-broker-provider-evidence\n")
    broker_metadata = temp / "broker-metadata.json"
    broker_metadata.write_text(json.dumps({
        "schema_version": 1,
        "environment": "staging",
        "evidence_kind": "message-broker-deployment",
        "staging_target_binding_sha256": target_hash,
        "provider": "fixture-mq",
        "scope_id": "workspace-a",
        "resource_id": "rabbitmq-a",
        "raw_evidence_sha256": hashlib.sha256(broker.read_bytes()).hexdigest(),
    }), encoding="utf-8")
    worker = temp / "worker.txt"
    worker.write_text("synthetic-provider-evidence-only\n")
    worker_metadata = temp / "worker-metadata.json"
    worker_metadata.write_text(json.dumps({
        "schema_version": 1,
        "environment": "staging",
        "evidence_kind": "worker-deployment",
        "staging_target_binding_sha256": target_hash,
        "provider": "fixture-compute",
        "scope_id": "workspace-a",
        "resource_id": "worker-a",
        "raw_evidence_sha256": hashlib.sha256(worker.read_bytes()).hexdigest(),
        "git_sha": SHA.lower(),
    }), encoding="utf-8")
    output = temp / "evidence" / SHA
    env = dict(os.environ,
        PATH=str(bin_dir) + os.pathsep + os.environ["PATH"],
        CHARKHOONE_STAGING_API_BASE_URL="https://api.invalid",
        CHARKHOONE_STAGING_WORKER_HEALTH_URL="https://worker.invalid/health/live",
        CHARKHOONE_EXPECTED_GIT_SHA=SHA,
        CHARKHOONE_STAGING_ACCESS_TOKEN_FILE=str(token),
        CHARKHOONE_STAGING_CONTRACT_ID="11111111-1111-4111-8111-111111111111",
        CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY=str(database),
        CHARKHOONE_STAGING_MESSAGE_BROKER_EVIDENCE=str(broker),
        CHARKHOONE_STAGING_MESSAGE_BROKER_EVIDENCE_METADATA=str(broker_metadata),
        CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE=str(worker),
        CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE_METADATA=str(worker_metadata),
        CHARKHOONE_STAGING_WORKER_GIT_SHA=SHA,
        CHARKHOONE_STAGING_TARGET_MANIFEST=str(target_manifest),
        CHARKHOONE_ALLOW_STAGING_APPLICATION_SMOKE="true",
        CHARKHOONE_STAGING_EVIDENCE_DIR=str(output.parent),
        SMOKE_FIXTURE_WAITING=str(temp / "waiting"),
        SMOKE_FIXTURE_CURL_CALLED=str(temp / "curl-called"))

    def run(changes=None):
        return subprocess.run(SMOKE, cwd=ROOT, env=env | (changes or {}), capture_output=True, text=True, timeout=20)

    def success():
        result = run()
        assert result.returncode == 0, result.stderr
        assert (output / "summary.txt").is_file()
        assert len((output / "http-statuses.txt").read_text().splitlines()) == 8
        assert not list(output.glob(".attempt.*"))
        for file in output.iterdir():
            if file.is_file():
                assert "synthetic-not-a-real-token" not in file.read_text()

    for changes in [
        {"CHARKHOONE_STAGING_ACCESS_TOKEN_FILE": ""},
        {"SMOKE_FIXTURE_SCENARIO": "api_root"},
        {"SMOKE_FIXTURE_SCENARIO": "worker_health_live"},
        {"SMOKE_FIXTURE_SCENARIO": "worker_health_ready"},
        {"CHARKHOONE_STAGING_WORKER_GIT_SHA": "0" * 40},
        {"CHARKHOONE_STAGING_ACCESS_TOKEN_FILE": str(temp / "missing-token")},
        {"CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY": str(temp / "missing-summary")},
        {"CHARKHOONE_STAGING_TARGET_MANIFEST": str(temp / "missing-target-manifest")},
        {"CHARKHOONE_STAGING_MESSAGE_BROKER_EVIDENCE_METADATA": str(temp / "missing-broker-metadata")},
        {"CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE_METADATA": str(temp / "missing-worker-metadata")},
    ]:
        success()
        result = run(changes)
        assert result.returncode != 0
        assert not (output / "summary.txt").exists(), "Failed rerun retained prior completion"
        assert not list(output.glob(".attempt.*")), "Failed attempt was not cleaned"

    # Mismatched message broker provider metadata must be rejected before any HTTP request.
    success()
    wrong_broker_metadata = temp / "wrong-broker-metadata.json"
    wrong_broker_metadata.write_text(json.dumps({
        "schema_version": 1,
        "environment": "staging",
        "evidence_kind": "message-broker-deployment",
        "staging_target_binding_sha256": target_hash,
        "provider": "fixture-mq",
        "scope_id": "workspace-a",
        "resource_id": "other-broker",
        "raw_evidence_sha256": hashlib.sha256(broker.read_bytes()).hexdigest(),
    }), encoding="utf-8")
    curl_called = temp / "curl-called"
    curl_called.unlink(missing_ok=True)
    result = run({"CHARKHOONE_STAGING_MESSAGE_BROKER_EVIDENCE_METADATA": str(wrong_broker_metadata)})
    assert result.returncode != 0
    assert not curl_called.exists(), "Message broker provider mismatch reached curl instead of failing closed"
    assert not (output / "summary.txt").exists()
    assert not list(output.glob(".attempt.*"))

    # Mismatched Worker provider metadata must be rejected before any HTTP request.
    success()
    wrong_worker_metadata = temp / "wrong-worker-metadata.json"
    wrong_worker_metadata.write_text(json.dumps({
        "schema_version": 1,
        "environment": "staging",
        "evidence_kind": "worker-deployment",
        "staging_target_binding_sha256": target_hash,
        "provider": "fixture-compute",
        "scope_id": "workspace-a",
        "resource_id": "other-worker",
        "raw_evidence_sha256": hashlib.sha256(worker.read_bytes()).hexdigest(),
        "git_sha": SHA.lower(),
    }), encoding="utf-8")
    curl_called = temp / "curl-called"
    curl_called.unlink(missing_ok=True)
    result = run({"CHARKHOONE_STAGING_WORKER_DEPLOYMENT_EVIDENCE_METADATA": str(wrong_worker_metadata)})
    assert result.returncode != 0
    assert not curl_called.exists(), "Worker provider mismatch reached curl instead of failing closed"
    assert not (output / "summary.txt").exists()
    assert not list(output.glob(".attempt.*"))

    # A database rehearsal from another target must be rejected before any HTTP request.
    success()
    wrong_database = temp / "wrong-database-target.txt"
    wrong_database.write_text(
        f"environment=staging\ngit_sha={SHA}\nstaging_target_binding_sha256={'b' * 64}\n"
        "staging_target_database_name_match=true\n"
        "provider_backup_evidence=identity-and-raw-hash-verified\n"
        f"provider_backup_raw_sha256={'a' * 64}\n"
        f"provider_backup_metadata_sha256={'b' * 64}\n"
        "provider_restore_evidence=identity-and-raw-hash-verified\n"
        f"provider_restore_raw_sha256={'c' * 64}\n"
        f"provider_restore_metadata_sha256={'d' * 64}\n"
        "migration=completed\npost_migration_readiness=passed\n")
    curl_called = temp / "curl-called"
    curl_called.unlink(missing_ok=True)
    result = run({"CHARKHOONE_STAGING_DATABASE_REHEARSAL_SUMMARY": str(wrong_database)})
    assert result.returncode != 0
    assert not curl_called.exists(), "Target mismatch reached curl instead of failing closed"
    assert not (output / "summary.txt").exists()
    assert not list(output.glob(".attempt.*"))

    # A busy directory rejects the new attempt without invalidating an active reader's evidence.
    success()
    before = (output / "summary.txt").read_bytes()
    with (output / ".evidence.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_SH)
        result = run()
        assert result.returncode != 0 and "in use" in result.stderr
        assert (output / "summary.txt").read_bytes() == before

    # Terminate a late attempt. Its old completion was already invalidated.
    process = subprocess.Popen(SMOKE, cwd=ROOT, env=env | {"SMOKE_FIXTURE_SCENARIO": "hold"},
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE, start_new_session=True)
    try:
        deadline = time.monotonic() + 10
        while not (temp / "waiting").exists() and time.monotonic() < deadline:
            if process.poll() is not None: raise AssertionError(process.communicate())
            time.sleep(0.05)
        assert (temp / "waiting").exists(), "Fixture did not reach worker probe"
        assert not (output / "summary.txt").exists()
        os.killpg(process.pid, signal.SIGTERM)
        process.communicate(timeout=10)
        assert process.returncode != 0
        assert not (output / "summary.txt").exists()
        assert not list(output.glob(".attempt.*"))
    finally:
        if process.poll() is None:
            os.killpg(process.pid, signal.SIGKILL)
            process.communicate()
    success()

print("Evidence rerun, interrupted attempt, locking and token non-retention fixtures passed; staging_contacted=no; production_contacted=no")
