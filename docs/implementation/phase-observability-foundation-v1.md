# Observability foundation v1

This phase adds a vendor-neutral OpenTelemetry baseline for the API and Worker while keeping sensitive business data out of telemetry by design.

- API and Worker share the `Charkhoone` ActivitySource and Meter and export traces/metrics through OTLP only when `Observability:OtlpEndpoint` is explicitly configured.
- The API adds ASP.NET Core tracing/metrics; shared infrastructure adds outbound HTTP and .NET runtime instrumentation.
- Health endpoints are split into liveness (`/health` and `/health/live`) and dependency readiness (`/health/ready`). Readiness checks PostgreSQL and RabbitMQ; RabbitMQ is healthy-by-configuration when disabled for a deployment.
- API responses expose `X-Trace-Id`, and Problem Details uses the current activity trace id when available for operational correlation.
- Worker outbox publish and inbox consume operations create spans and low-cardinality counters. Telemetry tags include operation, messaging system/destination, message type and outcome, but not payloads, user/contract/application ids, payment amounts, tokens, OTP values, account numbers or documents.
- The OTLP endpoint must be an absolute HTTP/HTTPS URI. No collector credentials, headers or provider-specific secrets are committed to the repository.
- OpenTelemetry packages are pinned centrally. This phase does not add a specific observability vendor, collector deployment or production endpoint.
- No database schema or EF migration is changed by this phase.
