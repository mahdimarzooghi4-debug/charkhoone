using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Infrastructure.Persistence;

public sealed class CharkhooneDbContext(DbContextOptions<CharkhooneDbContext> options)
    : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CharkhooneDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
