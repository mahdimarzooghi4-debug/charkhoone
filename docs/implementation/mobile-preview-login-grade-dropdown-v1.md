# Mobile preview corrections — login, launcher icon, and grade dropdown (2026-10-23)

## Approved UX
- An **explicitly opted-in** web/mobile demo must show mobile-number entry and an OTP **visual preview** before the rest of the mocked app. The entry is not a real login, does not send SMS, does not assert mobile ownership, and does not collect national ID. Internal preview deep links require a completed local entry step; a direct OTP deep link requires a valid 11-digit locally entered demonstration mobile number.
- Real, non-demo mobile builds keep the existing OIDC + PKCE sign-in and secure token lifecycle. They do not invent an in-app OTP provider.
- The Android **adaptive launcher icon background** is configured as white (#FFFFFF), instead of green (#0D3B36). Existing image assets and colors of the entire UI are not rebranded by this setting.
- A single tap-to-open dropdown replaces the 15 always-visible grade tiles in the mobile calculator. It lists all A1–E3 grades with financing caps: A=55%, B=45%, C=40%, D=35%, E=30%. The default remains C3 at 40%; every selection continues to be **self-reported, unverified**, calculator-only, and free. No paid banking inquiry is triggered.

## Code boundaries
- `apps/mobile/app/index.tsx` now routes opt-in preview web and separately labeled demo APK to `/preview/login`. Non-demo entry remains `/(auth)/login`; this is not an OIDC bypass.
- `apps/mobile/app/preview/_layout.tsx` gates all preview routes, including direct links and refresh, based on transient in-memory demo state.
- `apps/mobile/app/preview/login.tsx`, `otp.tsx`, and `src/preview/MockPreviewAuthScreen.tsx` implement the two simulated screens using no real SMS or paid provider call. Phone input stays only in component/provider memory until the preview reloads.
- `src/preview/MockTenantCalculatorScreen.tsx` provides an accessible collapsed grade button, modal dropdown and exact ratio selection.
- `apps/mobile/app.json` sets `expo.android.adaptiveIcon.backgroundColor` to white. This is a **build-time native launcher setting**. It cannot change an existing installed APK; the next Android native build/reinstall is required. The referenced icon PNGs are not present in the reviewed GitHub tree, so a native APK asset validation and launcher visual QA are still required before claiming the icon is visually fixed in a delivered APK.
- Regression checks in `scripts/release/verify-mobile-mock-preview.py` pin entry sequencing, preview isolation, white adaptive icon setting, and all 15 financial ratios.

## Design handoff
Figma file `kIJQxlRhLRhjCCckMfcmsa`, tenant mobile page `41:2`:
- Login / Mobile Number `41:8`
- OTP Verification `39:26`
- Calculator / Manual Estimate `65:55`

The existing Figma login → OTP → Home prototype order was already corrected in the previous pass. The current calculator Figma frame predates the 15 visible grade tiles, so it still needs the new **single collapsed dropdown** represented as an editable control with a C3 — ۴۰٪ closed state and a list of fifteen options. A write attempt was blocked by the Figma MCP Starter-plan tool call limit on 2026-10-23; the Figma calculator frame has **not** been edited by this PR. This is a documented design reconciliation follow-up rather than a claim of completed design sync.

## Release boundary
This PR is Draft/Open pending exact-head CI, code review and explicit release approval. Neither the web demo nor the Android demo implements real SMS, national-phone verification, Khodnevis provider inquiry, or authenticated banking.
