-- Synthetic transport states; this script is invoked only by the guarded CI drill.
INSERT INTO outbox_messages ("Id", "OccurredAtUtc", "Type", "PayloadJson", "ProcessedAtUtc", "AttemptCount", "LastError") VALUES
('11111111-1111-4111-8111-111111111111', '2026-01-01T00:00:00Z', 'restore-drill-pending', '{"drill":true}', NULL, 1, 'synthetic retry'),
('22222222-2222-4222-8222-222222222222', '2026-01-01T00:00:00Z', 'restore-drill-processed', '{"drill":true}', '2026-01-02T00:00:00Z', 1, NULL);
INSERT INTO inbox_messages ("MessageId", "Type", "ReceivedAtUtc", "ProcessedAtUtc", "AttemptCount", "LastError") VALUES
('11111111-1111-4111-8111-111111111111', 'restore-drill-pending', '2026-01-01T00:00:00Z', NULL, 1, 'synthetic retry'),
('22222222-2222-4222-8222-222222222222', 'restore-drill-processed', '2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z', 1, NULL);
