using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Charkhoone.Infrastructure.Persistence.Configurations;

public sealed class CreditEligibilityAssessmentRowConfiguration
    : IEntityTypeConfiguration<CreditEligibilityAssessmentRow>
{
    public void Configure(EntityTypeBuilder<CreditEligibilityAssessmentRow> builder)
    {
        builder.ToTable("credit_eligibility_assessments");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.CreditApplicationId).IsUnique();
        builder.HasIndex(x => x.IdempotencyKey).IsUnique();
        builder.Property(x => x.Provider).HasMaxLength(128).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(64).IsRequired();
        builder.Property(x => x.ExternalSubGrade).HasMaxLength(16);
        builder.Property(x => x.FullDepositEquivalentRial).HasColumnType("numeric").IsRequired();
        builder.Property(x => x.LoanRatio).HasPrecision(10, 8);
        builder.Property(x => x.MaximumEligibleLoanRial).HasColumnType("numeric");
        builder.Property(x => x.IdempotencyKey).HasMaxLength(256).IsRequired();
        builder.Property(x => x.ExternalReference).HasMaxLength(256);
        builder.Property(x => x.ReasonCode).HasMaxLength(256);

        builder.HasOne<CreditApplicationRow>()
            .WithOne()
            .HasForeignKey<CreditEligibilityAssessmentRow>(x => x.CreditApplicationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
