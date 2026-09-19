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
require(
    "/loan-plans" in api and "/loan-plan" in api,
    "mobile API client must use the authoritative financing plan read and selection endpoints",
)
require(
    "getMobileFinancingPlans" in api and "selectMobileFinancingPlan" in api,
    "mobile API client must expose financing plan read and selection helpers",
)

authoritative_screens = [
    "apps/mobile/app/(auth)/login.tsx",
    "apps/mobile/app/(auth)/otp.tsx",
    "apps/mobile/app/(tenant)/home.tsx",
    "apps/mobile/app/(tenant)/payments.tsx",
    "apps/mobile/app/(tenant)/financing-plans.tsx",
    "apps/mobile/app/(tenant)/plan-confirmation.tsx",
    "apps/mobile/app/(tenant)/financing-under-review.tsx",
    "apps/mobile/app/(tenant)/financing-approved.tsx",
    "apps/mobile/app/(tenant)/financing-not-approved.tsx",
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

financing_plans = read("apps/mobile/app/(tenant)/financing-plans.tsx")
plan_confirmation = read("apps/mobile/app/(tenant)/plan-confirmation.tsx")
for token in (
    "getMobileFinancingPlans",
    "PlanSelectionPending",
    "plan.planId",
    "plan.version",
):
    require(token in financing_plans, f"financing plan list missing authoritative token: {token}")

for token in (
    "getMobileFinancingPlans",
    "selectMobileFinancingPlan",
    "mobile_financing_plan_not_available",
    'router.replace("/(tenant)/home")',
):
    require(token in plan_confirmation, f"plan confirmation missing authoritative token: {token}")

for prohibited in (
    "۴۵۰٬۰۰۰٬۰۰۰",
    "۱۸۰٬۰۰۰٬۰۰۰",
    "۱۸٬۵۰۰٬۰۰۰",
    "۲۰٬۰۰۰٬۰۰۰",
    "صرفه‌جویی تقریبی",
    "financing-under-review",
):
    require(
        prohibited not in plan_confirmation,
        f"plan confirmation contains prohibited synthetic financing value or route: {prohibited}",
    )

financing_under_review = read("apps/mobile/app/(tenant)/financing-under-review.tsx")
financing_approved = read("apps/mobile/app/(tenant)/financing-approved.tsx")
financing_rejected = read("apps/mobile/app/(tenant)/financing-not-approved.tsx")
home = read("apps/mobile/app/(tenant)/home.tsx")

for token in (
    "useMobileBootstrap",
    "application.status",
    "selectedPlan",
    "bankApproval",
    "fundingAllocation",
    "formatRial",
):
    require(
        token in financing_under_review,
        f"financing review status missing authoritative token: {token}",
    )

for token in (
    "useMobileBootstrap",
    'application?.status === "ApprovedFunded"',
    "fundingAllocation",
    "formatRial",
):
    require(
        token in financing_approved,
        f"approved financing status missing authoritative token: {token}",
    )

for token in (
    "useMobileBootstrap",
    'application?.status === "Rejected"',
    "bankApproval",
    "reasonCode",
):
    require(
        token in financing_rejected,
        f"rejected financing status missing authoritative token: {token}",
    )

require(
    'router.push("/(tenant)/financing-approved")' in home
    and 'router.push("/(tenant)/financing-not-approved")' in home
    and 'router.push("/(tenant)/financing-under-review")' in home,
    "home must route persisted application states to authoritative status screens",
)

for prohibited in (
    "/(tenant)/membership",
    "کد رهگیری",
    "سعادت‌آباد",
    "شرایط ویژه",
):
    require(
        prohibited not in financing_approved,
        f"approved financing status contains prohibited synthetic membership/property token: {prohibited}",
    )

for prohibited in (
    "طرح ویژه کارکنان",
    "بانک نمونه",
    "قرارداد سعادت‌آباد",
):
    require(
        prohibited not in financing_rejected,
        f"rejected financing status contains prohibited synthetic token: {prohibited}",
    )


# Every old tenant route remains resolvable by Expo Router but must fail closed
# even when opened as a deep link. No route may select a result via its filename.
legacy_tenant_routes = {
    "apps/mobile/app/(tenant)/home-review.tsx": "خانهٔ قدیمی",
    "apps/mobile/app/(tenant)/home-terminated.tsx": "خانهٔ فسخ‌شدهٔ قدیمی",
    "apps/mobile/app/(tenant)/calculator.tsx": "محاسبهٔ نمونه",
    "apps/mobile/app/(tenant)/calculator-result.tsx": "نتیجهٔ محاسبهٔ نمونه",
    "apps/mobile/app/(tenant)/membership.tsx": "عضویت",
    "apps/mobile/app/(tenant)/membership-payment-success.tsx": "نتیجهٔ پرداخت عضویت",
    "apps/mobile/app/(tenant)/membership-payment-failed.tsx": "نتیجهٔ پرداخت عضویت",
    "apps/mobile/app/(tenant)/membership-payment-pending.tsx": "نتیجهٔ پرداخت عضویت",
    "apps/mobile/app/(tenant)/contribution-required.tsx": "آوردهٔ مستأجر",
    "apps/mobile/app/(tenant)/contribution-payment-success.tsx": "نتیجهٔ پرداخت آورده",
    "apps/mobile/app/(tenant)/contribution-payment-failed.tsx": "نتیجهٔ پرداخت آورده",
    "apps/mobile/app/(tenant)/contribution-payment-pending.tsx": "نتیجهٔ پرداخت آورده",
    "apps/mobile/app/(tenant)/installment-payment-success.tsx": "نتیجهٔ پرداخت ماهانه",
    "apps/mobile/app/(tenant)/installment-payment-failed.tsx": "نتیجهٔ پرداخت ماهانه",
    "apps/mobile/app/(tenant)/installment-payment-pending.tsx": "نتیجهٔ پرداخت ماهانه",
    "apps/mobile/app/(tenant)/receipt.tsx": "رسید قدیمی",
    "apps/mobile/app/(tenant)/final-confirmation.tsx": "تأیید نهایی قدیمی",
    "apps/mobile/app/(tenant)/contract-detail.tsx": "جزئیات قرارداد قدیمی",
    "apps/mobile/app/(tenant)/contract-active.tsx": "وضعیت قرارداد قدیمی",
    "apps/mobile/app/(tenant)/contract-detail-terminated.tsx": "جزئیات فسخ قدیمی",
    "apps/mobile/app/(tenant)/payments-terminated.tsx": "تسویهٔ قدیمی",
}
legacy_import = 'import { LegacyTenantRouteUnavailable } from "@/components/LegacyTenantRouteUnavailable";'
for route, title in legacy_tenant_routes.items():
    expected = (
        f'{legacy_import}\n\n'
        'export default function Screen() {\n'
        f'  return <LegacyTenantRouteUnavailable title="{title}" />;\n'
        '}\n'
    )
    require(read(route) == expected, f"legacy tenant route must fail closed: {route}")

legacy_boundary = read("apps/mobile/src/components/LegacyTenantRouteUnavailable.tsx")
for token in (
    "useMobileAuth",
    'status !== "authenticated"',
    'status === "unauthenticated"',
    'status === "config-error"',
    'router.replace("/(auth)/login")',
    'router.replace("/(tenant)/home")',
    'router.replace("/(tenant)/payments")',
    'router.replace("/(shared)/contracts")',
):
    require(token in legacy_boundary, f"legacy tenant guard missing: {token}")
require(
    not (ROOT / "apps/mobile/src/components/PaymentResultScreen.tsx").exists(),
    "synthetic PaymentResultScreen must remain deleted",
)
require(
    'router.push("/(tenant)/calculator")' not in home,
    "authoritative home must not enter the sample calculator",
)
require(
    "onPress={openApplicationStatus}" in home,
    "home must keep a persisted-application shortcut",
)


# Deep-link coverage for remaining synthetic owner, shared contract/profile,
# and obsolete local identity/OTP prototype routes. OIDC login, persisted
# profile/contracts/payment and signed-out behavior remain independent.
legacy_owner_shared_auth_routes = {
    "apps/mobile/app/(owner)/contract-active.tsx": "وضعیت قرارداد مالک",
    "apps/mobile/app/(owner)/contract-connected.tsx": "اتصال قرارداد مالک",
    "apps/mobile/app/(owner)/contract-terminated.tsx": "فسخ قرارداد مالک",
    "apps/mobile/app/(owner)/final-confirmation.tsx": "تأیید نهایی مالک",
    "apps/mobile/app/(owner)/receive-pay.tsx": "دریافت و تسویه مالک",
    "apps/mobile/app/(owner)/settlement-preference.tsx": "انتخاب روش تسویه مالک",
    "apps/mobile/app/(shared)/change-mobile.tsx": "تغییر شماره موبایل",
    "apps/mobile/app/(shared)/verify-new-mobile.tsx": "تأیید شماره موبایل",
    "apps/mobile/app/(shared)/contract-tracking.tsx": "استعلام قرارداد",
    "apps/mobile/app/(shared)/role-selection.tsx": "انتخاب نقش قرارداد",
    "apps/mobile/app/(shared)/contracts-terminated.tsx": "فهرست قراردادهای قدیمی",
    "apps/mobile/app/(shared)/profile-photo.tsx": "ویرایش عکس پروفایل",
    "apps/mobile/app/(auth)/identity.tsx": "استعلام هویت قدیمی",
    "apps/mobile/app/(auth)/identity-error.tsx": "خطای استعلام هویت قدیمی",
    "apps/mobile/app/(auth)/otp-error.tsx": "کد تأیید قدیمی",
}
shared_legacy_import = 'import { LegacyMobileRouteUnavailable } from "@/components/LegacyTenantRouteUnavailable";'
for route, title in legacy_owner_shared_auth_routes.items():
    expected = (
        f'{shared_legacy_import}\n\n'
        'export default function Screen() {\n'
        f'  return <LegacyMobileRouteUnavailable title="{title}" />;\n'
        '}\n'
    )
    require(
        read(route) == expected,
        f"owner/shared/auth prototype route must fail closed: {route}",
    )

require(
    "export const LegacyMobileRouteUnavailable = LegacyTenantRouteUnavailable;" in legacy_boundary,
    "shared legacy guard must alias the authenticated tenant quarantine",
)
for token in (
    "هیچ هویت",
    "شمارهٔ موبایل",
    "کد تأیید",
    "استعلام قرارداد",
    "تأیید نهایی",
):
    require(token in legacy_boundary, f"shared legacy guard missing neutral boundary: {token}")

require(
    'return <Redirect href="/(auth)/login" />;' in read("apps/mobile/app/(auth)/otp.tsx"),
    "legacy OTP route must continue redirecting to real OIDC login",
)
for route in (
    "apps/mobile/app/(auth)/login.tsx",
    "apps/mobile/app/(shared)/profile.tsx",
    "apps/mobile/app/(shared)/contracts.tsx",
    "apps/mobile/app/(shared)/sign-out.tsx",
    "apps/mobile/app/(tenant)/payments.tsx",
):
    require(
        "LegacyMobileRouteUnavailable" not in read(route),
        f"real OIDC/API/sign-out route must not be quarantined: {route}",
    )

if failures:
    for failure in failures:
        print(f"mobile runtime wiring verification failed: {failure}", file=sys.stderr)
    raise SystemExit(1)

print("mobile runtime API/OIDC wiring contract verified")
