# Domain Core — Phase 1 scope

Implementation scope for the first post-bootstrap phase:

- Money value object using rial as the persisted/API reference unit, without imposing an unresolved rounding policy.
- Versioned bank-loan-plan and credit-grade-policy primitives.
- CreditApplication state machine.
- LeaseContract state machine.
- MonthlyObligation and PaymentInstruction states.
- Consecutive missed-month rule where a fully paid current month resets the consecutive counter without auto-settling older debt.
- Tests for valid/invalid transitions and the three-consecutive-missed trigger.

Out of scope until the corresponding approved decision exists: partial-payment allocation, lost-fund day-count, rounding points, early-cancellation release of frozen bank principal, bank monthly obligation formula, and landlord monthly-payment formula.
