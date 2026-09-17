using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Charkhoone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDatabaseIntegrityConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddCheckConstraint(
                name: "CK_tenant_contributions_initial_amount_rial_positive",
                table: "tenant_contributions",
                sql: "\"InitialAmountRial\" > 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_payment_instructions_amount_rial_positive",
                table: "payment_instructions",
                sql: "\"AmountRial\" > 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_journal_lines_single_sided_positive_amount",
                table: "journal_lines",
                sql: "\"DebitRial\" >= 0 AND \"CreditRial\" >= 0 AND ((\"DebitRial\" > 0 AND \"CreditRial\" = 0) OR (\"CreditRial\" > 0 AND \"DebitRial\" = 0))");

            migrationBuilder.AddCheckConstraint(
                name: "CK_external_transactions_amount_rial_positive",
                table: "external_transactions",
                sql: "\"AmountRial\" > 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_tenant_contributions_initial_amount_rial_positive",
                table: "tenant_contributions");

            migrationBuilder.DropCheckConstraint(
                name: "CK_payment_instructions_amount_rial_positive",
                table: "payment_instructions");

            migrationBuilder.DropCheckConstraint(
                name: "CK_journal_lines_single_sided_positive_amount",
                table: "journal_lines");

            migrationBuilder.DropCheckConstraint(
                name: "CK_external_transactions_amount_rial_positive",
                table: "external_transactions");
        }
    }
}
