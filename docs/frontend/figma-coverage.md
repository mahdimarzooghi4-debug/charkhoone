# Figma frontend coverage

Source file: `charkhooneh-platform` (`kIJQxlRhLRhjCCckMfcmsa`).

## Implemented Figma sources

### Foundations

- Page: `01 — Foundations` (`15:2`)
- Frame: `Foundations` (`35:35`)
- RTL example: `RTL Demo` (`35:197`)
- Route: `/design-system`

Covered tokens/components include brand and semantic colors, Vazirmatn typography, spacing/radius scales, 48px default controls and the RTL example components.

### Marketing / public pages

- Page: `09-Charkhooneh Landing` (`636:2`)
- `Charkhooneh / Landing` (`631:474`) → `/`
- `Charkhooneh / App Download` (`1002:8`) → `/app-download`

Landing coverage includes the Figma header, hero/ecosystem visual, audience cards, four-step flow, benefits, final CTA and footer. App Download covers the Figma phone mockup, Android option and iOS coming-soon state. The Android action remains visual-only because Figma does not provide an APK URL.

### User Web App

Page: `05 - User Web App` (`144:14`). This is one unified User Web application; tenant/owner states are screen flows in the same web app rather than separate web apps.

#### Authentication and shared entry states

- `Web App / Login` (`163:165`) → `/login`
- `Web App / OTP Verification` (`167:175`) → `/otp-verification`
- `Web App / OTP Verification / Error` (`168:45`) → `/otp-verification/error`
- `Web App / OTP Verification / Loading` (`168:215`) → `/otp-verification/loading`
- `Web App / OTP Verification / Resend Available` (`168:248`) → `/otp-verification/resend`
- `Web App / Identity Verification` (`167:211`) → `/identity-verification`
- `Web App / Identity Verification / Invalid Format` (`170:51`) → `/identity-verification/invalid-format`
- `Web App / Identity Verification / Mismatch` (`170:79`) → `/identity-verification/mismatch`
- `Web App / Identity Verification / Loading` (`170:107`) → `/identity-verification/loading`

OTP digits, countdowns, error/loading/resend messages, masked mobile and national ID are Figma fixture states only. No OTP or identity-validation service is connected yet.

#### Dashboard, account and utilities

- `Web App / Home` (`144:154`) → `/user/home`
- `Web App / Account` (`161:424`) → `/user/account`
- `Web App / Change Mobile / Step 1` (`175:224`) → `/user/account/change-mobile`
- `Web App / Change Mobile / Step 2 OTP` (`175:341`) → `/user/account/change-mobile/otp`
- `Web App / Change Profile Image / Default` (`175:459`) → `/user/account/profile-image`
- `Web App / Change Profile Image / Preview` (`175:578`) → `/user/account/profile-image/preview`
- `Web App / Calculator` (`150:588`) → `/user/calculator`

The dashboard/account/calculator values, limits, identity information and banking fields are presentation fixtures. Profile image/mobile-change screens are frontend-only; no account, upload, SMS or banking behavior is connected.

#### Contracts, property and receive/pay

- `Web App / Contracts` (`149:150`) → `/user/contracts`
- `Web App / Contract Detail` (`150:277`) → `/user/contracts/123456789012`
- `Web App / Properties` (`173:379`) → `/user/properties`
- `Web App / Receive & Pay` (`150:412`) → `/user/receive-pay`
- `Web App / Payment Return` (`173:639`) → `/user/receive-pay/result`
- `Web App / Receipt` (`173:542`) → `/user/receive-pay/receipt`
- `Web App / Contract Active` (`161:163`) → `/user/contracts/123456789012/owner`
- `Web App / Contract Terminated / Tenant` (`171:379`) → `/user/contracts/123456789012/terminated`

The screens cover active/terminated contract presentation, property cards, transaction history, payment result and receipt. Print/download/share controls remain visual-only where behavior is not specified.

#### Tenant financing lifecycle

- `Web App / Register Tracking Code` (`150:706`) → `/user/contracts/register`
- `Web App / Contract Lookup Result` (`150:761`) → `/user/contracts/register/result`
- `Web App / Eligible Financing Plans` (`150:904`) → `/user/contracts/register/plans`
- `Web App / Plan Confirmation` (`150:1053`) → `/user/contracts/register/plans/confirmation`
- `Web App / Financing Under Review` (`150:1198`) → `/user/contracts/register/plans/review`
- `Web App / Financing Approved / Membership Required` (`912:106`) → `/user/contracts/register/plans/approved`
- `Web App / Tenant Membership` (`195:322`) → `/user/contracts/register/plans/membership`
- `Web App / Payment Return / Membership Success` (`175:754`) → `/user/contracts/register/plans/membership/result`
- `Web App / Payment Return / Membership Failed` (`175:856`) → `/user/contracts/register/plans/membership/failed`
- `Web App / Payment Return / Membership Pending` (`175:958`) → `/user/contracts/register/plans/membership/pending`
- `Web App / Membership Payment / Success` (`912:278`) → `/user/contracts/register/plans/membership/payment-success`
- `Web App / Membership Payment / Failed` (`912:382`) → `/user/contracts/register/plans/membership/payment-failed`
- `Web App / Membership Payment / Pending` (`912:486`) → `/user/contracts/register/plans/membership/payment-pending`
- `Web App / Financing Approved / Contribution Required` (`150:1317`) → `/user/contracts/register/plans/contribution`
- `Web App / Contribution Paid / Final Confirmation` (`150:1489`) → `/user/contracts/register/plans/final-confirmation`
- `Web App / Waiting for Owner Confirmation` (`171:211`) → `/user/contracts/register/plans/waiting-owner`
- `Web App / Financing Not Approved` (`161:334`) → `/user/contracts/register/plans/not-approved`

The lifecycle navigation is frontend-only. Eligibility, bank review, membership activation, payment processing, contribution settlement and owner confirmation are not implemented as business logic or external integrations.

#### Owner contract lifecycle

- `Web App / Owner Contract Connected` (`170:278`) → `/user/contracts/123456789012/owner/connected`
- `Web App / Owner Settlement Preference` (`150:1685`) → `/user/contracts/123456789012/owner/settlement-preference`
- `Web App / Owner Final Contract Confirmation` (`150:1830`) → `/user/contracts/123456789012/owner/final-confirmation`
- `Web App / Contract Terminated / Owner` (`173:219`) → `/user/contracts/123456789012/owner/terminated`

These screens preserve the Figma owner-side waiting/process state, settlement-method comparison, final-confirmation state and terminated/financial-settlement state. The payout-method and fee figures are presentation fixtures only; they do not define fund, fee or settlement rules.

### User Web inventory status

The full set of 45 top-level frames currently enumerated on Figma page `05 - User Web App` (`144:14`) has a corresponding frontend route/state on `feature/platform-v1`. User Web top-level Figma coverage is therefore complete for the currently enumerated page inventory. Final pixel-level visual review and exact-asset vending remain pre-merge tasks.

## Implementation notes

- The repository remains Next.js + TypeScript with plain CSS/CSS Modules; Tailwind has not been added.
- Desktop dimensions, spacing, typography and colors come from Figma design context. Responsive behavior below the supplied desktop frames is a conservative adaptation.
- All names, national IDs, tracking/transaction numbers, amounts, dates, bank/plan names, overdue counts, rates, fees and statuses shown in these screens are Figma presentation fixtures, not domain/backend rules.
- `/login` → authentication states → `/user/home` and all post-login flow navigation are frontend-only.
- No contract lookup/Khodnevis, bank, credit, fund, organization, payment gateway, account, banking or partner API is connected yet.
- Figma-exported logo/icon/avatar URLs are short-lived working references. Before final merge, their exact exported bytes must be vendored into the repository without redrawing/substituting assets.
- Pixel-level visual regression has not yet been run; compile/typecheck/build CI is not a substitute for final visual review.

No backend integration, database behavior or partner API behavior is introduced by these pages. After the remaining frontend Figma areas (including Bank Panel and Fund Panel) are completed, the project order remains Backend → Database → final test/review → Merge.
