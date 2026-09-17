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
        builder.ToTable("tenant_contributions", table =>
        {
            table.HasCheckConstraint(
                "CK_tenant_contributions_initial_amount_positive_finite",
                "\"InitialAmountRial\" > 0 AND \"InitialAmountRial\"::text NOT IN ('NaN', 'Infinity', '-Infinity')");
        });
        builder.HasKey(x => x.ContractId);
        builder.HasIndex(x => x.FundingAllocationId).IsUnique();
        builder.Property(x => x.InitialAmountRial).HasColumnType("numeric").IsRequired();
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
        builder.ToTable("external_transactions", table =>
        {
            table.HasCheckConstraint(
                "CK_external_transactions_amount_positive_finite",
                "\"AmountRial\" > 0 AND \"AmountRial\"::text NOT IN ('NaN', 'Infinity', '-Infinity')");
            table.HasCheckConstraint(
                "CK_external_transactions_currency_irr",
                "\"Currency\" = 'IRR'");
            table.HasCheckConstraint(
                "CK_external_transactions_idempotency_key_nonblank",
                "btrim(\"IdempotencyKey\") <> ''");
        });
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.IdempotencyKey).IsUnique();
        builder.HasIndex(x => new { x.AggregateType, x.AggregateId, x.CreatedAtUtc });
        builder.HasIndex(x => new { x.AggregateType, x.AggregateId, x.UpdatedAtUtc, x.Id });
        builder.HasIndex(x => new { x.UpdatedAtUtc, x.Id })
            .HasFilter("\"AggregateType\" = 'PaymentInstruction' AND \"OperationType\" = 'payment_reconciliation' AND \"Status\" IN ('Pending','Unknown')");
        builder.Property(x => x.Provider).HasMaxLength(128).IsRequired();
        builder.Property(x => x.OperationType).HasMaxLength(128).IsRequired();
        builder.Property(x => x.AggregateType).HasMaxLength(64).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(x => x.AmountRial).HasColumnType("numeric").IsRequired();
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
        builder.ToTable("ledger_accounts", table =>
        {
            table.HasCheckConstraint(
                "CK_ledger_accounts_currency_irr",
                "\"Currency\" = 'IRR'");
        });
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
        builder.ToTable("journal_entries", table =>
        {
            table.HasCheckConstraint(
                "CK_journal_entries_posted_at_or_after_occurred_at",
                "\"PostedAtUtc\" >= \"OccurredAtUtc\"");
            table.HasCheckConstraint(
                "CK_journal_entries_not_self_reversal",
                "\"ReversalOfJournalEntryId\" IS NULL OR \"ReversalOfJournalEntryId\" <> \"Id\"");
            table.HasCheckConstraint(
                "CK_journal_entries_idempotency_key_nonblank",
                "btrim(\"IdempotencyKey\") <> ''");
        });
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
        builder.ToTable("journal_lines", table =>
        {
            table.HasCheckConstraint(
                "CK_journal_lines_single_sided_positive_finite",
                "\"DebitRial\"::text NOT IN ('NaN', 'Infinity', '-Infinity') AND \"CreditRial\"::text NOT IN ('NaN', 'Infinity', '-Infinity') AND ((\"DebitRial\" > 0 AND \"CreditRial\" = 0) OR (\"CreditRial\" > 0 AND \"DebitRial\" = 0))");
        });
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.JournalEntryId);
        builder.HasIndex(x => x.LedgerAccountId);
        builder.Property(x => x.DebitRial).HasColumnType("numeric").IsRequired();
        builder.Property(x => x.CreditRial).HasColumnType("numeric").IsRequired();

        builder.HasOne<JournalEntryRow>()
            .WithMany()
            .HasForeignKey(x => x.JournalEntryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<LedgerAccountRow>()
            .WithMany()
            .HasForeignKey(x => x.LedgerAccountId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
