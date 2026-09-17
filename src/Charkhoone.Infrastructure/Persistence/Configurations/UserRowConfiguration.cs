using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Charkhoone.Infrastructure.Persistence.Configurations;

public sealed class UserRowConfiguration : IEntityTypeConfiguration<UserRow>
{
    public void Configure(EntityTypeBuilder<UserRow> builder)
    {
        builder.ToTable("users");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.OidcSubject).IsUnique();
        builder.Property(x => x.OidcSubject).HasMaxLength(256).IsRequired();
    }
}
