using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Charkhoone.Infrastructure.Persistence.Configurations;

public sealed class BankApprovalRowConfiguration : IEntityTypeConfiguration<BankApprovalRow>
{
    public void Configure(EntityTypeBuilder<BankApprovalRow> builder)
    {
        builder.ToTable("bank_approvals", table =>
        {
            table.HasCheckConstraint(
                "CK_bank_approvals_maximum_eligible_nonnegative_finite",
                "\"MaximumEligibleLoanRial\"::text NOT IN ('NaN','Infinity','-Infinity') AND \"MaximumEligibleLoanRial\" >= 0");
            table.HasCheckConstraint(
                "CK_bank_approvals_approved_amount_valid",
                "\"ApprovedLoanRial\" IS NULL OR (\"ApprovedLoanRial\"::text NOT IN ('NaN','Infinity','-Infinity') AND \"ApprovedLoanRial\" > 0 AND \"ApprovedLoanRial\" <= \"MaximumEligibleLoanRial\")");
            table.HasCheckConstraint(
                "CK_bank_approvals_idempotency_key_nonblank",
                "btrim(\"IdempotencyKey\") <> ''");
        });
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.CreditApplicationId).IsUnique();
        builder.HasIndex(x => x.IdempotencyKey).IsUnique();
        builder.Property(x => x.Provider).HasMaxLength(128).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(64).IsRequired();
        builder.Property(x => x.MaximumEligibleLoanRial).HasColumnType("numeric").IsRequired();
        builder.Property(x => x.ApprovedLoanRial).HasColumnType("numeric");
        builder.Property(x => x.IdempotencyKey).HasMaxLength(256).IsRequired();
        builder.Property(x => x.ExternalReference).HasMaxLength(256);
        builder.Property(x => x.ReasonCode).HasMaxLength(256);

        builder.HasOne<CreditApplicationRow>()
            .WithOne()
            .HasForeignKey<BankApprovalRow>(x => x.CreditApplicationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class FundingAllocationRowConfiguration : IEntityTypeConfiguration<FundingAllocationRow>
{
    public void Configure(EntityTypeBuilder<FundingAllocationRow> builder)
    {
        builder.ToTable("funding_allocations", table =>
        {
            table.HasCheckConstraint(
                "CK_funding_allocations_amounts_and_equation",
                "\"FullDepositEquivalentRial\"::text NOT IN ('NaN','Infinity','-Infinity') AND \"MaximumEligibleLoanRial\"::text NOT IN ('NaN','Infinity','-Infinity') AND \"BankApprovedLoanRial\"::text NOT IN ('NaN','Infinity','-Infinity') AND \"TenantContributionRial\"::text NOT IN ('NaN','Infinity','-Infinity') AND \"FullDepositEquivalentRial\" >= 0 AND \"MaximumEligibleLoanRial\" >= 0 AND \"BankApprovedLoanRial\" > 0 AND \"BankApprovedLoanRial\" <= \"MaximumEligibleLoanRial\" AND \"BankApprovedLoanRial\" <= \"FullDepositEquivalentRial\" AND \"TenantContributionRial\" >= 0 AND \"TenantContributionRial\" = \"FullDepositEquivalentRial\" - \"BankApprovedLoanRial\"");
            table.HasCheckConstraint(
                "CK_funding_allocations_bank_id_nonblank",
                "btrim(\"BankId\") <> ''");
            table.HasCheckConstraint(
                "CK_funding_allocations_plan_version_nonblank",
                "btrim(\"BankLoanPlanVersion\") <> ''");
        });
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.CreditApplicationId).IsUnique();
        builder.HasIndex(x => x.ContractId).IsUnique();
        builder.Property(x => x.BankLoanPlanVersion).HasMaxLength(64).IsRequired();
        builder.Property(x => x.BankId).HasMaxLength(128).IsRequired();
        builder.Property(x => x.FullDepositEquivalentRial).HasColumnType("numeric").IsRequired();
        builder.Property(x => x.MaximumEligibleLoanRial).HasColumnType("numeric").IsRequired();
        builder.Property(x => x.BankApprovedLoanRial).HasColumnType("numeric").IsRequired();
        builder.Property(x => x.TenantContributionRial).HasColumnType("numeric").IsRequired();

        builder.HasOne<CreditApplicationRow>()
            .WithOne()
            .HasForeignKey<FundingAllocationRow>(x => x.CreditApplicationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<LeaseContractRow>()
            .WithOne()
            .HasForeignKey<FundingAllocationRow>(x => x.ContractId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class FundPrincipalFreezeRowConfiguration : IEntityTypeConfiguration<FundPrincipalFreezeRow>
{
    public void Configure(EntityTypeBuilder<FundPrincipalFreezeRow> builder)
    {
        builder.ToTable("fund_principal_freezes", table =>
        {
            table.HasCheckConstraint(
                "CK_fund_principal_freezes_idempotency_key_nonblank",
                "btrim(\"IdempotencyKey\") <> ''");
        });
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.FundingAllocationId).IsUnique();
        builder.HasIndex(x => x.IdempotencyKey).IsUnique();
        builder.Property(x => x.Provider).HasMaxLength(128).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(64).IsRequired();
        builder.Property(x => x.IdempotencyKey).HasMaxLength(256).IsRequired();
        builder.Property(x => x.FundReference).HasMaxLength(256);
        builder.Property(x => x.ExternalReference).HasMaxLength(256);
        builder.Property(x => x.ReasonCode).HasMaxLength(256);

        builder.HasOne<FundingAllocationRow>()
            .WithOne()
            .HasForeignKey<FundPrincipalFreezeRow>(x => x.FundingAllocationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
