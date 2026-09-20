#!/usr/bin/env python3
"""Fail closed if a Figma preview /user page regresses to a sample profile footer.

The web user pages are design fixtures, not authenticated/financial truth.
Outer LTR flex is intentional: main THEN aside leaves the green sidebar at right.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
USER_ROOT = ROOT / "apps/web/src/app/user"
SCAFFOLD = ROOT / "apps/web/src/components/account/AccountModalScaffold.tsx"
CSS_SCAFFOLD = ROOT / "apps/web/src/components/account/AccountModalScaffold.module.css"
EXIT = ROOT / "apps/web/src/components/user/UserPanelExit.tsx"
EXIT_CSS = ROOT / "apps/web/src/components/user/UserPanelExit.module.css"
SIDEBAR = ROOT / "apps/web/src/components/user/UserPanelSidebar.tsx"
SIDEBAR_CSS = ROOT / "apps/web/src/components/user/UserPanelSidebar.module.css"

failures: list[str] = []


def require(condition: bool, message: str) -> None:
    if not condition:
        failures.append(message)


def read(path: Path) -> str:
    require(path.is_file(), f"missing: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8") if path.is_file() else ""


exit_code = read(EXIT)
exit_css = read(EXIT_CSS)
require('href="/login"' in exit_code, "preview exit must return to login")
require("خروج" in exit_code and "پیش‌نمایش" in exit_code, "preview exit must not claim live logout")
require("localStorage" not in exit_code and "sessionStorage" not in exit_code, "preview exit must not pretend to clear browser credentials")
require(".exit {" in exit_css and ":focus-visible" in exit_css, "exit must have visible/focus styling")
require("justify-content: center;" in exit_css and "text-align: center;" in exit_css,
        "sidebar exit must center its text")
require("←" not in exit_code, "sidebar exit must not show a decorative arrow")

sidebar_code = read(SIDEBAR)
sidebar_css = read(SIDEBAR_CSS)
require(sidebar_code.count("<UserPanelExit />") == 1, "one shared preview exit belongs inside shared sidebar")
require('usePathname()' in sidebar_code and 'aria-current={selected ? "page" : undefined}' in sidebar_code,
        "shared sidebar must select the active tab from current route")
require('width={200} height={86}' in sidebar_code and
        ".logoWrap img {" in sidebar_css and "width: 200px;" in sidebar_css and "height: 86px;" in sidebar_css and
        "place-items: center;" in sidebar_css,
        "all web preview sidebars must use the large centered permanent logo")
require('src="/brand/dashboard-logo.png"' in sidebar_code,
        "shared sidebar logo must be a stable local file")
for filename in ("dashboard-logo.png", "dashboard-nav-home.svg", "dashboard-nav-file.svg",
                 "dashboard-nav-card.svg", "dashboard-nav-user.svg"):
    require((ROOT / "apps/web/public/brand" / filename).is_file(),
            f"missing sidebar asset: {filename}")
require('alertBadge' not in sidebar_code and 'styles.profile' not in sidebar_code,
        "shared sidebar must not show static counts or fake profile details")
require('hideOnMobile' in sidebar_code and ".hideOnMobile { display: none; }" in sidebar_css,
        "account dialog previews must be able to hide the sidebar on mobile")

panel_pages = sorted(USER_ROOT.rglob("page.tsx"))
require(len(panel_pages) >= 36, "expected complete owner and tenant user web page set")
modal_subpages = {
    "account/change-mobile/page.tsx",
    "account/change-mobile/otp/page.tsx",
    "account/profile-image/page.tsx",
    "account/profile-image/preview/page.tsx",
}
panel_count = 0
styles_checked: set[Path] = set()

for path in panel_pages + [SCAFFOLD]:
    text = read(path)
    name = path.relative_to(ROOT)
    if "<UserPanelSidebar" not in text:
        require(path in panel_pages and path.relative_to(USER_ROOT).as_posix() in modal_subpages,
                f"{name}: route must use the shared sidebar or an account modal scaffold")
        continue
    panel_count += 1
    require(text.count("<UserPanelSidebar") == 1, f"{name}: render exactly one shared sidebar")
    require('import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";' in text,
            f"{name}: import shared sidebar")
    require("<aside className={styles.sidebar}" not in text and "<UserPanelExit />" not in text,
            f"{name}: do not duplicate sidebar markup or exit")
    require(not re.search(r"<div className=\{styles\.(?:profile|sidebarProfile)\}", text),
            f"{name}: remove static profile footer")
    match = re.search(r'import styles from "([^"]+)";', text)
    require(match is not None, f"{name}: missing CSS module import")
    if match is None:
        continue
    css_file = (path.parent / match.group(1)).resolve()
    require(css_file.is_relative_to(ROOT), f"{name}: CSS module must be in repo")
    if not css_file.is_relative_to(ROOT):
        continue
    styles_checked.add(css_file)
    css = read(css_file)
    require(".mainContent { direction: rtl; text-align: right; }" in css,
            f"{css_file.relative_to(ROOT)}: Persian panel content must stay RTL")

require(panel_count == len(panel_pages) - len(modal_subpages) + 1,
        f"all web user panels and account scaffold must use one shared sidebar: {panel_count}")
require(CSS_SCAFFOLD in styles_checked, "account modal scaffold must share right-aligned sidebar and exit")
require("direction: ltr" in read(CSS_SCAFFOLD), "account modal sidebar placement must remain on right")
for modal in (
    "account/change-mobile/page.module.css",
    "account/change-mobile/otp/page.module.css",
    "account/profile-image/page.module.css",
    "account/profile-image/preview/page.module.css",
):
    require(".modal { direction: rtl; text-align: right; }" in read(USER_ROOT / modal),
            f"account modal is not right-to-left: {modal}")


account_text = read(USER_ROOT / "account/page.tsx")
account_css = read(USER_ROOT / "account/page.module.css")
modal_text = read(SCAFFOLD)
modal_css = read(CSS_SCAFFOLD)
for label, css in (("account", account_css), ("account modal", modal_css)):
    require(bool(re.search(r"\.columns\s*\{[^}]*direction:\s*rtl\s*;", css)),
            f"{label}: settings column must be on the right")
    require(".settingsRow { direction: ltr;" in css,
            f"{label}: settings indicators left and Persian label right")
for label, value in (("mobile", "۰۹۱۲•••••۶۷"), ("national ID", "۰۰۱•••••۷۸۹")):
    require(bool(re.search(r'<strong className=\{styles\.ltrNumber\} dir="ltr"[^>]*>'
                           + re.escape(value) + r"</strong>", account_text)),
            f"account {label}: masked digits must be isolated LTR")
require(".valueRow strong.ltrNumber," in account_css and
        ".identityRow strong.ltrNumber" in account_css and
        "unicode-bidi: isolate;" in account_css,
        "masked account numbers must override previous strong direction: rtl")
require("logoutAction" not in account_text and 'styles.logout}' not in modal_text,
        "remove redundant nonfunctional account/logout pseudo-buttons")



home_text = read(USER_ROOT / "home/page.tsx")
home_css = read(USER_ROOT / "home/page.module.css")
require("<UserPanelSidebar" in home_text and 'src="/brand/dashboard-logo.png"' in sidebar_code,
        "home must reuse the centered permanent shared sidebar")
require(".remainingInfo { direction: rtl; }" in home_css,
        "home remaining-uses count must be left of its label")
require("styles.remainingInfo" in home_text, "home remaining-uses layout hook missing")
require(bool(re.search(r"\.actionContent\s*\{[^}]*direction:\s*rtl\s*;", home_css)) and
        ".actionTitleRow {\n  /* Preserve badges left / title right inside the right-aligned content. */\n  direction: ltr;" in home_css,
        "home required-action card content must align right")
require('<Link href="/user/contracts/123456789012/owner/settlement-preference" className={styles.actionButton}>بررسی قرارداد</Link>' in home_text and
        '<strong>انتخاب روش دریافت و تأیید قرارداد</strong>' in home_text and
        'className={styles.actionButton}>بررسی قرارداد</Link>' in home_text and
        '<Link href="/user/contracts/123456789012/owner/final-confirmation" className={styles.actionButton}' not in home_text,
        "home owner review CTA must open settlement selection before final confirmation")

contracts_text = read(USER_ROOT / "contracts/page.tsx")
contracts_css = read(USER_ROOT / "contracts/page.module.css")
require('"use client";' in contracts_text and "useState<RoleFilter>" in contracts_text and
        "useState<StatusFilter>" in contracts_text, "contracts filters must keep interactive selection state")
require("visibleContracts = contracts.filter(" in contracts_text and
        "contract.role === roleFilter" in contracts_text and "contract.status === statusFilter" in contracts_text and
        "visibleContracts.map(" in contracts_text, "contracts list must filter role and status together")
require("aria-pressed={roleFilter === role}" in contracts_text and
        "aria-pressed={statusFilter === status}" in contracts_text and
        "visibleContracts.length === 0" in contracts_text,
        "contracts filters must show active state and empty results")
require("<UserPanelSidebar" in contracts_text and "alertBadge" not in sidebar_code,
        "contracts must use the shared sidebar without a static count")
require(bool(re.search(r"\.contractHeader,\s*\.contractBottom\s*\{[^}]*direction:\s*rtl\s*;", contracts_css)),
        "contracts card layout must align to right")

require(contracts_text.count('action: "بررسی و تأیید", href: "/user/contracts/123456789012/owner/settlement-preference"') == 1 and
        'nodeId: "149:223"' in contracts_text and
        'statusTone: "attention" as const' in contracts_text and
        'contract.href ? <Link href={contract.href} className={contract.statusTone === "attention" ? styles.reviewButton : styles.detailButton}>{contract.action}</Link>' in contracts_text and
        '.reviewButton {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;' in contracts_css and
        'text-decoration: none;' in contracts_css and
        'href: null' in contracts_text,
        "contracts review-and-confirm action must navigate to owner final-confirmation sample without changing other cards")

contracts_assets = {
    "logo": "dashboard-logo.png",
    "home": "dashboard-nav-home.svg",
    "contracts": "dashboard-nav-file.svg",
    "payments": "dashboard-nav-card.svg",
    "account": "dashboard-nav-user.svg",
}
for name, filename in contracts_assets.items():
    path = ROOT / "apps/web/public/brand" / filename
    require(path.is_file(), f"missing local contracts {name} asset: {filename}")
    require(f'/brand/{filename}' in sidebar_code,
            f"shared sidebar {name} must use its permanent same-origin asset")
require("figma.com/api/mcp/asset/" not in contracts_text,
        "contracts page must not depend on expiring Figma image URLs")

register_text = read(USER_ROOT / "contracts/register/page.tsx")
register_css = read(USER_ROOT / "contracts/register/page.module.css")
require("<UserPanelSidebar" in register_text and 'alertBadge' not in sidebar_code,
        "register tracking code route must use the shared sidebar without count")
for asset_name, asset_file in contracts_assets.items():
    require(f'/brand/{asset_file}' in sidebar_code,
            f"tracking-code register must reuse stable {asset_name} asset")
require("figma.com/api/mcp/asset/" not in register_text,
        "tracking-code register must not rely on expiring Figma assets")

lookup_text = read(USER_ROOT / "contracts/register/result/page.tsx")
lookup_css = read(USER_ROOT / "contracts/register/result/page.module.css")
require('"use client";' in lookup_text and 'useState<ContractRole>("tenant")' in lookup_text,
        "contract lookup result role selection must be interactive")
require('checked={selectedRole === "owner"}' in lookup_text and
        'checked={selectedRole === "tenant"}' in lookup_text and
        'onChange={() => setSelectedRole("owner")}' in lookup_text and
        'onChange={() => setSelectedRole("tenant")}' in lookup_text and
        'role="radiogroup"' in lookup_text,
        "contract lookup role radio buttons must update exclusive selection")
require('href={nextHref}' in lookup_text and
        '"/user/contracts/123456789012/owner/connected"' in lookup_text and
        '"/user/contracts/register/plans"' in lookup_text,
        "contract lookup continuation must honor selected owner or tenant preview route")
require("<UserPanelSidebar" in lookup_text and 'alertBadge' not in sidebar_code,
        "contract lookup result must use shared sidebar without static count")
require("<UserPanelSidebar" in lookup_text and "place-items: center;" in sidebar_css,
        "contract lookup result must reuse the 200px shared centered sidebar logo")
require(bool(re.search(r"appearance:\s*none\s*;", lookup_css)) and
        bool(re.search(r"-webkit-appearance:\s*none\s*;", lookup_css)) and
        '.roleOption input[type="radio"]:checked { border-color: var(--ch-color-primary); background: var(--ch-color-primary);' in lookup_css and
        '.roleOption input[type="radio"]:focus-visible { outline: 3px solid rgb(13 59 54 / 30%);' in lookup_css and
        '.nextNotice { width: 100%; min-height: 100px; padding: 10px 12px; color: var(--ch-color-primary);' in lookup_css,
        "lookup selected radio, focus and next-step notice must use brand green rather than browser blue")
require('.roleOption input[type="radio"]' in lookup_css and
        'min-height: 18px; /* Override global input min-height: 48px. */' in lookup_css and
        'max-height: 18px;' in lookup_css and
        'aspect-ratio: 1 / 1;' in lookup_css,
        "lookup radio must stay circular despite global 48px input minimum height")
require('<p data-node-id="150:769">سلام، علی رضایی</p>' in lookup_text and
        '.headerRight { gap: 4px; direction: rtl; align-items: stretch; }' in lookup_css and
        '.headerRight h1, .headerRight p { width: 100%; direction: rtl; text-align: right; }' in lookup_css,
        "lookup top greeting must align to the right edge under the inquiry title")
require(lookup_text.count('className={styles.nationalId} dir="rtl"') == 2 and
        lookup_text.count('<bdi dir="ltr">') == 2 and
        '.partyInfo > .nationalId { width: 100%; display: flex; flex-direction: row; justify-content: flex-start;' in lookup_css and
        '.nationalId bdi { direction: ltr; unicode-bidi: isolate; }' in lookup_css,
        "both role-card national ID labels must start at the right with isolated LTR numerals")
require(lookup_text.count('<span className={styles.partyInfo} dir="rtl">') == 2 and
        '<strong>علی رضایی</strong>' in lookup_text and
        bool(re.search(r"\.partyInfo\s*\{[^}]*display:\s*grid\s*;[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*;[^}]*direction:\s*rtl\s*;[^}]*text-align:\s*right\s*;", lookup_css)) and
        bool(re.search(r"\.partyInfo\s*>\s*\*\s*\{[^}]*width:\s*100%\s*;[^}]*display:\s*block\s*;[^}]*text-align:\s*right\s*;", lookup_css)),
        "owner/tenant names including Ali Rezaei must occupy full-width RTL rows flush right inside role cards")
for asset_name, asset_file in contracts_assets.items():
    require(f'/brand/{asset_file}' in sidebar_code,
            f"contract lookup result should use stable {asset_name} sidebar asset")
require('className={styles.officialNotice}' in lookup_text and
        '<span className={styles.noticeIcon} aria-hidden="true">ⓘ</span><span className={styles.noticeText}>' in lookup_text and
        'از سامانهٔ خودنویس استعلام نشده است.' in lookup_text and
        'assets.info' not in lookup_text,
        "lookup bottom notice must show a stable information marker and disclose sample data")
require('.officialNotice { width: 100%; display: grid; grid-template-columns: 20px minmax(0, 1fr);' in lookup_css and
        'direction: rtl; text-align: right; }' in lookup_css and
        '.noticeText { min-width: 0; width: 100%; direction: rtl; text-align: right; }' in lookup_css,
        "lookup bottom notice icon must stay in rightmost grid cell and Persian copy next to it")

plans_page = read(USER_ROOT / "contracts/register/plans/page.tsx")
plans_css = read(USER_ROOT / "contracts/register/plans/page.module.css")
plans_confirmation = read(USER_ROOT / "contracts/register/plans/confirmation/page.tsx")
summary_pairs = (
    ('مبلغ موردنیاز:', '۴۵۰٬۰۰۰٬۰۰۰ تومان'),
    ('اجاره ماهانه:', '۲۰٬۰۰۰٬۰۰۰ تومان'),
    ('مبلغ رهن:', '۵۰۰٬۰۰۰٬۰۰۰ تومان'),
    ('قرارداد:', 'سعادت‌آباد'),
)
context_markup = plans_page.split('className={styles.contractContext}', 1)[1].split('</section>', 1)[0]
require(context_markup.count('<div>') == len(summary_pairs) and
        all(bool(re.search(r'<div>\s*<span>' + re.escape(label) +
                            r'</span>\s*<strong(?:\s+className=\{styles\.contextRegular\})?>' +
                            re.escape(value) + r'</strong>\s*</div>', context_markup))
            for label, value in summary_pairs) and
        '.contractContext > div { display: flex; align-items: baseline; gap: 4px; white-space: nowrap; direction: rtl; text-align: right; }' in plans_css,
        "financing context must display all four labels on the right and values immediately to their left")
require('"use client";' in plans_page and 'useState<PlanId>("staff")' in plans_page and
        'onChange={onSelect}' in plans_page and 'selected={selectedPlan === plan.id}' in plans_page and
        'onSelect={() => setSelectedPlan(plan.id)}' in plans_page and
        'type="radio" name="financing-plan"' in plans_page,
        "finance plan selection must be interactive and exclusive")
require('confirmation?plan=${selectedPlan}' in plans_page and
        'const isGeneral = plan === "general";' in plans_confirmation and
        'const planRows = isGeneral ? generalPlanRows : staffPlanRows;' in plans_confirmation and
        'const summaryRows = isGeneral ? generalSummaryRows : staffSummaryRows;' in plans_confirmation,
        "finance plan confirmation must show the selected sample plan and its amounts")
require('assets.sparkles' not in plans_page and 'assets.info' not in plans_page and
        'figma.com/api/mcp/asset/' not in plans_page and
        '<span className={styles.noticeIcon} aria-hidden="true">ⓘ</span>' in plans_page,
        "finance plan preview must not use expiring Figma sparkle/info images")
require('.headerRight h1, .headerRight p, .pageHeader h2, .pageHeader p { width: 100%; direction: rtl; text-align: right; }' in plans_css and
        '.planTitle h3, .planTitle p { width: 100%; text-align: right; }' in plans_css and
        '.informationNote { width: 100%; display: grid; grid-template-columns: 20px minmax(0, 1fr);' in plans_css,
        "finance plans heading, plan titles and bottom warning must be right-aligned")
require('نمونهٔ طراحی‌اند' in plans_page and
        'background: var(--ch-color-primary); border-radius: 50%;' in plans_css,
        "finance plans selection must use brand green and identify fixture values as a preview")

confirmation_css = read(USER_ROOT / "contracts/register/plans/confirmation/page.module.css")
consent_code = read(USER_ROOT / "contracts/register/plans/confirmation/PlanConfirmationConsent.tsx")
require('import { PlanConfirmationConsent } from "./PlanConfirmationConsent";' in plans_confirmation and
        '<PlanConfirmationConsent plan={isGeneral ? "general" : "staff"} />' in plans_confirmation and
        'type="checkbox"' in consent_code and
        'useState(false)' in consent_code and
        'onChange={(event) => setAgreed(event.target.checked)}' in consent_code and
        'disabled={!agreed}' in consent_code and
        'router.push(`/user/contracts/register/plans/review?plan=${plan}`)' in consent_code and
        'plan }: { plan: "general" | "staff" }' in consent_code,
        "confirmation preview checkbox must toggle and block navigation until checked")
require(consent_code.count('type="checkbox"') == 1 and
        'styles.checkbox' not in consent_code and
        'aria-hidden="true">✓</span>' not in consent_code and
        '.confirmationRow { width: 100%; display: grid; grid-template-columns: 20px minmax(0, 1fr);' in confirmation_css and
        'direction: rtl; cursor: pointer; }' in confirmation_css and
        'position: static;' in confirmation_css and
        'appearance: none;' in confirmation_css and
        '.consentInput:checked::after { content: "✓";' in confirmation_css and
        '.consentInput:focus-visible {' in confirmation_css,
        "consent must render exactly one visible green checkbox in the rightmost RTL column")
require('<span className={styles.infoBubble} aria-hidden="true">ⓘ</span><span data-node-id="150:1124">اجاره ماهانه قرارداد مرتبط</span>' in plans_confirmation and
        '.rentRow > div { display: flex; align-items: center; flex-direction: row; gap: 8px; direction: rtl; }' in confirmation_css and
        '.rentRow > div > span:last-child' in confirmation_css,
        "related contract monthly rent info icon must appear at the right of its RTL label")
require('assets.info' not in plans_confirmation and 'assets.check' not in plans_confirmation,
        "confirmation page must not depend on temporary Figma icon links")

review_page = read(USER_ROOT / "contracts/register/plans/review/page.tsx")
review_css = read(USER_ROOT / "contracts/register/plans/review/page.module.css")
review_icon_specs = {
    "financing-review-clock.svg": ('stroke="#FF8A00"', 'width="24"', 'height="24"'),
    "financing-review-pending.svg": ('fill="#E5E7E6"', 'width="28"', 'height="28"'),
    "financing-review-active.svg": ('stroke="#0D3B36"', 'width="28"', 'height="28"'),
    "financing-review-check.svg": ('stroke="white"', 'width="14"', 'height="14"'),
}
require("const assets = {" not in review_page and
        "figma.com/api/mcp/asset/" not in review_page and
        "assets." not in review_page and
        "<svg viewBox=" not in review_page and
        all(review_page.count(f'/brand/{name}') == 1
            for name in review_icon_specs) and
        'className={styles.clockWrap} aria-hidden="true"' in review_page and
        'className={styles.completedIcon} aria-hidden="true"' in review_page,
        "finance review must use all four permanent local Figma-exported icon files")
for icon_name, attributes in review_icon_specs.items():
    icon_path = ROOT / "apps/web/public/brand" / icon_name
    require(icon_path.is_file() and
            all(attribute in read(icon_path) for attribute in attributes),
            f"finance review missing original Figma icon: {icon_name}")
require('.clockWrap img {' in review_css and
        '.timelineIcon img {' in review_css and
        '.completedIcon img {' in review_css,
        "finance review must dimension the local Figma SVG images explicitly")
require("درخواست واقعی به بانک ارسال نشده است." in review_page and
        "این مرحله نمایشی است و نتیجه‌ای از بانک دریافت نمی‌شود." in review_page and
        "تاریخ نمونهٔ درخواست" in review_page and
        "درخواست شما برای بررسی به بانک ارسال شده است." not in review_page,
        "finance review prototype must not claim bank submission or real review")
require('<UserPanelSidebar nodeId="142:1738" />' in review_page,
        "finance review must keep the shared panel sidebar")

contract_detail = read(USER_ROOT / "contracts/123456789012/page.tsx")
contract_detail_css = read(USER_ROOT / "contracts/123456789012/page.module.css")
require('مشاهده اطلاعات کامل ملک' not in contract_detail and
        'styles.ghostAction' not in contract_detail and
        '.ghostAction' not in contract_detail_css,
        "contract detail must not show redundant nonfunctional full-property link")
require('<span aria-hidden="true">‹</span>' in contract_detail and
        'transform: rotate(180deg);' not in contract_detail_css and
        '.backButton {' in contract_detail_css,
        "contract detail upper-left back arrow must point left without CSS rotation")
require('const isNationalId = label === "کد ملی مستأجر" || label === "کد ملی مالک";' in contract_detail and
        'dir={isNationalId ? "ltr" : undefined}' in contract_detail and
        '.nationalId { direction: ltr; unicode-bidi: isolate; text-align: left; }' in contract_detail_css,
        "contract detail must render both owner and tenant national IDs left-to-right")

# Keep the sample financing flow inside bank review, decision and membership.
approved_page = read(USER_ROOT / "contracts/register/plans/approved/page.tsx")
approved_css = read(USER_ROOT / "contracts/register/plans/approved/page.module.css")
membership_page = read(USER_ROOT / "contracts/register/plans/membership/page.tsx")
require('href={`/user/contracts/register/plans/approved?plan=${plan}`}' in review_page and
        'href={`/user/contracts/register/plans/not-approved?plan=${plan}`}' in review_page and
        'پیش‌نمایش نتیجه: تأیید درخواست' in review_page and
        'پیش‌نمایش نتیجه: رد درخواست' in review_page and
        '<Link href="/user/contracts/123456789012" className={styles.primaryAction}' not in review_page,
        "review primary action must lead to the sample bank decision, not ordinary contracts/payments")
require('اعلام نتیجهٔ نمونهٔ بررسی بانک' in approved_page and
        'title: "بررسی بانک (نمونه)"' in approved_page and
        'title: "اعلام نتیجه (نمونه)"' in approved_page and
        'title: "خرید عضویت چارخونه"' in approved_page and
        'href={`/user/contracts/register/plans/membership?plan=${plan}`}' in approved_page and
        'انتخاب و خرید عضویت (نمونه)' in approved_page and
        'data-name="Web App / Tenant Membership"' in membership_page,
        "review -> sample result -> membership selection must be an unbroken route")
require('نتیجهٔ واقعی از بانک دریافت نشده است.' in approved_page and
        'پرداخت واقعی انجام نمی‌شود.' in approved_page and
        'تأمین مالی شما توسط بانک تأیید شده است' not in approved_page and
        'src="/brand/financing-review-check.svg"' in approved_page and
        'figma.com/api/mcp/asset/' not in approved_page and
        '.heroIcon img { width: 14px; height: 14px; display: block; }' in approved_css,
        "bank result preview must avoid live bank/payment claims and temporary icon links")

not_approved_page = read(USER_ROOT / "contracts/register/plans/not-approved/page.tsx")
require('const plan = (await searchParams).plan === "general" ? "general" : "staff";' in review_page and
        'const requestRows = plan === "general" ? generalRequestRows : staffRequestRows;' in review_page and
        'const financeRows = plan === "general" ? generalFinanceRows : staffFinanceRows;' in approved_page and
        'const planRows = plan === "general" ? generalPlanRows : staffPlanRows;' in approved_page and
        'const resultRows = plan === "general" ? generalResultRows : staffResultRows;' in not_approved_page and
        all(value in review_page and value in approved_page and value in not_approved_page
            for value in ("۴۰۰٬۰۰۰٬۰۰۰ تومان", "طرح عمومی")) and
        '۲۰٬۵۰۰٬۰۰۰ تومان' in review_page and
        '۲۰٬۵۰۰٬۰۰۰ تومان' in approved_page and
        '۱۰۰٬۰۰۰٬۰۰۰ تومان' in review_page and
        '۱۰۰٬۰۰۰٬۰۰۰ تومان' in approved_page and
        'نتیجه واقعی از بانک دریافت نشده است' in not_approved_page,
        "financing preview must preserve general/staff plan across consent, bank review and both results")
require('disabled={!agreed}' in consent_code and
        'onChange={(event) => setAgreed(event.target.checked)}' in consent_code and
        'href="/user/contracts"' in review_page,
        "financing preview outcome links must not bypass the confirmation consent")

membership_css = read(USER_ROOT / "contracts/register/plans/membership/page.module.css")
require('.headerRight { min-width: 0; flex: 0 1 auto;' in membership_css and
        '.headerRight h1, .headerRight p { width: 100%; text-align: right; direction: rtl; }' in membership_css and
        'className={styles.headerRight}' in membership_page,
        "membership heading and greeting must occupy the right edge away from the top-left back arrow")
require('assets.radioActive' not in membership_page and
        'figma.com/api/mcp/asset/' not in membership_page and
        'className={styles.radioActive} aria-hidden="true"' in membership_page and
        'className={styles.radio} aria-hidden="true"' in membership_page and
        '.radioActive::after { content: "";' in membership_css and
        'background: var(--ch-color-primary);' in membership_css,
        "membership selected radio must remain visible as a local brand-green CSS circle")

membership_result = read(USER_ROOT / "contracts/register/plans/membership/result/page.tsx")
membership_result_css = read(USER_ROOT / "contracts/register/plans/membership/result/page.module.css")
require('"use client";' in membership_page and
        'useState<MembershipPlanId>("once")' in membership_page and
        'type="radio" name="membership-plan"' in membership_page and
        'checked={selected}' in membership_page and
        'onChange={onSelect}' in membership_page and
        'onSelect={() => setSelectedPlan(plan.id)}' in membership_page and
        'selected={selectedPlan === plan.id}' in membership_page and
        "id: \"once\"" in membership_page and
        "id: \"twice\"" in membership_page and
        'id: "twice-high"' in membership_page and
        '.planCard:focus-within {' in membership_css and
        '.planInput {' in membership_css,
        "all three membership plan cards must be single-choice, interactive and keyboard accessible")
require('membership/result?plan=${selectedPlan}' in membership_page and
        'پرداخت (نمونه)' in membership_page and
        'searchParams: Promise<{ plan?: string }>' in membership_result and
        'const choice = membershipChoices[chosenId];' in membership_result and
        'plan === "twice" || plan === "twice-high"' in membership_result and
        '["مبلغ نمونه", choice.amount, true]' in membership_result and
        '["سقف تأمین مالی", choice.cap, false]' in membership_result and
        'سهمیه انتخابی: {choice.uses}' in membership_result,
        "membership preview route must show the actually selected plan and price")
require('هیچ پرداخت یا فعال‌سازی واقعی عضویت انجام نشده است.' in membership_result and
        'حق عضویت با موفقیت پرداخت شد' not in membership_result and
        'assets.check' not in membership_result and
        'src="/brand/financing-review-check.svg"' in membership_result and
        '.previewNote {' in membership_result_css and
        '.checkCircle img { width: 14px; height: 14px; display: block; }' in membership_result_css and
        'href="/user/contracts/register/plans/contribution"' in membership_page,
        "membership buttons must keep the existing illustrative contribution route without claiming a real payment")

contribution_page = read(USER_ROOT / "contracts/register/plans/contribution/page.tsx")
contribution_css = read(USER_ROOT / "contracts/register/plans/contribution/page.module.css")
require('<h1 data-node-id="150:1324">پرداخت آورده</h1><span className={styles.approvedBadge}>تأیید شده</span>' in contribution_page and
        '.titleRow { width: 100%; display: flex; align-items: center; justify-content: flex-start; gap: 12px; direction: rtl; text-align: right; }' in contribution_css and
        '.pageHeader { width: 100%; display: flex; flex-direction: column; align-items: stretch; gap: 8px; direction: rtl; text-align: right; }' in contribution_css,
        "contribution heading must precede status badge at the right of the RTL header")
require('assets.heroCheck' not in contribution_page and
        'assets.check' not in contribution_page and
        'figma.com/api/mcp/asset/' not in contribution_page and
        contribution_page.count('src="/brand/financing-review-check.svg"') == 2 and
        '.heroIcon { width: 48px; height: 48px; flex: 0 0 48px; display: inline-flex; align-items: center; justify-content: center; background: var(--ch-color-primary);' in contribution_css and
        '.heroIcon img { width: 14px; height: 14px; display: block; }' in contribution_css,
        "contribution membership banner and timeline checks must use permanent local SVG")

final_confirmation = read(USER_ROOT / "contracts/register/plans/final-confirmation/page.tsx")
final_css = read(USER_ROOT / "contracts/register/plans/final-confirmation/page.module.css")
final_consent = read(USER_ROOT / "contracts/register/plans/final-confirmation/FinalConfirmationConsent.tsx")
require('<h1 data-node-id="150:1494">تأیید نهایی قرارداد</h1><span className={styles.paidBadge} data-node-id="150:1495">آورده پرداخت شده (نمونه)</span>' in final_confirmation and
        '.titleRow { width: 100%; display: flex; align-items: center; justify-content: flex-start; gap: 12px; direction: rtl; text-align: right; }' in final_css and
        '.pageHeader { width: 100%; display: flex; flex-direction: column; align-items: stretch; gap: 8px; direction: rtl; text-align: right; }' in final_css,
        "final-confirmation heading must appear to the right of the status badge with header RTL")
require('const toPersianDigits = (value: string) =>' in final_confirmation and
        'value.replace(/[0-9٠-٩]/g,' in final_confirmation and
        '{renderPersianValue(value)}' in final_confirmation and
        '{renderPersianValue("۵۰٬۰۰۰٬۰۰۰")}' in final_confirmation and
        '{renderPersianValue("۱۲۳۴۵۶۷۸۹")}' in final_confirmation and
        'renderPersianValue(step.number ?? "")' in final_confirmation,
        "final-confirmation sample figures, reference and step numbers should be Persian digits")
require('className={styles.successIcon}><img src="/brand/financing-review-check.svg"' in final_confirmation and
        final_confirmation.count('src="/brand/financing-review-check.svg"') == 2 and
        'figma.com/api/mcp/asset/' not in final_confirmation and
        '.successTop { width: 100%; display: flex; align-items: center; gap: 16px; direction: ltr; }' in final_css and
        '.successIcon { width: 48px; height: 48px; flex: 0 0 48px; display: inline-flex; align-items: center; justify-content: center; background: var(--ch-color-primary);' in final_css and
        '.successIcon img { width: 14px; height: 14px; display: block; }' in final_css,
        "final confirmation banner icon must be permanent, branded and on the left")
require('<FinalConfirmationConsent />' in final_confirmation and
        'styles.checkbox' not in final_confirmation and
        final_consent.count('type="checkbox"') == 1 and
        'useState(false)' in final_consent and
        'checked={confirmed}' in final_consent and
        'onChange={(event) => setConfirmed(event.target.checked)}' in final_consent and
        'disabled={!confirmed}' in final_consent and
        'router.push("/user/contracts/register/plans/waiting-owner")' in final_consent and
        '.confirmationRow { width: 100%; display: grid; grid-template-columns: 20px minmax(0, 1fr);' in final_css and
        'direction: rtl; cursor: pointer; }' in final_css and
        '.confirmationCheckbox:checked::after { content: "✓";' in final_css,
        "final confirmation must use one right-aligned interactive checkbox gating the existing sample route")
require('پرداخت واقعی ثبت نشده' in final_confirmation and
        'شناسهٔ نمونه:' in final_confirmation,
        "final confirmation payment and reference should be identified as illustrative")
require('function renderPersianValue(value: string)' in final_confirmation and
        'className={styles.persianNumber}' in final_confirmation and
        'dir="ltr"' in final_confirmation and
        '.persianNumber { direction: ltr; unicode-bidi: isolate;' in final_css and
        'const previewNextSteps = [' in final_confirmation and
        '<bdi dir="ltr">{toPersianDigits(String(index + 1))}</bdi>' in final_confirmation and
        '<span className={styles.stepPeriod}>.</span>' in final_confirmation and
        '.nextSteps ol {' in final_css and 'list-style: none;' in final_css and
        '.stepNumber { display: inline-flex; flex-direction: row;' in final_css and
        'justify-content: flex-start; color: var(--ch-color-primary);' in final_css and
        'direction: rtl; unicode-bidi: isolate; text-align: right; }' in final_css and
        '.stepPeriod { direction: ltr; unicode-bidi: isolate; }' in final_css,
        "final confirmation must isolate Persian numeric runs and render Persian ordered-step digits explicitly")
require(final_confirmation.count('className={styles.nationalId} dir="ltr"') == 2 and
        '{toPersianDigits("۰۰۱•••••۷۸۹")}' in final_confirmation and
        '{toPersianDigits("۰۰۲•••••۴۵۶")}' in final_confirmation and
        '.nationalId { direction: ltr; unicode-bidi: isolate;' in final_css and
        '.party p { display: flex; align-items: baseline; justify-content: flex-start; gap: 6px; direction: rtl;' in final_css,
        "final confirmation must keep Persian national-ID labels RTL and masked digits in LTR order")

waiting_owner = read(USER_ROOT / "contracts/register/plans/waiting-owner/page.tsx")
waiting_owner_css = read(USER_ROOT / "contracts/register/plans/waiting-owner/page.module.css")
require('<div className={styles.nextStepHeader} data-node-id="171:324"><img src={assets.info} alt="" width={20} height={20} /><h2 data-node-id="171:325">مرحله بعد</h2></div>' in waiting_owner and
        '.nextStep { width: 100%; display: flex; flex-direction: column; gap: 12px; padding: 20px; background: #f0f7f6; border: 1px solid #c2e2df; border-radius: 16px; direction: rtl; text-align: right; }' in waiting_owner_css and
        '.nextStepHeader { width: 100%; display: flex; align-items: center; justify-content: flex-start; gap: 8px; direction: rtl; text-align: right; }' in waiting_owner_css,
        "waiting-owner next-step box icon and heading must align together at its right edge")
require('<div className={styles.notice} data-node-id="171:339"><img src={assets.alert} alt="" width={16} height={16} /><span data-node-id="171:340">در حال حاضر اقدامی از طرف شما لازم نیست.</span></div>' in waiting_owner and
        '.notice { display: flex; align-items: center; justify-content: flex-start; gap: 8px; color: var(--ch-color-muted); font-size: 14px; direction: rtl; text-align: right; }' in waiting_owner_css and
        '.bottomActions { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding-top: 24px; border-top: 1px solid var(--ch-color-border); direction: ltr; }' in waiting_owner_css and
        '.completedList > div { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px; direction: ltr; }' in waiting_owner_css,
        "waiting-owner footer notice must align icon and text right; buttons and green badges must stay unchanged")

owner_connected = read(USER_ROOT / "contracts/123456789012/owner/connected/page.tsx")
owner_flow_css = read(USER_ROOT / "contracts/123456789012/owner/flow.module.css")
require('function InfoIcon({ size = 20 }:' in owner_connected and
        'className={`${styles.infoHeader} ${styles.connectedInfoHeader}`}' in owner_connected and
        '<InfoIcon /><h3 data-node-id="170:380">مرحله بعد</h3>' in owner_connected and
        '<div className={styles.bottomNote}><InfoIcon size={16} />' in owner_connected and
        'figma.com/api/mcp/asset/' not in owner_connected and
        '.connectedInfoHeader { justify-content: flex-start; gap: 8px; direction: rtl; text-align: right; }' in owner_flow_css and
        '.connectedInfoHeader svg { width: 20px; height: 20px;' in owner_flow_css,
        "owner-connected next step icon must render permanently on the right without changing other owner routes")
require('<Link href="/user/contracts/123456789012/owner/settlement-preference" className={styles.primaryButton}>پیش‌نمایش مرحله بعد: انتخاب روش دریافت</Link>' in owner_connected and
        'بدون بررسی واقعی وضعیت مستأجر' in owner_connected and
        'در انتظار تکمیل فرایند مستأجر' in owner_connected,
        "owner connected waiting fixture must provide clearly labeled demo-only navigation to receipt selection")
require('<span className={styles.connectedNationalId}><span>کد ملی:</span><bdi dir="ltr" className={styles.connectedNationalIdValue}>۰۰۱•••••۷۸۹</bdi></span>' in owner_connected and
        '.connectedNationalId { display: inline-flex; align-items: baseline; gap: 6px; direction: rtl; text-align: right; }' in owner_flow_css and
        '.connectedNationalIdValue { direction: ltr; unicode-bidi: isolate; white-space: nowrap; text-align: left; }' in owner_flow_css and
        '<strong>علی رضایی</strong>' in owner_connected,
        "owner-connected masked national-ID value must be LTR while its Persian label and tenant name stay RTL")
require('const toPersianDigits = (value: number) =>' in owner_connected and
        'String(value).replace(/[0-9]/g,' in owner_connected and
        '>{toPersianDigits(index + 1)}</span><div className={styles.timelineCopy}>' in owner_connected and
        '>{index + 1}</span><div className={styles.timelineCopy}>' not in owner_connected,
        "owner-connected five process step numbers must display Persian digits")

owner_final = read(USER_ROOT / "contracts/123456789012/owner/final-confirmation/page.tsx")
owner_flow_css = read(USER_ROOT / "contracts/123456789012/owner/flow.module.css")
require('className={`${styles.page} ${styles.ownerFinalRtl}`}' in owner_final and
        '<div className={styles.titleCopy}><h1 data-node-id="150:1845">تأیید نهایی قرارداد</h1>' in owner_final and
        '.ownerFinalRtl .titleBlock { direction: rtl; justify-content: flex-start;' in owner_flow_css and
        '.ownerFinalRtl .titleCopy h1, .ownerFinalRtl .titleCopy p { width: 100%; text-align: right; }' in owner_flow_css,
        "owner final confirmation heading and badges must be RTL with heading first")
require('<h2 data-node-id="150:1931">وضعیت مستأجر</h2><div className={styles.badges}>' in owner_final and
        '<h2 data-node-id="150:1940">تأمین مالی قرارداد</h2><span className={styles.badgeSuccess}>' in owner_final and
        '.ownerFinalRtl .cardHeader, .ownerFinalRtl .selectedPayoutHeader {' in owner_flow_css and
        '.ownerFinalRtl .summaryGrid { direction: rtl; }' in owner_flow_css and
        '.ownerFinalRtl .row { direction: rtl; }' in owner_flow_css,
        "owner final confirmation cards and label-value rows must be right aligned")
require(owner_final.count('<div className={styles.processCompactRow}><div className={styles.processContent}>') == 5 and
        '<div className={styles.processContent}><span className={styles.processCheck}>✓</span><strong>تأیید بانک</strong></div>' in owner_final and
        '.ownerFinalRtl .processCompactRow { direction: rtl; text-align: right; }' in owner_flow_css and
        '.ownerFinalRtl .processContent { min-width: 0; direction: rtl; text-align: right; }' in owner_flow_css,
        "owner final confirmation process icon and stage labels must start at the right")
require(owner_final.count('className={styles.ownerFinalIdValue}>') == 3 and
        owner_final.count('dir="ltr" className={styles.ownerFinalIdValue}') == 3 and
        '.ownerFinalRtl .ownerFinalNationalId {' in owner_flow_css and
        '.ownerFinalRtl .ownerFinalIdValue { direction: ltr; unicode-bidi: isolate; white-space: nowrap; text-align: left; }' in owner_flow_css and
        '<OwnerFinalConfirmationConsent method={method} />' in owner_final and
        'href="/user/contracts/123456789012/owner/settlement-preference"' in owner_final,
        "owner final confirmation IDs must be LTR, keeping preview links unchanged")
require('.ownerFinalRtl .checkboxRow { direction: rtl; justify-content: flex-start; text-align: right; }' in owner_flow_css and
        '.ownerFinalRtl .partyGrid { direction: rtl; }' in owner_flow_css and
        '.ownerFinalRtl .party, .ownerFinalRtl .partyTop { direction: rtl; text-align: right; }' in owner_flow_css and
        '<UserPanelSidebar nodeId="142:1528" />' in owner_final,
        "owner final confirmation consent and party rows RTL without changing the sidebar")

require(owner_final.count('<span className={`${styles.processIcon} ${styles.processIconCurrent}`} aria-hidden="true"><svg') == 1 and
        owner_final.count('<span className={`${styles.processIcon} ${styles.processIconWaiting}`} aria-hidden="true"><svg') == 1 and
        'assets.current' not in owner_final and
        'assets.waiting' not in owner_final and
        'www.figma.com/api/mcp/asset/' not in owner_final and
        '.ownerFinalRtl .processIconCurrent {' in owner_flow_css and
        '.ownerFinalRtl .processIconWaiting {' in owner_flow_css and
        '.ownerFinalRtl .processIcon svg {' in owner_flow_css,
        "owner final process action and waiting icons must be built-in SVGs and not broken external Figma images")

owner_final_consent = read(USER_ROOT / "contracts/123456789012/owner/final-confirmation/OwnerFinalConfirmationConsent.tsx")
require('import { OwnerFinalConfirmationConsent } from "./OwnerFinalConfirmationConsent";' in owner_final and
        owner_final.count('<OwnerFinalConfirmationConsent method={method} />') == 1 and
        'className={styles.checkbox}>✓' not in owner_final and
        owner_final_consent.startswith('"use client";') and
        owner_final_consent.count('type="checkbox"') == 1 and
        'useState(false)' in owner_final_consent and
        'checked={accepted}' in owner_final_consent and
        'onChange={(event) => setAccepted(event.target.checked)}' in owner_final_consent and
        'disabled={!accepted}' in owner_final_consent and
        'router.push(`/user/contracts/123456789012/owner?method=${method}`)' in owner_final_consent and
        'method }: { method: "monthly" | "fund" }' in owner_final_consent,
        "owner final contract confirmation must use one interactive unchecked-by-default consent gating demo navigation")
require('className={styles.ownerFinalConsentRow}' in owner_final_consent and
        'className={styles.ownerFinalConsentCheckbox}' in owner_final_consent and
        '.ownerFinalRtl .ownerFinalConsentRow {' in owner_flow_css and
        'grid-template-columns: 20px minmax(0, 1fr);' in owner_flow_css and
        '.ownerFinalRtl .ownerFinalConsentCheckbox:checked {' in owner_flow_css and
        '.ownerFinalRtl .ownerFinalConsentCheckbox:checked::after {' in owner_flow_css and
        '.ownerFinalRtl .primaryButton:disabled {' in owner_flow_css and
        '.ownerFinalRtl .primaryButton:focus-visible {' in owner_flow_css,
        "owner final consent checkbox and disabled button must be styled RTL and brand green only for this route")

owner_settlement = read(USER_ROOT / "contracts/123456789012/owner/settlement-preference/page.tsx")
owner_active = read(USER_ROOT / "contracts/123456789012/owner/page.tsx")
owner_active_css = read(USER_ROOT / "contracts/123456789012/owner/page.module.css")
receive_pay = read(USER_ROOT / "receive-pay/page.tsx")
shared_sidebar = read(ROOT / "apps/web/src/components/user/UserPanelSidebar.tsx")
shared_exit = read(ROOT / "apps/web/src/components/user/UserPanelExit.tsx")
require('<section id="owner-property-info" className={styles.card} data-node-id="161:190">' in owner_active and
        '<a href="#owner-property-info">‹ <span>مشاهده اطلاعات ملک</span></a>' in owner_active and
        '<div>‹ <span>مشاهده اطلاعات ملک</span></div>' not in owner_active and
        '.quickActions > a, .quickActions > div {' in owner_active_css and
        owner_active.count('href={`/user/receive-pay?method=${fund ? "fund" : "monthly"}`}') == 3 and
        'export default async function ReceivePayPage(' in receive_pay and
        '<ReceivePayActivities method={method === "fund" || method === "monthly" ? method : undefined} />' in receive_pay and
        all('href: "' + target + '"' in shared_sidebar for target in
            ('/user/home', '/user/contracts', '/user/receive-pay', '/user/account')) and
        'href={href}' in shared_sidebar and
        'href="/login"' in shared_exit,
        "owner active preview must have working property anchor, three receipt-history/payment links and shared sidebar destinations")


require('action: "بررسی و تأیید", href: "/user/contracts/123456789012/owner/settlement-preference"' in contracts_text and
        'action: "بررسی و تأیید", href: "/user/contracts/123456789012/owner/final-confirmation"' not in contracts_text and
        'href="/user/contracts/123456789012/owner/settlement-preference"' in owner_final,
        "owner review CTA must visit receipt model selection before final confirmation")
require(owner_settlement.startswith('"use client";') and
        'const [method, setMethod] = useState<ReceiptMethod>("monthly");' in owner_settlement and
        'onClick={() => setMethod("monthly")}' in owner_settlement and
        'onClick={() => setMethod("fund")}' in owner_settlement and
        'aria-pressed={isMonthly}' in owner_settlement and
        'aria-pressed={!isMonthly}' in owner_settlement and
        'final-confirmation?method=${method}' in owner_settlement and
        'owner?method=${method}' in owner_settlement and
        '{isMonthly ? "دریافت ماهانه" : "تجمیع دریافتی در صندوق"}' in owner_settlement and
        '.ownerSettlementChoice .optionCard {' in owner_flow_css and
        '.ownerSettlementChoice .optionCard:focus-visible {' in owner_flow_css,
        "owner receipt options must both be selectable with visible selected state and forward chosen model")
require('searchParams: Promise<{ method?: string }>' in owner_final and
        'const method = (await searchParams).method === "monthly" ? "monthly" : "fund";' in owner_final and
        '<OwnerFinalConfirmationConsent method={method} />' in owner_final and
        '{isMonthly ? "دریافت ماهانه" : "تجمیع دریافتی در صندوق"}' in owner_final and
        '{!isMonthly && <div className={styles.row}>' in owner_final and
        'router.push(`/user/contracts/123456789012/owner?method=${method}`)' in owner_final_consent and
        'const fund = (await searchParams).method === "fund";' in owner_active and
        '{fund ? "تجمیع دریافتی در صندوق" : "دریافت ماهانه"}' in owner_active,
        "owner selected receipt method must survive confirmation and appear consistently on active demo contract")


# The receive/pay screen is preview-only. Its controls must be operable and
# its simulated receipts must follow the clicked row rather than a fixed fixture.
receive_pay_controls = read(USER_ROOT / "receive-pay/ReceivePayActivities.tsx")
receive_pay_fixtures = read(USER_ROOT / "receive-pay/demo-transactions.ts")
receive_pay_css = read(USER_ROOT / "receive-pay/page.module.css")
payment_result = read(USER_ROOT / "receive-pay/result/page.tsx")
payment_receipt = read(USER_ROOT / "receive-pay/receipt/page.tsx")
payment_receipt_actions = read(USER_ROOT / "receive-pay/receipt/ReceiptActions.tsx")
require('aria-label="فیلتر وضعیت تراکنش"' in receive_pay_controls and
        'onChange={event => setStatus(event.target.value as StatusFilter)}' in receive_pay_controls and
        'onClick={() => setKind(value)}' in receive_pay_controls and
        'aria-pressed={kind === value}' in receive_pay_controls and
        'visible.length === 0' in receive_pay_controls and
        'item.href + "&method=" + method' in receive_pay_controls and
        'className={styles.emptyState}' in receive_pay_controls and
        '.emptyState {' in receive_pay_css,
        "receive/pay kind/status filters and empty state must respond to user input")
require('"/user/receive-pay/result?transaction=overdue"' in receive_pay_fixtures and
        '"/user/receive-pay/result?transaction=due"' in receive_pay_fixtures and
        '"/user/receive-pay/receipt?transaction=paid-mehr"' in receive_pay_fixtures and
        '"/user/receive-pay/receipt?transaction=owner-ponak"' in receive_pay_fixtures and
        'href: "/user/contracts"' in receive_pay_fixtures and
        'button type="button" className={styles.terminatedAction}' not in receive_pay and
        'href="/user/contracts/123456789012/terminated"' in receive_pay and
        'showTerminationScenario && <section className={styles.terminationCard}' in receive_pay and
        'const showTerminationScenario = params.scenario === "termination";' in receive_pay and
        '<section className={styles.terminationCard}' not in receive_pay.replace('showTerminationScenario && <section className={styles.terminationCard}', ''),
        "each sample transaction row and termination scenario must have a working destination")
require('previews[selected]' in payment_result and
        'const backHref = "/user/receive-pay" + (method ? "?method=" + method : "");' in payment_result and
        '"&method=" + method' in payment_result and
        'const backHref = "/user/receive-pay" + (method ? "?method=" + method : "");' in payment_receipt and
        'transaction === "overdue" ? "overdue" : "due"' in payment_result and
        '"/user/receive-pay/receipt?transaction=" + selected' in payment_result and
        'هیچ تراکنش بانکی انجام نشده است' in payment_result and
        'preview.amount' in payment_result and
        'preview.date' in payment_result and
        'receiptKey(params.transaction)' in payment_receipt and
        'previews[key]' in payment_receipt and
        'preview.role === "مالک" ? "/user/contracts" : "/user/contracts/123456789012"' in payment_receipt and
        'هیچ تراکنش بانکی واقعی ثبت نشده است' in payment_receipt,
        "sample result and receipt must match clicked transaction without claiming real payment")
require(payment_receipt_actions.startswith('"use client";') and
        'onClick={() => window.print()}' in payment_receipt_actions and
        'onClick={saveImage}' in payment_receipt_actions and
        'canvas.toBlob(' in payment_receipt_actions and
        'image/png' in payment_receipt_actions and
        'onClick={share}' in payment_receipt_actions and
        'navigator.share' in payment_receipt_actions and
        'navigator.clipboard' in payment_receipt_actions and
        'role="status" aria-live="polite"' in payment_receipt_actions,
        "receipt print, PNG save and share/copy fallback must perform real browser actions")
require('const fund = method === "fund";' in receive_pay and
        'پیش‌نمایش مالک سعادت‌آباد' in receive_pay and
        'method === "monthly" || fund' in receive_pay and
        'سناریوی نمونه فسخ' in receive_pay,
        "payment screen must retain owner method context and disclose separate sample termination")



# The generic receive/pay table must keep one RTL column order for headers
# and data cells, while termination warning is only on explicitly requested scenario.
tenant_terminated = read(USER_ROOT / "contracts/123456789012/terminated/page.tsx")
owner_terminated = read(USER_ROOT / "contracts/123456789012/owner/terminated/page.tsx")
require('<span>نوع</span><span>قرارداد</span><span>شرح</span><span>مبلغ</span>' in receive_pay_controls and
        '<span>تاریخ</span><span>وضعیت</span><span>عملیات</span>' in receive_pay_controls and
        receive_pay_controls.index('<span>نوع</span><span>قرارداد</span>') <
        receive_pay_controls.index('>{item.kind}</span>') <
        receive_pay_controls.index('>{item.contract}</strong>') <
        receive_pay_controls.index('>{item.description}</span>') <
        receive_pay_controls.index('>{item.amount}</strong>') <
        receive_pay_controls.index('>{item.date}</span>') <
        receive_pay_controls.index('>{item.status}</span>') <
        receive_pay_controls.index('>{item.action}</Link>') and
        'direction: rtl;' in receive_pay_css.split('.tableRow {', 1)[1].split('}', 1)[0] and
        'grid-template-columns: minmax(88px, 0.7fr)' in receive_pay_css and
        '.badgeCell, .actionCell { display: flex; align-items: center; justify-content: flex-start; direction: rtl; text-align: right; }' in receive_pay_css and
        '.badgeCell > .badge { width: fit-content; flex: 0 0 auto; }' in receive_pay_css and
        '.contractCell { width: 100%; align-items: flex-start; direction: rtl; text-align: right; gap: 2px; }' in receive_pay_css and
        '<span className={styles.badgeCell}><span className={[styles.badge, styles["badge_" + item.kindTone]].join(" ")}' in receive_pay_controls and
        '<span className={styles.badgeCell}><span className={[styles.badge, styles["badge_" + item.statusTone]].join(" ")}' in receive_pay_controls and
        'href="/user/receive-pay?scenario=termination"' in tenant_terminated and
        'href="/user/receive-pay?scenario=termination"' in owner_terminated,
        "receive/pay headers and rows must have matching RTL columns and scenario must be opt-in")


# Figma Web App / Calculator (150:588) was previously a fully static image
# fixture, despite the home quick link and financing-plan discovery route.
calculator_page = read(USER_ROOT / "calculator/page.tsx")
calculator_css = read(USER_ROOT / "calculator/page.module.css")
require('"use client";' in calculator_page and
        'useState(EXAMPLE_DEPOSIT)' in calculator_page and
        'useState(20_000_000)' in calculator_page and
        'type="range"' in calculator_page and
        'type="number"' in calculator_page and
        'onChange={(event) => setAmount(Number(event.target.value))}' in calculator_page and
        'setAmount(clamp(Number(event.target.value), max))' in calculator_page and
        'const minFinancing = Math.round(deposit * 0.7);' in calculator_page and
        'const maxFinancing = Math.round(deposit * 0.9);' in calculator_page and
        'const contribution = deposit - maxFinancing;' in calculator_page and
        'const monthly = Math.round((18_500_000 * deposit) / EXAMPLE_DEPOSIT);' in calculator_page and
        'money(rent)' in calculator_page and
        'figma.com/api/mcp/asset/' not in calculator_page and
        'styles.gaugeTrack' in calculator_page and
        '.rangeInput::-webkit-slider-thumb {' in calculator_css and
        'فرمول بانک' in calculator_page and
        'href="/user/contracts/register/plans"' in calculator_page and
        'href="/user/calculator"' in plans_page,
        "calculator must be accessible from financing plans, interactive and clearly sample-only")


if failures:
    print("\n".join("ERROR: " + issue for issue in failures))
    raise SystemExit(1)
print(f"Web user RTL verified: {panel_count} preview shells, {len(styles_checked)} CSS modules, 4 account dialogs")
