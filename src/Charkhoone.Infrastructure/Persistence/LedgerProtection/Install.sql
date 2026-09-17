-- IsSealed is internal commit metadata, not a new business posting state.
-- Existing rows were validated by preflight and receive the column's true default.
CREATE FUNCTION public.charkhoone_ledger_entry_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $ledger$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW."IsSealed" := false;
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    -- Only the nested deferred trigger may seal; no financial/header field can change.
    IF pg_trigger_depth() = 2 AND NOT OLD."IsSealed" AND NEW."IsSealed"
       AND (to_jsonb(NEW) - 'IsSealed') = (to_jsonb(OLD) - 'IsSealed') THEN
      RETURN NEW;
    END IF;
  END IF;
  RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'posted_ledger_immutable';
END $ledger$;

CREATE FUNCTION public.charkhoone_ledger_line_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $ledger$
DECLARE sealed boolean;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'posted_ledger_immutable';
  END IF;
  SELECT "IsSealed" INTO sealed FROM public.journal_entries WHERE "Id" = NEW."JournalEntryId";
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '23503', MESSAGE = 'ledger_parent_not_visible';
  END IF;
  IF sealed THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'posted_ledger_append_forbidden';
  END IF;
  RETURN NEW;
END $ledger$;

CREATE FUNCTION public.charkhoone_ledger_seal() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $ledger$
DECLARE line_count bigint; debit numeric; credit numeric;
BEGIN
  SELECT count(*), sum("DebitRial"), sum("CreditRial") INTO line_count, debit, credit
    FROM public.journal_lines WHERE "JournalEntryId" = NEW."Id";
  IF line_count < 2 OR debit IS NULL OR debit <= 0 OR debit <> credit
     OR debit::text IN ('NaN', 'Infinity', '-Infinity')
     OR credit::text IN ('NaN', 'Infinity', '-Infinity') THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'ledger_unbalanced_at_commit';
  END IF;
  UPDATE public.journal_entries SET "IsSealed" = true WHERE "Id" = NEW."Id";
  RETURN NULL;
END $ledger$;

CREATE FUNCTION public.charkhoone_ledger_no_truncate() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog AS $ledger$
BEGIN
  RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'posted_ledger_truncate_forbidden';
END $ledger$;

CREATE TRIGGER ledger_entry_guard BEFORE INSERT OR UPDATE OR DELETE ON public.journal_entries
FOR EACH ROW EXECUTE FUNCTION public.charkhoone_ledger_entry_guard();
CREATE TRIGGER ledger_line_guard BEFORE INSERT OR UPDATE OR DELETE ON public.journal_lines
FOR EACH ROW EXECUTE FUNCTION public.charkhoone_ledger_line_guard();
CREATE CONSTRAINT TRIGGER ledger_seal AFTER INSERT ON public.journal_entries
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.charkhoone_ledger_seal();
CREATE TRIGGER ledger_entry_no_truncate BEFORE TRUNCATE ON public.journal_entries
FOR EACH STATEMENT EXECUTE FUNCTION public.charkhoone_ledger_no_truncate();
CREATE TRIGGER ledger_line_no_truncate BEFORE TRUNCATE ON public.journal_lines
FOR EACH STATEMENT EXECUTE FUNCTION public.charkhoone_ledger_no_truncate();
REVOKE ALL ON FUNCTION public.charkhoone_ledger_entry_guard() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.charkhoone_ledger_line_guard() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.charkhoone_ledger_seal() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.charkhoone_ledger_no_truncate() FROM PUBLIC;
