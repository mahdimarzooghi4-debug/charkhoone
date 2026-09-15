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
- Receive & Pay frame: `Web App / Receive & Pay` (`150:412`), route `/user/receive-pay`
- Properties frame: `Web App / Properties` (`173:379`), route `/user/properties`
- Payment-return frame: `Web App / Payment Return` (`173:639`), route `/user/receive-pay/result`
- Receipt frame: `Web App / Receipt` (`173:542`), route `/user/receive-pay/receipt`

The login route covers the Figma split brand/auth layout, exact Persian copy, mobile-number field, confirmation-code action, legal copy and the login-specific exported logo. The login form performs frontend-only navigation to the OTP route.

The OTP route covers the corresponding split layout, exact masked-mobile copy, five Figma digit boxes, resend countdown state, confirmation action, change-mobile link and its screen-specific exported logo. Its confirmation action performs frontend-only navigation to the identity-verification route. The OTP digits and countdown are Figma fixture state only; no verification service or timer logic is introduced yet.

The identity-verification route covers the Figma split layout, verified masked-mobile row and badge, national-ID input, confirmation action and the screen-specific exported logo. The masked mobile and example national ID remain presentation fixtures. Its CTA performs frontend-only navigation to `/user/home`.

The User Web home route implements the Figma desktop dashboard shell: right sidebar and profile, overview cards, membership status, action-required cards, quick access, recent contracts, and the receive/pay activity table. Names, amounts, dates, contract counts, membership limits and statuses are presentation fixtures copied from Figma and are not business rules or API-backed values. The existing `املاک من` quick-access item now links frontend-only to `/user/properties`.

The contracts route implements the Figma summary row, role/status filters and four contract states. Only the Saadatabad fixture links to the implemented contract-detail screen; actions for other contracts remain visual-only until their corresponding Figma destination screens are implemented.

The contract-detail route implements the Figma breadcrumb/header, contract role/status, property and party information, active-contract status, next-payment card, main contract data and completed financing-plan card. The tracking code in the route and page content is a Figma fixture only. Its payment CTA links frontend-only to `/user/receive-pay`; the property-detail action remains visual-only because that destination screen is distinct from the Properties overview and has not been implemented yet.

The receive/pay route implements the Figma header, four overview cards, terminated-contract warning, type/status filters and five financial-history rows covering overdue/pending payments, future settlement and completed payment/settlement states. The Figma waiting-payment fixture links frontend-only to `/user/receive-pay/result`, and the completed Saadatabad payment fixture links to `/user/receive-pay/receipt`. Other transaction/termination actions remain visual-only until their exact destination frames are implemented. The amounts, dates, displayed ۰٫۵٪ service-fee copy, overdue count and termination explanation remain presentation fixtures rather than business rules.

The properties route implements the Figma header/notification control, tenant-owner-total summary pills, three property cards (active tenant, active owner and owner in-progress states) and the inline empty state. The Saadatabad property links to the already implemented contract-detail route. The Poonak/Vanak actions and `ثبت کد رهگیری` remain visual-only until their exact destination frames are implemented. Addresses, postal codes, dates and amounts are Figma fixtures only.

The payment-return route implements the Figma successful-payment result card, amount, transaction details, installment/contract context and navigation back to Receive & Pay. Its `مشاهده رسید` CTA links frontend-only to the implemented receipt route and its contract context links to the Saadatabad detail fixture.

The receipt route implements the Figma transaction receipt, paid/payment badges, transaction metadata and contract context. `چاپ رسید`, `ذخیره تصویر رسید` and `اشتراک‌گذاری رسید` remain visual-only controls because no print/download/share behavior is specified or integrated yet.

## Implementation notes

- The repository remains Next.js + TypeScript with plain CSS; Tailwind has not been added.
- Desktop dimensions, spacing, typography and colors are taken from the Figma design context. Responsive behavior below the provided desktop frames is a conservative implementation adaptation.
- The Android download control is visual only because the Figma source does not provide an APK/download URL.
- `/login` → `/otp-verification` → `/identity-verification` → `/user/home` navigation is frontend-only. Verification, identity validation, dashboard actions and post-login data loading are not connected to backend services yet.
- User Web routes and fixture links are frontend-only; no contract, payment, financing or property API behavior has been introduced.
- Dashboard/navigation/action controls whose target screens have not yet been implemented are intentionally visual-only rather than pointing to invented routes.
- Figma-exported logo/icon/avatar asset URLs are currently referenced on the working branch. They are short-lived and must be vendored into the repository (exact exported bytes, no redrawing) before the final merge.

No backend integration, database behavior or partner API behavior is introduced by these pages.
