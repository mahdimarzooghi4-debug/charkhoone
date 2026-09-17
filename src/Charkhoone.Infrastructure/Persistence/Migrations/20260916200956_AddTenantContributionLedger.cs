using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Charkhoone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantContributionLedger : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "external_transactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Provider = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    OperationType = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    AggregateType = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    AggregateId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    AmountRial = table.Column<decimal>(type: "numeric(38,18)", precision: 38, scale: 18, nullable: false),
                    Currency = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    IdempotencyKey = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    ExternalReference = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ReasonCode = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_external_transactions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "journal_entries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReferenceType = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    ReferenceId = table.Column<Guid>(type: "uuid", nullable: false),
                    IdempotencyKey = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    OccurredAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    PostedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ReversalOfJournalEntryId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_journal_entries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_journal_entries_journal_entries_ReversalOfJournalEntryId",
                        column: x => x.ReversalOfJournalEntryId,
                        principalTable: "journal_entries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ledger_accounts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Currency = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    ContractId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ledger_accounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ledger_accounts_lease_contracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "lease_contracts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "tenant_contributions",
                columns: table => new
                {
                    ContractId = table.Column<Guid>(type: "uuid", nullable: false),
                    FundingAllocationId = table.Column<Guid>(type: "uuid", nullable: false),
                    InitialAmountRial = table.Column<decimal>(type: "numeric(38,18)", precision: 38, scale: 18, nullable: false),
                    FundReference = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    FundedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tenant_contributions", x => x.ContractId);
                    table.ForeignKey(
                        name: "FK_tenant_contributions_funding_allocations_FundingAllocationId",
                        column: x => x.FundingAllocationId,
                        principalTable: "funding_allocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_tenant_contributions_lease_contracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "lease_contracts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "tenant_contribution_fundings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FundingAllocationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExternalTransactionId = table.Column<Guid>(type: "uuid", nullable: false),
                    FundReference = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    AttemptCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tenant_contribution_fundings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_tenant_contribution_fundings_external_transactions_External~",
                        column: x => x.ExternalTransactionId,
                        principalTable: "external_transactions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_tenant_contribution_fundings_funding_allocations_FundingAll~",
                        column: x => x.FundingAllocationId,
                        principalTable: "funding_allocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "journal_lines",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    JournalEntryId = table.Column<Guid>(type: "uuid", nullable: false),
                    LedgerAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    DebitRial = table.Column<decimal>(type: "numeric(38,18)", precision: 38, scale: 18, nullable: false),
                    CreditRial = table.Column<decimal>(type: "numeric(38,18)", precision: 38, scale: 18, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_journal_lines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_journal_lines_journal_entries_JournalEntryId",
                        column: x => x.JournalEntryId,
                        principalTable: "journal_entries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_journal_lines_ledger_accounts_LedgerAccountId",
                        column: x => x.LedgerAccountId,
                        principalTable: "ledger_accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_external_transactions_AggregateType_AggregateId_CreatedAtUtc",
                table: "external_transactions",
                columns: new[] { "AggregateType", "AggregateId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_external_transactions_IdempotencyKey",
                table: "external_transactions",
                column: "IdempotencyKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_journal_entries_IdempotencyKey",
                table: "journal_entries",
                column: "IdempotencyKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_journal_entries_ReferenceType_ReferenceId",
                table: "journal_entries",
                columns: new[] { "ReferenceType", "ReferenceId" });

            migrationBuilder.CreateIndex(
                name: "IX_journal_entries_ReversalOfJournalEntryId",
                table: "journal_entries",
                column: "ReversalOfJournalEntryId");

            migrationBuilder.CreateIndex(
                name: "IX_journal_lines_JournalEntryId",
                table: "journal_lines",
                column: "JournalEntryId");

            migrationBuilder.CreateIndex(
                name: "IX_journal_lines_LedgerAccountId",
                table: "journal_lines",
                column: "LedgerAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_ledger_accounts_Code",
                table: "ledger_accounts",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ledger_accounts_ContractId",
                table: "ledger_accounts",
                column: "ContractId");

            migrationBuilder.CreateIndex(
                name: "IX_tenant_contribution_fundings_ExternalTransactionId",
                table: "tenant_contribution_fundings",
                column: "ExternalTransactionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tenant_contribution_fundings_FundingAllocationId",
                table: "tenant_contribution_fundings",
                column: "FundingAllocationId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tenant_contributions_FundingAllocationId",
                table: "tenant_contributions",
                column: "FundingAllocationId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "journal_lines");

            migrationBuilder.DropTable(
                name: "tenant_contribution_fundings");

            migrationBuilder.DropTable(
                name: "tenant_contributions");

            migrationBuilder.DropTable(
                name: "journal_entries");

            migrationBuilder.DropTable(
                name: "ledger_accounts");

            migrationBuilder.DropTable(
                name: "external_transactions");
        }
    }
}
