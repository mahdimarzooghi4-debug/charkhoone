# Mobile real API / OIDC wiring V1

This slice replaces the primary mobile application's synthetic authentication and dashboard data with a real authenticated API boundary.

It does not contact or configure a real OIDC tenant, staging environment, bank, fund, payment provider, app store, or signing service.

## Authentication boundary

The mobile application is an OIDC public client.

It uses:

- Authorization Code response flow;
- PKCE with the S256-capable Expo AuthSession implementation;
- the existing `charkhoone://auth/callback` application scheme;
- OIDC discovery from the configured HTTPS issuer;
- no client secret.

The checked-in public runtime inputs are documented in `apps/mobile/.env.example`:

- `EXPO_PUBLIC_CHARKHOONE_API_BASE_URL`
- `EXPO_PUBLIC_CHARKHOONE_OIDC_ISSUER`
- `EXPO_PUBLIC_CHARKHOONE_OIDC_CLIENT_ID`
- `EXPO_PUBLIC_CHARKHOONE_OIDC_AUDIENCE`

These values are public application configuration and must never contain credentials.

Production API and OIDC URLs must use HTTPS. HTTP is accepted only for localhost/127.0.0.1 in development.

## Session storage

Access/refresh token material is stored through Expo SecureStore using the this-device-only unlocked accessibility level.

The application does not store tokens in source, AsyncStorage, route parameters, or a checked-in environment file.

When an access token is no longer fresh, the application uses the provider-issued refresh token when one exists. If refresh cannot be performed, the local session is cleared and the operator/user must authenticate again.

Local sign-out clears the device session. This slice does not claim provider-side revocation when the external provider has not been contacted.

## API boundary

Authenticated mobile requests:

- are limited to paths beginning with `/api/v1/`;
- are resolved only against the configured API origin;
- use `Authorization: Bearer <access token>`;
- clear the local session after an API HTTP 401.

The client does not decode a JWT to make authorization decisions. The API remains authoritative for OIDC `sub` mapping and resource access.

## Bootstrap endpoint

The backend adds:

`GET /api/v1/mobile/bootstrap`

The endpoint maps the authenticated OIDC `sub` through the existing `IUserIdentityLookup` boundary and returns read-only persisted data for that internal user.

The response contains:

- the internal user id;
- latest credit application for the user, when one exists;
- up to 20 accessible tenant/owner contracts;
- persisted monthly rent in rial when a trusted contract snapshot exists;
- up to 50 non-terminal payment instructions belonging to contracts where the user is the tenant.

Payment data includes persisted payment id, obligation id, contract id, contract month, component kind, due timestamp, exact amount in rial, status, and update timestamp.

Financial decimals are serialized as invariant strings. The React Native client formats those strings for display without converting authoritative money through JavaScript floating-point numbers.

## Synthetic-data removal

The primary authenticated routes no longer present these values as real data:

- sample phone number and OTP;
- sample user name, national id, membership limit, or bank account;
- fake contracts/cities/tracking codes;
- fake payment history/reference numbers;
- fake bank loan plans, rates, or monetary amounts;
- toman-denominated authoritative amounts;
- a payment button that jumps directly to a success screen.

The financing-plan screen now states that a real plan-list read endpoint is not available instead of inventing plans.

The payment screen is read-only because the current public API exposes reconciliation of an existing payment instruction, not a separate online payment-initiation endpoint. The mobile UI therefore does not misuse reconciliation as payment initiation.

## PostgreSQL evidence

`MobileBootstrapIntegrationTests.AuthenticatedMobileBootstrap_ReadsOnlyOwnedPostgresData_WithExactRialText` seeds real PostgreSQL rows for:

- authenticated tenant;
- owner;
- unrelated tenant;
- credit application;
- accessible and unrelated contracts;
- monthly obligations;
- payment instructions and components.

The test proves:

- the authenticated user's persisted application and contract are returned;
- the unrelated contract/payment are not returned;
- the monetary amount remains the exact string `1234567890123456.78`;
- a valid authenticated subject with no mapped Charkhoone user receives HTTP 403.

All seeded rows are removed afterward.

## CI enforcement

The required `mobile-export-build` gate now runs `scripts/release/verify-mobile-runtime-wiring.py` before dependency installation and export.

The verifier enforces:

- the SDK-57 AuthSession/SecureStore dependency pins;
- SecureStore native plugin configuration;
- code + PKCE rather than implicit token response;
- no mobile client secret;
- API path/origin restrictions;
- required public runtime config names;
- absence of the old sample phone/OTP, sample bank, toman amounts, and direct synthetic payment-success route from the authoritative mobile screens.

The existing gate still typechecks and exports production Android and iOS bundles. It still does not claim a native APK/AAB/IPA build or signed store artifact.

## External activation requirements

A real environment still needs:

1. an approved HTTPS OIDC issuer;
2. a registered public native client id;
3. the exact `charkhoone://auth/callback` redirect registration;
4. the API audience/scope contract approved by the provider;
5. a reachable HTTPS API for the mobile application;
6. a Charkhoone `UserRow` mapping for the authenticated OIDC `sub`;
7. normal staging promotion evidence before production use.
