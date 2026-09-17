using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Charkhoone.Infrastructure.Persistence.Configurations;

public sealed class AuditEventRowConfiguration : IEntityTypeConfiguration<AuditEventRow>
{
    public void Configure(EntityTypeBuilder<AuditEventRow> builder)
    {
        builder.ToTable("audit_events");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.AggregateType, x.AggregateId, x.OccurredAtUtc, x.Id });
        builder.HasIndex(x => new { x.AggregateType, x.AggregateId, x.Action, x.OccurredAtUtc, x.Id });
        builder.Property(x => x.AggregateType).HasMaxLength(64).IsRequired();
        builder.Property(x => x.ActorId).HasMaxLength(256).IsRequired();
        builder.Property(x => x.Action).HasMaxLength(128).IsRequired();
        builder.Property(x => x.Reason).HasColumnType("text").IsRequired();
    }
}