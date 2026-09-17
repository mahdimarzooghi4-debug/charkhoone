# API security hardening v1

This phase adds defense-in-depth controls around the existing authenticated API without changing financial business rules.

## Sensitive mutation rate limiting

The following mutation routes use the named `sensitive-mutation` limiter:

- create a credit application;
- submit a credit application;
- reconcile a payment instruction;
- reconcile normal contract settlement.

The limiter runs after authentication, so authenticated requests are partitioned by OIDC `sub`. Requests without an authenticated subject fall back to remote IP. The default is 30 requests per 60 seconds with no queue, and both values are deployment-configurable. Rejection is HTTP 429 with Problem-Details-compatible JSON and `Retry-After` when the framework supplies one.

These numbers are operational abuse controls, not payment deadlines, eligibility rules, or financial-policy limits. The in-process limiter is defense in depth only. A multi-replica production deployment still needs a trusted ingress/distributed limit if a globally shared quota is required.

## Response hardening

All responses add:

- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY`;
- `Referrer-Policy: no-referrer`.

Responses below `/api` also use `Cache-Control: no-store` and `Pragma: no-cache` so authenticated financial/API responses are not intentionally cached by clients or intermediaries.

The phase does not introduce request/response body logging and therefore does not add OTPs, tokens, bank/account identifiers, documents, or financial payloads to logs or telemetry.

## Controls that require deployment/provider policy

This slice intentionally does not guess deployment-specific values or external identity behavior. Remaining controls include:

- Keycloak MFA policy for sensitive operators;
- Keycloak session lifetime/revocation policy;
- maker-checker authorization for future administrative/manual-payment and beneficiary-account mutation routes;
- trusted-proxy/forwarded-header and TLS termination configuration at Nginx/ingress;
- a production CORS allowlist once actual web origins are known;
- ingress/distributed rate limiting when the API runs with multiple replicas.

No database schema change or EF migration is required for this phase.
