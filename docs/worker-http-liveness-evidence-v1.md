# Worker Independent HTTP Liveness Evidence V1

## Purpose

The Worker now exposes an independent HTTP liveness surface so release evidence can prove that the Worker process is not only running but can also accept and answer an HTTP request from outside the process.

## Liveness contract

The Worker exposes:

- `GET /health`
- `GET /health/live`

Both endpoints return HTTP 200 with a response identifying `Charkhoone.Worker` and `status=live` while the host is running.

This is intentionally a **liveness-only** contract. It does not claim that PostgreSQL, RabbitMQ, or any external financial integration is reachable or healthy. No Worker readiness endpoint is defined by this phase.

## Release identity

When `Release:GitSha` is configured, it must be a full 40-character hexadecimal git SHA. Successful HTTP responses include:

`X-Charkhoone-Release-Sha: <full git sha>`

This lets the container smoke test bind the HTTP response to the same immutable source revision used to build the image.

## Container evidence

The container release workflow now verifies all of the following on a real built Worker image:

- the image runs as a configured non-root user;
- the OCI revision label exactly matches `GITHUB_SHA`;
- TCP port 8080 is exposed;
- the Worker container remains running;
- `GET /health/live` succeeds over a host-to-container HTTP connection;
- the response contains the exact release SHA header;
- the response identifies `Charkhoone.Worker` and `status=live`.

The SHA-bound container evidence records `worker_http_liveness_smoke=success` and `worker_release_sha_header=verified`. It also records `worker_readiness=not-claimed` so liveness evidence cannot be misrepresented as dependency readiness evidence.

## Evidence boundary

This phase does not push an image to a registry and does not deploy or contact staging or production. It does not create a schema migration and does not define or change financial policy.
