using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Charkhoone.Infrastructure.Persistence.Configurations;

public sealed class NormalSettlementRowConfiguration : IEntityTypeConfiguration<NormalSettlementRow>
{
    public void Configure(EntityTypeBuilder<NormalSettlementRow> builder)
    {
        builder.ToTable("normal_settlements");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.ContractId).IsUnique();
        builder.HasIndex(x => x.BankExternalTransactionId).IsUnique();
        builder.HasIndex(x => x.TenantExternalTransactionId).IsUnique();
        builder.HasIndex(x => x.BankJournalEntryId).IsUnique();
        builder.HasIndex(x => x.TenantJournalEntryId).IsUnique();

        builder.Property(x => x.BankId).HasMaxLength(128).IsRequired();
        builder.Property(x => x.FundReference).HasMaxLength(256).IsRequired();
        builder.Property(x => x.BankPrincipalAmountRial).HasPrecision(38, 18).IsRequired();
        builder.Property(x => x.BankPrincipalStatus).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(x => x.BankExternalReference).HasMaxLength(256);
        builder.Property(x => x.TenantResidualAmountRial).HasPrecision(38, 18).IsRequired();
        builder.Property(x => x.TenantResidualStatus).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(x => x.TenantExternalReference).HasMaxLength(256);

        builder.HasOne<LeaseContractRow>()
            .WithOne()
            .HasForeignKey<NormalSettlementRow>(x => x.ContractId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<UserRow>()
            .WithMany()
            .HasForeignKey(x => x.TenantUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<ExternalTransactionRow>()
            .WithOne()
            .HasForeignKey<NormalSettlementRow>(x => x.BankExternalTransactionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<ExternalTransactionRow>()
            .WithOne()
            .HasForeignKey<NormalSettlementRow>(x => x.TenantExternalTransactionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<JournalEntryRow>()
            .WithMany()
            .HasForeignKey(x => x.BankJournalEntryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<JournalEntryRow>()
            .WithMany()
            .HasForeignKey(x => x.TenantJournalEntryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
