using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Charkhoone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddNormalSettlement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "normal_settlements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ContractId = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    BankId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    FundReference = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    BankPrincipalAmountRial = table.Column<decimal>(type: "numeric(38,18)", precision: 38, scale: 18, nullable: false),
                    BankPrincipalStatus = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    BankExternalTransactionId = table.Column<Guid>(type: "uuid", nullable: true),
                    BankExternalReference = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    BankJournalEntryId = table.Column<Guid>(type: "uuid", nullable: true),
                    BankPrincipalReturnedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    TenantResidualAmountRial = table.Column<decimal>(type: "numeric(38,18)", precision: 38, scale: 18, nullable: false),
                    TenantResidualStatus = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    TenantExternalTransactionId = table.Column<Guid>(type: "uuid", nullable: true),
                    TenantExternalReference = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    TenantJournalEntryId = table.Column<Guid>(type: "uuid", nullable: true),
                    TenantResidualReturnedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CompletedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_normal_settlements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_normal_settlements_external_transactions_BankExternalTransa~",
                        column: x => x.BankExternalTransactionId,
                        principalTable: "external_transactions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_normal_settlements_external_transactions_TenantExternalTran~",
                        column: x => x.TenantExternalTransactionId,
                        principalTable: "external_transactions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_normal_settlements_journal_entries_BankJournalEntryId",
                        column: x => x.BankJournalEntryId,
                        principalTable: "journal_entries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_normal_settlements_journal_entries_TenantJournalEntryId",
                        column: x => x.TenantJournalEntryId,
                        principalTable: "journal_entries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_normal_settlements_lease_contracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "lease_contracts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_normal_settlements_users_TenantUserId",
                        column: x => x.TenantUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_normal_settlements_BankExternalTransactionId",
                table: "normal_settlements",
                column: "BankExternalTransactionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_normal_settlements_BankJournalEntryId",
                table: "normal_settlements",
                column: "BankJournalEntryId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_normal_settlements_ContractId",
                table: "normal_settlements",
                column: "ContractId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_normal_settlements_TenantExternalTransactionId",
                table: "normal_settlements",
                column: "TenantExternalTransactionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_normal_settlements_TenantJournalEntryId",
                table: "normal_settlements",
                column: "TenantJournalEntryId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_normal_settlements_TenantUserId",
                table: "normal_settlements",
                column: "TenantUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "normal_settlements");
        }
    }
}
