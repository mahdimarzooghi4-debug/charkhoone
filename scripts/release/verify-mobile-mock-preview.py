#!/usr/bin/env python3
"""Regression checks for the isolated tenant MOCK preview route."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
failures: list[str] = []


def read(path: str) -> str:
    value = ROOT / path
    if not value.is_file():
        failures.append(f"missing {path}")
        return ""
    return value.read_text(encoding="utf-8")


screen = read("apps/mobile/src/preview/MockTenantScreen.tsx")
data = read("apps/mobile/src/preview/mockTenantData.ts")
provider = read("apps/mobile/src/preview/MockPreviewProvider.tsx")
route = read("apps/mobile/app/preview/[screen].tsx")
home_route = read("apps/mobile/app/preview/home.tsx")
root_layout = read("apps/mobile/app/_layout.tsx")

for value in ("۵۰۰٬۰۰۰٬۰۰۰", "۲۰٬۰۰۰٬۰۰۰", "۱٬۱۶۶٬۶۶۶٬۶۶۷", "۳۵۰٬۰۰۰٬۰۰۰", "۸۱۶٬۶۶۶٬۶۶۷", "۶٬۷۰۸٬۳۳۳", "۲۳٪"):
    if value not in data:
        failures.append(f"C3 MOCK financial value missing: {value}")

for route_name in (
    "calculator-result", "financing-plans", "plan-confirmation", "review", "approved", "rejected",
    "membership", "contribution", "final-confirmation", "contract-active", "contract-detail",
    "payments", "receipt", "payment-pending", "payment-failed", "payment-terminated",
):
    if f'"{route_name}"' not in screen:
        failures.append(f"MOCK navigation screen missing: {route_name}")

for token in ("financingPlan", "membership", "setFinancingPlan", "setMembership"):
    if token not in provider:
        failures.append(f"financing/membership state separation missing: {token}")

for token in (
    'kind === "success" ? <Button label="ادامه به آورده" to="contribution" /> : <Button label="بازگشت به عضویت"',
    'contributionSucceeded ? <Button label="تأیید نهایی نمونه" to="final-confirmation" /> : <Button label="بازگشت به آورده"',
    "bottomButton: { flex: 1, minHeight: 44, paddingHorizontal: 2 }",
):
    if token not in screen:
        failures.append(f"MOCK result gating or four-item bottom navigation missing: {token}")

for token in ("MOCK", "هیچ درخواست، پرداخت، تأیید بانک، عضویت یا قراردادی ثبت نمی‌شود"):
    if token not in screen and token not in data:
        failures.append(f"MOCK boundary notice missing: {token}")

if "@/api/" in screen or "useMobileAuth" in screen or "getMobileBootstrap" in screen:
    failures.append("MOCK preview must not read or mutate the authenticated mobile API")

if "MockTenantScreen" not in route:
    failures.append("/preview/[screen] must render isolated MOCK screen")

if 'return <MockTenantScreen screen="home" />;' not in home_route:
    failures.append("/preview/home must be an explicit MOCK route")

for token in ('useSegments', 'segments[0] === "preview"', 'if (segments[0] === "preview") return navigator'):
    if token not in root_layout:
        failures.append(f"preview must bypass the OIDC runtime provider: {token}")

if failures:
    raise SystemExit("\n".join(f"mobile MOCK preview verification failed: {item}" for item in failures))

print("mobile MOCK preview navigation, finance values and isolation verified")
