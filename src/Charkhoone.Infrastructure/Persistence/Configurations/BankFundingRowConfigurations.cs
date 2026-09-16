using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Charkhoone.Infrastructure.Persistence.Configurations;

public sealed class BankApprovalRowConfiguration : IEntityTypeConfiguration<BankApprovalRow>
{
    public void Configure(EntityTypeBuilder<BankApprovalRow> builder)
    {
        builder.ToTable("bank_approvals");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.CreditApplicationId).IsUnique();
        builder.HasIndex(x => x.IdempotencyKey).IsUnique();
        builder.Property(x => x.Provider).HasMaxLength(128).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(64).IsRequired();
        builder.Property(x => x.MaximumEligibleLoanRial).HasPrecision(38, 18).IsRequired();
        builder.Property(x => x.ApprovedLoanRial).HasPrecision(38, 18);
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
        builder.ToTable("funding_allocations");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.CreditApplicationId).IsUnique();
        builder.HasIndex(x => x.ContractId).IsUnique();
        builder.Property(x => x.BankLoanPlanVersion).HasMaxLength(64).IsRequired();
        builder.Property(x => x.BankId).HasMaxLength(128).IsRequired();
        builder.Property(x => x.FullDepositEquivalentRial).HasPrecision(38, 18).IsRequired();
        builder.Property(x => x.MaximumEligibleLoanRial).HasPrecision(38, 18).IsRequired();
        builder.Property(x => x.BankApprovedLoanRial).HasPrecision(38, 18).IsRequired();
        builder.Property(x => x.TenantContributionRial).HasPrecision(38, 18).IsRequired();

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
        builder.ToTable("fund_principal_freezes");
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
