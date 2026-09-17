using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Charkhoone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDatabaseQueryIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_coverage_payments_MonthlyObligationId",
                table: "coverage_payments");

            migrationBuilder.DropIndex(
                name: "IX_audit_events_AggregateType_AggregateId_OccurredAtUtc",
                table: "audit_events");

            migrationBuilder.CreateIndex(
                name: "IX_outbox_messages_OccurredAtUtc_Id",
                table: "outbox_messages",
                columns: new[] { "OccurredAtUtc", "Id" },
                filter: "\"ProcessedAtUtc\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_monthly_obligations_Status_DueAtUtc_Id",
                table: "monthly_obligations",
                columns: new[] { "Status", "DueAtUtc", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_lost_fund_returns_ContractId",
                table: "lost_fund_returns",
                column: "ContractId",
                filter: "\"CalculatedReturnRial\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_lease_contracts_Status_UpdatedAtUtc_Id",
                table: "lease_contracts",
                columns: new[] { "Status", "UpdatedAtUtc", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_external_transactions_AggregateType_OperationType_Status_Up~",
                table: "external_transactions",
                columns: new[] { "AggregateType", "OperationType", "Status", "UpdatedAtUtc", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_coverage_payments_MonthlyObligationId_Status",
                table: "coverage_payments",
                columns: new[] { "MonthlyObligationId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_audit_events_AggregateType_AggregateId_Action_OccurredAtUtc~",
                table: "audit_events",
                columns: new[] { "AggregateType", "AggregateId", "Action", "OccurredAtUtc", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_audit_events_AggregateType_AggregateId_OccurredAtUtc_Id",
                table: "audit_events",
                columns: new[] { "AggregateType", "AggregateId", "OccurredAtUtc", "Id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_outbox_messages_OccurredAtUtc_Id",
                table: "outbox_messages");

            migrationBuilder.DropIndex(
                name: "IX_monthly_obligations_Status_DueAtUtc_Id",
                table: "monthly_obligations");

            migrationBuilder.DropIndex(
                name: "IX_lost_fund_returns_ContractId",
                table: "lost_fund_returns");

            migrationBuilder.DropIndex(
                name: "IX_lease_contracts_Status_UpdatedAtUtc_Id",
                table: "lease_contracts");

            migrationBuilder.DropIndex(
                name: "IX_external_transactions_AggregateType_OperationType_Status_Up~",
                table: "external_transactions");

            migrationBuilder.DropIndex(
                name: "IX_coverage_payments_MonthlyObligationId_Status",
                table: "coverage_payments");

            migrationBuilder.DropIndex(
                name: "IX_audit_events_AggregateType_AggregateId_Action_OccurredAtUtc~",
                table: "audit_events");

            migrationBuilder.DropIndex(
                name: "IX_audit_events_AggregateType_AggregateId_OccurredAtUtc_Id",
                table: "audit_events");

            migrationBuilder.CreateIndex(
                name: "IX_coverage_payments_MonthlyObligationId",
                table: "coverage_payments",
                column: "MonthlyObligationId");

            migrationBuilder.CreateIndex(
                name: "IX_audit_events_AggregateType_AggregateId_OccurredAtUtc",
                table: "audit_events",
                columns: new[] { "AggregateType", "AggregateId", "OccurredAtUtc" });
        }
    }
}
