using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Charkhoone.Infrastructure.Persistence.Configurations;

public sealed class LeaseContractTermsRowConfiguration : IEntityTypeConfiguration<LeaseContractTermsRow>
{
    public void Configure(EntityTypeBuilder<LeaseContractTermsRow> builder)
    {
        builder.ToTable("lease_contract_terms", table =>
        {
            table.HasCheckConstraint(
                "CK_lease_contract_terms_calendar",
                ""Calendar" = 'Persian'");
            table.HasCheckConstraint(
                "CK_lease_contract_terms_persian_start",
                ""PersianStartYear" > 0 AND "PersianStartMonth" BETWEEN 1 AND 12 AND "PersianStartDay" BETWEEN 1 AND 31");
            table.HasCheckConstraint(
                "CK_lease_contract_terms_term_months",
                ""TermMonths" = 12");
            table.HasCheckConstraint(
                "CK_lease_contract_terms_amounts",
                ""CashDepositRial" >= 0 AND "MonthlyRentRial" >= 0 AND "FullDepositEquivalentRial" > 0 "
                + "AND "CashDepositRial" = trunc("CashDepositRial") "
                + "AND "MonthlyRentRial" = trunc("MonthlyRentRial") "
                + "AND "FullDepositEquivalentRial" = trunc("FullDepositEquivalentRial") "
                + "AND "CashDepositRial"::text NOT IN ('NaN', 'Infinity', '-Infinity') "
                + "AND "MonthlyRentRial"::text NOT IN ('NaN', 'Infinity', '-Infinity') "
                + "AND "FullDepositEquivalentRial"::text NOT IN ('NaN', 'Infinity', '-Infinity')");
            table.HasCheckConstraint(
                "CK_lease_contract_terms_full_deposit_equation",
                ""FullDepositEquivalentRial" = floor("CashDepositRial" + ("MonthlyRentRial" / 0.03))");
            table.HasCheckConstraint(
                "CK_lease_contract_terms_beneficiaries_nonblank",
                "btrim("OwnerBeneficiaryId") <> '' AND btrim("BankBeneficiaryId") <> ''");
            table.HasCheckConstraint(
                "CK_lease_contract_terms_source_reference_nonblank",
                "btrim("SourceReference") <> ''");
        });

        builder.HasKey(x => x.ContractId);
        builder.Property(x => x.Calendar).HasMaxLength(32).IsRequired();
        builder.Property(x => x.CashDepositRial).HasColumnType("numeric").IsRequired();
        builder.Property(x => x.MonthlyRentRial).HasColumnType("numeric").IsRequired();
        builder.Property(x => x.FullDepositEquivalentRial).HasColumnType("numeric").IsRequired();
        builder.Property(x => x.OwnerBeneficiaryId).HasMaxLength(256).IsRequired();
        builder.Property(x => x.BankBeneficiaryId).HasMaxLength(256).IsRequired();
        builder.Property(x => x.SourceReference).HasMaxLength(256).IsRequired();

        builder.HasOne<LeaseContractRow>()
            .WithOne()
            .HasForeignKey<LeaseContractTermsRow>(x => x.ContractId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.ScheduleMonths)
            .WithOne()
            .HasForeignKey(x => x.ContractId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class LeaseContractScheduleMonthRowConfiguration : IEntityTypeConfiguration<LeaseContractScheduleMonthRow>
{
    public void Configure(EntityTypeBuilder<LeaseContractScheduleMonthRow> builder)
    {
        builder.ToTable("lease_contract_schedule_months", table =>
        {
            table.HasCheckConstraint(
                "CK_lease_contract_schedule_month_number",
                ""ContractMonthNumber" BETWEEN 1 AND 12");
            table.HasCheckConstraint(
                "CK_lease_contract_schedule_amounts",
                ""OwnerPaymentRial" >= 0 AND "BankInterestRial" >= 0 "
                + "AND ("OwnerPaymentRial" > 0 OR "BankInterestRial" > 0) "
                + "AND "OwnerPaymentRial" = trunc("OwnerPaymentRial") "
                + "AND "BankInterestRial" = trunc("BankInterestRial") "
                + "AND "OwnerPaymentRial"::text NOT IN ('NaN', 'Infinity', '-Infinity') "
                + "AND "BankInterestRial"::text NOT IN ('NaN', 'Infinity', '-Infinity')");
        });

        builder.HasKey(x => new { x.ContractId, x.ContractMonthNumber });
        builder.HasIndex(x => new { x.ContractId, x.DueAtUtc }).IsUnique();
        builder.Property(x => x.OwnerPaymentRial).HasColumnType("numeric").IsRequired();
        builder.Property(x => x.BankInterestRial).HasColumnType("numeric").IsRequired();
    }
}
