using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Charkhoone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLeaseContractTermsSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "lease_contract_terms",
                columns: table => new
                {
                    ContractId = table.Column<Guid>(type: "uuid", nullable: false),
                    Calendar = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    PersianStartYear = table.Column<int>(type: "integer", nullable: false),
                    PersianStartMonth = table.Column<int>(type: "integer", nullable: false),
                    PersianStartDay = table.Column<int>(type: "integer", nullable: false),
                    TermMonths = table.Column<int>(type: "integer", nullable: false),
                    CashDepositRial = table.Column<decimal>(type: "numeric", nullable: false),
                    MonthlyRentRial = table.Column<decimal>(type: "numeric", nullable: false),
                    FullDepositEquivalentRial = table.Column<decimal>(type: "numeric", nullable: false),
                    OwnerBeneficiaryId = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    BankBeneficiaryId = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    SourceReference = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    CapturedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lease_contract_terms", x => x.ContractId);
                    table.CheckConstraint("CK_lease_contract_terms_amounts", ""CashDepositRial" >= 0 AND "MonthlyRentRial" >= 0 AND "FullDepositEquivalentRial" > 0 AND "CashDepositRial" = trunc("CashDepositRial") AND "MonthlyRentRial" = trunc("MonthlyRentRial") AND "FullDepositEquivalentRial" = trunc("FullDepositEquivalentRial") AND "CashDepositRial"::text NOT IN ('NaN', 'Infinity', '-Infinity') AND "MonthlyRentRial"::text NOT IN ('NaN', 'Infinity', '-Infinity') AND "FullDepositEquivalentRial"::text NOT IN ('NaN', 'Infinity', '-Infinity')");
                    table.CheckConstraint("CK_lease_contract_terms_beneficiaries_nonblank", "btrim("OwnerBeneficiaryId") <> '' AND btrim("BankBeneficiaryId") <> ''");
                    table.CheckConstraint("CK_lease_contract_terms_calendar", ""Calendar" = 'Persian'");
                    table.CheckConstraint("CK_lease_contract_terms_full_deposit_equation", ""FullDepositEquivalentRial" = floor("CashDepositRial" + ("MonthlyRentRial" / 0.03))");
                    table.CheckConstraint("CK_lease_contract_terms_persian_start", ""PersianStartYear" > 0 AND "PersianStartMonth" BETWEEN 1 AND 12 AND "PersianStartDay" BETWEEN 1 AND 31");
                    table.CheckConstraint("CK_lease_contract_terms_source_reference_nonblank", "btrim("SourceReference") <> ''");
                    table.CheckConstraint("CK_lease_contract_terms_term_months", ""TermMonths" = 12");
                    table.ForeignKey(
                        name: "FK_lease_contract_terms_lease_contracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "lease_contracts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "lease_contract_schedule_months",
                columns: table => new
                {
                    ContractId = table.Column<Guid>(type: "uuid", nullable: false),
                    ContractMonthNumber = table.Column<int>(type: "integer", nullable: false),
                    DueAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    OwnerPaymentRial = table.Column<decimal>(type: "numeric", nullable: false),
                    BankInterestRial = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lease_contract_schedule_months", x => new { x.ContractId, x.ContractMonthNumber });
                    table.CheckConstraint("CK_lease_contract_schedule_amounts", ""OwnerPaymentRial" >= 0 AND "BankInterestRial" >= 0 AND ("OwnerPaymentRial" > 0 OR "BankInterestRial" > 0) AND "OwnerPaymentRial" = trunc("OwnerPaymentRial") AND "BankInterestRial" = trunc("BankInterestRial") AND "OwnerPaymentRial"::text NOT IN ('NaN', 'Infinity', '-Infinity') AND "BankInterestRial"::text NOT IN ('NaN', 'Infinity', '-Infinity')");
                    table.CheckConstraint("CK_lease_contract_schedule_month_number", ""ContractMonthNumber" BETWEEN 1 AND 12");
                    table.ForeignKey(
                        name: "FK_lease_contract_schedule_months_lease_contract_terms_ContractId",
                        column: x => x.ContractId,
                        principalTable: "lease_contract_terms",
                        principalColumn: "ContractId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_lease_contract_schedule_months_ContractId_DueAtUtc",
                table: "lease_contract_schedule_months",
                columns: new[] { "ContractId", "DueAtUtc" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "lease_contract_schedule_months");

            migrationBuilder.DropTable(
                name: "lease_contract_terms");
        }
    }
}
