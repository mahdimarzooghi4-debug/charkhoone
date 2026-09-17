using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Charkhoone.Infrastructure.Persistence.Configurations;

public sealed class CancellationSettlementRowConfiguration : IEntityTypeConfiguration<CancellationSettlementRow>
{
    public void Configure(EntityTypeBuilder<CancellationSettlementRow> builder)
    {
        builder.ToTable("cancellation_settlements");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.ContractId).IsUnique();
        builder.HasIndex(x => x.ExternalTransactionId).IsUnique();
        builder.HasIndex(x => x.JournalEntryId).IsUnique();
        builder.Property(x => x.AmountRial).HasColumnType("numeric").IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(x => x.ExternalReference).HasMaxLength(256);
        builder.Property(x => x.RemainingTenantContributionRial).HasColumnType("numeric");

        builder.HasOne<LeaseContractRow>()
            .WithOne()
            .HasForeignKey<CancellationSettlementRow>(x => x.ContractId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<UserRow>()
            .WithMany()
            .HasForeignKey(x => x.OwnerUserId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<ExternalTransactionRow>()
            .WithOne()
            .HasForeignKey<CancellationSettlementRow>(x => x.ExternalTransactionId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<JournalEntryRow>()
            .WithMany()
            .HasForeignKey(x => x.JournalEntryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
