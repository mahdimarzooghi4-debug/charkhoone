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

if failures:
    print("\n".join("ERROR: " + issue for issue in failures))
    raise SystemExit(1)
print(f"Web user RTL verified: {panel_count} preview shells, {len(styles_checked)} CSS modules, 4 account dialogs")
