SELECT 'lease_contracts' AS metric, count(*)::bigint AS value FROM lease_contracts
UNION ALL SELECT 'monthly_obligations', count(*)::bigint FROM monthly_obligations
UNION ALL SELECT 'payment_instructions', count(*)::bigint FROM payment_instructions
UNION ALL SELECT 'external_transactions', count(*)::bigint FROM external_transactions
UNION ALL SELECT 'coverage_payments', count(*)::bigint FROM coverage_payments
UNION ALL SELECT 'cancellation_settlements', count(*)::bigint FROM cancellation_settlements
UNION ALL SELECT 'normal_settlements', count(*)::bigint FROM normal_settlements
UNION ALL SELECT 'outbox_messages', count(*)::bigint FROM outbox_messages
UNION ALL SELECT 'audit_events', count(*)::bigint FROM audit_events
UNION ALL SELECT 'lost_fund_returns', count(*)::bigint FROM lost_fund_returns
UNION ALL SELECT 'payment_reconciliation_candidates', count(*)::bigint
FROM payment_instructions p
JOIN monthly_obligations o ON p."ObligationId" = o."Id"
JOIN lease_contracts c ON o."ContractId" = c."Id"
JOIN external_transactions e ON p."Id" = e."AggregateId"
WHERE e."AggregateType" = 'PaymentInstruction'
  AND e."OperationType" = 'payment_reconciliation'
  AND e."Status" IN ('Pending', 'Unknown')
  AND p."Status" IN ('Pending', 'Unknown', 'ReconciliationRequired')
UNION ALL SELECT 'coverage_candidates', count(*)::bigint
FROM monthly_obligations o
WHERE o."Status" = 'Missed'
  AND NOT EXISTS (
      SELECT 1 FROM coverage_payments cp
      WHERE cp."MonthlyObligationId" = o."Id" AND cp."Status" = 'Failed')
UNION ALL SELECT 'cancellation_candidates', count(*)::bigint
FROM lease_contracts c
WHERE c."Status" = 'CancellationPending'
  AND NOT EXISTS (
      SELECT 1 FROM cancellation_settlements s
      WHERE s."ContractId" = c."Id" AND s."Status" = 'Failed')
UNION ALL SELECT 'normal_settlement_candidates', count(*)::bigint
FROM lease_contracts c
WHERE c."Status" = 'SettlementPending'
  AND NOT EXISTS (
      SELECT 1 FROM normal_settlements s
      WHERE s."ContractId" = c."Id"
        AND (s."BankPrincipalStatus" = 'Failed' OR s."TenantResidualStatus" = 'Failed'))
UNION ALL SELECT 'pending_outbox', count(*)::bigint
FROM outbox_messages WHERE "ProcessedAtUtc" IS NULL
UNION ALL SELECT 'lease_contract_audit_events', count(*)::bigint
FROM audit_events WHERE "AggregateType" = 'LeaseContract'
UNION ALL SELECT 'open_lost_fund_return_exposures', count(*)::bigint
FROM lost_fund_returns WHERE "CalculatedReturnRial" IS NULL
ORDER BY metric;
