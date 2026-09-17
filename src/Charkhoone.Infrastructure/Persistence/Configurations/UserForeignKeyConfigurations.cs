using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Charkhoone.Infrastructure.Persistence.Configurations;

public sealed class CreditApplicationUserConfiguration : IEntityTypeConfiguration<CreditApplicationRow>
{
    public void Configure(EntityTypeBuilder<CreditApplicationRow> builder)
    {
        builder.HasOne<UserRow>()
            .WithMany()
            .HasForeignKey(x => x.ApplicantUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class LeaseContractUserConfiguration : IEntityTypeConfiguration<LeaseContractRow>
{
    public void Configure(EntityTypeBuilder<LeaseContractRow> builder)
    {
        builder.HasOne<UserRow>()
            .WithMany()
            .HasForeignKey(x => x.TenantUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<UserRow>()
            .WithMany()
            .HasForeignKey(x => x.OwnerUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
