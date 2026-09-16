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
