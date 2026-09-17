using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Charkhoone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCancellationOwnerSettlement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "cancellation_settlements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ContractId = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    AmountRial = table.Column<decimal>(type: "numeric(38,18)", precision: 38, scale: 18, nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ExternalTransactionId = table.Column<Guid>(type: "uuid", nullable: true),
                    JournalEntryId = table.Column<Guid>(type: "uuid", nullable: true),
                    ExternalReference = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    RemainingTenantContributionRial = table.Column<decimal>(type: "numeric(38,18)", precision: 38, scale: 18, nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CompletedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cancellation_settlements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_cancellation_settlements_external_transactions_ExternalTran~",
                        column: x => x.ExternalTransactionId,
                        principalTable: "external_transactions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cancellation_settlements_journal_entries_JournalEntryId",
                        column: x => x.JournalEntryId,
                        principalTable: "journal_entries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cancellation_settlements_lease_contracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "lease_contracts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_cancellation_settlements_users_OwnerUserId",
                        column: x => x.OwnerUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_cancellation_settlements_ContractId",
                table: "cancellation_settlements",
                column: "ContractId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_cancellation_settlements_ExternalTransactionId",
                table: "cancellation_settlements",
                column: "ExternalTransactionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_cancellation_settlements_JournalEntryId",
                table: "cancellation_settlements",
                column: "JournalEntryId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_cancellation_settlements_OwnerUserId",
                table: "cancellation_settlements",
                column: "OwnerUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "cancellation_settlements");
        }
    }
}
