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
-- pg_dump/reparse can distribute an array cast into per-element casts. Reparse
-- both predicates with PostgreSQL itself; do not erase casts or skip predicates.
CREATE FUNCTION pg_temp.drill_normalize_predicate(relation regclass, predicate text)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE definition text;
BEGIN
  EXECUTE format('CREATE TEMP VIEW drill_predicate AS SELECT (%s) AS matches FROM %s', predicate, relation);
  SELECT pg_get_viewdef('pg_temp.drill_predicate'::regclass, false) INTO definition;
  DROP VIEW pg_temp.drill_predicate;
  RETURN definition;
END $$;
SELECT t.relname, idx.relname,
       CASE WHEN i.indpred IS NULL THEN pg_get_indexdef(i.indexrelid)
            ELSE regexp_replace(pg_get_indexdef(i.indexrelid), ' WHERE .*$', '')
                 || ' PREDICATE ' || pg_temp.drill_normalize_predicate(
                       i.indrelid, pg_get_expr(i.indpred, i.indrelid)) END
FROM pg_index i JOIN pg_class t ON t.oid = i.indrelid
JOIN pg_class idx ON idx.oid = i.indexrelid
WHERE t.relnamespace = 'public'::regnamespace
ORDER BY t.relname COLLATE "C", idx.relname COLLATE "C";
