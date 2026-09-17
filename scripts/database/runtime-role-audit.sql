-- Read-only least-privilege audit for the application runtime role.
-- Run while connected as the exact application role used by API/Worker in staging/production.
-- Each row is a stable check code and violation count. A production-ready runtime role requires zero violations.

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
ORDER BY check_code;
