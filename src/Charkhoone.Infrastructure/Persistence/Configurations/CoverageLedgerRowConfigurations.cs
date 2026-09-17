using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Charkhoone.Infrastructure.Persistence.Configurations;

public sealed class CoveragePaymentRowConfiguration : IEntityTypeConfiguration<CoveragePaymentRow>
{
    public void Configure(EntityTypeBuilder<CoveragePaymentRow> builder)
    {
        builder.ToTable("coverage_payments");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.PaymentInstructionId).IsUnique();
        builder.HasIndex(x => x.ExternalTransactionId).IsUnique();
        builder.HasIndex(x => x.JournalEntryId).IsUnique();
        builder.HasIndex(x => new { x.ContractId, x.Status });
        builder.HasIndex(x => new { x.Status, x.UpdatedAtUtc, x.Id });
        builder.Property(x => x.Kind).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(x => x.AmountRial).HasColumnType("numeric").IsRequired();
        builder.Property(x => x.BeneficiaryId).HasMaxLength(256).IsRequired();
        builder.Property(x => x.RemainingTenantContributionRial).HasColumnType("numeric");

        builder.HasOne<LeaseContractRow>()
            .WithMany()
            .HasForeignKey(x => x.ContractId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<MonthlyObligationRow>()
            .WithMany()
            .HasForeignKey(x => x.MonthlyObligationId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<PaymentInstructionRow>()
            .WithOne()
            .HasForeignKey<CoveragePaymentRow>(x => x.PaymentInstructionId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<ExternalTransactionRow>()
            .WithOne()
            .HasForeignKey<CoveragePaymentRow>(x => x.ExternalTransactionId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<JournalEntryRow>()
            .WithMany()
            .HasForeignKey(x => x.JournalEntryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class TenantContributionReplenishmentRowConfiguration : IEntityTypeConfiguration<TenantContributionReplenishmentRow>
{
    public void Configure(EntityTypeBuilder<TenantContributionReplenishmentRow> builder)
    {
        builder.ToTable("tenant_contribution_replenishments");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.ExternalTransactionId).IsUnique();
        builder.HasIndex(x => x.JournalEntryId).IsUnique();
        builder.HasIndex(x => new { x.ContractId, x.ReplenishedAtUtc });
        builder.Property(x => x.AmountRial).HasColumnType("numeric").IsRequired();
        builder.Property(x => x.RemainingTenantContributionRial).HasColumnType("numeric").IsRequired();
        builder.Property(x => x.ExternalReference).HasMaxLength(256).IsRequired();

        builder.HasOne<LeaseContractRow>()
            .WithMany()
            .HasForeignKey(x => x.ContractId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<ExternalTransactionRow>()
            .WithOne()
            .HasForeignKey<TenantContributionReplenishmentRow>(x => x.ExternalTransactionId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<JournalEntryRow>()
            .WithMany()
            .HasForeignKey(x => x.JournalEntryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
