using Charkhoone.Application.CreditApplications;
using Charkhoone.Application.CreditEligibility;
using Charkhoone.Application.IdentityVerification;
using Charkhoone.Infrastructure.CreditApplications;
using Charkhoone.Infrastructure.CreditEligibility;
using Charkhoone.Infrastructure.IdentityVerification;
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
        services.AddScoped<ICreditApplicationIdentityService, EfCreditApplicationIdentityService>();
        services.AddScoped<ICreditEligibilityService, EfCreditEligibilityService>();

        var identityAdapterMode = configuration["ExternalAdapters:Identity:Mode"];
        if (string.Equals(identityAdapterMode, "DevelopmentMock", StringComparison.OrdinalIgnoreCase))
        {
            services.AddSingleton<IIdentityVerificationAdapter, DevelopmentIdentityVerificationAdapter>();
        }
        else
        {
            services.AddSingleton<IIdentityVerificationAdapter, UnavailableIdentityVerificationAdapter>();
        }

        var creditGradeAdapterMode = configuration["ExternalAdapters:CreditGrade:Mode"];
        if (string.Equals(creditGradeAdapterMode, "DevelopmentMock", StringComparison.OrdinalIgnoreCase))
        {
            services.AddSingleton<IExternalCreditGradeAdapter, DevelopmentExternalCreditGradeAdapter>();
        }
        else
        {
            services.AddSingleton<IExternalCreditGradeAdapter, UnavailableExternalCreditGradeAdapter>();
        }

        return services;
    }
}
