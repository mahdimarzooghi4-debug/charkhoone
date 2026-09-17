using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Charkhoone.Infrastructure.Persistence.Configurations;

public sealed class VerificationRequestRowConfiguration : IEntityTypeConfiguration<VerificationRequestRow>
{
    public void Configure(EntityTypeBuilder<VerificationRequestRow> builder)
    {
        builder.ToTable("verification_requests", table =>
        {
            table.HasCheckConstraint(
                "CK_verification_requests_idempotency_key_nonblank",
                "btrim(\"IdempotencyKey\") <> ''");
        });
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.IdempotencyKey).IsUnique();
        builder.HasIndex(x => new { x.CreditApplicationId, x.Type, x.CreatedAtUtc });

        builder.Property(x => x.Type).HasMaxLength(64).IsRequired();
        builder.Property(x => x.Provider).HasMaxLength(128).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(64).IsRequired();
        builder.Property(x => x.IdempotencyKey).HasMaxLength(256).IsRequired();
        builder.Property(x => x.ExternalReference).HasMaxLength(256);
        builder.Property(x => x.ReasonCode).HasMaxLength(128);

        builder.HasOne<CreditApplicationRow>()
            .WithMany()
            .HasForeignKey(x => x.CreditApplicationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
