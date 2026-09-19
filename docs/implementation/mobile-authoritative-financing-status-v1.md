# Mobile authoritative financing status V1

This slice removes synthetic financing review, approval, rejection, property, bank, and membership data from the mobile status flow.

## Authoritative bootstrap evidence

The authenticated `GET /api/v1/mobile/bootstrap` response now enriches the latest owned credit application with three nullable persisted evidence blocks.

### selectedPlan

Resolved only from the application's exact persisted `BankLoanPlanId` plus `BankLoanPlanVersion`:

- plan id;
- exact version;
- bank id;
- title;
- persisted interest-terms text;
- term months.

If the exact persisted plan version cannot be resolved, the block is null. The mobile client does not invent a replacement.

### bankApproval

Read only from the unique `bank_approvals` row belonging to the latest owned application:

- provider;
- status;
- maximum eligible loan;
- approved loan, when present;
- reason code, when present;
- updated timestamp.

Monetary values are serialized as invariant decimal strings in rial.

### fundingAllocation

Read only from the unique `funding_allocations` row belonging to the latest owned application:

- contract id;
- bank id;
- full-deposit equivalent;
- maximum eligible loan;
- bank-approved loan;
- tenant contribution;
- updated timestamp.

All monetary values are serialized as invariant decimal strings in rial. The client does not convert them through JavaScript floating point before display.

## Mobile status routes

The authenticated home page routes the latest persisted application state as follows:

- `PlanSelectionPending` -> authoritative financing-plan list;
- `ApprovedFunded` -> authoritative approved-funding status;
- `Rejected` -> authoritative rejected status;
- other application states -> authoritative review/status view.

The three status pages all call the authenticated mobile bootstrap hook and fail closed when the expected persisted evidence is absent.

### Review/status

`/(tenant)/financing-under-review` shows:

- exact application status;
- application id;
- exact selected-plan metadata when available;
- bank-approval evidence when available;
- funding-allocation evidence when available.

It does not invent requested amount, bank name, contract tracking code, property address, or progress stage.

### Approved

`/(tenant)/financing-approved` shows an approval state only when:

- application status is exactly `ApprovedFunded`; and
- a persisted funding allocation exists for that same application.

It displays exact rial values from the persisted allocation.

The prior hardcoded membership call-to-action is removed. This repository does not currently expose an authoritative mobile membership entitlement/payment model, so this screen does not fabricate one.

### Rejected

`/(tenant)/financing-not-approved` shows rejection only when application status is exactly `Rejected`.

If a bank-approval row exists, its persisted status/provider/reason code is shown. If no bank-approval row exists, the client explicitly avoids attributing the rejection to a bank because rejection may occur earlier in the workflow.

Reason codes remain provider/system codes. The mobile client does not turn them into invented narrative explanations.

## PostgreSQL evidence

`MobileBootstrapIntegrationTests.AuthenticatedMobileBootstrap_ReadsOnlyOwnedPostgresData_WithExactRialText` now seeds real PostgreSQL data for both the authenticated tenant and an unrelated tenant.

The test proves that the authenticated tenant receives only its own:

- latest application;
- exact selected plan;
- bank-approval evidence;
- funding allocation;
- contract;
- open payment instruction.

It also verifies large monetary values are returned as exact strings and that unrelated bank/provider/plan evidence does not leak into the response.

## CI enforcement

The required mobile runtime verifier now covers the three financing-status screens and requires:

- authenticated bootstrap usage;
- persisted application-status checks;
- selected-plan/bank-approval/funding-allocation usage;
- exact-rial formatting;
- home routing from persisted status;
- absence of the old synthetic membership route;
- absence of hardcoded bank/property/financing examples.

The existing required mobile workflow still runs locked dependency installation, TypeScript typecheck, Android export, iOS export, and SHA-bound evidence upload.

## Deliberate external boundary

This slice does not call a real bank, fund, payment provider, OIDC tenant, staging environment, or production system.

It also does not define membership entitlement semantics. A real membership flow requires an authoritative backend model and cannot be inferred from `ApprovedFunded`.

## Subsequent legacy tenant-route quarantine

The follow-up mobile legacy tenant financial quarantine V1 replaces the old tenant-only mock routes with one fail-closed, authenticated informational view. This includes direct links to former membership and contribution screens, all three kinds of payment-result screens (success/failure/pending), receipt, final confirmation, calculator and result, old contract/termination details, terminated payments, and the old home review/termination views. Route names remain addressable to avoid falling through to unexpected navigation, but route names alone never imply any persisted financial state.

The old `PaymentResultScreen` component is deleted and the authoritative home no longer links to the sample calculator. A verified application-status shortcut replaces it when a real application exists. Existing authenticated home, financing status/plan, contracts overview, and payments instruction views remain supported.

This is a client-only quarantine: no backend model, PostgreSQL schema, monetary rule, provider, OIDC configuration, bank, fund, payment initiation, settlement/cancellation policy, or environment was changed. Because it makes no persisted-data read or mutation changes, new PostgreSQL integration tests are not applicable to this slice; the mobile verifier explicitly guards every quarantined path, authentication gate, and removal of the old payment-result component. The separate owner/shared prototype routes are not claimed as authoritative and remain a later audit target.
