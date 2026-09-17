using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Charkhoone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantContributionCoverageLedger : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "coverage_payments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ContractId = table.Column<Guid>(type: "uuid", nullable: false),
                    MonthlyObligationId = table.Column<Guid>(type: "uuid", nullable: false),
                    PaymentInstructionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Kind = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    AmountRial = table.Column<decimal>(type: "numeric(38,18)", precision: 38, scale: 18, nullable: false),
                    BeneficiaryId = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ExternalTransactionId = table.Column<Guid>(type: "uuid", nullable: false),
                    JournalEntryId = table.Column<Guid>(type: "uuid", nullable: true),
                    RemainingTenantContributionRial = table.Column<decimal>(type: "numeric(38,18)", precision: 38, scale: 18, nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CoveredAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_coverage_payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_coverage_payments_external_transactions_ExternalTransaction~",
                        column: x => x.ExternalTransactionId,
                        principalTable: "external_transactions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_coverage_payments_journal_entries_JournalEntryId",
                        column: x => x.JournalEntryId,
                        principalTable: "journal_entries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_coverage_payments_lease_contracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "lease_contracts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_coverage_payments_monthly_obligations_MonthlyObligationId",
                        column: x => x.MonthlyObligationId,
                        principalTable: "monthly_obligations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_coverage_payments_payment_instructions_PaymentInstructionId",
                        column: x => x.PaymentInstructionId,
                        principalTable: "payment_instructions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "tenant_contribution_replenishments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ContractId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExternalTransactionId = table.Column<Guid>(type: "uuid", nullable: false),
                    JournalEntryId = table.Column<Guid>(type: "uuid", nullable: false),
                    AmountRial = table.Column<decimal>(type: "numeric(38,18)", precision: 38, scale: 18, nullable: false),
                    RemainingTenantContributionRial = table.Column<decimal>(type: "numeric(38,18)", precision: 38, scale: 18, nullable: false),
                    ExternalReference = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    ReplenishedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tenant_contribution_replenishments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_tenant_contribution_replenishments_external_transactions_Ex~",
                        column: x => x.ExternalTransactionId,
                        principalTable: "external_transactions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_tenant_contribution_replenishments_journal_entries_JournalE~",
                        column: x => x.JournalEntryId,
                        principalTable: "journal_entries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_tenant_contribution_replenishments_lease_contracts_Contract~",
                        column: x => x.ContractId,
                        principalTable: "lease_contracts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_coverage_payments_ContractId_Status",
                table: "coverage_payments",
                columns: new[] { "ContractId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_coverage_payments_ExternalTransactionId",
                table: "coverage_payments",
                column: "ExternalTransactionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_coverage_payments_JournalEntryId",
                table: "coverage_payments",
                column: "JournalEntryId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_coverage_payments_MonthlyObligationId",
                table: "coverage_payments",
                column: "MonthlyObligationId");

            migrationBuilder.CreateIndex(
                name: "IX_coverage_payments_PaymentInstructionId",
                table: "coverage_payments",
                column: "PaymentInstructionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tenant_contribution_replenishments_ContractId_ReplenishedAt~",
                table: "tenant_contribution_replenishments",
                columns: new[] { "ContractId", "ReplenishedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_tenant_contribution_replenishments_ExternalTransactionId",
                table: "tenant_contribution_replenishments",
                column: "ExternalTransactionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tenant_contribution_replenishments_JournalEntryId",
                table: "tenant_contribution_replenishments",
                column: "JournalEntryId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "coverage_payments");

            migrationBuilder.DropTable(
                name: "tenant_contribution_replenishments");
        }
    }
}
