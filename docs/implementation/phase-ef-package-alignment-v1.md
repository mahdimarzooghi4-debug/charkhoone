# EF package alignment v1

This phase removes the mixed Entity Framework Core relational dependency versions observed in CI.

- Central package management now enables transitive pinning.
- `Microsoft.EntityFrameworkCore.Relational` is explicitly pinned to `10.0.12`, matching the existing EF Core and EF Core Design package line.
- `Npgsql.EntityFrameworkCore.PostgreSQL` remains pinned independently at `10.0.3`; no provider behavior or database schema is changed by this phase.
- The previous MSBuild conflict between `Microsoft.EntityFrameworkCore.Relational` 10.0.4 and 10.0.12 is no longer emitted by the backend build.
- A pre-existing nullable warning in `PersistenceModelTests` was fixed so the backend build can complete without compiler/MSBuild warnings from project code.
- No EF migration is required because this phase changes dependency resolution and tests only, not the model or schema.
