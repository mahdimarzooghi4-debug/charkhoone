#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
failures: list[str] = []


def require(condition: bool, message: str) -> None:
    if not condition:
        failures.append(message)


def read(relative: str) -> str:
    path = ROOT / relative
    require(path.is_file(), f"missing required file: {relative}")
    return path.read_text(encoding="utf-8") if path.is_file() else ""


package = json.loads(read("apps/mobile/package.json"))
app_config = json.loads(read("apps/mobile/app.json"))
env_example = read("apps/mobile/.env.example")
auth = read("apps/mobile/src/auth/MobileAuthProvider.tsx")
runtime = read("apps/mobile/src/auth/runtimeConfig.ts")
api = read("apps/mobile/src/api/mobileApi.ts")

required_dependencies = {
    "expo-auth-session": "~57.0.12",
    "expo-crypto": "~57.0.3",
    "expo-secure-store": "~57.0.4",
    "expo-web-browser": "~57.0.3",
}
for name, version in required_dependencies.items():
    require(
        package.get("dependencies", {}).get(name) == version,
        f"mobile dependency {name} must be pinned to {version}",
    )

plugins = app_config.get("expo", {}).get("plugins", [])
require("expo-secure-store" in plugins, "expo-secure-store config plugin is required")
require(
    app_config.get("expo", {}).get("scheme") == "charkhoone",
    "mobile OIDC redirect scheme must remain charkhoone",
)

for key in (
    "EXPO_PUBLIC_CHARKHOONE_API_BASE_URL=",
    "EXPO_PUBLIC_CHARKHOONE_OIDC_ISSUER=",
    "EXPO_PUBLIC_CHARKHOONE_OIDC_CLIENT_ID=",
    "EXPO_PUBLIC_CHARKHOONE_OIDC_AUDIENCE=",
):
    require(key in env_example, f"mobile env example missing {key}")

for prohibited in (
    "CLIENT_SECRET",
    "client_secret=",
    "Bearer ey",
):
    require(prohibited not in env_example, f"mobile env example must not contain {prohibited}")

for token in (
    "AuthSession.ResponseType.Code",
    "usePKCE: true",
    "code_verifier",
    "SecureStore.setItemAsync",
    "SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY",
    'headers.set("authorization",',
):
    require(token in auth, f"mobile auth boundary missing token: {token}")

require("ResponseType.Token" not in auth, "implicit access-token response flow is prohibited")
require("clientSecret" not in auth, "mobile public client must not carry a client secret")
require(
    'path.startsWith("/api/v1/")' in auth,
    "mobile API client must restrict requests to versioned API paths",
)
require(
    "target.origin !== config.apiBaseUrl.origin" in auth,
    "mobile API client must enforce the configured API origin",
)

for token in (
    "EXPO_PUBLIC_CHARKHOONE_API_BASE_URL",
    "EXPO_PUBLIC_CHARKHOONE_OIDC_ISSUER",
    "EXPO_PUBLIC_CHARKHOONE_OIDC_CLIENT_ID",
):
    require(token in runtime, f"mobile runtime config missing {token}")

require(
    '"/api/v1/mobile/bootstrap"' in api,
    "mobile API client must use the authenticated bootstrap endpoint",
)

authoritative_screens = [
    "apps/mobile/app/(auth)/login.tsx",
    "apps/mobile/app/(auth)/otp.tsx",
    "apps/mobile/app/(tenant)/home.tsx",
    "apps/mobile/app/(tenant)/payments.tsx",
    "apps/mobile/app/(tenant)/financing-plans.tsx",
    "apps/mobile/app/(shared)/contracts.tsx",
    "apps/mobile/app/(shared)/profile.tsx",
]
screen_text = "\n".join(read(path) for path in authoritative_screens)

for prohibited in (
    "09121234567",
    "48216",
    "بانک ملت",
    " تومان",
):
    require(
        prohibited not in screen_text,
        f"authoritative mobile route contains prohibited synthetic value: {prohibited}",
    )

require(
    "installment-payment-success" not in read("apps/mobile/app/(tenant)/payments.tsx"),
    "payments screen must not route directly to synthetic success",
)

if failures:
    for failure in failures:
        print(f"mobile runtime wiring verification failed: {failure}", file=sys.stderr)
    raise SystemExit(1)

print("mobile runtime API/OIDC wiring contract verified")
