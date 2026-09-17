using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Charkhoone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLedgerIntegrityConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddCheckConstraint(
                name: "CK_journal_lines_one_sided_positive_amount",
                table: "journal_lines",
                sql: "(\"DebitRial\" > 0 AND \"CreditRial\" = 0) OR (\"CreditRial\" > 0 AND \"DebitRial\" = 0)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_journal_entries_not_self_reversal",
                table: "journal_entries",
                sql: "\"ReversalOfJournalEntryId\" IS NULL OR \"ReversalOfJournalEntryId\" <> \"Id\"");

            migrationBuilder.AddCheckConstraint(
                name: "CK_journal_entries_posted_at_or_after_occurred_at",
                table: "journal_entries",
                sql: "\"PostedAtUtc\" >= \"OccurredAtUtc\"");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_journal_lines_one_sided_positive_amount",
                table: "journal_lines");

            migrationBuilder.DropCheckConstraint(
                name: "CK_journal_entries_not_self_reversal",
                table: "journal_entries");

            migrationBuilder.DropCheckConstraint(
                name: "CK_journal_entries_posted_at_or_after_occurred_at",
                table: "journal_entries");
        }
    }
}
