# Mobile legacy tenant financial-route quarantine V1

Base: `35e9fd6e045fbf74611cb5f7cf2cfc9f3d3ccb87` (PR #112 merge).

## Risk closed

Legacy tenant routes could be opened directly, even though the authenticated home/status screens had been corrected. Their embedded mock data falsely declared successful membership, paid contribution/installments, issued receipts, active/terminated contracts, and example amounts/dates. Routing away from these screens in normal navigation was insufficient: deep links could still display assertions unsupported by PostgreSQL.

## Implementation

Every identified tenant financial prototype route now renders `LegacyTenantRouteUnavailable`, which redirects unauthenticated/config-error sessions to login and renders nothing until authenticated. Authenticated sessions see one informational fail-closed view and can return only to authoritative home, payments, or contracts overview. The screen does not initiate payment, infer payment success/failure/pending, create membership entitlement, or claim a contract or settlement state.

Covered routes (each `apps/mobile/app/(tenant)/<name>.tsx`):

- `home-review`
- `home-terminated`
- `calculator`
- `calculator-result`
- `membership`
- `membership-payment-success`
- `membership-payment-failed`
- `membership-payment-pending`
- `contribution-required`
- `contribution-payment-success`
- `contribution-payment-failed`
- `contribution-payment-pending`
- `installment-payment-success`
- `installment-payment-failed`
- `installment-payment-pending`
- `receipt`
- `final-confirmation`
- `contract-detail`
- `contract-active`
- `contract-detail-terminated`
- `payments-terminated`

`PaymentResultScreen.tsx` is removed. The authenticated home replaces the synthetic calculator quick link with an application-status link only when a persisted application exists.

## Verification and boundaries

`scripts/release/verify-mobile-runtime-wiring.py` checks the exact no-data wrapper on every route, authenticates the shared guard, asserts old payment-result code is gone, and guards the home shortcut. The required mobile workflow additionally runs TypeScript typecheck and Expo Android/iOS exports. There is no relevant new PostgreSQL test for a UI-only fail-closed quarantine; existing PostgreSQL coverage for authoritative mobile bootstrap and financing evidence is unchanged and continues in `ci`.

No API or database changes; no real payment, bank, fund, OIDC tenant, environment or credentials touched. All monetary rules stay in the backend. This PR does not claim owner/shared prototype routes are authoritative or deliver a membership/payment initiation endpoint.

## Next: owner/shared and obsolete identity quarantine

PR #114 extends the same authenticated fail-closed screen to the remaining owner and shared prototype routes and the three obsolete local identity/OTP-error routes. The strict route inventory, security/authentication boundaries and residual gaps are documented in `mobile-owner-shared-legacy-quarantine-v1.md`. Real OIDC login, the OTP redirect, authenticated profile/contracts/payment screens and sign-out are not quarantined.
