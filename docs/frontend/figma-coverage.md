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

The login route covers the Figma split brand/auth layout, exact Persian copy, mobile-number field, confirmation-code action, legal copy and the login-specific exported logo. The login form now performs frontend-only navigation to the OTP route.

The OTP route covers the corresponding split layout, exact masked-mobile copy, five Figma digit boxes, resend countdown state, confirmation action, change-mobile link and its screen-specific exported logo. The OTP digits and countdown are Figma fixture state only; no verification service, timer logic or backend behavior is introduced yet.

## Implementation notes

- The repository remains Next.js + TypeScript with plain CSS; Tailwind has not been added.
- Desktop dimensions, spacing, typography and colors are taken from the Figma design context. Responsive behavior below the provided 1440px frames is a conservative implementation adaptation.
- The Android download control is visual only because the Figma source does not provide an APK/download URL.
- `/login` → `/otp-verification` navigation is frontend-only. OTP verification, resend behavior and the post-verification transition remain unimplemented until their Figma states and later backend phase are covered.
- Figma-exported logo/icon asset URLs are currently referenced on the working branch. They are short-lived and must be vendored into the repository (exact exported bytes, no redrawing) before the final merge.

No backend integration, database behavior or partner API behavior is introduced by these pages.
