using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Charkhoone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ProtectPostedLedger : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("-- Migration transaction holds these locks until protections are installed.\nLOCK TABLE public.journal_entries, public.journal_lines IN ACCESS EXCLUSIVE MODE;\nDO $ledger_preflight$\nBEGIN\n  IF EXISTS (\n    SELECT FROM public.journal_lines\n    WHERE \"DebitRial\" < 0 OR \"CreditRial\" < 0\n       OR (\"DebitRial\" > 0) = (\"CreditRial\" > 0)\n       OR \"DebitRial\"::text IN ('NaN', 'Infinity', '-Infinity')\n       OR \"CreditRial\"::text IN ('NaN', 'Infinity', '-Infinity')\n  ) OR EXISTS (\n    SELECT e.\"Id\" FROM public.journal_entries e\n    LEFT JOIN public.journal_lines l ON l.\"JournalEntryId\" = e.\"Id\"\n    GROUP BY e.\"Id\" HAVING count(l.\"Id\") < 2\n       OR sum(l.\"DebitRial\") <> sum(l.\"CreditRial\") OR sum(l.\"DebitRial\") <= 0\n  ) OR EXISTS (SELECT FROM public.journal_entries WHERE btrim(\"IdempotencyKey\") = '') THEN\n    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'ledger_preflight_failed: investigate existing ledger; do not auto-repair posted data';\n  END IF;\nEND $ledger_preflight$;\n");

            migrationBuilder.AddColumn<bool>(
                name: "IsSealed",
                table: "journal_entries",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_journal_lines_valid_sides",
                table: "journal_lines",
                sql: "\"DebitRial\" >= 0 AND \"CreditRial\" >= 0\nAND ((\"DebitRial\" > 0 AND \"CreditRial\" = 0) OR (\"CreditRial\" > 0 AND \"DebitRial\" = 0))\nAND \"DebitRial\"::text NOT IN ('NaN', 'Infinity', '-Infinity')\nAND \"CreditRial\"::text NOT IN ('NaN', 'Infinity', '-Infinity')");

            migrationBuilder.AddCheckConstraint(
                name: "CK_journal_entries_idempotency",
                table: "journal_entries",
                sql: "btrim(\"IdempotencyKey\") <> ''");

            migrationBuilder.Sql("-- IsSealed is internal commit metadata, not a new business posting state.\n-- Existing rows were validated by preflight and receive the column's true default.\nCREATE FUNCTION public.charkhoone_ledger_entry_guard() RETURNS trigger\nLANGUAGE plpgsql SET search_path = pg_catalog AS $ledger$\nBEGIN\n  IF TG_OP = 'INSERT' THEN\n    NEW.\"IsSealed\" := false;\n    RETURN NEW;\n  END IF;\n  IF TG_OP = 'UPDATE' THEN\n    -- Only the nested deferred trigger may seal; no financial/header field can change.\n    IF pg_trigger_depth() = 2 AND NOT OLD.\"IsSealed\" AND NEW.\"IsSealed\"\n       AND (to_jsonb(NEW) - 'IsSealed') = (to_jsonb(OLD) - 'IsSealed') THEN\n      RETURN NEW;\n    END IF;\n  END IF;\n  RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'posted_ledger_immutable';\nEND $ledger$;\n\nCREATE FUNCTION public.charkhoone_ledger_line_guard() RETURNS trigger\nLANGUAGE plpgsql SET search_path = pg_catalog AS $ledger$\nDECLARE sealed boolean;\nBEGIN\n  IF TG_OP <> 'INSERT' THEN\n    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'posted_ledger_immutable';\n  END IF;\n  SELECT \"IsSealed\" INTO sealed FROM public.journal_entries WHERE \"Id\" = NEW.\"JournalEntryId\";\n  IF NOT FOUND THEN\n    RAISE EXCEPTION USING ERRCODE = '23503', MESSAGE = 'ledger_parent_not_visible';\n  END IF;\n  IF sealed THEN\n    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'posted_ledger_append_forbidden';\n  END IF;\n  RETURN NEW;\nEND $ledger$;\n\nCREATE FUNCTION public.charkhoone_ledger_seal() RETURNS trigger\nLANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $ledger$\nDECLARE line_count bigint; debit numeric; credit numeric;\nBEGIN\n  SELECT count(*), sum(\"DebitRial\"), sum(\"CreditRial\") INTO line_count, debit, credit\n    FROM public.journal_lines WHERE \"JournalEntryId\" = NEW.\"Id\";\n  IF line_count < 2 OR debit IS NULL OR debit <= 0 OR debit <> credit\n     OR debit::text IN ('NaN', 'Infinity', '-Infinity')\n     OR credit::text IN ('NaN', 'Infinity', '-Infinity') THEN\n    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'ledger_unbalanced_at_commit';\n  END IF;\n  UPDATE public.journal_entries SET \"IsSealed\" = true WHERE \"Id\" = NEW.\"Id\";\n  RETURN NULL;\nEND $ledger$;\n\nCREATE FUNCTION public.charkhoone_ledger_no_truncate() RETURNS trigger\nLANGUAGE plpgsql SET search_path = pg_catalog AS $ledger$\nBEGIN\n  RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'posted_ledger_truncate_forbidden';\nEND $ledger$;\n\nCREATE TRIGGER ledger_entry_guard BEFORE INSERT OR UPDATE OR DELETE ON public.journal_entries\nFOR EACH ROW EXECUTE FUNCTION public.charkhoone_ledger_entry_guard();\nCREATE TRIGGER ledger_line_guard BEFORE INSERT OR UPDATE OR DELETE ON public.journal_lines\nFOR EACH ROW EXECUTE FUNCTION public.charkhoone_ledger_line_guard();\nCREATE CONSTRAINT TRIGGER ledger_seal AFTER INSERT ON public.journal_entries\nDEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.charkhoone_ledger_seal();\nCREATE TRIGGER ledger_entry_no_truncate BEFORE TRUNCATE ON public.journal_entries\nFOR EACH STATEMENT EXECUTE FUNCTION public.charkhoone_ledger_no_truncate();\nCREATE TRIGGER ledger_line_no_truncate BEFORE TRUNCATE ON public.journal_lines\nFOR EACH STATEMENT EXECUTE FUNCTION public.charkhoone_ledger_no_truncate();\nREVOKE ALL ON FUNCTION public.charkhoone_ledger_entry_guard() FROM PUBLIC;\nREVOKE ALL ON FUNCTION public.charkhoone_ledger_line_guard() FROM PUBLIC;\nREVOKE ALL ON FUNCTION public.charkhoone_ledger_seal() FROM PUBLIC;\nREVOKE ALL ON FUNCTION public.charkhoone_ledger_no_truncate() FROM PUBLIC;\n");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TRIGGER ledger_seal ON public.journal_entries;\nDROP TRIGGER ledger_entry_guard ON public.journal_entries;\nDROP TRIGGER ledger_line_guard ON public.journal_lines;\nDROP TRIGGER ledger_entry_no_truncate ON public.journal_entries;\nDROP TRIGGER ledger_line_no_truncate ON public.journal_lines;\nDROP FUNCTION public.charkhoone_ledger_seal();\nDROP FUNCTION public.charkhoone_ledger_entry_guard();\nDROP FUNCTION public.charkhoone_ledger_line_guard();\nDROP FUNCTION public.charkhoone_ledger_no_truncate();\n");

            migrationBuilder.DropCheckConstraint(
                name: "CK_journal_lines_valid_sides",
                table: "journal_lines");

            migrationBuilder.DropCheckConstraint(
                name: "CK_journal_entries_idempotency",
                table: "journal_entries");

            migrationBuilder.DropColumn(
                name: "IsSealed",
                table: "journal_entries");
        }
    }
}
