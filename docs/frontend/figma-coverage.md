# Figma frontend coverage

Source file: `charkhoone-platform` (`kIJQxlRhLRhjCCckMfcmsa`)

Current Figma coverage available to implementation contains a single top-level page: `01 — Foundations` (`15:2`). The implemented source frame is `Foundations` (`35:35`) and the only application-like example currently present is `RTL Demo` (`35:197`).

Implemented in this phase:

- Brand and semantic color tokens from Figma.
- Vazirmatn typography scale references.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48 px.
- Radius scale: 8, 12, 16, 24 px.
- Default button/input height: 48 px.
- Mobile/desktop page gutter guidance.
- RTL lease-registration demo as reusable React components.
- `/design-system` reference page that mirrors the Foundations content.

Not invented in code:

- Screens, navigation, dashboards, onboarding flows, organization panels, bank panels, or other product pages that are not currently present in the Figma file.
- Business interactions or API behavior behind the demo controls.
- A font binary. The CSS references `Vazirmatn` first and falls back to system fonts until the project provides an approved font-delivery method.

The frontend implementation uses the repository's existing Next.js + TypeScript stack and plain CSS. Tailwind was intentionally not added.
