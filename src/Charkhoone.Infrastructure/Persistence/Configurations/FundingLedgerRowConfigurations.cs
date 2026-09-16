using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Charkhoone.Infrastructure.Persistence.Configurations;

public sealed class TenantContributionFundingRowConfiguration : IEntityTypeConfiguration<TenantContributionFundingRow>
{
    public void Configure(EntityTypeBuilder<TenantContributionFundingRow> builder)
    {
        builder.ToTable("tenant_contribution_fundings");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.FundingAllocationId).IsUnique();
        builder.HasIndex(x => x.ExternalTransactionId).IsUnique();
        builder.Property(x => x.FundReference).HasMaxLength(256);

        builder.HasOne<FundingAllocationRow>()
            .WithOne()
            .HasForeignKey<TenantContributionFundingRow>(x => x.FundingAllocationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<ExternalTransactionRow>()
            .WithOne()
            .HasForeignKey<TenantContributionFundingRow>(x => x.ExternalTransactionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class TenantContributionRowConfiguration : IEntityTypeConfiguration<TenantContributionRow>
{
    public void Configure(EntityTypeBuilder<TenantContributionRow> builder)
    {
        builder.ToTable("tenant_contributions");
        builder.HasKey(x => x.ContractId);
        builder.HasIndex(x => x.FundingAllocationId).IsUnique();
        builder.Property(x => x.InitialAmountRial).HasPrecision(38, 18).IsRequired();
        builder.Property(x => x.FundReference).HasMaxLength(256).IsRequired();

        builder.HasOne<FundingAllocationRow>()
            .WithOne()
            .HasForeignKey<TenantContributionRow>(x => x.FundingAllocationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<LeaseContractRow>()
            .WithOne()
            .HasForeignKey<TenantContributionRow>(x => x.ContractId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class ExternalTransactionRowConfiguration : IEntityTypeConfiguration<ExternalTransactionRow>
{
    public void Configure(EntityTypeBuilder<ExternalTransactionRow> builder)
    {
        builder.ToTable("external_transactions");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.IdempotencyKey).IsUnique();
        builder.HasIndex(x => new { x.AggregateType, x.AggregateId, x.CreatedAtUtc });
        builder.Property(x => x.Provider).HasMaxLength(128).IsRequired();
        builder.Property(x => x.OperationType).HasMaxLength(128).IsRequired();
        builder.Property(x => x.AggregateType).HasMaxLength(64).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(x => x.AmountRial).HasPrecision(38, 18).IsRequired();
        builder.Property(x => x.Currency).HasMaxLength(8).IsRequired();
        builder.Property(x => x.IdempotencyKey).HasMaxLength(256).IsRequired();
        builder.Property(x => x.ExternalReference).HasMaxLength(256);
        builder.Property(x => x.ReasonCode).HasMaxLength(256);
    }
}

public sealed class LedgerAccountRowConfiguration : IEntityTypeConfiguration<LedgerAccountRow>
{
    public void Configure(EntityTypeBuilder<LedgerAccountRow> builder)
    {
        builder.ToTable("ledger_accounts");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.Code).IsUnique();
        builder.HasIndex(x => x.ContractId);
        builder.Property(x => x.Code).HasMaxLength(256).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(256).IsRequired();
        builder.Property(x => x.Currency).HasMaxLength(8).IsRequired();

        builder.HasOne<LeaseContractRow>()
            .WithMany()
            .HasForeignKey(x => x.ContractId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class JournalEntryRowConfiguration : IEntityTypeConfiguration<JournalEntryRow>
{
    public void Configure(EntityTypeBuilder<JournalEntryRow> builder)
    {
        builder.ToTable("journal_entries");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.IdempotencyKey).IsUnique();
        builder.HasIndex(x => new { x.ReferenceType, x.ReferenceId });
        builder.Property(x => x.ReferenceType).HasMaxLength(128).IsRequired();
        builder.Property(x => x.IdempotencyKey).HasMaxLength(256).IsRequired();
        builder.Property(x => x.Description).HasColumnType("text").IsRequired();

        builder.HasOne<JournalEntryRow>()
            .WithMany()
            .HasForeignKey(x => x.ReversalOfJournalEntryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class JournalLineRowConfiguration : IEntityTypeConfiguration<JournalLineRow>
{
    public void Configure(EntityTypeBuilder<JournalLineRow> builder)
    {
        builder.ToTable("journal_lines");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.JournalEntryId);
        builder.HasIndex(x => x.LedgerAccountId);
        builder.Property(x => x.DebitRial).HasPrecision(38, 18).IsRequired();
        builder.Property(x => x.CreditRial).HasPrecision(38, 18).IsRequired();

        builder.HasOne<JournalEntryRow>()
            .WithMany()
            .HasForeignKey(x => x.JournalEntryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<LedgerAccountRow>()
            .WithMany()
            .HasForeignKey(x => x.LedgerAccountId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
