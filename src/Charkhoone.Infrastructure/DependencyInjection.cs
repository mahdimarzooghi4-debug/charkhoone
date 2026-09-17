using Charkhoone.Application.BankFunding;
using Charkhoone.Application.CreditApplications;
using Charkhoone.Application.CreditEligibility;
using Charkhoone.Application.IdentityVerification;
using Charkhoone.Application.Payments;
using Charkhoone.Application.TenantContributionFunding;
using Charkhoone.Infrastructure.BankFunding;
using Charkhoone.Infrastructure.CreditApplications;
using Charkhoone.Infrastructure.CreditEligibility;
using Charkhoone.Infrastructure.IdentityVerification;
using Charkhoone.Infrastructure.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.TenantContributionFunding;
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
        services.AddScoped<IBankFundingService, EfBankFundingService>();
        services.AddScoped<ITenantContributionFundingService, EfTenantContributionFundingService>();
        services.AddScoped<EfPaymentService>();
        services.AddScoped<IPaymentReconciliationService>(provider => provider.GetRequiredService<EfPaymentService>());
        services.AddScoped<IMonthlyObligationService>(provider => provider.GetRequiredService<EfPaymentService>());
        services.AddScoped<ITenantContributionCoverageService, EfTenantContributionCoverageService>();

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

        var bankApprovalAdapterMode = configuration["ExternalAdapters:BankApproval:Mode"];
        if (string.Equals(bankApprovalAdapterMode, "DevelopmentMock", StringComparison.OrdinalIgnoreCase))
        {
            services.AddSingleton<IExternalBankApprovalAdapter, DevelopmentBankApprovalAdapter>();
        }
        else
        {
            services.AddSingleton<IExternalBankApprovalAdapter, UnavailableBankApprovalAdapter>();
        }

        var fundAdapterMode = configuration["ExternalAdapters:Fund:Mode"];
        if (string.Equals(fundAdapterMode, "DevelopmentMock", StringComparison.OrdinalIgnoreCase))
        {
            services.AddSingleton<IExternalFundAdapter, DevelopmentFundAdapter>();
        }
        else
        {
            services.AddSingleton<IExternalFundAdapter, UnavailableFundAdapter>();
        }

        var paymentAdapterMode = configuration["ExternalAdapters:Payment:Mode"];
        if (string.Equals(paymentAdapterMode, "DevelopmentMock", StringComparison.OrdinalIgnoreCase))
        {
            services.AddSingleton<IExternalPaymentReconciliationAdapter, DevelopmentPaymentReconciliationAdapter>();
        }
        else
        {
            services.AddSingleton<IExternalPaymentReconciliationAdapter, UnavailablePaymentReconciliationAdapter>();
        }

        var coverageAdapterMode = configuration["ExternalAdapters:Coverage:Mode"];
        if (string.Equals(coverageAdapterMode, "DevelopmentMock", StringComparison.OrdinalIgnoreCase))
        {
            services.AddSingleton<IExternalCoverageTransferAdapter, DevelopmentCoverageTransferAdapter>();
        }
        else
        {
            services.AddSingleton<IExternalCoverageTransferAdapter, UnavailableCoverageTransferAdapter>();
        }

        return services;
    }
}
