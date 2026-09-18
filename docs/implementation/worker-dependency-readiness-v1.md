# Worker dependency readiness v1

The Worker now exposes two distinct health boundaries.

- `/health/live` proves only that the Worker HTTP host is alive.
- `/health/ready` proves that dependencies required by the currently enabled Worker features are ready enough for processing.

## Readiness checks

The readiness endpoint reports three named checks and returns HTTP 503 when any required check is unhealthy.

### PostgreSQL

The Worker opens the configured EF Core PostgreSQL path and requires `CanConnectAsync` to succeed.

A missing/unregistered database configuration or unreachable database is unhealthy.

### RabbitMQ

When `RabbitMq:Enabled=true`, readiness opens a RabbitMQ connection using the same Worker options as the hosted consumers/outbox.

When RabbitMQ is explicitly disabled, the check is healthy with a disabled description rather than pretending a connection was tested.

### External adapters

Readiness inspects the concrete registered adapter implementations, not just arbitrary mode strings.

When RabbitMQ processing is enabled, the Worker requires non-unavailable implementations for:

- Identity
- CancellationNotification
- NormalSettlementNotification

When financial reconciliation is enabled, the Worker additionally requires non-unavailable implementations for:

- BankApproval
- Fund
- Payment
- Coverage
- ArrearsRepayment
- CancellationSettlement
- NormalSettlementBank
- NormalSettlementTenant

This makes a release fail closed if an enabled background workflow still resolves to one of the checked-in `Unavailable...` adapters.

Development mocks remain governed by the existing environment safety rules and cannot be enabled outside Development.

## Staging evidence

The staging application smoke now derives Worker `/health/ready` from the manifest-bound `/health/live` URL and requires:

- HTTP 200
- exact release SHA header
- `service=Charkhoone.Worker`
- `status=ready`
- nonempty dependency checks
- every reported dependency status equals `healthy`

The promotion packet rejects application evidence that lacks Worker readiness proof.

This is stronger than deployment evidence alone: a deployed Worker is not promotion-ready when its runtime dependencies are unavailable.

## Evidence limits

A healthy adapter-readiness check proves only that enabled Worker workflows are not wired to the checked-in unavailable implementations.

It does not prove that a real external provider is reachable, authorized, financially correct, or production-certified. Real provider connectivity and provider-native staging evidence remain separate launch requirements.

A healthy RabbitMQ check proves connection reachability at check time, not message delivery SLOs or broker durability policy.

## PostgreSQL tests

Real PostgreSQL integration coverage proves the Worker readiness check connects to the migrated PostgreSQL database.

Additional tests prove that required unavailable adapters make enabled Worker features unhealthy and that disabled feature groups do not create false adapter requirements.

No schema migration, staging, production, or real external provider is contacted by this phase.
