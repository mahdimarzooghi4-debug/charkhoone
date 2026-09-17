-- Schema metadata only, intended for a read-only transaction.
SELECT 'constraint', t.relname, c.conname, c.contype::text,
       pg_get_constraintdef(c.oid), c.convalidated::text
FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
WHERE c.connamespace = 'public'::regnamespace
ORDER BY t.relname, c.conname;
SELECT 'unique_index', t.relname, x.relname, pg_get_indexdef(i.indexrelid),
       i.indisvalid, i.indisready
FROM pg_index i JOIN pg_class t ON t.oid = i.indrelid JOIN pg_class x ON x.oid = i.indexrelid
WHERE t.relnamespace = 'public'::regnamespace AND i.indisunique
ORDER BY t.relname, x.relname;
SELECT 'user_trigger', t.relname, g.tgname, pg_get_triggerdef(g.oid)
FROM pg_trigger g JOIN pg_class t ON t.oid = g.tgrelid
WHERE t.relnamespace = 'public'::regnamespace AND NOT g.tgisinternal
ORDER BY t.relname, g.tgname;
