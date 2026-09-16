using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Charkhoone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialPersistence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "bank_loan_plan_versions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    Version = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    BankId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Title = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    InterestTerms = table.Column<string>(type: "text", nullable: false),
                    Scope = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    TermMonths = table.Column<int>(type: "integer", nullable: false, defaultValue: 12),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bank_loan_plan_versions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "credit_grade_policy_versions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Version = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    EffectiveFromUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_credit_grade_policy_versions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "frozen_principals",
                columns: table => new
                {
                    ContractId = table.Column<Guid>(type: "uuid", nullable: false),
                    BankId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    AmountRial = table.Column<decimal>(type: "numeric(38,18)", precision: 38, scale: 18, nullable: false),
                    FundReference = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    FrozenAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_frozen_principals", x => x.ContractId);
                });

            migrationBuilder.CreateTable(
                name: "outbox_messages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OccurredAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Type = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    PayloadJson = table.Column<string>(type: "jsonb", nullable: false),
                    ProcessedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    AttemptCount = table.Column<int>(type: "integer", nullable: false),
                    LastError = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_outbox_messages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "payment_instructions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ObligationId = table.Column<Guid>(type: "uuid", nullable: false),
                    DueAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    BeneficiaryId = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    AmountRial = table.Column<decimal>(type: "numeric(38,18)", precision: 38, scale: 18, nullable: false),
                    IdempotencyKey = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Status = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payment_instructions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OidcSubject = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "workflow_transitions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AggregateType = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    AggregateId = table.Column<Guid>(type: "uuid", nullable: false),
                    FromStatus = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ToStatus = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ActorId = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Reason = table.Column<string>(type: "text", nullable: false),
                    OccurredAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_workflow_transitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "bank_loan_plan_organizations",
                columns: table => new
                {
                    PlanVersionId = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bank_loan_plan_organizations", x => new { x.PlanVersionId, x.OrganizationId });
                    table.ForeignKey(
                        name: "FK_bank_loan_plan_organizations_bank_loan_plan_versions_PlanVe~",
                        column: x => x.PlanVersionId,
                        principalTable: "bank_loan_plan_versions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "credit_grade_policy_entries",
                columns: table => new
                {
                    PolicyVersionId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExternalSubGrade = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    LoanRatio = table.Column<decimal>(type: "numeric(10,8)", precision: 10, scale: 8, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_credit_grade_policy_entries", x => new { x.PolicyVersionId, x.ExternalSubGrade });
                    table.ForeignKey(
                        name: "FK_credit_grade_policy_entries_credit_grade_policy_versions_Po~",
                        column: x => x.PolicyVersionId,
                        principalTable: "credit_grade_policy_versions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "credit_applications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ApplicantUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    BankLoanPlanId = table.Column<Guid>(type: "uuid", nullable: true),
                    BankLoanPlanVersion = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    CreditGradePolicyVersion = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_credit_applications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_credit_applications_users_ApplicantUserId",
                        column: x => x.ApplicantUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "lease_contracts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropertyId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreditApplicationId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    BankLoanPlanId = table.Column<Guid>(type: "uuid", nullable: true),
                    BankLoanPlanVersion = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    CreditGradePolicyVersion = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lease_contracts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_lease_contracts_users_OwnerUserId",
                        column: x => x.OwnerUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_lease_contracts_users_TenantUserId",
                        column: x => x.TenantUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_bank_loan_plan_versions_PlanId_Version",
                table: "bank_loan_plan_versions",
                columns: new[] { "PlanId", "Version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_credit_applications_ApplicantUserId",
                table: "credit_applications",
                column: "ApplicantUserId");

            migrationBuilder.CreateIndex(
                name: "IX_credit_grade_policy_versions_Version",
                table: "credit_grade_policy_versions",
                column: "Version",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_lease_contracts_CreditApplicationId",
                table: "lease_contracts",
                column: "CreditApplicationId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_lease_contracts_OwnerUserId",
                table: "lease_contracts",
                column: "OwnerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_lease_contracts_PropertyId",
                table: "lease_contracts",
                column: "PropertyId");

            migrationBuilder.CreateIndex(
                name: "IX_lease_contracts_TenantUserId",
                table: "lease_contracts",
                column: "TenantUserId");

            migrationBuilder.CreateIndex(
                name: "IX_outbox_messages_ProcessedAtUtc_OccurredAtUtc",
                table: "outbox_messages",
                columns: new[] { "ProcessedAtUtc", "OccurredAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_payment_instructions_IdempotencyKey",
                table: "payment_instructions",
                column: "IdempotencyKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_payment_instructions_ObligationId",
                table: "payment_instructions",
                column: "ObligationId");

            migrationBuilder.CreateIndex(
                name: "IX_users_OidcSubject",
                table: "users",
                column: "OidcSubject",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_workflow_transitions_AggregateType_AggregateId_OccurredAtUtc",
                table: "workflow_transitions",
                columns: new[] { "AggregateType", "AggregateId", "OccurredAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "bank_loan_plan_organizations");

            migrationBuilder.DropTable(
                name: "credit_applications");

            migrationBuilder.DropTable(
                name: "credit_grade_policy_entries");

            migrationBuilder.DropTable(
                name: "frozen_principals");

            migrationBuilder.DropTable(
                name: "lease_contracts");

            migrationBuilder.DropTable(
                name: "outbox_messages");

            migrationBuilder.DropTable(
                name: "payment_instructions");

            migrationBuilder.DropTable(
                name: "workflow_transitions");

            migrationBuilder.DropTable(
                name: "bank_loan_plan_versions");

            migrationBuilder.DropTable(
                name: "credit_grade_policy_versions");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
