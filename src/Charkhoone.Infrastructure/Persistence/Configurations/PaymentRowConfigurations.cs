using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Charkhoone.Infrastructure.Persistence.Configurations;

public sealed class MonthlyObligationRowConfiguration : IEntityTypeConfiguration<MonthlyObligationRow>
{
    public void Configure(EntityTypeBuilder<MonthlyObligationRow> builder)
    {
        builder.ToTable("monthly_obligations");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.ContractId, x.ContractMonthNumber }).IsUnique();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.HasOne<LeaseContractRow>()
            .WithMany()
            .HasForeignKey(x => x.ContractId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class MonthlyObligationComponentRowConfiguration : IEntityTypeConfiguration<MonthlyObligationComponentRow>
{
    public void Configure(EntityTypeBuilder<MonthlyObligationComponentRow> builder)
    {
        builder.ToTable("monthly_obligation_components");
        builder.HasKey(x => x.PaymentInstructionId);
        builder.HasIndex(x => new { x.MonthlyObligationId, x.Kind }).IsUnique();
        builder.Property(x => x.Kind).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.HasOne<MonthlyObligationRow>()
            .WithMany()
            .HasForeignKey(x => x.MonthlyObligationId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<PaymentInstructionRow>()
            .WithOne()
            .HasForeignKey<MonthlyObligationComponentRow>(x => x.PaymentInstructionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class ContractDelinquencyRowConfiguration : IEntityTypeConfiguration<ContractDelinquencyRow>
{
    public void Configure(EntityTypeBuilder<ContractDelinquencyRow> builder)
    {
        builder.ToTable("contract_delinquencies");
        builder.HasKey(x => x.ContractId);
        builder.HasOne<LeaseContractRow>()
            .WithOne()
            .HasForeignKey<ContractDelinquencyRow>(x => x.ContractId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class MonthlyPaymentInstructionRelationshipConfiguration : IEntityTypeConfiguration<PaymentInstructionRow>
{
    public void Configure(EntityTypeBuilder<PaymentInstructionRow> builder)
    {
        builder.HasOne<MonthlyObligationRow>()
            .WithMany()
            .HasForeignKey(x => x.ObligationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
