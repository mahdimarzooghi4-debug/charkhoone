using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Charkhoone.Infrastructure.Persistence.Configurations;

public sealed class InboxMessageRowConfiguration : IEntityTypeConfiguration<InboxMessageRow>
{
    public void Configure(EntityTypeBuilder<InboxMessageRow> builder)
    {
        builder.ToTable("inbox_messages");
        builder.HasKey(x => x.MessageId);
        builder.HasIndex(x => x.ProcessedAtUtc);
        builder.Property(x => x.Type).HasMaxLength(256).IsRequired();
        builder.Property(x => x.LastError).HasColumnType("text");
    }
}
