using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Charkhoone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddJournalLedgerTriggers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DO $preflight$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM journal_entries e
                        LEFT JOIN journal_lines l ON l."JournalEntryId" = e."Id"
                        GROUP BY e."Id"
                        HAVING count(l."Id") < 2
                            OR COALESCE(sum(l."DebitRial"), 0) <= 0
                            OR COALESCE(sum(l."CreditRial"), 0) <= 0
                            OR COALESCE(sum(l."DebitRial"), 0) <> COALESCE(sum(l."CreditRial"), 0)
                    ) THEN
                        RAISE EXCEPTION USING
                            ERRCODE = '23514',
                            MESSAGE = 'existing journal data is not balanced; run the read-only integrity audit and remediate before migration';
                    END IF;
                END
                $preflight$;

                CREATE TABLE journal_entry_seals (
                    "JournalEntryId" uuid PRIMARY KEY
                        REFERENCES journal_entries("Id") ON DELETE RESTRICT,
                    "SealedAtUtc" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
                );

                INSERT INTO journal_entry_seals ("JournalEntryId")
                SELECT "Id" FROM journal_entries;

                CREATE OR REPLACE FUNCTION charkhoone_reject_posted_ledger_mutation()
                RETURNS trigger
                LANGUAGE plpgsql
                AS $function$
                BEGIN
                    RAISE EXCEPTION USING
                        ERRCODE = '55000',
                        MESSAGE = 'posted journal history is immutable; record a reversal instead';
                END
                $function$;

                CREATE OR REPLACE FUNCTION charkhoone_reject_sealed_journal_line_insert()
                RETURNS trigger
                LANGUAGE plpgsql
                AS $function$
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM journal_entry_seals
                        WHERE "JournalEntryId" = NEW."JournalEntryId"
                    ) THEN
                        RAISE EXCEPTION USING
                            ERRCODE = '55000',
                            MESSAGE = 'posted journal history is immutable; new lines cannot be appended';
                    END IF;

                    RETURN NEW;
                END
                $function$;

                CREATE OR REPLACE FUNCTION charkhoone_validate_and_seal_journal()
                RETURNS trigger
                LANGUAGE plpgsql
                AS $function$
                DECLARE
                    journal_id uuid;
                    line_count bigint;
                    total_debit numeric;
                    total_credit numeric;
                BEGIN
                    IF TG_TABLE_NAME = 'journal_entries' THEN
                        journal_id := NEW."Id";
                    ELSE
                        journal_id := NEW."JournalEntryId";
                    END IF;

                    SELECT count(*),
                           COALESCE(sum("DebitRial"), 0),
                           COALESCE(sum("CreditRial"), 0)
                    INTO line_count, total_debit, total_credit
                    FROM journal_lines
                    WHERE "JournalEntryId" = journal_id;

                    IF line_count < 2
                       OR total_debit <= 0
                       OR total_credit <= 0
                       OR total_debit <> total_credit THEN
                        RAISE EXCEPTION USING
                            ERRCODE = '23514',
                            MESSAGE = 'journal entry must contain at least two balanced positive lines';
                    END IF;

                    INSERT INTO journal_entry_seals ("JournalEntryId")
                    VALUES (journal_id)
                    ON CONFLICT ("JournalEntryId") DO NOTHING;

                    RETURN NEW;
                END
                $function$;

                CREATE TRIGGER trg_journal_entries_immutable
                BEFORE UPDATE OR DELETE ON journal_entries
                FOR EACH ROW
                EXECUTE FUNCTION charkhoone_reject_posted_ledger_mutation();

                CREATE TRIGGER trg_journal_lines_immutable
                BEFORE UPDATE OR DELETE ON journal_lines
                FOR EACH ROW
                EXECUTE FUNCTION charkhoone_reject_posted_ledger_mutation();

                CREATE TRIGGER trg_journal_lines_reject_after_seal
                BEFORE INSERT ON journal_lines
                FOR EACH ROW
                EXECUTE FUNCTION charkhoone_reject_sealed_journal_line_insert();

                CREATE TRIGGER trg_journal_entry_seals_immutable
                BEFORE UPDATE OR DELETE ON journal_entry_seals
                FOR EACH ROW
                EXECUTE FUNCTION charkhoone_reject_posted_ledger_mutation();

                CREATE CONSTRAINT TRIGGER trg_journal_entry_balanced_deferred
                AFTER INSERT ON journal_entries
                DEFERRABLE INITIALLY DEFERRED
                FOR EACH ROW
                EXECUTE FUNCTION charkhoone_validate_and_seal_journal();

                CREATE CONSTRAINT TRIGGER trg_journal_line_balanced_deferred
                AFTER INSERT ON journal_lines
                DEFERRABLE INITIALLY DEFERRED
                FOR EACH ROW
                EXECUTE FUNCTION charkhoone_validate_and_seal_journal();
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DROP TRIGGER IF EXISTS trg_journal_line_balanced_deferred ON journal_lines;
                DROP TRIGGER IF EXISTS trg_journal_entry_balanced_deferred ON journal_entries;
                DROP TRIGGER IF EXISTS trg_journal_entry_seals_immutable ON journal_entry_seals;
                DROP TRIGGER IF EXISTS trg_journal_lines_reject_after_seal ON journal_lines;
                DROP TRIGGER IF EXISTS trg_journal_lines_immutable ON journal_lines;
                DROP TRIGGER IF EXISTS trg_journal_entries_immutable ON journal_entries;

                DROP FUNCTION IF EXISTS charkhoone_validate_and_seal_journal();
                DROP FUNCTION IF EXISTS charkhoone_reject_sealed_journal_line_insert();
                DROP FUNCTION IF EXISTS charkhoone_reject_posted_ledger_mutation();

                DROP TABLE IF EXISTS journal_entry_seals;
                """);
        }
    }
}
