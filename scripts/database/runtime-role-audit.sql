-- Read-only least-privilege audit for the application runtime role.
-- Run while connected as the exact application role used by API/Worker in staging/production.
-- Each row is a stable check code and violation count. A production-ready runtime role requires zero violations.
-- Ownership checks use role membership as well as direct ownership because membership in an owner role can confer DDL authority.

SELECT 'role_superuser' AS check_code,
       CASE WHEN r.rolsuper THEN 1 ELSE 0 END::bigint AS violations
FROM pg_roles r WHERE r.rolname = current_user
UNION ALL
SELECT 'role_create_role', CASE WHEN r.rolcreaterole THEN 1 ELSE 0 END::bigint
FROM pg_roles r WHERE r.rolname = current_user
UNION ALL
SELECT 'role_create_db', CASE WHEN r.rolcreatedb THEN 1 ELSE 0 END::bigint
FROM pg_roles r WHERE r.rolname = current_user
UNION ALL
SELECT 'role_replication', CASE WHEN r.rolreplication THEN 1 ELSE 0 END::bigint
FROM pg_roles r WHERE r.rolname = current_user
UNION ALL
SELECT 'role_bypass_rls', CASE WHEN r.rolbypassrls THEN 1 ELSE 0 END::bigint
FROM pg_roles r WHERE r.rolname = current_user
UNION ALL
SELECT 'database_create_privilege',
       CASE WHEN has_database_privilege(current_user, current_database(), 'CREATE') THEN 1 ELSE 0 END::bigint
UNION ALL
SELECT 'public_schema_create_privilege',
       CASE WHEN has_schema_privilege(current_user, 'public', 'CREATE') THEN 1 ELSE 0 END::bigint
UNION ALL
SELECT 'database_owner',
       CASE WHEN pg_has_role(current_user, d.datdba, 'MEMBER') THEN 1 ELSE 0 END::bigint
FROM pg_database d
WHERE d.datname = current_database()
UNION ALL
SELECT 'public_schema_owner',
       CASE WHEN pg_has_role(current_user, n.nspowner, 'MEMBER') THEN 1 ELSE 0 END::bigint
FROM pg_namespace n
WHERE n.nspname = 'public'
UNION ALL
SELECT 'application_table_owner', count(*)::bigint
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p')
  AND pg_has_role(current_user, c.relowner, 'MEMBER')
UNION ALL
SELECT 'application_function_owner', count(*)::bigint
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND NOT EXISTS (
      SELECT 1
      FROM pg_depend d
      WHERE d.classid = 'pg_proc'::regclass
        AND d.objid = p.oid
        AND d.deptype = 'e'
  )
  AND pg_has_role(current_user, p.proowner, 'MEMBER')
UNION ALL
SELECT 'application_table_truncate_privilege', count(*)::bigint
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p')
  AND has_table_privilege(current_user, c.oid, 'TRUNCATE')
UNION ALL
SELECT 'application_table_trigger_privilege', count(*)::bigint
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p')
  AND has_table_privilege(current_user, c.oid, 'TRIGGER')
ORDER BY check_code;
