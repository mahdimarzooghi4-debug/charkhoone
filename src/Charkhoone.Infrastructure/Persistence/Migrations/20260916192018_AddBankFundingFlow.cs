using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Charkhoone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBankFundingFlow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "bank_approvals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CreditApplicationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Provider = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Status = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    MaximumEligibleLoanRial = table.Column<decimal>(type: "numeric(38,18)", precision: 38, scale: 18, nullable: false),
                    ApprovedLoanRial = table.Column<decimal>(type: "numeric(38,18)", precision: 38, scale: 18, nullable: true),
                    IdempotencyKey = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    ExternalReference = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ReasonCode = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    AttemptCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bank_approvals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_bank_approvals_credit_applications_CreditApplicationId",
                        column: x => x.CreditApplicationId,
                        principalTable: "credit_applications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "funding_allocations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CreditApplicationId = table.Column<Guid>(type: "uuid", nullable: false),
                    ContractId = table.Column<Guid>(type: "uuid", nullable: false),
                    BankLoanPlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    BankLoanPlanVersion = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    BankId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    FullDepositEquivalentRial = table.Column<decimal>(type: "numeric(38,18)", precision: 38, scale: 18, nullable: false),
                    MaximumEligibleLoanRial = table.Column<decimal>(type: "numeric(38,18)", precision: 38, scale: 18, nullable: false),
                    BankApprovedLoanRial = table.Column<decimal>(type: "numeric(38,18)", precision: 38, scale: 18, nullable: false),
                    TenantContributionRial = table.Column<decimal>(type: "numeric(38,18)", precision: 38, scale: 18, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_funding_allocations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_funding_allocations_credit_applications_CreditApplicationId",
                        column: x => x.CreditApplicationId,
                        principalTable: "credit_applications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_funding_allocations_lease_contracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "lease_contracts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "fund_principal_freezes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FundingAllocationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Provider = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Status = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    IdempotencyKey = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    FundReference = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ExternalReference = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ReasonCode = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    AttemptCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fund_principal_freezes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_fund_principal_freezes_funding_allocations_FundingAllocatio~",
                        column: x => x.FundingAllocationId,
                        principalTable: "funding_allocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_bank_approvals_CreditApplicationId",
                table: "bank_approvals",
                column: "CreditApplicationId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_bank_approvals_IdempotencyKey",
                table: "bank_approvals",
                column: "IdempotencyKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_fund_principal_freezes_FundingAllocationId",
                table: "fund_principal_freezes",
                column: "FundingAllocationId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_fund_principal_freezes_IdempotencyKey",
                table: "fund_principal_freezes",
                column: "IdempotencyKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_funding_allocations_ContractId",
                table: "funding_allocations",
                column: "ContractId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_funding_allocations_CreditApplicationId",
                table: "funding_allocations",
                column: "CreditApplicationId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "bank_approvals");

            migrationBuilder.DropTable(
                name: "fund_principal_freezes");

            migrationBuilder.DropTable(
                name: "funding_allocations");
        }
    }
}
