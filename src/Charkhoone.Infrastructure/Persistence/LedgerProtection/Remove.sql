DROP TRIGGER ledger_seal ON public.journal_entries;
DROP TRIGGER ledger_entry_guard ON public.journal_entries;
DROP TRIGGER ledger_line_guard ON public.journal_lines;
DROP TRIGGER ledger_entry_no_truncate ON public.journal_entries;
DROP TRIGGER ledger_line_no_truncate ON public.journal_lines;
DROP FUNCTION public.charkhoone_ledger_seal();
DROP FUNCTION public.charkhoone_ledger_entry_guard();
DROP FUNCTION public.charkhoone_ledger_line_guard();
DROP FUNCTION public.charkhoone_ledger_no_truncate();
