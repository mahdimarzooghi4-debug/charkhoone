# ADR 0001 — Technical Specification v3 approved

Date: 1405/06/24
Status: Accepted

The product owner approved Technical Specification v3 as the implementation baseline.

Implementation guardrails:
- Business rules in the approved v3 specification take precedence over conflicting legacy spreadsheet formulas.
- External credit grade is queried from a partner; Charkhoone does not generate credit grades.
- Partner APIs are not considered operational until real contracts, authentication and reconciliation behavior are supplied and tested.
- Open P0 decisions (day-count, partial-payment allocation, rounding points, early-cancellation frozen-principal release, monthly bank obligation amount and landlord monthly payment source) must not be guessed in production code.
- Frozen bank principal is non-spendable and never used for coverage or landlord transfer.
