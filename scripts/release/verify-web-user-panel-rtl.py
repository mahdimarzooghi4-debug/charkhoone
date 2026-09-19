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
require('<Link href="/user/contracts/123456789012/owner/final-confirmation" className={styles.actionButton}>بررسی قرارداد</Link>' in home_text,
        "review contract CTA must open existing owner final-confirmation preview")

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
        all(bool(re.search(r'<div>\\s*<span>' + re.escape(label) +
                            r'</span>\\s*<strong(?:\\s+className=\\{styles\\.contextRegular\\})?>' +
                            re.escape(value) + r'</strong>\\s*</div>', context_markup))
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

if failures:
    print("\n".join("ERROR: " + issue for issue in failures))
    raise SystemExit(1)
print(f"Web user RTL verified: {panel_count} preview shells, {len(styles_checked)} CSS modules, 4 account dialogs")
