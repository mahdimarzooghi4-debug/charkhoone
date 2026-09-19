# Mobile authoritative owner contract terms V1

Base: `ad3d54d205d2516107c4f160b5dc07d18c0d05d2` (PR #114).

## Real capability restored

The authenticated mobile bootstrap now includes a nullable `terms` read model per contract, populated solely from the trusted and immutable `lease_contract_terms` snapshot for the *already authorized* tenant/owner contract IDs. The existing 20-contract bound and newest-first ordering remain; an unknown OIDC subject still fails closed with 403. No independent contract ID query or speculative lookup is added.

`terms` includes original Persian calendar, Persian start year/month/day, term months, cash deposit and full-deposit equivalent as invariant exact decimal **rial strings**, plus capture timestamp. Existing `monthlyRentRial` continues to be returned from the same persisted snapshot. An absent snapshot returns `terms: null` and `monthlyRentRial: null`; the client does not reconstruct rent or invent contract terms from funding allocation.

No beneficiary identifiers, source reference, unrelated application approval, payment instructions of tenants, owner payout or settlement information are included in the nested terms response.

## Mobile

The old synthetic `/(owner)/contract-active` route is restored as an authenticated owner contract read screen (not a claim that the contract is active). It filters `contracts` by `role === "Owner"` and, for a direct link, matches the optional `contractId` *only inside that authorized owner set*. It displays the persisted status exactly as received, full-deposit equivalent and cash deposit in rial, monthly rent from the snapshot, and original Persian start date. Missing/incompatible snapshot and unknown owner-contract ID show an informational fail-closed view. It does not show payout, payment confirmation, 0.5% service fees or a synthesized ending date.

The shared authoritative contracts list offers a detail link only for `Owner` contracts using that contract's ID. The other five owner financial/settlement/confirmation prototypes and other shared/tenant prototypes remain quarantined.

## Real PostgreSQL integration evidence

The existing OIDC-scoped bootstrap integration test now inserts a trusted Persian lease snapshot with a full-deposit amount above JavaScript's safe integer range, alongside:
- the original tenant and owner sharing a funded lease;
- a second contract owned by the same owner with **no** snapshot;
- a distinct contract owned by an unrelated owner.

It verifies exact large rial strings, calendar/year/month/day, no beneficiary or source-reference leakage, the tenant's correct terms, the owner's two owned contracts and no application/payment leakage, the unrelated owner's single separate contract, nullable missing terms and unknown subject 403. No schema migration or data mutation was needed beyond test seeds.

## Boundaries

This is read-only: no payment initiation, owner settlement, bank/fund operation, real OIDC tenant, staging/production or credentials touched. The authoritative backend financial calculations, full precision and final-boundary flooring, deposit × 3% rent, 12-month Persian schedule, no partial payment, oldest-debt-first, cancellation/settlement and Lost Fund Return rules remain unchanged.
