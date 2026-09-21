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
