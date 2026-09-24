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
owner_gross = ((deposit + rent / Decimal("0.03")) * Decimal("0.03")).quantize(0, rounding=ROUND_HALF_UP)
owner_fee = (owner_gross * Decimal("0.005")).quantize(0, rounding=ROUND_HALF_UP)
owner_net = owner_gross - owner_fee
demand((full, loan, tenant, monthly_interest, owner_gross, owner_fee, owner_net) == (
    1_166_666_667, 350_000_000, 816_666_667, 6_708_333, 35_000_000, 175_000, 34_825_000
), "C3 fixture arithmetic mismatch")

sample = {
    "full": "۱٬۱۶۶٬۶۶۶٬۶۶۷",
    "loan": "۳۵۰٬۰۰۰٬۰۰۰",
    "tenant": "۸۱۶٬۶۶۶٬۶۶۷",
    "monthly": "۶٬۷۰۸٬۳۳۳",
    "owner_gross": "۳۵٬۰۰۰٬۰۰۰",
    "owner_fee": "۱۷۵٬۰۰۰",
    "owner_net": "۳۴٬۸۲۵٬۰۰۰",
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
owner_choice = (PAGES / "contracts/123456789012/owner/settlement-preference/page.tsx").read_text(encoding="utf-8")
home = (PAGES / "home/page.tsx").read_text(encoding="utf-8")
demand(sample["loan"] in owner_active and "۴۵۰٬۰۰۰٬۰۰۰" not in owner_active and
       sample["owner_net"] in owner_active and
       all(sample[key] in owner_choice for key in ("owner_gross", "owner_fee", "owner_net")) and
       all(sample[key] in owner_final for key in ("owner_gross", "owner_fee", "owner_net")) and
       sample["owner_net"] in payments and sample["owner_net"] in home and
       "با پرداخت سود وام مستأجر یکی نیست" in owner_final and
       "رهن کامل معادل" in owner_active and "رهن کامل معادل" in owner_choice and
       "رهن کامل معادل" in payments,
       "owner payout preview must use the full-deposit equivalent and remain separate from tenant bank interest")

# Legacy membership result routes remain directly navigable. Make their status
# unambiguously illustrative even though the primary flow uses membership/result.
for relative in (
    "contracts/register/plans/membership/payment-success/page.tsx",
    "contracts/register/plans/membership/payment-failed/page.tsx",
    "contracts/register/plans/membership/payment-pending/page.tsx",
    "contracts/register/plans/membership/failed/page.tsx",
    "contracts/register/plans/membership/pending/page.tsx",
):
    legacy = (PAGES / relative).read_text(encoding="utf-8")
    demand("سناریوی نمایشی" in legacy and "شناسه نمونه" in legacy and
           "شماره پیگیری" not in legacy and
           "وضعیت تراکنش شما در سامانه چارخونه" not in legacy,
           relative + ": legacy membership screen must not claim a real payment")

print("web C3 interest-only mock financing is consistent across user panel")
