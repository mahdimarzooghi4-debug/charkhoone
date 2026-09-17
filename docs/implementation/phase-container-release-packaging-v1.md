# Phase: container release packaging v1

This phase closes the repository-side container packaging gap after the backend/database source freeze on `main`.

## Scope

- add production-oriented multi-stage Dockerfiles for API, Worker, and Web;
- run all application runtime containers as non-root;
- attach the exact source revision through an OCI image label;
- generate and commit the Web npm lockfile with npm itself rather than writing a lockfile manually;
- use the generated lockfile with `npm ci` in the Web image;
- add provider-neutral release Compose/Nginx wiring for externally managed PostgreSQL, RabbitMQ, OIDC, TLS, registry, and secrets;
- add CI that actually builds every image and runs container startup smoke checks;
- produce SHA-bound container evidence without pushing images or deploying an environment.

## Deliberate boundaries

- no registry is selected or configured;
- no staging or production host is created;
- no real environment credentials are committed;
- EF migrations do not run from application container startup;
- no PostgreSQL/RabbitMQ/OIDC service is provisioned by the release Compose file;
- Worker process startup is not represented as Worker business health because the Worker has no HTTP health endpoint;
- mobile install/typecheck remains separate; no mobile container or mobile production build is claimed;
- external partner adapters remain unavailable until real provider contracts and credentials exist;
- no unresolved financial policy is encoded.

The temporary lockfile-generation workflow is removed before final validation. Only the npm-generated `apps/web/package-lock.json` remains.
