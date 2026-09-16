using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Charkhoone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMonthlyPaymentReconciliation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "contract_delinquencies",
                columns: table => new
                {
                    ContractId = table.Column<Guid>(type: "uuid", nullable: false),
                    ConsecutiveMissedMonths = table.Column<int>(type: "integer", nullable: false),
                    CancellationRequired = table.Column<bool>(type: "boolean", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contract_delinquencies", x => x.ContractId);
                    table.ForeignKey(
                        name: "FK_contract_delinquencies_lease_contracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "lease_contracts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "monthly_obligations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ContractId = table.Column<Guid>(type: "uuid", nullable: false),
                    ContractMonthNumber = table.Column<int>(type: "integer", nullable: false),
                    DueAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ClosedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_monthly_obligations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_monthly_obligations_lease_contracts_ContractId",
                        column: x => x.ContractId,
                        principalTable: "lease_contracts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "monthly_obligation_components",
                columns: table => new
                {
                    PaymentInstructionId = table.Column<Guid>(type: "uuid", nullable: false),
                    MonthlyObligationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Kind = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_monthly_obligation_components", x => x.PaymentInstructionId);
                    table.ForeignKey(
                        name: "FK_monthly_obligation_components_monthly_obligations_MonthlyOb~",
                        column: x => x.MonthlyObligationId,
                        principalTable: "monthly_obligations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_monthly_obligation_components_payment_instructions_PaymentI~",
                        column: x => x.PaymentInstructionId,
                        principalTable: "payment_instructions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_monthly_obligation_components_MonthlyObligationId_Kind",
                table: "monthly_obligation_components",
                columns: new[] { "MonthlyObligationId", "Kind" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_monthly_obligations_ContractId_ContractMonthNumber",
                table: "monthly_obligations",
                columns: new[] { "ContractId", "ContractMonthNumber" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_payment_instructions_monthly_obligations_ObligationId",
                table: "payment_instructions",
                column: "ObligationId",
                principalTable: "monthly_obligations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_payment_instructions_monthly_obligations_ObligationId",
                table: "payment_instructions");

            migrationBuilder.DropTable(
                name: "contract_delinquencies");

            migrationBuilder.DropTable(
                name: "monthly_obligation_components");

            migrationBuilder.DropTable(
                name: "monthly_obligations");
        }
    }
}
