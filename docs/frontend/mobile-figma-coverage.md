# Mobile Figma coverage

Source file: `charkhoone-platform` (`kIJQxlRhLRhjCCckMfcmsa`)

Pages:

- `03 - Tenant Mobile` (`41:2`)
- `04 - Owner Mobile` (`39:161`)

## Architecture rule

Owner and tenant use one shared mobile application. Shared authentication, identity, contract lookup and role-selection live in the same app. After role resolution, navigation branches to role-specific flows. Both tenant and owner branches are now represented as frontend Figma fixtures in `apps/mobile`.

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

Role selection is interactive and routes the selected role into the corresponding owner or tenant frontend flow.

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

### Tenant termination states

- `109:157` — Tenant Home / Contract Terminated
- `109:261` — Payments / Overview / Terminated
- `978:120` — Contract / Detail / Tenant / Terminated
- `978:221` — Contracts / Overview / Terminated

### Owner contract lifecycle

- `112:16` — Owner / Contract Connected
- `136:150` — Owner / Settlement Preference
- `116:140` — Owner / Final Contract Confirmation
- `118:154` — Owner / Contract Active
- `118:251` — Owner / Receive & Pay Overview
- `204:345` — Owner / Contract Terminated

The owner settlement preference supports the two Figma choices as frontend selection state. Owner confirmation, active-contract, receive/pay and termination surfaces are implemented as Expo Router routes and reuse the shared mobile tokens/components where the Figma design matches them.

The screens use the Figma values only as presentation fixtures. Sample amounts, rates, identities, dates, fees, statuses and termination amounts are not business rules and are not wired to backend/domain logic.

## Navigation implemented

Shared entry flow:

`login -> otp -> identity -> contract tracking -> role selection`

Tenant financing flow:

`role selection -> eligible plans -> plan confirmation -> under review -> approved -> membership -> contribution -> final confirmation -> active contract`

Owner flow:

`role selection -> contract connected -> settlement preference -> final contract confirmation -> active contract -> receive & pay`

Explicit frontend-only routes also exist for authentication error states, contract-review home, rejected financing, payment success/failed/pending states, receipt display and terminated-contract states. These routes are fixtures for Figma coverage until backend state machines, settlement logic and payment callbacks are introduced.

## Asset handling

Figma MCP asset URLs are currently isolated in `apps/mobile/src/figmaAssets.ts` and `apps/mobile/src/ownerAssets.ts` where exported icons/images are needed, so no icon/logo is redrawn or substituted. SVG exports are rendered with `react-native-svg`. These URLs are short-lived. Before final merge, their exact exported bytes must be vendored into the repository and references changed to local assets.

## Verification

The Owner Mobile tranche was typechecked in CI together with the existing web and backend jobs. The latest verification run completed successfully for all three jobs.

## Open implementation boundary

No bank, credit, fund, organization, payment-gateway or Khodnevis API is called by the mobile app yet. Navigation and screen state are frontend-only placeholders until the backend phase begins. Owner bottom-navigation items reuse the existing shared profile/contracts surfaces where those destinations are already represented; no additional owner-only home/account/contracts screens were invented beyond the supplied `04 - Owner Mobile` source page.
