using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Charkhoone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLostFundReturnTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "lost_fund_returns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ContractId = table.Column<Guid>(type: "uuid", nullable: false),
                    CoveragePaymentId = table.Column<Guid>(type: "uuid", nullable: false),
                    WithdrawnAmountRial = table.Column<decimal>(type: "numeric(38,18)", precision: 38, scale: 18, nullable: false),
                    MonthlyRate = table.Column<decimal>(type: "numeric(10,8)", precision: 10, scale: 8, nullable: false),
                    WithdrawnAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CalculationPeriodStartUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ReplacedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CalculationPeriodEndUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CalculationPolicyVersion = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    CalculatedReturnRial = table.Column<decimal>(type: "numeric(38,18)", precision: 38, scale: 18, nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lost_fund_returns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_lost_fund_returns_coverage_payments_CoveragePaymentId",
                        column: x => x.CoveragePaymentId,
                        principalTable: "coverage_payments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_lost_fund_returns_lease_contracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "lease_contracts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_lost_fund_returns_ContractId_WithdrawnAtUtc",
                table: "lost_fund_returns",
                columns: new[] { "ContractId", "WithdrawnAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_lost_fund_returns_CoveragePaymentId",
                table: "lost_fund_returns",
                column: "CoveragePaymentId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "lost_fund_returns");
        }
    }
}
