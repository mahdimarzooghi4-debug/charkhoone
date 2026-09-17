# Rial precision correctness v1

This phase removes the fixed PostgreSQL scale from persisted rial-denominated amounts.

- Every decimal persistence property whose name ends with `Rial` maps to PostgreSQL `numeric` without an explicit precision or scale.
- Ratio/rate fields such as credit loan ratios and the monthly lost-fund-return rate remain fixed-precision because they are policy values, not persisted rial amounts.
- EF Core migration `UseUnscaledRialNumeric` was generated with `dotnet ef`; generated migration, designer, and model snapshot are version-controlled.
- PostgreSQL integration coverage checks `information_schema` for an unscaled `external_transactions.AmountRial` column and round-trips a decimal with more than 18 fractional digits without database scale rounding.
- No product rounding policy is introduced by this phase.
- The migration is exercised only against the ephemeral PostgreSQL service in CI; this document does not claim staging or production deployment.
