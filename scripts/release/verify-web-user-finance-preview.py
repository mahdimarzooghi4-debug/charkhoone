#!/usr/bin/env python3
"""Guard demo financing figures against drifting away from the web calculator.

This does NOT validate a bank product, return guarantee, or external grade result.
It validates only the static C3/23% user-panel scenario until trusted integrations exist.
"""
from pathlib import Path
from decimal import Decimal, ROUND_HALF_UP

ROOT = Path(__file__).resolve().parents[2]
PAGES = ROOT / "apps/web/src/app/user"
CALCULATOR = (PAGES / "calculator/page.tsx").read_text(encoding="utf-8")

def demand(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit("ERROR: " + message)

demand('const MONTHLY_RENT_TO_FULL_DEPOSIT_RATIO = 0.03;' in CALCULATOR,
       "calculator monthly rent-to-deposit conversion changed")
demand('const DEMO_EXTERNAL_SUBGRADE = "C3";' in CALCULATOR and
       'C1: 40, C2: 40, C3: 30,' in CALCULATOR,
       "calculator mock grade and finance percentage changed")
demand('const SAMPLE_BANK_ANNUAL_RATE = "23";' in CALCULATOR,
       "calculator sample nominal bank rate changed")

deposit = Decimal(500_000_000)
rent = Decimal(20_000_000)
full = deposit + (rent / Decimal("0.03")).quantize(0, rounding=ROUND_HALF_UP)
loan = (full * Decimal("0.30")).quantize(0, rounding=ROUND_HALF_UP)
tenant = full - loan
monthly_interest = (loan * Decimal("0.23") / 12).quantize(0, rounding=ROUND_HALF_UP)
demand((full, loan, tenant, monthly_interest) == (
    1_166_666_667, 350_000_000, 816_666_667, 6_708_333
), "C3 fixture arithmetic mismatch")

sample = {
    "full": "۱٬۱۶۶٬۶۶۶٬۶۶۷",
    "loan": "۳۵۰٬۰۰۰٬۰۰۰",
    "tenant": "۸۱۶٬۶۶۶٬۶۶۷",
    "monthly": "۶٬۷۰۸٬۳۳۳",
}
pages = {
    "contracts/register/plans/page.tsx": ("full", "loan", "tenant", "monthly"),
    "contracts/register/plans/confirmation/page.tsx": ("full", "loan", "tenant", "monthly"),
    "contracts/register/plans/review/page.tsx": ("full", "loan", "tenant", "monthly"),
    "contracts/register/plans/approved/page.tsx": ("full", "loan", "tenant", "monthly"),
    "contracts/register/plans/contribution/page.tsx": ("full", "loan", "tenant", "monthly"),
    "contracts/register/plans/final-confirmation/page.tsx": ("full", "loan", "tenant", "monthly"),
    "contracts/register/plans/waiting-owner/page.tsx": ("full", "loan", "tenant"),
    "contracts/register/plans/membership/page.tsx": ("full", "loan"),
    "contracts/123456789012/page.tsx": ("full", "loan", "tenant", "monthly"),
    "contracts/123456789012/owner/final-confirmation/page.tsx": ("full", "loan"),
    "home/page.tsx": ("monthly",),
    "properties/page.tsx": ("monthly",),
    "receive-pay/page.tsx": ("monthly",),
    "receive-pay/demo-transactions.ts": ("monthly",),
    "contracts/page.tsx": ("monthly",),
}
for relative, required in pages.items():
    body = (PAGES / relative).read_text(encoding="utf-8")
    demand(all(sample[key] in body for key in required),
           relative + ": sample financing amounts are out of sync")
    demand("۱۸٬۵۰۰٬۰۰۰" not in body and "۲۰٬۵۰۰٬۰۰۰" not in body and
           "۴۵۰٬۰۰۰٬۰۰۰" not in body and "۴۰۰٬۰۰۰٬۰۰۰" not in body,
           relative + ": legacy sample financing amounts remain")

for relative in ("contracts/register/plans/page.tsx",
                 "contracts/register/plans/confirmation/page.tsx",
                 "contracts/register/plans/approved/page.tsx",
                 "contracts/register/plans/contribution/page.tsx",
                 "contracts/register/plans/final-confirmation/page.tsx"):
    body = (PAGES / relative).read_text(encoding="utf-8")
    demand("فقط سود وام" in body or "اصل وام" in body,
           relative + ": interest-only payment disclaimer missing")

contract = (PAGES / "contracts/123456789012/page.tsx").read_text(encoding="utf-8")
demand('label="مدت زمان قرارداد" value="۱۲ ماه"' in contract,
       "lease length must remain 12 months, independent of bank principal settlement")

# Guard the split between the financing-plan key and the membership choice.
membership = (PAGES / "contracts/register/plans/membership/page.tsx").read_text(encoding="utf-8")
membership_result = (PAGES / "contracts/register/plans/membership/result/page.tsx").read_text(encoding="utf-8")
contribution_page = (PAGES / "contracts/register/plans/contribution/page.tsx").read_text(encoding="utf-8")
final_page = (PAGES / "contracts/register/plans/final-confirmation/page.tsx").read_text(encoding="utf-8")
final_consent = (PAGES / "contracts/register/plans/final-confirmation/FinalConfirmationConsent.tsx").read_text(encoding="utf-8")
waiting_owner = (PAGES / "contracts/register/plans/waiting-owner/page.tsx").read_text(encoding="utf-8")
demand("financingPlan}&membership=${selectedPlan}" in membership and
       "const { plan, membership } = await searchParams;" in membership_result and
       "const chosenId = membership" in membership_result and
       "contribution?plan=${financingPlan}" in membership_result and
       "final-confirmation?plan=${plan}" in contribution_page and
       "<FinalConfirmationConsent plan={plan} />" in final_page and
       "waiting-owner?plan=${plan}" in final_consent and
       "selectedPlanRows" in waiting_owner,
       "financing plan must survive the separate membership choice and tenant confirmation")

owner_active = (PAGES / "contracts/123456789012/owner/page.tsx").read_text(encoding="utf-8")
owner_final = (PAGES / "contracts/123456789012/owner/final-confirmation/page.tsx").read_text(encoding="utf-8")
payments = (PAGES / "receive-pay/page.tsx").read_text(encoding="utf-8")
demand(sample["loan"] in owner_active and "۴۵۰٬۰۰۰٬۰۰۰" not in owner_active and
       "سود وام ماهانه مستأجر متفاوت است" in owner_final and
       "برآورد مستقل مالک سعادت‌آباد" in payments,
       "owner payout preview must not be represented as tenant bank interest")

print("web C3 interest-only mock financing is consistent across user panel")
