# Mobile Figma coverage

Source file: `charkhoone-platform` (`kIJQxlRhLRhjCCckMfcmsa`)

Page: `03 - Tenant Mobile` (`41:2`)

## Architecture rule

Owner and tenant use one shared mobile application. Shared authentication, identity, contract lookup and role-selection live in the same app. After role resolution, navigation branches to role-specific flows. The owner branch is not implemented in this phase.

## Stack

- React Native + Expo SDK 57
- TypeScript
- Expo Router
- Vazirmatn through `@expo-google-fonts/vazirmatn`
- `react-native-svg` for exact exported SVG assets
- React Native `StyleSheet`; Tailwind is not used

## Implemented from Figma

- `41:8` — Login / Mobile Number
- `39:26` — OTP Verification
- `48:14` — Identity Verification
- `79:41` — Contract / Tracking Code
- `66:382` — Contract Lookup Result / role selection
- `61:28` — Tenant Home / New User
- `65:55` — Calculator / Manual Estimate
- `71:43` — Calculator / Result
- `85:62` — Financing / Eligible Plans
- `90:52` — Financing / Plan Confirmation
- `91:53` — Financing / Under Review

The screens use the Figma values only as presentation fixtures. Sample amounts, rates, identities and dates in these frames are not business rules and are not wired to backend/domain logic.

## Navigation implemented

`login -> otp -> identity -> contract tracking -> role selection -> eligible plans -> plan confirmation -> under review`

Tenant home is also implemented as the new-user dashboard and links to the calculator and contract-tracking flows. The next tenant tranche will continue with approved financing, membership, contribution payment, final confirmation, active contract, payments, contracts, profile and termination states.

## Asset handling

Figma MCP asset URLs are currently isolated in `apps/mobile/src/figmaAssets.ts` so no icon/logo is redrawn or substituted. SVG exports are rendered with `react-native-svg`. These URLs are short-lived. Before final merge, their exact exported bytes must be vendored into the repository and references changed to local assets.

## Open implementation boundary

No bank, credit, fund, organization or Khodnevis API is called by the mobile app yet. Navigation and screen state are frontend-only placeholders until the backend phase begins.
