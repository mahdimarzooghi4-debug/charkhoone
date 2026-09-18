# Container release packaging

This runbook defines the provider-neutral Linux/Docker packaging boundary for Charkhoone. It does not create a hosting account, registry, staging database, RabbitMQ cluster, OIDC realm, or partner credentials.

## Release artifacts

The repository contains three application images:

- `src/Charkhoone.Api/Dockerfile` — ASP.NET Core API on port 8080.
- `src/Charkhoone.Worker/Dockerfile` — background Worker process.
- `apps/web/Dockerfile` — Next.js standalone server on port 3000.

All runtime stages use a configured non-root user. The images carry the OCI `org.opencontainers.image.revision` label supplied through `VCS_REF`. The Web image uses the checked-in npm lockfile and `npm ci`.

Example builds from the repository root:

```bash
docker build --build-arg VCS_REF="$RELEASE_SHA" -f src/Charkhoone.Api/Dockerfile -t charkhoone-api:"$RELEASE_SHA" .
docker build --build-arg VCS_REF="$RELEASE_SHA" -f src/Charkhoone.Worker/Dockerfile -t charkhoone-worker:"$RELEASE_SHA" .
docker build --build-arg VCS_REF="$RELEASE_SHA" -f apps/web/Dockerfile -t charkhoone-web:"$RELEASE_SHA" apps/web
```

For promotion, use immutable registry digests rather than mutable tags wherever the selected registry supports digest references.

## Release compose contract

`deploy/compose.release.yaml` is a provider-neutral runtime wiring contract. It expects externally provisioned PostgreSQL, RabbitMQ, and OIDC. It does not run EF migrations and it does not provision infrastructure.

Required deployment inputs include:

- immutable API, Worker, and Web image references;
- exact 40-character release Git SHA;
- `Staging` or `Production` environment name;
- runtime PostgreSQL connection;
- HTTPS OIDC authority and audience;
- HTTPS admin OIDC login URL;
- RabbitMQ host and credentials.

The compose file intentionally does not contain real secrets. `deploy/release.env.example` documents the provider-neutral input names with placeholders only.

For the admin pilot surface, the Web container receives the internal server-only API origin `http://api:8080` as `CHARKHOONE_API_BASE_URL` and receives `CHARKHOONE_ADMIN_OIDC_LOGIN_URL` at runtime. Neither value is compiled into a `NEXT_PUBLIC_` variable. The API receives `PilotOperations__Enabled` plus indexed exact-subject allowlist values. Pilot operations remain disabled by default, and API startup fails if they are enabled without at least one nonblank subject.

Nginx explicitly forwards the incoming `Authorization` header to both the API and Web upstreams. This is only a transport boundary: an approved external OIDC gateway/ingress must authenticate the operator and preserve or inject the real bearer before traffic reaches this Nginx layer. The repository does not mint an operator token and does not add a local password/session fallback.

The compose file binds Nginx to `127.0.0.1:8080` by default. Public TLS termination, certificates, firewall rules, and public DNS remain the responsibility of the chosen deployment platform or ingress. Do not expose the default HTTP listener publicly without the approved TLS boundary.

## Admin pilot activation

Keep `CHARKHOONE_PILOT_OPERATIONS_ENABLED=false` until the environment has a real OIDC boundary and the exact approved operator `sub` values.

When activating the pilot:

1. Set the HTTPS `CHARKHOONE_ADMIN_OIDC_LOGIN_URL` for the approved login flow.
2. Set one or more exact `CHARKHOONE_PILOT_OPERATOR_SUBJECT_<index>` values. Do not use roles, email addresses, wildcards, prefixes, or applicant identities as substitutes for the OIDC `sub`.
3. Set `CHARKHOONE_PILOT_OPERATIONS_ENABLED=true`.
4. Confirm the ingress/gateway forwards the authenticated bearer to Nginx and that Nginx forwards it to Web/API.
5. Verify an allowlisted subject can read the real pilot queue and a near-match subject receives 403.

The checked-in Compose file provides four indexed subject slots for the initial pilot. Expanding the operator cohort requires an explicit repository change or environment-specific configuration mechanism with equivalent exact-sub semantics.

## Database migration boundary

Application containers must not perform schema migration on startup. Before starting a new release in staging or production:

1. Use the existing guarded database rehearsal/migration tooling with the distinct migration identity.
2. Verify migration history, integrity audit, runtime role, provider backup/PITR evidence, restore evidence, and representative query-plan evidence as required by the PostgreSQL readiness runbook.
3. Start the API/Worker/Web release only after the database gate succeeds for the same release SHA.

The application runtime identity must remain separate from the migration identity.

## Application checks after deployment

For the API, verify:

- `/health/live` is successful;
- `/health/ready` is successful against the real PostgreSQL and RabbitMQ dependencies;
- `X-Charkhoone-Release-Sha` equals the deployed release SHA;
- anonymous protected API requests are rejected;
- the authenticated staging smoke suite succeeds for the same release SHA.

The Worker currently has no HTTP health surface. Container CI therefore proves process startup only. Real staging/production Worker evidence must come from the deployment platform plus logs/metrics and the existing SHA-bound release evidence contract; process startup is not equivalent to business readiness.

## External integration boundary

Development mocks are rejected outside `Development`. A container that starts with adapters in `Unavailable` mode is not proof that identity, credit-grade, bank, fund, payment, coverage, or settlement partner integrations are operational. Real partner credentials and approved adapters remain an external launch prerequisite.

## CI evidence

`.github/workflows/container-images.yml` builds all three images without pushing them, verifies their OCI revision label and non-root runtime user, runs API liveness/Web HTTP/Worker process smoke checks, and uploads SHA-bound evidence. The workflow explicitly records that registry push, staging deployment, and production deployment were not performed.
