# Phone ownership / national-ID match and session policy — approved, staged

## Business contract
- The free financing calculator is self-reported and **does not** trigger OTP, Shahkar/phone ownership, or a bank credit inquiry.
- **National ID is not collected during login.** After mobile/OTP login the user can use free features. The **first authoritative Khodnevis contract query** is the earliest point requiring a national ID and a positive, still-valid provider-owned phone/national matching proof; it must occur BEFORE any contract-registry inquiry, not merely prior to financing submission. Contract lookup is not necessarily a financial obligation.
- The new `POST /api/v1/credit-applications/{id}/khodnevis/reconcile` accepts exact `nationalId` and explicit `confirm=true`, validates the pair against the current OIDC-verified phone without issuing another identity inquiry, then passes the submitted national ID only transiently to the contract evidence adapter. Missing/mismatched/expired evidence returns a conflict and does not call the provider. The legacy bodyless `property-contract/reconcile` endpoint is blocked outside local Development.
- The web route `/identity-verification` now redirects to the contract workspace; the new canonical national-ID stage is `/user/contracts/register/identity-verification` and remains a disabled/non-collecting preview until a real authenticated API and provider become available.
- After a user has an authenticated account, a **binding financing application submission** requires a successful and still-relevant match between their national ID and the phone asserted as verified by a trusted OIDC issuer.
- The first matching inquiry is initiated only upon explicit confirmation. A subsequent valid proof can be reused for the same account and current verified phone; changing the phone automatically makes the previous proof unusable.
- The phone ownership inquiry and bank credit inquiry are independent. The ordinary **8,800 toman** credit-report cost is not assumed to be the cost of phone ownership matching.
- OTP receipt proves access to a device/number; it is **not** the same as an authoritative operator/national-ID ownership match.
- A verified identity never results from a local sample response, user-provided phone field, missing claims, network failure or unconfigured provider.

## Implemented API and data boundaries
- Authenticated `GET /api/v1/mobile/account/identity-status` is read-only. It checks `phone_number_verified=true` and the current `phone_number` claim from the signed OIDC token; no query is sent to an outside provider and no fee is incurred.
- Authenticated, rate-limited `POST /api/v1/mobile/account/identity/verify` accepts only `{"nationalId":"<10-digit ID>","confirm":true}`. The server takes the mobile only from trusted verified OIDC claims, not from request JSON.
- A separate provider adapter must explicitly guarantee **idempotent billing** for a stable request identifier before the backend will ever contact it. The default provider is unavailable; no actual Shahkar/telecom provider, credentials, or billing integration has been selected or configured.
- On an independently verified positive response containing a provider reference, the server records an append-only User audit event holding keyed HMAC digests of the matched phone and national ID, provider and reference — **not** raw phone or national ID. An explicitly supplied private `IdentityMatch:HmacKey` (UTF-8 length at least 32 bytes) is mandatory; without it, the service fails closed. Never commit the key into source.
- Proof reuse requires a **separately approved** positive `IdentityMatch:EvidenceValidFor` configuration (for example a provider-approved TimeSpan). Without it or with expired/future-dated evidence, verification remains invalid; no default period is invented. Exact-pair replay under a PostgreSQL user-row lock returns a still-valid proof without a second provider call. An ambiguous remote acknowledgement must be reconciled using the stable provider key, never a fresh billable request. A future provider adapter must uphold this contract and needs separate QA and release approval.
- Outside `Development`, authenticated `POST /api/v1/credit-applications/{id}/submit` fails with `phone_national_identity_match_required` (HTTP 409) unless this user holds a valid proof for the current verified OIDC phone. Local `Development` integration tests remain isolated with mock identity and do not constitute real approval.
- Changed phone/OIDC phone-verified claim, changed HMAC key, missing provider/reference or missing proof all fail closed. No reset/revocation UI or real phone-change flow is implied by the web mock.
- Static Web OTP/login/identity screens are now explicitly labeled non-operational and cannot present fabricated OTP digits, verified mobile badges or false completion. The mobile profile reads a real API status when available and never makes a paid inquiry to display it.

## Session policy (no invented timeouts)
- Mobile OIDC Authorization Code + PKCE uses SecureStore and refreshes valid access tokens with a provider-issued refresh token. No login on every app open when the existing session remains valid.
- Reauthentication is required on explicit sign-out, invalid/unrefreshable session, or API HTTP 401. Provider-side revocation is not yet claimed for local sign-out.
- Changing the phone must require trusted verification for the new phone and invalidate the old ownership proof for sensitive actions. Changing it does not automatically authorize a bank request.
- Provider-controlled session lifetime, step-up/MFA and cross-device revocation must be approved/configured with actual issuer capabilities, not guessed as arbitrary 7/30-day durations.

## Release/production limitations
- The currently connected Render services are Web and Mobile Preview; **no Charkhoone API/worker/managed PostgreSQL service** was discovered in the confirmed workspace. Merging backend source does NOT deploy an authenticated identity API.
- No real OIDC issuer/verified phone claims, production HMAC secret, authoritative operator matching provider, operator billing contract, or production database activation is claimed.
- Before enabling real financial operations, deploy the backend with real services and verifiable proof that owner-ID matching and resubmission remain fail-closed on missing/expired/changed evidence.
- Do not treat a positive result of previous `IIdentityVerificationAdapter` alone as a Shahkar match; this new separate gate is required at authenticated submission in non-development.
