using Charkhoone.Domain.Finance;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Charkhoone.Infrastructure.Persistence.Configurations;

public sealed class BankLoanPlanVersionRowConfiguration : IEntityTypeConfiguration<BankLoanPlanVersionRow>
{
    public void Configure(EntityTypeBuilder<BankLoanPlanVersionRow> builder)
    {
        builder.ToTable("bank_loan_plan_versions");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.PlanId, x.Version }).IsUnique();
        builder.Property(x => x.Version).HasMaxLength(64).IsRequired();
        builder.Property(x => x.BankId).HasMaxLength(128).IsRequired();
        builder.Property(x => x.Title).HasMaxLength(256).IsRequired();
        builder.Property(x => x.InterestTerms).HasColumnType("text").IsRequired();
        builder.Property(x => x.Scope).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(x => x.TermMonths).HasDefaultValue(BankLoanPlanVersion.RequiredTermMonths);
        builder.HasMany(x => x.AllowedOrganizations)
            .WithOne()
            .HasForeignKey(x => x.PlanVersionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class BankLoanPlanOrganizationRowConfiguration : IEntityTypeConfiguration<BankLoanPlanOrganizationRow>
{
    public void Configure(EntityTypeBuilder<BankLoanPlanOrganizationRow> builder)
    {
        builder.ToTable("bank_loan_plan_organizations");
        builder.HasKey(x => new { x.PlanVersionId, x.OrganizationId });
    }
}

public sealed class CreditGradePolicyVersionRowConfiguration : IEntityTypeConfiguration<CreditGradePolicyVersionRow>
{
    public void Configure(EntityTypeBuilder<CreditGradePolicyVersionRow> builder)
    {
        builder.ToTable("credit_grade_policy_versions");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.Version).IsUnique();
        builder.Property(x => x.Version).HasMaxLength(64).IsRequired();
        builder.HasMany(x => x.Entries)
            .WithOne()
            .HasForeignKey(x => x.PolicyVersionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class CreditGradePolicyEntryRowConfiguration : IEntityTypeConfiguration<CreditGradePolicyEntryRow>
{
    public void Configure(EntityTypeBuilder<CreditGradePolicyEntryRow> builder)
    {
        builder.ToTable("credit_grade_policy_entries");
        builder.HasKey(x => new { x.PolicyVersionId, x.ExternalSubGrade });
        builder.Property(x => x.ExternalSubGrade).HasMaxLength(16).IsRequired();
        builder.Property(x => x.LoanRatio).HasPrecision(10, 8).IsRequired();
    }
}

public sealed class CreditApplicationRowConfiguration : IEntityTypeConfiguration<CreditApplicationRow>
{
    public void Configure(EntityTypeBuilder<CreditApplicationRow> builder)
    {
        builder.ToTable("credit_applications");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.ApplicantUserId);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(64).IsRequired();
        builder.Property(x => x.BankLoanPlanVersion).HasMaxLength(64);
        builder.Property(x => x.CreditGradePolicyVersion).HasMaxLength(64);
    }
}

public sealed class LeaseContractRowConfiguration : IEntityTypeConfiguration<LeaseContractRow>
{
    public void Configure(EntityTypeBuilder<LeaseContractRow> builder)
    {
        builder.ToTable("lease_contracts");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.TenantUserId);
        builder.HasIndex(x => x.OwnerUserId);
        builder.HasIndex(x => x.PropertyId);
        builder.HasIndex(x => x.CreditApplicationId).IsUnique();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(64).IsRequired();
        builder.Property(x => x.BankLoanPlanVersion).HasMaxLength(64);
        builder.Property(x => x.CreditGradePolicyVersion).HasMaxLength(64);
    }
}

public sealed class WorkflowTransitionRowConfiguration : IEntityTypeConfiguration<WorkflowTransitionRow>
{
    public void Configure(EntityTypeBuilder<WorkflowTransitionRow> builder)
    {
        builder.ToTable("workflow_transitions");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.AggregateType, x.AggregateId, x.OccurredAtUtc });
        builder.Property(x => x.AggregateType).HasMaxLength(64).IsRequired();
        builder.Property(x => x.FromStatus).HasMaxLength(64).IsRequired();
        builder.Property(x => x.ToStatus).HasMaxLength(64).IsRequired();
        builder.Property(x => x.ActorId).HasMaxLength(256).IsRequired();
        builder.Property(x => x.Reason).HasColumnType("text").IsRequired();
    }
}

public sealed class PaymentInstructionRowConfiguration : IEntityTypeConfiguration<PaymentInstructionRow>
{
    public void Configure(EntityTypeBuilder<PaymentInstructionRow> builder)
    {
        builder.ToTable("payment_instructions");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.IdempotencyKey).IsUnique();
        builder.HasIndex(x => x.ObligationId);
        builder.HasIndex(x => new { x.Status, x.UpdatedAtUtc, x.Id });
        builder.Property(x => x.BeneficiaryId).HasMaxLength(256).IsRequired();
        builder.Property(x => x.AmountRial).HasColumnType("numeric").IsRequired();
        builder.Property(x => x.IdempotencyKey).HasMaxLength(256).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(64).IsRequired();
    }
}

public sealed class FrozenPrincipalRowConfiguration : IEntityTypeConfiguration<FrozenPrincipalRow>
{
    public void Configure(EntityTypeBuilder<FrozenPrincipalRow> builder)
    {
        builder.ToTable("frozen_principals");
        builder.HasKey(x => x.ContractId);
        builder.Property(x => x.BankId).HasMaxLength(128).IsRequired();
        builder.Property(x => x.AmountRial).HasColumnType("numeric").IsRequired();
        builder.Property(x => x.FundReference).HasMaxLength(256).IsRequired();
    }
}

public sealed class OutboxMessageRowConfiguration : IEntityTypeConfiguration<OutboxMessageRow>
{
    public void Configure(EntityTypeBuilder<OutboxMessageRow> builder)
    {
        builder.ToTable("outbox_messages");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.ProcessedAtUtc, x.OccurredAtUtc, x.Id });
        builder.Property(x => x.Type).HasMaxLength(256).IsRequired();
        builder.Property(x => x.PayloadJson).HasColumnType("jsonb").IsRequired();
        builder.Property(x => x.LastError).HasColumnType("text");
    }
}
