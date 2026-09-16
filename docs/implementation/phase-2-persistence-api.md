# Phase 2 — Persistence and API foundation

This phase turns the approved domain rules into a PostgreSQL/EF Core persistence boundary and a versioned HTTP API foundation.

Implemented scope:

- EF Core rows/configurations for versioned bank loan plans and allowed organizations.
- EF Core rows/configurations for versioned external credit-grade policies and grade ratios.
- Credit application and lease-contract current state rows.
- Append-oriented workflow transition rows carrying actor, reason, source/target state and UTC occurrence time.
- Payment instruction rows with a unique idempotency key and lossless decimal rial storage.
- Frozen bank principal stored separately and keyed by contract; no debit field/operation is introduced.
- Transactional-outbox storage shape for later Worker/RabbitMQ publishing.
- `/api/v1` route group, Problem Details with trace id, health endpoint and generated OpenAPI document.
- Persistence model tests for money precision, idempotency uniqueness, frozen-principal separation, workflow audit and outbox registration.

Deliberately not implemented in this phase:

- Production seed data for banks, organizations or external partners.
- Real bank/fund/credit/self-registration adapters before their contracts are available.
- Partial-payment allocation behavior.
- Daily/day-count interpretation of the 3% lost-fund return.
- Final money-rounding points.
- Early-cancellation release/settlement timing for frozen bank principal.

The initial database migration should be generated only after the EF model compiles and its model tests pass in CI, so the migration represents a verified model rather than a hand-authored approximation.
