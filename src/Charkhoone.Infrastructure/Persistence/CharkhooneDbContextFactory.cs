using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Charkhoone.Infrastructure.Persistence;

public sealed class CharkhooneDbContextFactory : IDesignTimeDbContextFactory<CharkhooneDbContext>
{
    public CharkhooneDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__Postgres");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            connectionString = "Host=localhost;Port=5432;Database=charkhoone;Username=charkhoone;Password=charkhoone_dev";
        }

        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new CharkhooneDbContext(options);
    }
}
