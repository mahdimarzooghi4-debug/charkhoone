#!/usr/bin/env python3
"""Validate and canonically fingerprint a non-secret staging target manifest."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

PROVIDER_RE = re.compile(r"^[a-z0-9][a-z0-9._-]{0,63}$")
COMPONENT_KEYS = {"provider", "scope_id", "resource_id"}
TOP_LEVEL_KEYS = {"schema_version", "environment", "database", "message_broker", "api", "worker"}


def fail(message: str) -> "NoReturn":
    raise SystemExit(message)


def require_plain_identifier(value: object, field: str) -> str:
    if not isinstance(value, str):
        fail(f"{field} must be a string.")
    normalized = value.strip()
    if not normalized or len(normalized) > 256:
        fail(f"{field} must contain 1-256 non-whitespace characters.")
    if normalized != value or any(ord(ch) < 32 or ord(ch) == 127 for ch in normalized):
        fail(f"{field} must not contain surrounding whitespace or control characters.")
    if "://" in normalized:
        fail(f"{field} must be a provider identifier, not a URL or connection string.")
    return normalized


def validate_component(value: object, field: str, extra_keys: set[str] | None = None) -> dict[str, str]:
    if not isinstance(value, dict):
        fail(f"{field} must be an object.")
    allowed = COMPONENT_KEYS | (extra_keys or set())
    if set(value) != allowed:
        missing = sorted(allowed - set(value))
        extra = sorted(set(value) - allowed)
        fail(f"{field} keys are invalid; missing={missing}, extra={extra}.")
    provider = value.get("provider")
    if not isinstance(provider, str) or not PROVIDER_RE.fullmatch(provider):
        fail(f"{field}.provider must match {PROVIDER_RE.pattern}.")
    result = {
        "provider": provider,
        "scope_id": require_plain_identifier(value.get("scope_id"), f"{field}.scope_id"),
        "resource_id": require_plain_identifier(value.get("resource_id"), f"{field}.resource_id"),
    }
    for key in sorted(extra_keys or set()):
        extra_value = value.get(key)
        if not isinstance(extra_value, str):
            fail(f"{field}.{key} must be a string.")
        result[key] = extra_value
    return result


def normalize_api_base_url(raw: object) -> str:
    if not isinstance(raw, str):
        fail("api.base_url must be a string.")
    candidate = raw.strip()
    if candidate != raw:
        fail("api.base_url must not contain surrounding whitespace.")
    parsed = urlsplit(candidate)
    if parsed.scheme != "https" or not parsed.hostname:
        fail("api.base_url must be an HTTPS URL with a hostname.")
    if parsed.username is not None or parsed.password is not None:
        fail("api.base_url must not contain URL credentials.")
    if parsed.query or parsed.fragment:
        fail("api.base_url must not contain a query string or fragment.")
    path = parsed.path.rstrip("/")
    return urlunsplit((parsed.scheme, parsed.netloc, path, "", ""))


def normalize_worker_health_url(raw: object) -> str:
    if not isinstance(raw, str):
        fail("worker.health_url must be a string.")
    candidate = raw.strip()
    if candidate != raw:
        fail("worker.health_url must not contain surrounding whitespace.")
    parsed = urlsplit(candidate)
    if parsed.username is not None or parsed.password is not None:
        fail("worker.health_url must not contain URL credentials.")
    if parsed.query or parsed.fragment:
        fail("worker.health_url must not contain a query string or fragment.")
    if parsed.path != "/health/live":
        fail("worker.health_url path must be exactly /health/live.")
    if parsed.scheme == "https":
        if not parsed.hostname:
            fail("worker.health_url HTTPS URL must contain a hostname.")
    elif parsed.scheme == "http":
        if parsed.hostname not in {"127.0.0.1", "localhost", "::1"}:
            fail("Plain HTTP worker.health_url is allowed only on loopback.")
    else:
        fail("worker.health_url must use HTTPS, or HTTP only on loopback.")
    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, "", ""))


def load_and_normalize(path: Path) -> dict[str, object]:
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        fail(f"Could not read a valid UTF-8 JSON staging target manifest: {exc}")
    if not isinstance(raw, dict):
        fail("Staging target manifest must be a JSON object.")
    if set(raw) != TOP_LEVEL_KEYS:
        missing = sorted(TOP_LEVEL_KEYS - set(raw))
        extra = sorted(set(raw) - TOP_LEVEL_KEYS)
        fail(f"Top-level manifest keys are invalid; missing={missing}, extra={extra}.")
    if raw.get("schema_version") != 1:
        fail("schema_version must equal 1.")
    if raw.get("environment") != "staging":
        fail("environment must equal staging.")

    database = validate_component(raw["database"], "database", {"database_name"})
    broker = validate_component(raw["message_broker"], "message_broker")
    api = validate_component(raw["api"], "api", {"base_url"})
    worker = validate_component(raw["worker"], "worker", {"health_url"})
    database["database_name"] = require_plain_identifier(database["database_name"], "database.database_name")
    api["base_url"] = normalize_api_base_url(api["base_url"])
    worker["health_url"] = normalize_worker_health_url(worker["health_url"])

    return {
        "schema_version": 1,
        "environment": "staging",
        "database": database,
        "message_broker": broker,
        "api": api,
        "worker": worker,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest", type=Path)
    args = parser.parse_args()

    normalized = load_and_normalize(args.manifest)
    canonical = json.dumps(normalized, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("ascii")
    fingerprint = hashlib.sha256(canonical).hexdigest()

    print(f"staging_target_binding_sha256={fingerprint}")
    print(f"database_name={normalized['database']['database_name']}")
    print(f"api_base_url={normalized['api']['base_url']}")
    print(f"worker_health_url={normalized['worker']['health_url']}")


if __name__ == "__main__":
    main()
