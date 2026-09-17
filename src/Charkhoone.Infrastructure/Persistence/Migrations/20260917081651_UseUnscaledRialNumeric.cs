using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Charkhoone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UseUnscaledRialNumeric : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "InitialAmountRial",
                table: "tenant_contributions",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(38,18)",
                oldPrecision: 38,
                oldScale: 18);

            migrationBuilder.AlterColumn<decimal>(
                name: "RemainingTenantContributionRial",
                table: "tenant_contribution_replenishments",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(38,18)",
                oldPrecision: 38,
                oldScale: 18);

            migrationBuilder.AlterColumn<decimal>(
                name: "AmountRial",
                table: "tenant_contribution_replenishments",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(38,18)",
                oldPrecision: 38,
                oldScale: 18);

            migrationBuilder.AlterColumn<decimal>(
                name: "AmountRial",
                table: "payment_instructions",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(38,18)",
                oldPrecision: 38,
                oldScale: 18);

            migrationBuilder.AlterColumn<decimal>(
                name: "TenantResidualAmountRial",
                table: "normal_settlements",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(38,18)",
                oldPrecision: 38,
                oldScale: 18);

            migrationBuilder.AlterColumn<decimal>(
                name: "BankPrincipalAmountRial",
                table: "normal_settlements",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(38,18)",
                oldPrecision: 38,
                oldScale: 18);

            migrationBuilder.AlterColumn<decimal>(
                name: "WithdrawnAmountRial",
                table: "lost_fund_returns",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(38,18)",
                oldPrecision: 38,
                oldScale: 18);

            migrationBuilder.AlterColumn<decimal>(
                name: "CalculatedReturnRial",
                table: "lost_fund_returns",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(38,18)",
                oldPrecision: 38,
                oldScale: 18,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "DebitRial",
                table: "journal_lines",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(38,18)",
                oldPrecision: 38,
                oldScale: 18);

            migrationBuilder.AlterColumn<decimal>(
                name: "CreditRial",
                table: "journal_lines",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(38,18)",
                oldPrecision: 38,
                oldScale: 18);

            migrationBuilder.AlterColumn<decimal>(
                name: "TenantContributionRial",
                table: "funding_allocations",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(38,18)",
                oldPrecision: 38,
                oldScale: 18);

            migrationBuilder.AlterColumn<decimal>(
                name: "MaximumEligibleLoanRial",
                table: "funding_allocations",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(38,18)",
                oldPrecision: 38,
                oldScale: 18);

            migrationBuilder.AlterColumn<decimal>(
                name: "FullDepositEquivalentRial",
                table: "funding_allocations",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(38,18)",
                oldPrecision: 38,
                oldScale: 18);

            migrationBuilder.AlterColumn<decimal>(
                name: "BankApprovedLoanRial",
                table: "funding_allocations",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(38,18)",
                oldPrecision: 38,
                oldScale: 18);

            migrationBuilder.AlterColumn<decimal>(
                name: "AmountRial",
                table: "frozen_principals",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(38,18)",
                oldPrecision: 38,
                oldScale: 18);

            migrationBuilder.AlterColumn<decimal>(
                name: "AmountRial",
                table: "external_transactions",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(38,18)",
                oldPrecision: 38,
                oldScale: 18);

            migrationBuilder.AlterColumn<decimal>(
                name: "MaximumEligibleLoanRial",
                table: "credit_eligibility_assessments",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(38,18)",
                oldPrecision: 38,
                oldScale: 18,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "FullDepositEquivalentRial",
                table: "credit_eligibility_assessments",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(38,18)",
                oldPrecision: 38,
                oldScale: 18);

            migrationBuilder.AlterColumn<decimal>(
                name: "RemainingTenantContributionRial",
                table: "coverage_payments",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(38,18)",
                oldPrecision: 38,
                oldScale: 18,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "AmountRial",
                table: "coverage_payments",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(38,18)",
                oldPrecision: 38,
                oldScale: 18);

            migrationBuilder.AlterColumn<decimal>(
                name: "RemainingTenantContributionRial",
                table: "cancellation_settlements",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(38,18)",
                oldPrecision: 38,
                oldScale: 18,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "AmountRial",
                table: "cancellation_settlements",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(38,18)",
                oldPrecision: 38,
                oldScale: 18);

            migrationBuilder.AlterColumn<decimal>(
                name: "MaximumEligibleLoanRial",
                table: "bank_approvals",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(38,18)",
                oldPrecision: 38,
                oldScale: 18);

            migrationBuilder.AlterColumn<decimal>(
                name: "ApprovedLoanRial",
                table: "bank_approvals",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(38,18)",
                oldPrecision: 38,
                oldScale: 18,
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "InitialAmountRial",
                table: "tenant_contributions",
                type: "numeric(38,18)",
                precision: 38,
                scale: 18,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "RemainingTenantContributionRial",
                table: "tenant_contribution_replenishments",
                type: "numeric(38,18)",
                precision: 38,
                scale: 18,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "AmountRial",
                table: "tenant_contribution_replenishments",
                type: "numeric(38,18)",
                precision: 38,
                scale: 18,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "AmountRial",
                table: "payment_instructions",
                type: "numeric(38,18)",
                precision: 38,
                scale: 18,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "TenantResidualAmountRial",
                table: "normal_settlements",
                type: "numeric(38,18)",
                precision: 38,
                scale: 18,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "BankPrincipalAmountRial",
                table: "normal_settlements",
                type: "numeric(38,18)",
                precision: 38,
                scale: 18,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "WithdrawnAmountRial",
                table: "lost_fund_returns",
                type: "numeric(38,18)",
                precision: 38,
                scale: 18,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "CalculatedReturnRial",
                table: "lost_fund_returns",
                type: "numeric(38,18)",
                precision: 38,
                scale: 18,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "DebitRial",
                table: "journal_lines",
                type: "numeric(38,18)",
                precision: 38,
                scale: 18,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "CreditRial",
                table: "journal_lines",
                type: "numeric(38,18)",
                precision: 38,
                scale: 18,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "TenantContributionRial",
                table: "funding_allocations",
                type: "numeric(38,18)",
                precision: 38,
                scale: 18,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "MaximumEligibleLoanRial",
                table: "funding_allocations",
                type: "numeric(38,18)",
                precision: 38,
                scale: 18,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "FullDepositEquivalentRial",
                table: "funding_allocations",
                type: "numeric(38,18)",
                precision: 38,
                scale: 18,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "BankApprovedLoanRial",
                table: "funding_allocations",
                type: "numeric(38,18)",
                precision: 38,
                scale: 18,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "AmountRial",
                table: "frozen_principals",
                type: "numeric(38,18)",
                precision: 38,
                scale: 18,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "AmountRial",
                table: "external_transactions",
                type: "numeric(38,18)",
                precision: 38,
                scale: 18,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "MaximumEligibleLoanRial",
                table: "credit_eligibility_assessments",
                type: "numeric(38,18)",
                precision: 38,
                scale: 18,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "FullDepositEquivalentRial",
                table: "credit_eligibility_assessments",
                type: "numeric(38,18)",
                precision: 38,
                scale: 18,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "RemainingTenantContributionRial",
                table: "coverage_payments",
                type: "numeric(38,18)",
                precision: 38,
                scale: 18,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "AmountRial",
                table: "coverage_payments",
                type: "numeric(38,18)",
                precision: 38,
                scale: 18,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "RemainingTenantContributionRial",
                table: "cancellation_settlements",
                type: "numeric(38,18)",
                precision: 38,
                scale: 18,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "AmountRial",
                table: "cancellation_settlements",
                type: "numeric(38,18)",
                precision: 38,
                scale: 18,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "MaximumEligibleLoanRial",
                table: "bank_approvals",
                type: "numeric(38,18)",
                precision: 38,
                scale: 18,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "ApprovedLoanRial",
                table: "bank_approvals",
                type: "numeric(38,18)",
                precision: 38,
                scale: 18,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);
        }
    }
}
