# Tenant mobile MOCK — Figma navigation and local web preview

Source: [03 - Tenant Mobile, Figma node 41:2](https://www.figma.com/design/kIJQxlRhLRhjCCckMfcmsa/charkhooneh-platform?node-id=41-2).

## One command for local review

Use only the isolated `charkhoone-mobile-tenant` worktree; do not run commands in the primary charkhoone checkout.

```powershell
cd "C:\Users\ASUS\source\repos\mahdimarzooghi4-debug\charkhoone-mobile-tenant"
git pull --ff-only origin ux/mobile-tenant-preview-clean-v1
cd .\apps\mobile
npm.cmd run preview:web
```

Keep that PowerShell window running and open the **Web** address printed by Expo. With `preview:web`, the local **web development** root `/` redirects to `/preview/home`. If Expo offers a different port (8082, etc.), use it instead of 8081. This script uses the locally installed Expo CLI; no global Expo install is needed. The real default `npm run start`, native entry, production bundle and explicit `/login` remain on the OIDC route. The MOCK toggle is `EXPO_PUBLIC_CHARKHOONE_MOCK_PREVIEW=1`, effective only in `__DEV__ && Platform.OS === "web"`; it never authorizes access to real API endpoints.

Do not close Expo's terminal to run Git commands. Use a second terminal for Git. `Ctrl+C` terminates the Expo server and produces `ERR_CONNECTION_REFUSED`, which is not a calculator runtime error.

## User walkthrough (screen and Figma frame)

| Browser route after `/preview/` | Figma frame | Next user action |
|---|---|---|
| `home` | 61:28 Tenant Home / New User (preview shows C3 estimate example) | «محاسبه شرایط» → calculator; «ثبت کد رهگیری» → contract-tracking |
| `calculator` | 65:55 Calculator / Manual Estimate | Adjustable cash deposit + monthly rent → calculator-result |
| `calculator-result` | 71:43 Calculator / Result | «ثبت کد رهگیری قرارداد» → contract-tracking; recalculate → calculator |
| `contract-tracking` | 79:41 Contract / Tracking Code | Sample 12-digit MOCK code → contract-lookup; **no Khodnevis inquiry** |
| `contract-lookup` | 66:382 Contract Lookup Result | Choose Owner or Tenant with selectable Figma cards: Tenant → financing-plans; Owner → owner-contract; no real party verification |
| `owner-contract` | Owner-only MOCK continuation (outside tenant Figma 41:2) | Sample owner contract summary and back to role selection; no tenant bank interest or actual owner settlement |
| `financing-plans` | 85:62 Financing / Eligible Plans | Separate financing-plan choice → plan-confirmation |
| `plan-confirmation` | 90:52 Financing / Plan Confirmation | Inspect figures → review |
| `review` | 91:53 Financing / Under Review | Demo-only approved/rejected branches |
| `rejected` | 97:85 Financing / Not Approved | Return to plans or contracts |
| `approved` | 910:126 Financing / Approved | Membership |
| `membership` | 245:228 Tenant / Membership | Select 1/2/3 uses, independent of financing → success/pending/failed |
| `membership-success`, `membership-pending`, `membership-failed` | 184:244 / 184:334 / 184:298 | Only success advances to contribution |
| `contribution` | 91:149 Financing / Contribution Required | Demo success/pending/failed |
| `contribution-success`, `contribution-pending`, `contribution-failed` | 204:425 / 204:497 / 204:464 | Only success advances to final-confirmation |
| `final-confirmation` | 93:61 Financing / Contribution Paid | Demo contract-active |
| `contracts` | 102:86 Contracts / Overview | Bottom tab, detail or new sample tracking code |
| `contract-active` | 93:213 Contract / Active | Detail or payments |
| `contract-detail` | 103:89 Contract / Detail / Tenant | Payments or plans |
| `payments` | 94:91 Payments / Overview | Bottom tab, MOCK receipt/pending/failed/terminated |
| `receipt`, `payment-pending`, `payment-failed` | 100:89 / 205:282 / 205:235 | Back to payments |
| `profile` | 104:93 Account / Profile | Bottom tab, membership or home |

All destinations above have **explicit** files in `apps/mobile/app/preview/`, so Expo Router need not infer a dynamic `[screen]` parameter for buttons or deep links. An invalid legacy link such as `/preview/undefined` returns to `/preview/home` rather than impersonating a valid contract page.

## Financial and trust boundaries

C3 baseline: 500m toman cash deposit + 20m monthly rent; monthly rent-to-deposit conversion 3%, full-deposit equivalent 1,166,666,667; 30% illustrative financing 350m and tenant contribution 816,666,667; nominal annual 23% interest-only payment **6,708,333 toman/month**. Edits to the calculator are local MOCK estimates and persist across preview screens. Bank eligibility, approval, Khodnevis identity/contract verification, membership, receipt and payment remain explicitly fictitious. The old Figma mock's 450m, 18.5m, 4%/12% figures are **not** imported as financial rules. The real authenticated app and real mobile API remain separate.

Scope caveat: The screen hierarchy and user transitions are keyed to all documented Figma frames, but this is still a **MOCK**, not a bank/payment product or a pixel-for-pixel acceptance of all 42 Figma states. Figma’s registration/login and some incidental overlays remain governed by the real auth boundary or future dedicated visual QA.

## QA checklist (iPhone 16, 393 × 852)

1. Run `preview:web`, not `start`; opening Expo’s root must land on `/preview/home`, not `/login`.
2. Home → orange button must land on `/preview/calculator`, never `/preview/undefined`.
3. Change cash deposit by +5m and monthly rent by +1m; the monthly interest-only estimate must change. Revisit calculator to verify local state.
4. Calculator → result → tracking → lookup → financing plans → confirmation → review → approved → membership → contribution → final confirmation → contract. Test rejected/pending/failed return paths too.
5. Bottom tabs: Home, Payments, Contracts (overview, not active-detail), Account. Green home notice remains right-aligned. Check device scroll without horizontal overflow.
6. Close browser then re-open preview route; direct deep links must not render the login page while Expo is active.
7. OIDC login and any bank/payment calls must **never** be triggered by MOCK buttons.

Static route/financial/opt-in safeguards: `python scripts/release/verify-mobile-mock-preview.py`; real-runtime fail-closed safeguards: `python scripts/release/verify-mobile-runtime-wiring.py`. GitHub CI typecheck and Expo export are **not** substitutes for a real browser click-through; do not merge the PR until browser acceptance.

## Visual parity pass — 21 Sep 2026

The original implementation focused on clickability; it was **not** a faithful screen-by-screen rendering. This follow-up explicitly compared Figma's structure and typography on the five core pages and the request, membership, contracts, payments and profile overviews. Changes in this branch include:

- **Calculator Result / 71:43:** actual Figma gauge asset and metrics grid, separate monthly-interest-only card, pale benefit-summary section and a fixed white action footer. Original Figma 450m/18.5m/claimed savings are not financially valid for C3 and were not copied.
- **Eligible Plans / 85:62:** pale selected-plan card with the indicator/badge, independent general-plan card and bottom pale CTA, rather than two identical generic cards. Both still show the same C3 sample rates until bank-specific terms are established.
- **Confirmation 90:52; Review 91:53; Approved 910:126; Membership 245:228; Contribution 91:149; Final 93:61:** restored Figma hierarchy of intro, status hero, status badge, key amount/next action, progress row and separate card sections. Demo-only outcomes remain clearly marked MOCK.
- **Contracts 102:86, Payments 94:91, Account 104:93:** separate summary cards, status badges, empty payment progress where appropriate, upcoming demo items and profile-avatar/account layout. Mock owner contracts never present tenant bank interest as owner income.
- Shared app bars are full-width; result and financing pages do not incorrectly show the tenant tab bar below their Figma action footer.

**Not yet accepted visually:** the Figma file contains many further detailed states and overlays. Typecheck/Expo exports and structural regression tests cannot measure pixel-perfect visual similarity, real icon loading or browser tap targets. Compare each page in Chrome iPhone 16 393×852 and capture differences against its Figma frame. Existing `apps/mobile/src/figmaAssets.ts` contains temporary Figma asset URLs which must be replaced with the exact exported bytes before merging, or visuals may break when the URLs expire.

## Owner Mobile MOCK — Figma 04 / 39:161 (21 Sep 2026)

The `04 - Owner Mobile` page contains these six (390px-wide) frames. The isolated preview now has explicit equivalent routes, separate from the authenticated `apps/mobile/app/(owner)` routes; those remain fail-closed except for read-only trusted owner contract terms.

| Preview route | Figma node | What is shown in MOCK |
|---|---|---|
| `/preview/contract-lookup` | Shared role selection `66:382` | Choose **Owner** → `owner-connected`, not tenant financing |
| `/preview/owner-connected` | `112:16` | Contract connected, owner status, masked tenant identity, contract/property and next steps |
| `/preview/owner-settlement-preference` | `136:150` | Select monthly receipt or aggregation in fund; choice preserved across screens |
| `/preview/owner-final-confirmation` | `116:140` | Recheck tenant, rental terms, bank financing C3, chosen owner settlement, and opt-in to example consent |
| `/preview/owner-active` | `118:154` | Sample active contract, next owner receipt, financing status, owner-selected settlement and property |
| `/preview/owner-receive-pay` | `118:251` | Owner receipt/pay overview, illustrative next receipt and empty real-payment history |
| `/preview/owner-terminated` | `204:345` | Sample termination; final settlement requires trusted bank/contract/arrears inputs and is **not fabricated** |
| `/preview/owner-account` | Auxiliary, not a Figma owner frame | Safe target for owner bottom navigation; no fake real identity or bank data |

Baseline monthly owner receipt **is distinct from the tenant's 6,708,333 monthly bank interest**: contract rent 20,000,000 gross, illustrative Figma service fee at 0.5% = 100,000, owner net receipt = 19,900,000 toman. If the tenant changes sample rent, the owner's mock fee and net follow the same sample rent rather than hard-coding stale values. This fee is a UI example, not an operationally agreed fee. The second fund preference is **selection only**: no 3%/3.5% investment calculation, guaranteed yield or fund transfer. Figma's older owner funding 450m and termination deductions 55.5m / 394.5m are not treated as authoritative C3/settlement rules.

### Owner RTL, Persian digits and bottom navigation (follow-up)

The owner preview now wraps all its native visible `Text` and `OwnerRow` content in one **presentation-only** Persian-digit formatter. It converts ASCII 0–9 and Arabic-Indic ٠–٩ into Persian ۰–۹ (including interpolated mock amounts and C3 captions); it never changes the stored numeric calculation, route, contract identifier or real API payload. Card labels, explanatory copy and owner property text use RTL/right alignment; side-by-side owner summary tiles start on the right.

Owner bottom tabs match the tenant / Figma order **left to right: حساب من | قراردادها | دریافت و پرداخت | خانه** and use one shared owner component with the same height (80), label size (11), spacing and orange selected state. Home, Payments, Contracts and Account each have their own correct active state and icon; the payment icon is not permanently orange on other tabs. Their routes stay strictly under `/preview/owner-*`: contracts → `owner-connected`, payments → `owner-receive-pay`, home → `owner-active`, account → `owner-account`. The active/overview, contracts-connected, terminated, payment-overview and auxiliary account pages have the tab bar; the settlement-selection and final-consent wizard screens retain their intentionally focused Figma layouts without it.

### Owner QA (web iPhone 16 width 393 × 852)

1. In preview, open `/preview/contract-lookup`, select مالک and confirm. You should land on `/preview/owner-connected`.
2. Walk through connected → settlement preference, switch to fund then back to monthly; verify displayed choice persists on final confirmation.
3. At final confirmation, the demo acknowledgment checkbox gates continuing; owner funding line should be **350m** for default C3, not 450m.
4. Active → receive/pay → termination and back; owner receipt should be **19.9m monthly** for the default sample, not tenant monthly bank interest.
5. Owner bottom tabs may only open MOCK owner destinations, never authenticated OIDC or tenant screens. No real payment history, fund execution or owner settlement should be claimed.
6. Refresh and check console/asset failures. CI route checks and typecheck do not substitute for this visual/click walkthrough.

