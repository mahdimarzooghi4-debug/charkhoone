\pset tuples_only on
\pset format unaligned
-- Exact sorted row representations (including numeric precision), not only counts.
-- CI fixtures are small. Output is temporary and never uploaded.
SELECT format('SELECT %L || ''|'' || row_to_json(t)::text FROM %I.%I t ORDER BY row_to_json(t)::text COLLATE "C";', tablename, schemaname, tablename)
FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename COLLATE "C"
\gexec
SELECT conrelid::regclass::text, conname, pg_get_constraintdef(oid), convalidated
FROM pg_constraint WHERE connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text COLLATE "C", conname COLLATE "C";
SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public'
ORDER BY tablename COLLATE "C", indexname COLLATE "C";
