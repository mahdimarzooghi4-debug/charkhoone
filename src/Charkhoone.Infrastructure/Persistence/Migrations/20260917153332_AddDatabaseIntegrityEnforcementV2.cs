using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Charkhoone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDatabaseIntegrityEnforcementV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_journal_lines_journal_entries_JournalEntryId",
                table: "journal_lines");

            migrationBuilder.AddCheckConstraint(
                name: "CK_verification_requests_idempotency_key_nonblank",
                table: "verification_requests",
                sql: "btrim(\"IdempotencyKey\") <> ''");

            migrationBuilder.AddCheckConstraint(
                name: "CK_tenant_contributions_initial_amount_positive_finite",
                table: "tenant_contributions",
                sql: "\"InitialAmountRial\" > 0 AND \"InitialAmountRial\"::text NOT IN ('NaN', 'Infinity', '-Infinity')");

            migrationBuilder.AddCheckConstraint(
                name: "CK_payment_instructions_amount_positive_finite",
                table: "payment_instructions",
                sql: "\"AmountRial\" > 0 AND \"AmountRial\"::text NOT IN ('NaN', 'Infinity', '-Infinity')");

            migrationBuilder.AddCheckConstraint(
                name: "CK_payment_instructions_idempotency_key_nonblank",
                table: "payment_instructions",
                sql: "btrim(\"IdempotencyKey\") <> ''");

            migrationBuilder.AddCheckConstraint(
                name: "CK_ledger_accounts_currency_irr",
                table: "ledger_accounts",
                sql: "\"Currency\" = 'IRR'");

            migrationBuilder.AddCheckConstraint(
                name: "CK_journal_lines_single_sided_positive_finite",
                table: "journal_lines",
                sql: "\"DebitRial\"::text NOT IN ('NaN', 'Infinity', '-Infinity') AND \"CreditRial\"::text NOT IN ('NaN', 'Infinity', '-Infinity') AND ((\"DebitRial\" > 0 AND \"CreditRial\" = 0) OR (\"CreditRial\" > 0 AND \"DebitRial\" = 0))");

            migrationBuilder.AddCheckConstraint(
                name: "CK_journal_entries_idempotency_key_nonblank",
                table: "journal_entries",
                sql: "btrim(\"IdempotencyKey\") <> ''");

            migrationBuilder.AddCheckConstraint(
                name: "CK_journal_entries_not_self_reversal",
                table: "journal_entries",
                sql: "\"ReversalOfJournalEntryId\" IS NULL OR \"ReversalOfJournalEntryId\" <> \"Id\"");

            migrationBuilder.AddCheckConstraint(
                name: "CK_journal_entries_posted_at_or_after_occurred_at",
                table: "journal_entries",
                sql: "\"PostedAtUtc\" >= \"OccurredAtUtc\"");

            migrationBuilder.AddCheckConstraint(
                name: "CK_funding_allocations_amounts_and_equation",
                table: "funding_allocations",
                sql: "\"FullDepositEquivalentRial\" >= 0 AND \"MaximumEligibleLoanRial\" >= 0 AND \"BankApprovedLoanRial\" >= 0 AND \"TenantContributionRial\" >= 0 AND \"BankApprovedLoanRial\" <= \"MaximumEligibleLoanRial\" AND \"BankApprovedLoanRial\" <= \"FullDepositEquivalentRial\" AND \"BankApprovedLoanRial\" + \"TenantContributionRial\" = \"FullDepositEquivalentRial\" AND \"FullDepositEquivalentRial\"::text NOT IN ('NaN', 'Infinity', '-Infinity') AND \"MaximumEligibleLoanRial\"::text NOT IN ('NaN', 'Infinity', '-Infinity') AND \"BankApprovedLoanRial\"::text NOT IN ('NaN', 'Infinity', '-Infinity') AND \"TenantContributionRial\"::text NOT IN ('NaN', 'Infinity', '-Infinity')");

            migrationBuilder.AddCheckConstraint(
                name: "CK_fund_principal_freezes_idempotency_key_nonblank",
                table: "fund_principal_freezes",
                sql: "btrim(\"IdempotencyKey\") <> ''");

            migrationBuilder.AddCheckConstraint(
                name: "CK_frozen_principals_amount_positive_finite",
                table: "frozen_principals",
                sql: "\"AmountRial\" > 0 AND \"AmountRial\"::text NOT IN ('NaN', 'Infinity', '-Infinity')");

            migrationBuilder.AddCheckConstraint(
                name: "CK_external_transactions_amount_positive_finite",
                table: "external_transactions",
                sql: "\"AmountRial\" > 0 AND \"AmountRial\"::text NOT IN ('NaN', 'Infinity', '-Infinity')");

            migrationBuilder.AddCheckConstraint(
                name: "CK_external_transactions_currency_irr",
                table: "external_transactions",
                sql: "\"Currency\" = 'IRR'");

            migrationBuilder.AddCheckConstraint(
                name: "CK_external_transactions_idempotency_key_nonblank",
                table: "external_transactions",
                sql: "btrim(\"IdempotencyKey\") <> ''");

            migrationBuilder.AddCheckConstraint(
                name: "CK_credit_eligibility_assessments_idempotency_key_nonblank",
                table: "credit_eligibility_assessments",
                sql: "btrim(\"IdempotencyKey\") <> ''");

            migrationBuilder.AddCheckConstraint(
                name: "CK_bank_approvals_amounts_valid",
                table: "bank_approvals",
                sql: "\"MaximumEligibleLoanRial\" >= 0 AND \"MaximumEligibleLoanRial\"::text NOT IN ('NaN', 'Infinity', '-Infinity') AND (\"ApprovedLoanRial\" IS NULL OR (\"ApprovedLoanRial\" >= 0 AND \"ApprovedLoanRial\" <= \"MaximumEligibleLoanRial\" AND \"ApprovedLoanRial\"::text NOT IN ('NaN', 'Infinity', '-Infinity')))");

            migrationBuilder.AddCheckConstraint(
                name: "CK_bank_approvals_idempotency_key_nonblank",
                table: "bank_approvals",
                sql: "btrim(\"IdempotencyKey\") <> ''");

            migrationBuilder.AddForeignKey(
                name: "FK_frozen_principals_lease_contracts_ContractId",
                table: "frozen_principals",
                column: "ContractId",
                principalTable: "lease_contracts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_journal_lines_journal_entries_JournalEntryId",
                table: "journal_lines",
                column: "JournalEntryId",
                principalTable: "journal_entries",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_lease_contracts_credit_applications_CreditApplicationId",
                table: "lease_contracts",
                column: "CreditApplicationId",
                principalTable: "credit_applications",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_frozen_principals_lease_contracts_ContractId",
                table: "frozen_principals");

            migrationBuilder.DropForeignKey(
                name: "FK_journal_lines_journal_entries_JournalEntryId",
                table: "journal_lines");

            migrationBuilder.DropForeignKey(
                name: "FK_lease_contracts_credit_applications_CreditApplicationId",
                table: "lease_contracts");

            migrationBuilder.DropCheckConstraint(
                name: "CK_verification_requests_idempotency_key_nonblank",
                table: "verification_requests");

            migrationBuilder.DropCheckConstraint(
                name: "CK_tenant_contributions_initial_amount_positive_finite",
                table: "tenant_contributions");

            migrationBuilder.DropCheckConstraint(
                name: "CK_payment_instructions_amount_positive_finite",
                table: "payment_instructions");

            migrationBuilder.DropCheckConstraint(
                name: "CK_payment_instructions_idempotency_key_nonblank",
                table: "payment_instructions");

            migrationBuilder.DropCheckConstraint(
                name: "CK_ledger_accounts_currency_irr",
                table: "ledger_accounts");

            migrationBuilder.DropCheckConstraint(
                name: "CK_journal_lines_single_sided_positive_finite",
                table: "journal_lines");

            migrationBuilder.DropCheckConstraint(
                name: "CK_journal_entries_idempotency_key_nonblank",
                table: "journal_entries");

            migrationBuilder.DropCheckConstraint(
                name: "CK_journal_entries_not_self_reversal",
                table: "journal_entries");

            migrationBuilder.DropCheckConstraint(
                name: "CK_journal_entries_posted_at_or_after_occurred_at",
                table: "journal_entries");

            migrationBuilder.DropCheckConstraint(
                name: "CK_funding_allocations_amounts_and_equation",
                table: "funding_allocations");

            migrationBuilder.DropCheckConstraint(
                name: "CK_fund_principal_freezes_idempotency_key_nonblank",
                table: "fund_principal_freezes");

            migrationBuilder.DropCheckConstraint(
                name: "CK_frozen_principals_amount_positive_finite",
                table: "frozen_principals");

            migrationBuilder.DropCheckConstraint(
                name: "CK_external_transactions_amount_positive_finite",
                table: "external_transactions");

            migrationBuilder.DropCheckConstraint(
                name: "CK_external_transactions_currency_irr",
                table: "external_transactions");

            migrationBuilder.DropCheckConstraint(
                name: "CK_external_transactions_idempotency_key_nonblank",
                table: "external_transactions");

            migrationBuilder.DropCheckConstraint(
                name: "CK_credit_eligibility_assessments_idempotency_key_nonblank",
                table: "credit_eligibility_assessments");

            migrationBuilder.DropCheckConstraint(
                name: "CK_bank_approvals_amounts_valid",
                table: "bank_approvals");

            migrationBuilder.DropCheckConstraint(
                name: "CK_bank_approvals_idempotency_key_nonblank",
                table: "bank_approvals");

            migrationBuilder.AddForeignKey(
                name: "FK_journal_lines_journal_entries_JournalEntryId",
                table: "journal_lines",
                column: "JournalEntryId",
                principalTable: "journal_entries",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
