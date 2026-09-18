#!/usr/bin/env python3
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT = os.path.join(ROOT, "scripts", "pilot", "verify-cohort-target.py")

def run(connection: str, confirmation: str):
    env = dict(os.environ)
    env["CHARKHOONE_PILOT_POSTGRES"] = connection
    env["CHARKHOONE_PILOT_DATABASE_CONFIRMATION"] = confirmation
    return subprocess.run(
        [sys.executable, SCRIPT],
        cwd=ROOT,
        env=env,
        capture_output=True,
        text=True,
        check=False)

accepted = run(
    "Host=localhost;Port=5432;Database=charkhoone_pilot_demo;Username=postgres;Password=secret",
    "charkhoone_pilot_demo")
assert accepted.returncode == 0, accepted.stderr
assert "pilot_database_guard=passed" in accepted.stdout
assert "Password=secret" not in accepted.stdout

accepted_uri = run(
    "postgresql://user:secret@localhost:5432/charkhoone_pilot_uri",
    "charkhoone_pilot_uri")
assert accepted_uri.returncode == 0, accepted_uri.stderr
assert "secret" not in accepted_uri.stdout

for connection, confirmation in [
    ("Host=localhost;Database=charkhoone;Username=postgres", "charkhoone"),
    ("Host=localhost;Database=charkhoone_integration;Username=postgres", "charkhoone_integration"),
    ("Host=localhost;Database=production;Username=postgres", "production"),
    ("Host=localhost;Database=charkhoone_pilot_safe;Username=postgres", "wrong_database"),
    ("Host=localhost;Username=postgres", "charkhoone_pilot_missing"),
]:
    rejected = run(connection, confirmation)
    assert rejected.returncode != 0, (connection, rejected.stdout)

print("Pilot cohort target guard fixtures passed; credentials were not emitted.")
