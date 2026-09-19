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

panel_pages = sorted(USER_ROOT.rglob("page.tsx"))
require(len(panel_pages) >= 30, "expected complete web user route set, including owner and tenant flows")
panel_count = 0
styles_checked: set[Path] = set()

for path in panel_pages + [SCAFFOLD]:
    text = read(path)
    if "<aside className={styles.sidebar}" not in text:
        continue
    panel_count += 1
    name = path.relative_to(ROOT)
    require(text.count("<UserPanelExit />") == 1, f"{name}: one shared footer exit required")
    require('import { UserPanelExit } from "@/components/user/UserPanelExit";' in text, f"{name}: import shared exit")
    require(not re.search(r"<div className=\{styles\.(?:profile|sidebarProfile)\}", text),
            f"{name}: remove static name and phone from sidebar")
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
    for token in (
        ".mainContent { direction: rtl; text-align: right; }",
        ".sidebar { direction: rtl; text-align: right; }",
        ".navItem { direction: ltr; text-align: right; }",
        ".navItem > span { direction: rtl; text-align: right; }",
    ):
        require(token in css, f"{css_file.relative_to(ROOT)}: missing shared RTL rule: {token}")

require(panel_count >= 30, f"insufficient user panel pages/scaffold with shared exit: {panel_count}")
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
require(".sidebarLogo { justify-content: center; }" in home_css,
        "home sidebar logo must be centered")
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
require('<span className={styles.alertBadge}>۱</span>' not in contracts_text,
        "contracts tab must not show a static 1 alert badge")
require(".logoWrap { justify-content: center; }" in contracts_css and
        bool(re.search(r"\.contractHeader,\s*\.contractBottom\s*\{[^}]*direction:\s*rtl\s*;", contracts_css)),
        "contracts logo and card layout must align to right")

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
    require(f'{name}: "/brand/{filename}"' in contracts_text,
            f"contracts {name} must use its permanent same-origin asset")
require("figma.com/api/mcp/asset/" not in contracts_text,
        "contracts page must not depend on expiring Figma image URLs")

register_text = read(USER_ROOT / "contracts/register/page.tsx")
register_css = read(USER_ROOT / "contracts/register/page.module.css")
require('<span className={styles.alertBadge}>۱</span>' not in register_text and
        '<span className={styles.navSpacer} /><span>قراردادها</span>' in register_text,
        "tracking-code register contracts nav must have no static orange one")
require(".logoWrap { width: 100%; display: flex; justify-content: center; }" in register_css and
        register_css.rstrip().endswith(".logoWrap { justify-content: center; }"),
        "tracking-code register sidebar logo must remain centered after final RTL CSS override")
for asset_name, asset_file in contracts_assets.items():
    require(f'{asset_name}: "/brand/{asset_file}"' in register_text,
            f"tracking-code register must reuse stable {asset_name} asset")
require("figma.com/api/mcp/asset/" not in register_text,
        "tracking-code register must not rely on expiring Figma assets")

if failures:
    print("\n".join("ERROR: " + issue for issue in failures))
    raise SystemExit(1)
print(f"Web user RTL verified: {panel_count} preview shells, {len(styles_checked)} CSS modules, 4 account dialogs")
