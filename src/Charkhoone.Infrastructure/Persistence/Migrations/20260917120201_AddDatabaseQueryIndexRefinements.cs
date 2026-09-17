using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Charkhoone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDatabaseQueryIndexRefinements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_external_transactions_AggregateType_OperationType_Status_Up~",
                table: "external_transactions");

            migrationBuilder.CreateIndex(
                name: "IX_external_transactions_AggregateType_AggregateId_UpdatedAtUt~",
                table: "external_transactions",
                columns: new[] { "AggregateType", "AggregateId", "UpdatedAtUtc", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_external_transactions_UpdatedAtUtc_Id",
                table: "external_transactions",
                columns: new[] { "UpdatedAtUtc", "Id" },
                filter: "\"AggregateType\" = 'PaymentInstruction' AND \"OperationType\" = 'payment_reconciliation' AND \"Status\" IN ('Pending','Unknown')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_external_transactions_AggregateType_AggregateId_UpdatedAtUt~",
                table: "external_transactions");

            migrationBuilder.DropIndex(
                name: "IX_external_transactions_UpdatedAtUtc_Id",
                table: "external_transactions");

            migrationBuilder.CreateIndex(
                name: "IX_external_transactions_AggregateType_OperationType_Status_Up~",
                table: "external_transactions",
                columns: new[] { "AggregateType", "OperationType", "Status", "UpdatedAtUtc", "Id" });
        }
    }
}
