using Charkhoone.Application.CreditApplications;
using Charkhoone.Infrastructure.CreditApplications;
using Charkhoone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Charkhoone.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Postgres");

        if (!string.IsNullOrWhiteSpace(connectionString))
        {
            services.AddDbContext<CharkhooneDbContext>(options =>
                options.UseNpgsql(connectionString));
        }

        services.AddScoped<IUserIdentityLookup, EfUserIdentityLookup>();
        services.AddScoped<ICreditApplicationService, EfCreditApplicationService>();

        return services;
    }
}
