# Public bank-loan plan selection v1

This phase makes the existing `PlanSelectionPending` state executable for an authenticated applicant without inventing organizational authorization.

## Applicant-owned selection

An authenticated applicant may call:

`POST /api/v1/credit-applications/{applicationId}/loan-plan`

with an exact persisted `planId` and `version`.

The application id is always resolved together with the authenticated internal applicant id. Another user receives not-found semantics and cannot bind a plan to the application.

## Exact immutable version binding

Selection binds both:

- `BankLoanPlanId`
- `BankLoanPlanVersion`

to the credit application in the same PostgreSQL transaction as the workflow transition.

The selected row must be:

- the exact requested plan id/version
- `Published`
- `Public`
- exactly 12 months

This phase deliberately does not authorize `Organizational` plans. The repository still has no trusted user-to-organization membership/authorization boundary, so treating an authenticated user as eligible for an organization plan would be invented authority.

## Workflow

A successful first selection applies exactly:

`PlanSelectionPending -> PropertyContractPending`

and writes:

- one workflow transition
- audit action `bank_loan_plan_selected`
- outbox event `credit-application.bank-loan-plan-selected.v1`

No eligibility, bank approval, funding, or contract-terms calculation is performed here.

## Idempotency and conflict

An exact replay of the already-bound plan/version returns `AlreadySelected` and writes no duplicate workflow/audit/outbox evidence.

A different requested plan after a plan has already been bound returns conflict.

A missing, suspended, retired, draft, organizational, or non-12-month plan cannot mutate the application.

## Next boundary

After this phase the application is intentionally left at `PropertyContractPending`.

The next slice must supply trusted property/lease contract evidence and the full-deposit-equivalent input required before `ExternalChecksPending` and credit eligibility evaluation. That workflow must not infer owner identity, property identity, contractual terms, or trusted contract approval.

## PostgreSQL evidence

Integration tests use the real PostgreSQL migration chain and prove:

- only the owning applicant can select
- the exact published public version is persisted
- the workflow moves to `PropertyContractPending`
- workflow/audit/outbox evidence is written once
- exact replay is idempotent
- organizational and suspended plans fail closed without mutation

No staging, production, external provider, or schema migration is involved.
