-- Read-only PostgreSQL runtime evidence. Does not emit SQL text, bind values, credentials, or customer rows.
-- Run with a role allowed to inspect pg_stat_activity for the intended operational scope.

SELECT 'connection_capacity' AS section,
       count(*)::bigint AS current_connections,
       current_setting('max_connections')::bigint AS max_connections
FROM pg_stat_activity;

SELECT 'database_sessions' AS section,
       COALESCE(NULLIF(application_name, ''), '(unset)') AS application_name,
       state,
       count(*)::bigint AS session_count
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY COALESCE(NULLIF(application_name, ''), '(unset)'), state
ORDER BY application_name, state;

SELECT 'wait_and_transaction_summary' AS section,
       count(*) FILTER (WHERE wait_event_type = 'Lock')::bigint AS lock_waiting_sessions,
       count(*) FILTER (WHERE state = 'idle in transaction')::bigint AS idle_in_transaction_sessions,
       COALESCE(
           max(extract(epoch FROM (clock_timestamp() - xact_start)))
               FILTER (WHERE xact_start IS NOT NULL),
           0)::bigint AS oldest_transaction_seconds
FROM pg_stat_activity
WHERE datname = current_database();

SELECT 'table_maintenance' AS section,
       relname AS table_name,
       n_live_tup::bigint AS estimated_live_rows,
       n_dead_tup::bigint AS estimated_dead_rows,
       autovacuum_count::bigint,
       autoanalyze_count::bigint,
       last_autovacuum,
       last_autoanalyze
FROM pg_stat_user_tables
ORDER BY relname;
