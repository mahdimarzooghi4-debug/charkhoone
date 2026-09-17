-- Migration transaction holds these locks until protections are installed.
LOCK TABLE public.journal_entries, public.journal_lines IN ACCESS EXCLUSIVE MODE;
DO $ledger_preflight$
BEGIN
  IF EXISTS (
    SELECT FROM public.journal_lines
    WHERE "DebitRial" < 0 OR "CreditRial" < 0
       OR ("DebitRial" > 0) = ("CreditRial" > 0)
       OR "DebitRial"::text IN ('NaN', 'Infinity', '-Infinity')
       OR "CreditRial"::text IN ('NaN', 'Infinity', '-Infinity')
  ) OR EXISTS (
    SELECT e."Id" FROM public.journal_entries e
    LEFT JOIN public.journal_lines l ON l."JournalEntryId" = e."Id"
    GROUP BY e."Id" HAVING count(l."Id") < 2
       OR sum(l."DebitRial") <> sum(l."CreditRial") OR sum(l."DebitRial") <= 0
  ) OR EXISTS (SELECT FROM public.journal_entries WHERE btrim("IdempotencyKey") = '') THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'ledger_preflight_failed: investigate existing ledger; do not auto-repair posted data';
  END IF;
END $ledger_preflight$;
