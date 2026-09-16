using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Charkhoone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCreditEligibilityAssessments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "credit_eligibility_assessments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CreditApplicationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Provider = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Status = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ExternalSubGrade = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    FullDepositEquivalentRial = table.Column<decimal>(type: "numeric(38,18)", precision: 38, scale: 18, nullable: false),
                    LoanRatio = table.Column<decimal>(type: "numeric(10,8)", precision: 10, scale: 8, nullable: true),
                    MaximumEligibleLoanRial = table.Column<decimal>(type: "numeric(38,18)", precision: 38, scale: 18, nullable: true),
                    IdempotencyKey = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    ExternalReference = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ReasonCode = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    AttemptCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_credit_eligibility_assessments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_credit_eligibility_assessments_credit_applications_CreditAp~",
                        column: x => x.CreditApplicationId,
                        principalTable: "credit_applications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_credit_eligibility_assessments_CreditApplicationId",
                table: "credit_eligibility_assessments",
                column: "CreditApplicationId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_credit_eligibility_assessments_IdempotencyKey",
                table: "credit_eligibility_assessments",
                column: "IdempotencyKey",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "credit_eligibility_assessments");
        }
    }
}
