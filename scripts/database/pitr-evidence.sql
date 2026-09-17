-- Read-only PostgreSQL recovery/WAL evidence.
-- This is diagnostic evidence, not proof that a managed provider has configured or retained PITR backups.
-- Provider-native retention, restore-window and completed-restore evidence is still required.

SELECT 'server' AS section,
       current_setting('server_version_num') AS server_version_num,
       current_setting('wal_level') AS wal_level,
       current_setting('archive_mode') AS archive_mode,
       current_setting('max_wal_senders') AS max_wal_senders,
       current_setting('max_replication_slots') AS max_replication_slots,
       pg_is_in_recovery()::text AS is_in_recovery;

SELECT 'archiver' AS section,
       archived_count::text,
       failed_count::text,
       COALESCE(last_archived_time::text, '') AS last_archived_time,
       COALESCE(last_failed_time::text, '') AS last_failed_time,
       stats_reset::text
FROM pg_stat_archiver;
