DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM "__EFMigrationsHistory")
     OR NOT EXISTS (SELECT FROM journal_entries)
     OR NOT EXISTS (SELECT FROM frozen_principals)
     OR NOT EXISTS (SELECT FROM tenant_contributions)
     OR NOT EXISTS (SELECT FROM external_transactions WHERE "Status" = 'Unknown')
     OR (SELECT count(*) FROM outbox_messages WHERE "Type" LIKE 'restore-drill-%') <> 2
     OR (SELECT count(*) FROM inbox_messages WHERE "Type" LIKE 'restore-drill-%') <> 2 THEN
    RAISE EXCEPTION 'Required drill fixture missing';
  END IF;
  IF EXISTS (
    SELECT e."Id" FROM journal_entries e LEFT JOIN journal_lines l ON l."JournalEntryId" = e."Id"
    GROUP BY e."Id" HAVING count(l."Id") < 2 OR sum(l."DebitRial") <> sum(l."CreditRial")
  ) THEN RAISE EXCEPTION 'Unbalanced or empty journal'; END IF;
  IF EXISTS (SELECT FROM journal_lines WHERE "DebitRial" < 0 OR "CreditRial" < 0
      OR ("DebitRial" > 0 AND "CreditRial" > 0)) THEN
    RAISE EXCEPTION 'Invalid debit/credit lines';
  END IF;
  IF EXISTS (SELECT FROM pg_constraint WHERE connamespace = 'public'::regnamespace AND NOT convalidated)
     OR EXISTS (SELECT FROM pg_index i JOIN pg_class c ON c.oid = i.indrelid
       WHERE c.relnamespace = 'public'::regnamespace AND (NOT i.indisvalid OR NOT i.indisready)) THEN
    RAISE EXCEPTION 'Unvalidated constraint or invalid index';
  END IF;
END $$;
-- pg_restore creates FK/unique constraints after data load and fails on violations.
-- Also scan every actual FK explicitly, without inventing missing domain constraints.
DO $$
DECLARE fk record; predicate text; nonnull text; orphan boolean;
BEGIN
  FOR fk IN SELECT * FROM pg_constraint WHERE contype = 'f' AND connamespace = 'public'::regnamespace LOOP
    SELECT string_agg(format('c.%I = p.%I', ca.attname, pa.attname), ' AND ' ORDER BY k.ord),
           string_agg(format('c.%I IS NOT NULL', ca.attname), ' AND ' ORDER BY k.ord)
      INTO predicate, nonnull
      FROM unnest(fk.conkey, fk.confkey) WITH ORDINALITY k(child, parent, ord)
      JOIN pg_attribute ca ON ca.attrelid = fk.conrelid AND ca.attnum = k.child
      JOIN pg_attribute pa ON pa.attrelid = fk.confrelid AND pa.attnum = k.parent;
    EXECUTE format('SELECT EXISTS (SELECT FROM %s c WHERE %s AND NOT EXISTS (SELECT FROM %s p WHERE %s))',
      fk.conrelid::regclass, nonnull, fk.confrelid::regclass, predicate) INTO orphan;
    IF orphan THEN RAISE EXCEPTION 'Orphan rows for %', fk.conname; END IF;
  END LOOP;
END $$;
