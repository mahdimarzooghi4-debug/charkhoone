# Admin release wiring V1

This slice closes the repository-side runtime wiring gap between the Admin Pilot Web and the protected Pilot Operations API.

It does not provision or contact a real OIDC tenant, hosting platform, staging environment, bank, fund, or payment provider.

## Runtime topology

The release Compose contract now wires:

- Browser / approved OIDC gateway -> Nginx
- Nginx -> Next.js Web on `web:3000`
- Nginx -> API on `api:8080`
- Next.js server -> protected Pilot API on the internal origin `http://api:8080`

The Web API origin is server-only. It is not exposed through a `NEXT_PUBLIC_` variable and is not baked into the image at build time.

## OIDC boundary

`CHARKHOONE_ADMIN_OIDC_LOGIN_URL` is supplied to the Web runtime and must be an approved HTTPS login destination.

The repository still does not:

- mint an operator token;
- store an OIDC client secret;
- implement a local password;
- implement a role fallback;
- impersonate an applicant;
- trust an email address in place of `sub`.

An external approved OIDC gateway/ingress is responsible for authentication. Nginx explicitly forwards the incoming `Authorization` header to both Web and API so the server-side Admin pages can pass the bearer to `/api/v1/pilot/*`.

## Pilot authorization configuration

The API release runtime receives:

- `PilotOperations__Enabled` from `CHARKHOONE_PILOT_OPERATIONS_ENABLED`;
- `PilotOperations__AllowedSubjects__0..3` from the corresponding `CHARKHOONE_PILOT_OPERATOR_SUBJECT_<index>` inputs.

The default is disabled.

If Pilot Operations is enabled with no nonblank allowed subject, API startup already fails closed through `PilotOperationsOptions`.

Authorization remains an ordinal exact match against the authenticated OIDC `sub`.

## Release input contract

`deploy/release.env.example` documents provider-neutral placeholders for release inputs.

No real secrets are committed. PostgreSQL and RabbitMQ credential fields are placeholders only.

The existing release Compose also keeps external partner adapters unavailable and does not enable financial reconciliation by default.

## CI enforcement

The required `container-images` gate now:

1. executes `scripts/release/verify-admin-release-wiring.py`;
2. verifies the expected server-only Web/API and exact-sub Pilot configuration tokens;
3. verifies Nginx explicitly forwards Authorization;
4. rejects reintroduction of `NEXT_PUBLIC_API_BASE_URL` for this admin path;
5. renders `deploy/compose.release.yaml` with fixture values using Docker Compose;
6. records `admin_release_wiring=verified` in SHA-bound container release evidence.

## PostgreSQL evidence

`PilotOperationsIntegrationTests.ReleaseConfiguredPilotOperator_RequiresExactSubject_ForRealPostgresCase` seeds a real PostgreSQL user and credit application.

The test configures the same hierarchical Pilot Operations keys used by the release environment mapping, then proves:

- the exact configured operator subject can read the persisted case;
- a near-match subject is rejected with HTTP 403.

The seeded rows are removed afterward.

## Deliberate external boundary

This slice does not claim that staging or production OIDC is operational.

Real activation still requires:

- an approved HTTPS OIDC authority/login flow;
- real operator `sub` values;
- an ingress/gateway that supplies the authenticated bearer;
- real deployment/server credentials;
- normal staging promotion evidence for the exact release SHA.
