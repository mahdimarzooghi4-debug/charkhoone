# Bank Web Panel — Figma coverage

Source file: `charkhooneh-platform` (`kIJQxlRhLRhjCCckMfcmsa`)

Page: `06 - Bank Web Panel` (`260:2`)

The 23 top-level Bank Web Panel frames currently enumerated on this page have corresponding frontend routes/states on `feature/platform-v1`.

## Authentication and dashboard

- `Bank / Login` (`790:12`) → `/bank/login`
- `Bank / Login / Failed` (`793:36`) → `/bank/login/failed`
- `Bank / Dashboard` (`260:218`) → `/bank`

## Financing requests

- `Bank / Requests` (`264:160`) → `/bank/requests`
- `Bank / Request Detail` (`268:160`) → `/bank/requests/1`
- `Bank / Request Rejection` (`310:2`) → `/bank/requests/1/reject`
- `Bank / Request Detail / Rejected` (`309:208`) → `/bank/requests/1/rejected`
- `Bank / Request Detail / Approved` (`314:2`) → `/bank/requests/1/approved`

## Plans

- `Bank / Plans` (`274:2`) → `/bank/plans`
- `Bank / Plan Detail` (`270:2`) → `/bank/plans/new`
- `Bank / Plan Detail / Existing` (`315:2`) → `/bank/plans/1`
- `Bank / Plan Deactivate Confirmation` (`327:2`) → `/bank/plans/1/deactivate`

## Receive & Pay

- `Bank / Receive & Pay` (`278:2`) → `/bank/receive-pay`
- `Bank / Financial Case Detail` (`284:2`) → `/bank/receive-pay/case/1`
- `Bank / Funding Confirmation` (`298:2`) → `/bank/receive-pay/case/1/fund`
- `Bank / Funding Processing` (`304:2`) → `/bank/receive-pay/case/1/fund/processing`
- `Bank / Funding Success` (`307:2`) → `/bank/receive-pay/case/1/fund/success`
- `Bank / Funding Failed` (`307:249`) → `/bank/receive-pay/case/1/fund/failed`
- `Bank / Transaction Detail` (`294:160`) → `/bank/receive-pay/transaction/1`

## Settings

- `Bank / Settings` (`284:601`) → `/bank/settings`
- `Bank / Settings / Add User` (`289:161`) → `/bank/settings/users/new`
- `Bank / Settings / Manage User` (`319:2`) → `/bank/settings/users/1`
- `Bank / Settings / API Connection` (`430:4`) → `/bank/settings/api`

## Implementation status

Bank Web Panel top-level Figma route/state coverage is complete for the currently enumerated page inventory. The implementation uses Next.js + TypeScript + CSS Modules and does not add Tailwind.

All applicant names, organization/bank names, plan conditions, rates, amounts, credit ranks, transaction IDs, dates, statuses, payment/funding states, API URLs/keys and operational rules shown in these screens are presentation fixtures copied from Figma. They are not backend/domain rules and no bank, brokerage, credit, Khodnevis, payment or partner API is connected by these screens.

Buttons and transitions are frontend navigation/state demonstrations only. Authentication, approval/rejection persistence, funding execution, transaction polling, plan persistence, user management, access control and API credential storage/testing will be implemented only in the later backend/database phases.

Figma-exported logo/icon/avatar URLs remain short-lived working references. Exact exported bytes must be vendored into the repository before final merge without redrawing or substituting the assets. Pixel-level visual regression is also still a pre-merge task; compile/typecheck/build CI does not replace final visual review.

## Direct Figma review — 2026-09-16

- Read page `260:2` directly: its name is `06 - Bank Web Panel`, and it contains the same 23 top-level frames listed above. This inventory does not make any claim about other Figma pages.
- Retrieved fresh design context and reference screenshots for Dashboard (`260:218`) and Requests (`264:160`). Corrected card order, right-aligned KPI values, sidebar icon placement, logo dimensions, request-filter order, search-icon placement and the dashboard view-all link alignment. Desktop page height now follows the 1041px reference; narrow layouts retain their existing responsive treatment.
- Table columns use the Figma width proportions within the available width, including the table border, to avoid clipping the final column at the reference viewport. Horizontal scrolling remains available below the desktop table width.
- Corrections are scoped to these two reviewed routes. The remaining Bank screens still require their own visual review; route coverage alone is not visual sign-off.
- Existing Web CI errors in the final-confirmation and membership fixture arrays were reproduced locally and fixed with explicit optional-property types. Fixture values and runtime behavior are unchanged.
- Web `npm run typecheck` passes. Local production builds (default and webpack) stop with the environment error `ENOENT: uv_resident_set_memory`; GitHub CI is the production-build verification gate for this tranche.
- The local development server starts, but the available review browser blocks `http://localhost:3000/bank` with `ERR_BLOCKED_BY_CLIENT`. Rendered-browser visual approval is therefore still pending.
- Exact-asset vending remains blocked in this environment: both a fresh design-context asset and a fresh `download_assets` export timed out without returning bytes. Existing asset references were retained; no icon/logo was redrawn or substituted.

Frontend work remains open. Backend and database changes are outside this tranche. PR #3 must remain Draft and unmerged.
