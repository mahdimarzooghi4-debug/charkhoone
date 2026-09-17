-- SELECT-only audit. Each row is a stable check code and violation count, never customer data.
-- Run inside a read-only, repeatable-read transaction for a consistent snapshot.
SELECT 'journal_balance' AS check_code, count(*) AS violations FROM (
  SELECT e."Id" FROM journal_entries e LEFT JOIN journal_lines l ON l."JournalEntryId" = e."Id"
  GROUP BY e."Id" HAVING count(l."Id") < 2 OR sum(l."DebitRial") <> sum(l."CreditRial")
     OR sum(l."DebitRial") <= 0 OR sum(l."CreditRial") <= 0
) bad
UNION ALL
SELECT 'journal_line_sides', count(*) FROM journal_lines
WHERE "DebitRial" < 0 OR "CreditRial" < 0
   OR ("DebitRial" > 0) = ("CreditRial" > 0)
   OR "DebitRial"::text IN ('NaN', 'Infinity', '-Infinity')
   OR "CreditRial"::text IN ('NaN', 'Infinity', '-Infinity')
UNION ALL
SELECT 'canonical_currency', count(*) FROM (
  SELECT "Currency" FROM ledger_accounts UNION ALL SELECT "Currency" FROM external_transactions
) amounts WHERE "Currency" <> 'IRR'
UNION ALL
SELECT 'blank_idempotency_key', count(*) FROM (
  SELECT "IdempotencyKey" FROM external_transactions UNION ALL
  SELECT "IdempotencyKey" FROM journal_entries UNION ALL
  SELECT "IdempotencyKey" FROM payment_instructions UNION ALL
  SELECT "IdempotencyKey" FROM bank_approvals UNION ALL
  SELECT "IdempotencyKey" FROM fund_principal_freezes UNION ALL
  SELECT "IdempotencyKey" FROM verification_requests UNION ALL
  SELECT "IdempotencyKey" FROM credit_eligibility_assessments
) keys WHERE "IdempotencyKey" IS NULL OR btrim("IdempotencyKey") = ''
UNION ALL
SELECT 'frozen_principal_orphan', count(*) FROM frozen_principals f
LEFT JOIN lease_contracts c ON c."Id" = f."ContractId" WHERE c."Id" IS NULL
UNION ALL
SELECT 'contract_application_orphan', count(*) FROM lease_contracts c
LEFT JOIN credit_applications a ON a."Id" = c."CreditApplicationId"
WHERE c."CreditApplicationId" IS NOT NULL AND a."Id" IS NULL
UNION ALL
SELECT 'allocation_contribution_equation', count(*) FROM funding_allocations
WHERE "FullDepositEquivalentRial" < 0 OR "BankApprovedLoanRial" < 0 OR "TenantContributionRial" < 0
   OR "BankApprovedLoanRial" + "TenantContributionRial" <> "FullDepositEquivalentRial"
   OR "BankApprovedLoanRial"::text IN ('NaN', 'Infinity', '-Infinity')
   OR "TenantContributionRial"::text IN ('NaN', 'Infinity', '-Infinity')
   OR "FullDepositEquivalentRial"::text IN ('NaN', 'Infinity', '-Infinity')
UNION ALL
SELECT 'frozen_allocation_mismatch', count(*) FROM frozen_principals f
JOIN funding_allocations a ON a."ContractId" = f."ContractId"
WHERE f."AmountRial" <> a."BankApprovedLoanRial" OR f."BankId" <> a."BankId"
UNION ALL
SELECT 'contribution_allocation_mismatch', count(*) FROM tenant_contributions t
JOIN funding_allocations a ON a."Id" = t."FundingAllocationId"
WHERE t."ContractId" <> a."ContractId" OR t."InitialAmountRial" <> a."TenantContributionRial"
UNION ALL
SELECT 'component_obligation_mismatch', count(*) FROM monthly_obligation_components c
JOIN payment_instructions p ON p."Id" = c."PaymentInstructionId"
WHERE c."MonthlyObligationId" <> p."ObligationId"
UNION ALL
SELECT 'coverage_relationship_mismatch', count(*) FROM coverage_payments c
JOIN monthly_obligations o ON o."Id" = c."MonthlyObligationId"
JOIN payment_instructions p ON p."Id" = c."PaymentInstructionId"
WHERE c."ContractId" <> o."ContractId" OR p."ObligationId" <> o."Id"
UNION ALL
SELECT 'lost_return_coverage_mismatch', count(*) FROM lost_fund_returns l
JOIN coverage_payments c ON c."Id" = l."CoveragePaymentId"
WHERE l."ContractId" <> c."ContractId" OR l."WithdrawnAmountRial" <> c."AmountRial"
UNION ALL
SELECT 'unvalidated_constraint', count(*) FROM pg_constraint
WHERE connamespace = 'public'::regnamespace AND NOT convalidated
UNION ALL
SELECT 'invalid_index', count(*) FROM pg_index i JOIN pg_class c ON c.oid = i.indrelid
WHERE c.relnamespace = 'public'::regnamespace AND (NOT i.indisvalid OR NOT i.indisready)
ORDER BY check_code;
