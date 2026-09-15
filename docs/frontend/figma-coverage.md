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

## Implementation notes

- The repository remains Next.js + TypeScript with plain CSS; Tailwind has not been added.
- Desktop dimensions, spacing, typography and colors are taken from the Figma design context. Responsive behavior below the provided 1440px frames is a conservative implementation adaptation because no mobile frame was present under `636:2`.
- The Android download control is visual only because the Figma source does not provide an APK/download URL.
- Login CTAs point to `/login`; the login screen itself is not claimed as implemented by this page coverage.
- Figma-exported logo/icon asset URLs are currently referenced on the working branch. They are short-lived and must be vendored into the repository (exact exported bytes, no redrawing) before the final merge.

No backend integration, database behavior or partner API behavior is introduced by these pages.
