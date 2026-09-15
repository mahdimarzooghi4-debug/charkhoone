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

The login route covers the Figma split brand/auth layout, exact Persian copy, mobile-number field, confirmation-code action, legal copy and the login-specific exported logo. The login form performs frontend-only navigation to the OTP route.

The OTP route covers the corresponding split layout, exact masked-mobile copy, five Figma digit boxes, resend countdown state, confirmation action, change-mobile link and its screen-specific exported logo. Its confirmation action performs frontend-only navigation to the identity-verification route. The OTP digits and countdown are Figma fixture state only; no verification service or timer logic is introduced yet.

The identity-verification route covers the Figma split layout, verified masked-mobile row and badge, national-ID input, confirmation action and the screen-specific exported logo. The masked mobile and example national ID remain presentation fixtures. Its CTA performs frontend-only navigation to `/user/home`.

The User Web home route implements the Figma desktop dashboard shell: right sidebar and profile, overview cards, membership status, action-required cards, quick access, recent contracts, and the receive/pay activity table. Names, amounts, dates, contract counts, membership limits and statuses are presentation fixtures copied from Figma and are not business rules or API-backed values.

The contracts route implements the Figma contracts screen: active sidebar state and alert badge, page CTA, three summary cards, role/status filter pills and four contract states (active tenant, active owner, owner action required, ended tenant). Contract filters and actions remain presentation-only until their target screens/state handling are implemented.

## Implementation notes

- The repository remains Next.js + TypeScript with plain CSS; Tailwind has not been added.
- Desktop dimensions, spacing, typography and colors are taken from the Figma design context. Responsive behavior below the provided desktop frames is a conservative implementation adaptation.
- The Android download control is visual only because the Figma source does not provide an APK/download URL.
- `/login` → `/otp-verification` → `/identity-verification` → `/user/home` navigation is frontend-only. Verification, identity validation, dashboard actions and post-login data loading are not connected to backend services yet.
- User Web routes implemented so far include `/user/home` and `/user/contracts`; the contracts sidebar links back to Home. Controls whose destination screen is not yet implemented remain visual-only rather than pointing to an unfinished route.
- Figma-exported logo/icon/avatar asset URLs are currently referenced on the working branch. They are short-lived and must be vendored into the repository (exact exported bytes, no redrawing) before the final merge.

No backend integration, database behavior or partner API behavior is introduced by these pages.
