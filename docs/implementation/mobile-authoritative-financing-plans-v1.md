# Mobile authoritative financing plans V1

This slice closes the mobile financing-plan discovery gap without introducing synthetic bank products, rates, monetary amounts, or provider decisions.

## Authoritative read endpoint

The API adds:

`GET /api/v1/credit-applications/{id}/loan-plans`

The endpoint:

- requires the existing authenticated OIDC boundary;
- resolves the internal user from the authenticated `sub`;
- requires the credit application to belong to that internal user;
- returns HTTP 404 for another user's application instead of disclosing its existence;
- returns HTTP 409 unless the application is currently `PlanSelectionPending`;
- lists only persisted `BankLoanPlanVersionRow` records that are:
  - `Published`;
  - `Public`;
  - exactly 12 months, matching the approved domain term;
- returns at most 100 rows in deterministic title/bank/id/version order.

Each returned item contains only persisted plan data:

- plan id;
- exact version;
- bank id;
- title;
- persisted interest-terms text;
- term months.

No loan amount, tenant contribution, installment amount, savings estimate, property data, or numeric interest rate is fabricated by this endpoint.

Organizational, Draft, Suspended, and Retired plan versions are not exposed by this public applicant list.

## Selection mutation

The mobile application continues to use the existing authoritative mutation:

`POST /api/v1/credit-applications/{id}/loan-plan`

with the exact persisted `planId` and `version`.

That mutation already revalidates:

- application ownership;
- `PlanSelectionPending` state;
- exact persisted plan id/version;
- `Published` status;
- `Public` scope;
- 12-month term.

On success it preserves the existing workflow transition to `PropertyContractPending`, audit event, and outbox event. This slice does not bypass or duplicate those mutation semantics.

## Mobile list and confirmation

`/(tenant)/financing-plans` now:

- reads the latest application from authenticated mobile bootstrap;
- requests plans only when the latest application is `PlanSelectionPending`;
- displays the exact backend title, bank id, version, term, and persisted interest terms;
- shows an explicit empty state when no public published plan exists.

`/(tenant)/plan-confirmation` does not trust route parameters as plan data.

It receives only the candidate application/plan/version identifiers, calls the authoritative list endpoint again, and displays the exact matching persisted row only if that exact version remains available.

Confirmation no longer displays synthetic:

- bank names;
- loan amounts;
- tenant contribution amounts;
- monthly installment amounts;
- rent amounts;
- rates;
- savings estimates;
- contract tracking numbers, dates, or addresses.

Submitting confirmation calls the existing exact-version selection mutation and returns the user to the authenticated home view. It does not jump to the old synthetic financing-under-review screen.

## PostgreSQL evidence

`BankLoanPlanReadIntegrationTests.Applicant_ListsOnlySelectablePersistedPlans_ThenSelectsExactVersion` seeds real PostgreSQL rows for:

- applicant and unrelated authenticated user;
- one `PlanSelectionPending` credit application;
- one Published/Public plan;
- one Draft/Public plan;
- one Published/Organizational plan;
- one Suspended/Public plan.

The test proves:

- another authenticated user receives 404 for the applicant's plan list;
- only the Published/Public plan is returned;
- bank id, title, exact version, persisted terms, and 12-month term are returned unchanged;
- the exact returned plan can be selected through the existing mutation;
- the application becomes `PropertyContractPending` and persists the exact plan id/version;
- the list endpoint returns 409 after the application leaves `PlanSelectionPending`.

Seeded test rows and selection evidence are cleaned up afterward.

## CI enforcement

The mobile runtime verifier now requires:

- the financing-plan read helper;
- the financing-plan selection helper;
- `PlanSelectionPending` gating in the list screen;
- exact plan id/version propagation;
- authoritative re-read in the confirmation screen;
- use of the existing selection mutation;
- removal of the old synthetic financing amounts and direct financing-under-review route from plan confirmation.

The existing required mobile gate still runs locked dependency installation, TypeScript typechecking, and Android/iOS Expo production export.

## Deliberate external boundary

This slice does not provision bank-plan administration, a real bank provider, organizational eligibility, staging, production, or OIDC tenant configuration.

Organizational plans remain intentionally excluded from applicant self-selection because the current authoritative selection mutation supports only Public plans. Extending that boundary requires an explicit organization-membership/eligibility model and must not be inferred in the mobile client.
