# Production authentication configuration hardening v1

This phase prevents a non-development API process from starting with an unconfigured JWT/OIDC authority or audience.

- Development may keep `Authentication:Authority` and `Authentication:Audience` empty so the existing integration-test authentication scheme and local development remain possible.
- Every non-Development environment must configure both values before the application can start.
- JWT bearer metadata continues to require HTTPS outside Development.
- The API still derives business-user identity from the authenticated OIDC `sub` claim and the existing internal user mapping; this phase does not add account auto-provisioning.
- Integration coverage verifies that Production startup fails when either required setting is absent and that `/health` starts when both are supplied.
- No Keycloak realm URL, client id, secret, OTP behavior, or deployment credential is invented or committed by this phase.
