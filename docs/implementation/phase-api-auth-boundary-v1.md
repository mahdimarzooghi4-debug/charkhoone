# API authentication boundary hardening v1

This phase hardens the existing OIDC/JWT boundary without introducing provider-specific secrets or deployment values.

## Changes

- Outside `Development`, `Authentication:Authority` must be a non-empty absolute HTTPS URI.
- Outside `Development`, `Authentication:Audience` remains mandatory.
- JWT bearer inbound claim mapping is disabled so standard OIDC claim names are preserved. Application ownership checks continue to use the `sub` claim explicitly.
- The `/api/v1` route group now requires authorization by default. This prevents a future endpoint from becoming anonymous merely because its mapping forgot `.RequireAuthorization()`.
- The service-info route `GET /api/v1` is explicitly marked anonymous and remains available for lightweight service discovery.
- Existing health endpoints remain outside the authenticated API group.
- No Keycloak realm URL, audience value, client secret, OTP behavior, role model, or user auto-provisioning rule is invented or committed.

## Tests

Integration tests verify:

- missing production authority is rejected;
- non-HTTPS production authority is rejected;
- missing audience is rejected;
- valid production configuration can start and serve liveness;
- JWT bearer preserves standard OIDC claim names (`MapInboundClaims = false`);
- the API root stays anonymous while protected versioned routes reject anonymous calls.

No database schema or migration change is required.
