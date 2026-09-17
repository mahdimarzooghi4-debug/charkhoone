using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Charkhoone.Infrastructure.Persistence.Configurations;

public sealed class LostFundReturnRowConfiguration : IEntityTypeConfiguration<LostFundReturnRow>
{
    public void Configure(EntityTypeBuilder<LostFundReturnRow> builder)
    {
        builder.ToTable("lost_fund_returns");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.CoveragePaymentId).IsUnique();
        builder.HasIndex(x => new { x.ContractId, x.WithdrawnAtUtc });

        builder.Property(x => x.WithdrawnAmountRial).HasColumnType("numeric").IsRequired();
        builder.Property(x => x.MonthlyRate).HasPrecision(10, 8).IsRequired();
        builder.Property(x => x.CalculationPolicyVersion).HasMaxLength(64);
        builder.Property(x => x.CalculatedReturnRial).HasColumnType("numeric");

        builder.HasOne<LeaseContractRow>()
            .WithMany()
            .HasForeignKey(x => x.ContractId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<CoveragePaymentRow>()
            .WithOne()
            .HasForeignKey<LostFundReturnRow>(x => x.CoveragePaymentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
