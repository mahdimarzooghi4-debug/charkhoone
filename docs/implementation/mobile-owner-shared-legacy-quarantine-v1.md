# Mobile owner/shared legacy route quarantine V1

Base: `0e0abc25f0770a9785c47d255999081f49f3d02c` (PR #113 merge).

## Gap

After tenant financial-route quarantine, 15 remaining Expo Router paths still rendered mock owner rent/settlement/contract and termination results, mock shared contract lookup and role selection, mock mobile number/OTP entry, and mock identity/OTP-error confirmation. Direct links could display example toman, addresses, tracking/national ID, paid contribution, owner settlement, and cancellation conclusions without authenticated PostgreSQL evidence. Some routes were navigable from other legacy screens.

## Changes

The following routes remain resolvable but now show only a shared authenticated fail-closed notice, with links solely to authenticated home, persisted payment instructions and persisted contracts. Unauthenticated or invalid-runtime-config sessions are redirected to real OIDC login; other non-authenticated auth transitions render nothing.

- `apps/mobile/app/(owner)/contract-active.tsx`
- `apps/mobile/app/(owner)/contract-connected.tsx`
- `apps/mobile/app/(owner)/contract-terminated.tsx`
- `apps/mobile/app/(owner)/final-confirmation.tsx`
- `apps/mobile/app/(owner)/receive-pay.tsx`
- `apps/mobile/app/(owner)/settlement-preference.tsx`
- `apps/mobile/app/(shared)/change-mobile.tsx`
- `apps/mobile/app/(shared)/verify-new-mobile.tsx`
- `apps/mobile/app/(shared)/contract-tracking.tsx`
- `apps/mobile/app/(shared)/role-selection.tsx`
- `apps/mobile/app/(shared)/contracts-terminated.tsx`
- `apps/mobile/app/(shared)/profile-photo.tsx`
- `apps/mobile/app/(auth)/identity.tsx`
- `apps/mobile/app/(auth)/identity-error.tsx`
- `apps/mobile/app/(auth)/otp-error.tsx`

The shared guard is the same component proven in PR #113, exposed with a generic `LegacyMobileRouteUnavailable` alias. The notice explicitly denies identity, phone/OTP, role/contract lookup, financial status, settlement preference or confirmation operations; a filename never proves an outcome. No mock data or simulated mutation remains in these 15 route modules.

## Preserved

Real `/(auth)/login` OIDC PKCE remains, and `/(auth)/otp` continues redirecting to it. The authenticated bootstrap-driven tenant home, financing screens, profile, contracts, payments and real sign-out remain. Existing tenant quarantine remains enforced. There is no authoritative owner contract details, owner settlement preferences/payout read model, account phone change, profile-photo mutation, shared contract lookup/role mutation, or local identity validation endpoint exposed in this mobile API.

## Verification and external/financial boundary

The required `verify-mobile-runtime-wiring.py` compares each of the 15 wrapper files byte-for-byte against expected fail-closed content, verifies generic alias and guard messaging, and checks that real OIDC/profile/contracts/payments/sign-out were not replaced. Mobile CI still runs locked installation, TypeScript, Android and iOS exports. Existing `ci` still runs real PostgreSQL coverage. No new PostgreSQL test applies: no new backend read, mutation or migration is introduced. No real bank, payment provider, fund, OIDC tenant, staging/production system, credential or financial policy is touched. Rial and exact-decimal backend contract remain unchanged.
