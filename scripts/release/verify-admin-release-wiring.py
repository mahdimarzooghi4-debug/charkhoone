#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
COMPOSE = ROOT / "deploy" / "compose.release.yaml"
NGINX = ROOT / "deploy" / "nginx" / "charkhoone.conf"
RELEASE_ENV = ROOT / "deploy" / "release.env.example"
WEB_ENV = ROOT / "apps" / "web" / ".env.example"

failures: list[str] = []


def require(condition: bool, message: str) -> None:
    if not condition:
        failures.append(message)


def read(path: Path) -> str:
    if not path.is_file():
        failures.append(f"missing required file: {path.relative_to(ROOT)}")
        return ""
    return path.read_text(encoding="utf-8")


compose = read(COMPOSE)
nginx = read(NGINX)
release_env = read(RELEASE_ENV)
web_env = read(WEB_ENV)

required_compose_tokens = [
    'PilotOperations__Enabled: ${CHARKHOONE_PILOT_OPERATIONS_ENABLED:-false}',
    'PilotOperations__AllowedSubjects__0: ${CHARKHOONE_PILOT_OPERATOR_SUBJECT_0:-}',
    'PilotOperations__AllowedSubjects__1: ${CHARKHOONE_PILOT_OPERATOR_SUBJECT_1:-}',
    'PilotOperations__AllowedSubjects__2: ${CHARKHOONE_PILOT_OPERATOR_SUBJECT_2:-}',
    'PilotOperations__AllowedSubjects__3: ${CHARKHOONE_PILOT_OPERATOR_SUBJECT_3:-}',
    'CHARKHOONE_API_BASE_URL: http://api:8080',
    'CHARKHOONE_ADMIN_OIDC_LOGIN_URL: ${CHARKHOONE_ADMIN_OIDC_LOGIN_URL:?set the HTTPS admin OIDC login URL}',
]
for token in required_compose_tokens:
    require(token in compose, f"release compose missing admin wiring token: {token}")

require(
    "NEXT_PUBLIC_API_BASE_URL" not in compose,
    "release compose must not expose the admin API origin through NEXT_PUBLIC_API_BASE_URL",
)
require(
    "CHARKHOONE_API_BASE_URL: http://api:8080" in compose,
    "admin web must use the internal API service origin",
)

authorization_forward = "proxy_set_header Authorization $http_authorization;"
require(
    nginx.count(authorization_forward) >= 2,
    "nginx must explicitly forward Authorization to both API and Web upstreams",
)
require(
    "proxy_pass http://api:8080;" in nginx and "proxy_pass http://web:3000;" in nginx,
    "nginx upstream boundaries must remain API=api:8080 and Web=web:3000",
)

required_release_env = [
    "CHARKHOONE_ADMIN_OIDC_LOGIN_URL=",
    "CHARKHOONE_PILOT_OPERATIONS_ENABLED=false",
    "CHARKHOONE_PILOT_OPERATOR_SUBJECT_0=",
    "CHARKHOONE_PILOT_OPERATOR_SUBJECT_1=",
    "CHARKHOONE_PILOT_OPERATOR_SUBJECT_2=",
    "CHARKHOONE_PILOT_OPERATOR_SUBJECT_3=",
]
for token in required_release_env:
    require(token in release_env, f"release env example missing token: {token}")

require(
    "NEXT_PUBLIC_" not in web_env,
    "admin runtime variables must remain server-only in apps/web/.env.example",
)
require(
    "CHARKHOONE_API_BASE_URL=" in web_env,
    "web env example must document CHARKHOONE_API_BASE_URL",
)
require(
    "CHARKHOONE_ADMIN_OIDC_LOGIN_URL=" in web_env,
    "web env example must document CHARKHOONE_ADMIN_OIDC_LOGIN_URL",
)

for prohibited in (
    "Bearer ey",
    "client_secret=",
    "CHARKHOONE_PILOT_OPERATIONS_ENABLED=true",
):
    require(
        prohibited not in release_env,
        f"release env example must not contain enabled/credential-like production values: {prohibited}",
    )

if failures:
    for failure in failures:
        print(f"admin release wiring verification failed: {failure}", file=sys.stderr)
    raise SystemExit(1)

print("admin release wiring contract verified")
