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

### Shared entry flow

- `41:8` — Login / Mobile Number
- `39:26` — OTP Verification
- `47:10` — OTP Verification / Error
- `48:14` — Identity Verification
- `39:66` — Identity Verification / Error
- `79:41` — Contract / Tracking Code
- `66:382` — Contract Lookup Result / role selection

### Tenant financing lifecycle

- `61:28` — Tenant Home / New User
- `55:30` — Tenant Home / Contract Review
- `65:55` — Calculator / Manual Estimate
- `71:43` — Calculator / Result
- `85:62` — Financing / Eligible Plans
- `90:52` — Financing / Plan Confirmation
- `91:53` — Financing / Under Review
- `910:126` — Financing / Approved
- `97:85` — Financing / Not Approved
- `245:228` — Tenant / Membership
- `91:149` — Financing / Contribution Required
- `93:61` — Financing / Contribution Paid / Final Confirmation
- `93:213` — Contract / Active

### Tenant payment results and receipt

- `184:244` — Membership Payment / Success
- `184:298` — Membership Payment / Failed
- `184:334` — Membership Payment / Pending
- `204:425` — Contribution Payment / Success
- `204:464` — Contribution Payment / Failed
- `204:497` — Contribution Payment / Pending
- `100:89` — Installment Payment / Success
- `205:235` — Installment Payment / Failed
- `205:282` — Installment Payment / Pending
- `107:132` — Payments / Share Receipt

The payment-result family is implemented with a shared React Native component and thin Expo Router routes so visual states stay consistent without turning Figma sample values into domain rules.

### Tenant active-contract surfaces

- `94:91` — Payments / Overview
- `102:86` — Contracts / Overview
- `103:89` — Contract / Detail / Tenant
- `104:93` — Account / Profile
- `106:95` — Account / Change Mobile
- `106:121` — Account / Verify New Mobile
- `106:197` — Account / Profile Photo Sheet
- `106:211` — Account / Sign Out Modal

### Termination states

- `109:157` — Tenant Home / Contract Terminated
- `109:261` — Payments / Overview / Terminated
- `978:120` — Contract / Detail / Tenant / Terminated
- `978:221` — Contracts / Overview / Terminated

The screens use the Figma values only as presentation fixtures. Sample amounts, rates, identities, dates, bank names, rejection reasons and payment states are not business rules and are not wired to backend/domain logic.

## Navigation implemented

Shared entry flow:

`login -> otp -> identity -> contract tracking -> role selection`

Tenant financing flow:

`eligible plans -> plan confirmation -> under review -> approved -> membership -> contribution -> final confirmation -> active contract`

Explicit frontend-only routes also exist for authentication error states, contract-review home, rejected financing, payment success/failed/pending states, receipt display and terminated-contract states. These routes are fixtures for Figma coverage until backend state machines and payment callbacks are introduced.

## Asset handling

Figma MCP asset URLs are currently isolated in `apps/mobile/src/figmaAssets.ts` where exported icons/images are needed, so no icon/logo is redrawn or substituted. SVG exports are rendered with `react-native-svg`. These URLs are short-lived. Before final merge, their exact exported bytes must be vendored into the repository and references changed to local assets.

## Open implementation boundary

No bank, credit, fund, organization, payment-gateway or Khodnevis API is called by the mobile app yet. Navigation and screen state are frontend-only placeholders until the backend phase begins. Owner-specific mobile screens are still outside this tenant tranche and will be implemented in the same mobile application after tenant coverage and review are complete.
