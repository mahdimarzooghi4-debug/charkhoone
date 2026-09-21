#!/usr/bin/env python3
"""Figma tenant MOCK route, financial and real-runtime isolation regression gate."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PREVIEW_ROUTES = ROOT / "apps/mobile/app/preview"
failures: list[str] = []


def read(path: str) -> str:
    target = ROOT / path
    if not target.is_file():
        failures.append(f"missing {path}")
        return ""
    return target.read_text(encoding="utf-8")


def require(condition: bool, message: str) -> None:
    if not condition:
        failures.append(message)


screen = read("apps/mobile/src/preview/MockTenantScreen.tsx")
calculator = read("apps/mobile/src/preview/MockTenantCalculatorScreen.tsx")
data = read("apps/mobile/src/preview/mockTenantData.ts")
provider = read("apps/mobile/src/preview/MockPreviewProvider.tsx")
root = read("apps/mobile/app/_layout.tsx")
index = read("apps/mobile/app/index.tsx")
launch = read("apps/mobile/scripts/start-preview-web.cjs")
package = json.loads(read("apps/mobile/package.json"))
dynamic = read("apps/mobile/app/preview/[screen].tsx")
preview_layout = read("apps/mobile/app/preview/_layout.tsx")
route_home = read("apps/mobile/app/preview/home.tsx")
route_calculator = read("apps/mobile/app/preview/calculator.tsx")
route_result = read("apps/mobile/app/preview/calculator-result.tsx")

# Figma user-flow map. Actual OIDC and bank-facing routes are intentionally separate.
figma_journey = {
    "home": "61:28",
    "calculator": "65:55",
    "calculator-result": "71:43",
    "contract-tracking": "79:41",
    "contract-lookup": "66:382",
    "financing-plans": "85:62",
    "plan-confirmation": "90:52",
    "review": "91:53",
    "rejected": "97:85",
    "approved": "910:126",
    "membership": "245:228",
    "membership-success": "184:244",
    "membership-failed": "184:298",
    "membership-pending": "184:334",
    "contribution": "91:149",
    "contribution-success": "204:425",
    "contribution-failed": "204:464",
    "contribution-pending": "204:497",
    "final-confirmation": "93:61",
    "contract-active": "93:213",
    "contracts": "102:86",
    "contract-detail": "103:89",
    "payments": "94:91",
    "receipt": "100:89",
    "payment-failed": "205:235",
    "payment-pending": "205:282",
    "profile": "104:93",
}
for name, frame in figma_journey.items():
    source = read(f"apps/mobile/app/preview/{name}.tsx")
    require(bool(source), f"Figma {frame}: missing explicit /preview/{name} route")
    if name == "calculator":
        require('return <MockTenantCalculatorScreen />;' in source, "Figma 65:55 must render its own editable calculator")
    else:
        require(f'screen="{name}"' in source, f"Figma {frame} must render the matching MOCK screen")
for name in ("payment-terminated", "preview-index"):
    target = PREVIEW_ROUTES / (("index" if name == "preview-index" else name) + ".tsx")
    require(target.is_file(), f"missing fallback /preview/{name}")
require('screen="home"' in route_home, "home needs explicit Figma 61:28 route")
require('MockTenantCalculatorScreen' in route_calculator, "calculator must use Figma 65:55")
require('screen="calculator-result"' in route_result, "result must map to Figma 71:43")

# No label or destination may accidentally fall through to /preview/undefined.
for to in re.findall(r'\bto="([a-z][a-z-]*)"', screen):
    require((PREVIEW_ROUTES / (to + ".tsx")).is_file(), f"missing explicit MOCK Button destination: {to}")
for to in re.findall(r'href="/preview/([a-z][a-z-]*)"', screen + calculator):
    require((PREVIEW_ROUTES / (to + ".tsx")).is_file(), f"missing explicit MOCK Link destination: {to}")
for to in re.findall(r'router\.(?:push|replace)\("/preview/([a-z][a-z-]*)"\)', screen + calculator):
    require((PREVIEW_ROUTES / (to + ".tsx")).is_file(), f"missing explicit router destination: {to}")
require('["قراردادها", "contracts",' in screen, "bottom navigation must open Figma Contracts / Overview")
require('["دریافت و پرداخت", "payments",' in screen, "bottom navigation must open Figma Payments / Overview")
require('["حساب من", "profile",' in screen, "bottom navigation must open Figma Account / Profile")
require('["خانه", "home",' in screen, "bottom navigation must open Figma Tenant Home")
require('to="contract-tracking"' in screen and 'router.push("/preview/contract-lookup")' in screen and 'to="financing-plans"' in screen, "calculator result must pass through the two Figma contract screens")
# Figma 66:382: two actual selectable role cards, both continued into distinct MOCK flows.
owner_route = read("apps/mobile/app/preview/owner-contract.tsx")
require('screen="owner-contract"' in owner_route, "owner role requires its own explicit MOCK route")
require('type MockContractRole = "Tenant" | "Owner"' in provider, "role selection type must distinguish tenant and owner")
require('contractRole' in provider and 'setContractRole' in provider, "role selection must persist in preview provider")
require('function ContractRoleCard' in screen, "Figma 66:382 must render selectable role cards")
for token in (
    'role="Owner"', 'role="Tenant"', 'contractRole === "Owner"', 'contractRole === "Tenant"',
    'selected={contractRole === "Owner"}', 'selected={contractRole === "Tenant"}',
    'onPress={setContractRole}', 'accessibilityRole="radio"',
    'figmaAssets.roleSelected', 'figmaAssets.roleUnselected',
    'router.push(contractRole === "Tenant" ? "/preview/financing-plans" : "/preview/owner-contract")',
    'case "owner-contract"', 'back="contract-lookup"',
):
    require(token in screen, f"Figma 66:382 role selection missing: {token}")
require('screen !== "contract-lookup" && screen !== "owner-contract"' in screen, "owner and role choice must not display tenant tab navigation")
require('parseMockAmount(trackingCode) !== 123456789012' in screen, "an arbitrary 12-digit code must not pretend to match a MOCK contract")
role_section = screen.split('case "contract-lookup": body = <>')[1].split('case "owner-contract": body = <>')[0]
require('نقش خود را در این قرارداد انتخاب کنید' in role_section and 'مشخصات کلی قرارداد' in role_section and 'ملک قرارداد' in role_section, "Figma 66:382 must show role cards, contract summary and property")
owner_section = screen.split('case "owner-contract": body = <>')[1].split('case "financing-plans": {')[0]
require('to="financing-plans"' not in owner_section and 'mockFinancialModel.monthlyInterest' not in owner_section, "owner MOCK must not inherit tenant financing or monthly bank interest")
require('router.push("/preview/contract-lookup")' in screen, "MOCK inquiry must navigate on explicit user action")
require('href="/preview/calculator"' in screen, "home orange CTA must open Figma 65:55")
require('href="/preview/calculator-result"' in calculator, "Figma 65:55 CTA must open Figma 71:43")

require('return <Redirect href="/preview/home" />;' in dynamic, "unknown /preview/undefined must redirect to the real home route")
require('MockPreviewProvider' in preview_layout, "MOCK financial state must survive page transitions")
for token in ('useSegments', 'segments[0] === "preview"', 'if (segments[0] === "preview") return navigator'):
    require(token in root, f"preview must bypass OIDC runtime provider: {token}")
require('EXPO_PUBLIC_CHARKHOONE_MOCK_PREVIEW === "1"' in index, "dev-only explicit preview flag missing")
require('Platform.OS === "web"' in index and '__DEV__' in index, "native and production root must keep real OIDC")
require('"/(auth)/login"' in index, "real auth entry must remain the default")
require('EXPO_PUBLIC_CHARKHOONE_MOCK_PREVIEW: "1"' in launch, "preview launch must opt in explicitly")
require(package["scripts"].get("preview:web") == "node ./scripts/start-preview-web.cjs", "single-command local web preview missing")

for n in ("۵۰۰٬۰۰۰٬۰۰۰", "۲۰٬۰۰۰٬۰۰۰", "۱٬۱۶۶٬۶۶۶٬۶۶۷", "۳۵۰٬۰۰۰٬۰۰۰", "۸۱۶٬۶۶۶٬۶۶۷", "۶٬۷۰۸٬۳۳۳", "۲۳٪"):
    require(n in data, f"C3 default value changed: {n}")
for token in (
    "calculateMockFinancialModel", "Math.round(deposit + rent / 0.03)",
    "Math.round(fullDeposit * 0.3)", "Math.round(financing * 0.23 / 12)",
    "MOCK_CASH_DEPOSIT_MAX", "MOCK_MONTHLY_RENT_MAX",
):
    require(token in data, f"shared approved financial formula missing: {token}")
for token in ("cashDeposit", "monthlyRent", "setCashDeposit", "setMonthlyRent", "financialModel", "setFinancingPlan", "setMembership"):
    require(token in provider, f"MOCK state continuity missing: {token}")
require('financialModel: mockFinancialModel' in screen, "home/results/plans/contract/payments must use edited values")
for token in ("onResponderMove", "TextInput", "setCashDeposit", "setMonthlyRent", "financialModel.monthlyInterest"):
    require(token in calculator, f"editable Figma calculator missing: {token}")
require("۱۸٬۵۰۰٬۰۰۰" not in calculator and "۴۵۰٬۰۰۰٬۰۰۰" not in calculator, "old Figma numbers must not override C3")
require("۱۸٬۵۰۰٬۰۰۰" not in screen and "۴۵۰٬۰۰۰٬۰۰۰" not in screen, "old Figma numbers must not override walkthrough")
require('homeNoticeText: { flex: 1, minWidth: 0' in screen and 'flexDirection: "row-reverse"' in screen, "RTL green home notice regressed")
require('عضویت' not in screen.split('function BottomNav')[1].split('function PreviewSummaryCard')[0], "membership must not displace Figma account tab")
for forbidden in ("@/api/", "useMobileAuth", "getMobileBootstrap"):
    require(forbidden not in screen + calculator + provider, f"MOCK must not access real API or auth: {forbidden}")

if failures:
    raise SystemExit("\n".join("mobile MOCK preview verification failed: " + e for e in failures))
print(f"Verified {len(figma_journey)} explicit Figma MOCK routes, navigation destinations, C3 calculations, and OIDC isolation")
