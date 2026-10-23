# Manual credit-grade preview and paid inquiry boundary (draft)

## Approved product intent
- Public tenant calculator on Web and Mobile is free and uses **self-reported, unverified** grade A1–E3. It must not call an external credit provider, charge the user, persist an authoritative assessment, or pretend to be a bank decision.
- C1/C2/C3 loan-ratio preview: **40%**. Remaining ratios remain unchanged.
- External paid credit inquiry may be initiated **only after explicit, authenticated applicant confirmation** of an actual financing request, for its exact application and selected bank plan. Merely opening or editing the calculator is never consent.
- After the trusted grade is received, re-evaluate loan and tenant contribution using the authoritative backend ratio policy and immutable trusted contract. If terms differ from preview, the applicant must explicitly reconfirm before bank handoff.
- Ordinary provider charge currently supplied by business: **8,800 toman per actually billed inquiry** (not a guaranteed contractual tariff).
- Expense is absorbed from Charkhoone's membership revenue, NOT charged separately to tenant and NOT treated as a reduction in tenant membership debt. The 2,500,000 toman annual fee remains unchanged unless a separate approved contract changes it.

## Required backend gate before enabling chargeable adapter
- Persist exact application/request/plan identity, applicant authorization, consent intent, timestamp, policy version, and one-time idempotency key. Audit every transition.
- Enforce the recorded consent and allowed application state inside the backend **before** invoking a chargeable provider, not just in web/mobile UI.
- Retry safe: duplicate UI actions, workers, and HTTP retries must not cause new billable inquiries. If remote acknowledgement is ambiguous, reconcile the same provider inquiry identity rather than retrying with a fresh key.
- Record actual provider charge at a verified billing boundary, independently from the financial eligibility result; use the actual charge (ordinary indicative rate 8,800 toman) with accounting lineage. Reject speculative cost posting.
- Missing provider or pricing configuration fails closed. The existing unavailable adapter must remain unavailable; development mock cannot simulate a billed production inquiry.
- Recomputed official terms must have explicit applicant acceptance prior to any real bank dispatch; a self-reported grade never enters official eligibility.
- Any membership accounting change must follow its own authorized journal/payment contracts; do not mutate member balance from a calculator or guess a settlement schema.

## Implementation status
- Manual grade calculators: UI preview only, no external inquiries.
- Protected paid-inquiry authorization, post-inquiry reconfirmation, cost ledger, and real bank dispatch: **not implemented** in this draft. These are separate backend/API/integration work items with tests and staging gates.
- Do not present mock UI or internal APIs as real paid eligibility or payment functionality.
