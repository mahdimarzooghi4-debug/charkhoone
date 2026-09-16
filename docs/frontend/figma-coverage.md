# Figma frontend coverage

Source file: `charkhooneh-platform` (`kIJQxlRhLRhjCCckMfcmsa`).

## Implemented Figma sources

### Foundations

- Page: `01 — Foundations` (`15:2`)
- Frame: `Foundations` (`35:35`)
- RTL example: `RTL Demo` (`35:197`)
- Route: `/design-system`

Covered tokens/components:

- Brand and semantic color tokens.
- Vazirmatn typography references.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48 px.
- Radius scale: 8, 12, 16, 24 px.
- Default button/input height: 48 px.
- RTL lease-registration example as reusable components.

### Marketing / public pages

- Page: `09-Charkhooneh Landing` (`636:2`)
- Landing frame: `Charkhooneh / Landing` (`631:474`)
- Route: `/`
- App-download frame: `Charkhooneh / App Download` (`1002:8`)
- Route: `/app-download`

Landing coverage includes the Figma header, hero/ecosystem visual, audience cards, four-step flow, "چرا چارخونه؟" cards, final CTA and footer. The app-download route covers the Figma header, phone mockup, Android option and iOS coming-soon state.

### User Web App

- Page: `05 - User Web App` (`144:14`)
- This is one unified User Web application; tenant/owner states are screens and flows inside the same web app, not separate web apps.
- Login frame: `Web App / Login` (`163:165`), route `/login`
- OTP frame: `Web App / OTP Verification` (`167:175`), route `/otp-verification`
- Identity frame: `Web App / Identity Verification` (`167:211`), route `/identity-verification`
- Home frame: `Web App / Home` (`144:154`), route `/user/home`
- Contracts frame: `Web App / Contracts` (`149:150`), route `/user/contracts`
- Contract-detail frame: `Web App / Contract Detail` (`150:277`), route `/user/contracts/123456789012`
- Owner active-contract frame: `Web App / Contract Active` (`161:163`), route `/user/contracts/123456789012/owner`
- Tenant terminated-contract frame: `Web App / Contract Terminated / Tenant` (`171:379`), route `/user/contracts/123456789012/terminated`
- Receive & Pay frame: `Web App / Receive & Pay` (`150:412`), route `/user/receive-pay`
- Properties frame: `Web App / Properties` (`173:379`), route `/user/properties`
- Payment-return frame: `Web App / Payment Return` (`173:639`), route `/user/receive-pay/result`
- Receipt frame: `Web App / Receipt` (`173:542`), route `/user/receive-pay/receipt`
- Account frame: `Web App / Account` (`161:424`), route `/user/account`
- Register tracking-code frame: `Web App / Register Tracking Code` (`150:706`), route `/user/contracts/register`
- Contract-lookup-result frame: `Web App / Contract Lookup Result` (`150:761`), route `/user/contracts/register/result`
- Eligible-financing-plans frame: `Web App / Eligible Financing Plans` (`150:904`), route `/user/contracts/register/plans`
- Plan-confirmation frame: `Web App / Plan Confirmation` (`150:1053`), route `/user/contracts/register/plans/confirmation`
- Financing-under-review frame: `Web App / Financing Under Review` (`150:1198`), route `/user/contracts/register/plans/review`
- Financing-approved / membership-required frame: `Web App / Financing Approved / Membership Required` (`912:106`), route `/user/contracts/register/plans/approved`
- Tenant-membership frame: `Web App / Tenant Membership` (`195:322`), route `/user/contracts/register/plans/membership`
- Membership-payment-success frame: `Web App / Payment Return / Membership Success` (`175:754`), route `/user/contracts/register/plans/membership/result`
- Membership-payment-failed frame: `Web App / Payment Return / Membership Failed` (`175:856`), route `/user/contracts/register/plans/membership/failed`
- Contribution-required frame: `Web App / Financing Approved / Contribution Required` (`150:1317`), route `/user/contracts/register/plans/contribution`
- Contribution-paid / final-confirmation frame: `Web App / Contribution Paid / Final Confirmation` (`150:1489`), route `/user/contracts/register/plans/final-confirmation`
- Waiting-owner-confirmation frame: `Web App / Waiting for Owner Confirmation` (`171:211`), route `/user/contracts/register/plans/waiting-owner`
- Financing-not-approved frame: `Web App / Financing Not Approved` (`161:334`), route `/user/contracts/register/plans/not-approved`

The login route covers the Figma split brand/auth layout, exact Persian copy, mobile-number field, confirmation-code action, legal copy and the login-specific exported logo. The login form performs frontend-only navigation to the OTP route.

The OTP route covers the corresponding split layout, exact masked-mobile copy, five Figma digit boxes, resend countdown state, confirmation action, change-mobile link and its screen-specific exported logo. Its confirmation action performs frontend-only navigation to the identity-verification route. The OTP digits and countdown are Figma fixture state only; no verification service or timer logic is introduced yet.

The identity-verification route covers the Figma split layout, verified masked-mobile row and badge, national-ID input, confirmation action and the screen-specific exported logo. The masked mobile and example national ID remain presentation fixtures. Its CTA performs frontend-only navigation to `/user/home`.

The User Web home route implements the Figma desktop dashboard shell: right sidebar and profile, overview cards, membership status, action-required cards, quick access, recent contracts, and the receive/pay activity table. Names, amounts, dates, contract counts, membership limits and statuses are presentation fixtures copied from Figma and are not business rules or API-backed values. The quick-access routes currently point to the implemented or in-progress frontend screens for calculator, tracking-code registration and properties.

The contracts route implements the Figma summary row, role/status filters and four contract states. The Saadatabad fixture has frontend-only destination screens for tenant active detail, owner active detail and tenant terminated state. These routes represent Figma screen states; no role/state resolution service is connected yet.

The tenant contract-detail route implements the Figma breadcrumb/header, contract role/status, property and party information, active-contract status, next-payment card, main contract data and completed financing-plan card. The owner active-contract route covers the owner-specific tenant/property cards, settlement status, next receivable, payout method, contract conditions and completed financing summary. The terminated tenant route covers the four-step termination/settlement state and financial-settlement summary. All tracking codes, dates, overdue counts, settlement amounts and fee copy are Figma presentation fixtures.

The tracking-code and lookup-result routes implement the frontend entry into the financing lifecycle. The lookup-result role selection links into eligible financing plans; no Khodnevis/contract lookup service is called yet.

The financing lifecycle now covers eligible plans, plan confirmation, bank-review state, approved/membership-required state, membership selection, membership payment success/failure, contribution-required state, final confirmation, waiting-for-owner state and not-approved alternative-plan state. Navigation between these routes is frontend-only and exists to represent Figma screen progression; bank review, eligibility, payment processing, membership activation, contribution settlement and owner confirmation are not implemented as business logic or external integrations.

The receive/pay route implements the Figma header, four overview cards, terminated-contract warning, type/status filters and financial-history rows covering overdue/pending payments, future settlement and completed payment/settlement states. The payment-result and receipt frames are implemented as frontend-only destination screens. The amounts, dates, displayed ۰٫۵٪ service-fee copy, overdue count and termination explanation remain presentation fixtures rather than business rules.

The properties route implements the Figma header/notification control, tenant-owner-total summary pills, three property cards (active tenant, active owner and owner in-progress states) and the inline empty state. Addresses, postal codes, dates and amounts are Figma fixtures only.

The payment-return route implements the Figma successful-payment result card, amount, transaction details, installment/contract context and navigation back to Receive & Pay. Its `مشاهده رسید` CTA links frontend-only to the implemented receipt route and its contract context links to the Saadatabad detail fixture.

The receipt route implements the Figma transaction receipt, paid/payment badges, transaction metadata and contract context. `چاپ رسید`, `ذخیره تصویر رسید` and `اشتراک‌گذاری رسید` remain visual-only controls because no print/download/share behavior is specified or integrated yet.

The account route implements the Figma account shell, profile summary, verified mobile state, empty IBAN state, identity information, membership summary and settings card. `تغییر تصویر` and `تغییر شماره موبایل` point to their frontend-only account subroutes; IBAN, legal/privacy, membership-detail and sign-out behavior remain visual-only until their exact Figma destination screens or behavior are implemented. All identity, membership and banking values shown here remain presentation fixtures.

Known User Web App frames still requiring review/implementation include `Web App / Membership Payment / Success` (`912:278`) and any additional states on page `144:14` not yet enumerated in this document.

## Implementation notes

- The repository remains Next.js + TypeScript with plain CSS/CSS Modules; Tailwind has not been added.
- Desktop dimensions, spacing, typography and colors are taken from the Figma design context. Responsive behavior below the provided desktop frames is a conservative implementation adaptation.
- The Android download control is visual only because the Figma source does not provide an APK/download URL.
- `/login` → `/otp-verification` → `/identity-verification` → `/user/home` navigation is frontend-only. Verification, identity validation, dashboard actions and post-login data loading are not connected to backend services yet.
- User Web routes and fixture links are frontend-only; no contract, payment, financing, property, account or banking API behavior has been introduced.
- Values shown in financing/payment/contract screens (names, national IDs, tracking/transaction numbers, amounts, dates, plan names, bank names, overdue counts, fees and statuses) are presentation fixtures copied from Figma, not domain or backend rules.
- Figma-exported logo/icon/avatar asset URLs are currently referenced on the working branch. They are short-lived and must be vendored into the repository as the exact exported bytes (no redrawing) before the final merge.
- Pixel-level visual regression has not yet been run; compile/typecheck CI is not a substitute for final visual review.

No backend integration, database behavior or partner API behavior is introduced by these pages.
