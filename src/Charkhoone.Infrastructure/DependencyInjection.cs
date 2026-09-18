using Charkhoone.Application.BankFunding;
using Charkhoone.Application.Contracts;
using Charkhoone.Application.CreditApplications;
using Charkhoone.Application.CreditEligibility;
using Charkhoone.Application.IdentityVerification;
using Charkhoone.Application.Mobile;
using Charkhoone.Application.Payments;
using Charkhoone.Application.PilotOperations;
using Charkhoone.Application.TenantContributionFunding;
using Charkhoone.Infrastructure.BankFunding;
using Charkhoone.Infrastructure.Contracts;
using Charkhoone.Infrastructure.CreditApplications;
using Charkhoone.Infrastructure.CreditEligibility;
using Charkhoone.Infrastructure.IdentityVerification;
using Charkhoone.Infrastructure.Mobile;
using Charkhoone.Infrastructure.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.PilotOperations;
using Charkhoone.Infrastructure.Persistence.Interceptors;
using Charkhoone.Infrastructure.TenantContributionFunding;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace Charkhoone.Infrastructure;

public static class DependencyInjection
{
    private static readonly string[] ExternalAdapterNames =
    [
        "Identity",
        "PropertyContract",
        "CreditGrade",
        "BankApproval",
        "Fund",
        "Payment",
        "Coverage",
        "ArrearsRepayment",
        "CancellationSettlement",
        "CancellationNotification",
        "NormalSettlementBank",
        "NormalSettlementTenant",
        "NormalSettlementNotification",
    ];

    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration,
        bool allowDevelopmentMocks = false,
        string databasePoolName = "Charkhoone.Postgres")
    {
        ValidateExternalAdapterModes(configuration, allowDevelopmentMocks);

        var connectionString = configuration.GetConnectionString("Postgres");
        services.AddScoped<LostFundReturnTrackingInterceptor>();

        if (!string.IsNullOrWhiteSpace(connectionString))
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(databasePoolName);
            var databaseRuntimeOptions = DatabaseRuntimeOptions.FromConfiguration(configuration, connectionString);
            var runtimeConnectionString = databaseRuntimeOptions
                .ApplyTo(connectionString, databasePoolName)
                .ConnectionString;

            services.AddSingleton(databaseRuntimeOptions);
            services.AddSingleton<NpgsqlDataSource>(_ =>
            {
                var dataSourceBuilder = new NpgsqlDataSourceBuilder(runtimeConnectionString)
                {
                    Name = databasePoolName.Trim(),
                };
                return dataSourceBuilder.Build();
            });
            services.AddDbContext<CharkhooneDbContext>((provider, options) =>
                options
                    .UseNpgsql(
                        provider.GetRequiredService<NpgsqlDataSource>(),
                        npgsql => npgsql.CommandTimeout(databaseRuntimeOptions.CommandTimeoutSeconds))
                    .AddInterceptors(provider.GetRequiredService<LostFundReturnTrackingInterceptor>()));
        }

        services.AddScoped<IUserIdentityLookup, EfUserIdentityLookup>();
        services.AddScoped<IMobileBootstrapService, EfMobileBootstrapService>();
        services.AddScoped<IContractReadService, EfContractReadService>();
        services.AddScoped<ILeaseContractTermsService, EfLeaseContractTermsService>();
        services.AddScoped<IPropertyContractRegistrationService, EfPropertyContractRegistrationService>();
        services.AddScoped<ILeaseFundingLifecycleService, EfLeaseFundingLifecycleService>();
        services.AddScoped<INormalMaturityService, EfNormalMaturityService>();
        services.AddScoped<ICreditApplicationService, EfCreditApplicationService>();
        services.AddScoped<IBankLoanPlanReadService, EfBankLoanPlanReadService>();
        services.AddScoped<ICreditApplicationIdentityService, EfCreditApplicationIdentityService>();
        services.AddScoped<ICreditEligibilityService, EfCreditEligibilityService>();
        services.AddScoped<IBankFundingService, EfBankFundingService>();
        services.AddScoped<ITenantContributionFundingService, EfTenantContributionFundingService>();
        services.AddScoped<EfPaymentService>();
        services.AddScoped<IPaymentReconciliationService>(provider => provider.GetRequiredService<EfPaymentService>());
        services.AddScoped<IMonthlyObligationService>(provider => provider.GetRequiredService<EfPaymentService>());
        services.AddScoped<IMonthlyScheduleProvisioningService, EfMonthlyScheduleProvisioningService>();
        services.AddScoped<IMonthlyDueLifecycleService, EfMonthlyDueLifecycleService>();
        services.AddScoped<ITenantContributionCoverageService, EfTenantContributionCoverageService>();
        services.AddScoped<ITenantArrearsRepaymentService, EfTenantArrearsRepaymentService>();
        services.AddScoped<ICancellationSettlementService, EfCancellationSettlementService>();
        services.AddScoped<ICancellationBankPrincipalSettlementService, EfCancellationBankPrincipalSettlementService>();
        services.AddScoped<INormalSettlementService, EfNormalSettlementService>();
        services.AddScoped<IPilotOperationsService, EfPilotOperationsService>();

        var identityAdapterMode = configuration["ExternalAdapters:Identity:Mode"];
        if (IsDevelopmentMock(identityAdapterMode))
        {
            services.AddSingleton<IIdentityVerificationAdapter, DevelopmentIdentityVerificationAdapter>();
        }
        else
        {
            services.AddSingleton<IIdentityVerificationAdapter, UnavailableIdentityVerificationAdapter>();
        }

        var propertyContractAdapterMode = configuration["ExternalAdapters:PropertyContract:Mode"];
        if (IsDevelopmentMock(propertyContractAdapterMode))
        {
            services.AddSingleton<IExternalPropertyContractEvidenceAdapter, DevelopmentPropertyContractEvidenceAdapter>();
        }
        else
        {
            services.AddSingleton<IExternalPropertyContractEvidenceAdapter, UnavailablePropertyContractEvidenceAdapter>();
        }

        var creditGradeAdapterMode = configuration["ExternalAdapters:CreditGrade:Mode"];
        if (IsDevelopmentMock(creditGradeAdapterMode))
        {
            services.AddSingleton<IExternalCreditGradeAdapter, DevelopmentExternalCreditGradeAdapter>();
        }
        else
        {
            services.AddSingleton<IExternalCreditGradeAdapter, UnavailableExternalCreditGradeAdapter>();
        }

        var bankApprovalAdapterMode = configuration["ExternalAdapters:BankApproval:Mode"];
        if (IsDevelopmentMock(bankApprovalAdapterMode))
        {
            services.AddSingleton<IExternalBankApprovalAdapter, DevelopmentBankApprovalAdapter>();
        }
        else
        {
            services.AddSingleton<IExternalBankApprovalAdapter, UnavailableBankApprovalAdapter>();
        }

        var fundAdapterMode = configuration["ExternalAdapters:Fund:Mode"];
        if (IsDevelopmentMock(fundAdapterMode))
        {
            services.AddSingleton<IExternalFundAdapter, DevelopmentFundAdapter>();
        }
        else
        {
            services.AddSingleton<IExternalFundAdapter, UnavailableFundAdapter>();
        }

        var paymentAdapterMode = configuration["ExternalAdapters:Payment:Mode"];
        if (IsDevelopmentMock(paymentAdapterMode))
        {
            services.AddSingleton<IExternalPaymentReconciliationAdapter, DevelopmentPaymentReconciliationAdapter>();
        }
        else
        {
            services.AddSingleton<IExternalPaymentReconciliationAdapter, UnavailablePaymentReconciliationAdapter>();
        }

        var coverageAdapterMode = configuration["ExternalAdapters:Coverage:Mode"];
        if (IsDevelopmentMock(coverageAdapterMode))
        {
            services.AddSingleton<IExternalCoverageTransferAdapter, DevelopmentCoverageTransferAdapter>();
        }
        else
        {
            services.AddSingleton<IExternalCoverageTransferAdapter, UnavailableCoverageTransferAdapter>();
        }

        var arrearsRepaymentAdapterMode = configuration["ExternalAdapters:ArrearsRepayment:Mode"];
        if (IsDevelopmentMock(arrearsRepaymentAdapterMode))
        {
            services.AddSingleton<IExternalTenantArrearsRepaymentAdapter, DevelopmentTenantArrearsRepaymentAdapter>();
        }
        else
        {
            services.AddSingleton<IExternalTenantArrearsRepaymentAdapter, UnavailableTenantArrearsRepaymentAdapter>();
        }

        var cancellationSettlementAdapterMode = configuration["ExternalAdapters:CancellationSettlement:Mode"];
        if (IsDevelopmentMock(cancellationSettlementAdapterMode))
        {
            services.AddSingleton<IExternalOwnerResidualTransferAdapter, DevelopmentOwnerResidualTransferAdapter>();
        }
        else
        {
            services.AddSingleton<IExternalOwnerResidualTransferAdapter, UnavailableOwnerResidualTransferAdapter>();
        }

        var cancellationNotificationMode = configuration["ExternalAdapters:CancellationNotification:Mode"];
        if (IsDevelopmentMock(cancellationNotificationMode))
        {
            services.AddSingleton<IExternalCancellationNotificationAdapter, DevelopmentCancellationNotificationAdapter>();
        }
        else
        {
            services.AddSingleton<IExternalCancellationNotificationAdapter, UnavailableCancellationNotificationAdapter>();
        }

        var normalSettlementBankMode = configuration["ExternalAdapters:NormalSettlementBank:Mode"];
        if (IsDevelopmentMock(normalSettlementBankMode))
        {
            services.AddSingleton<IExternalBankPrincipalReturnAdapter, DevelopmentBankPrincipalReturnAdapter>();
        }
        else
        {
            services.AddSingleton<IExternalBankPrincipalReturnAdapter, UnavailableBankPrincipalReturnAdapter>();
        }

        var normalSettlementTenantMode = configuration["ExternalAdapters:NormalSettlementTenant:Mode"];
        if (IsDevelopmentMock(normalSettlementTenantMode))
        {
            services.AddSingleton<IExternalTenantResidualReturnAdapter, DevelopmentTenantResidualReturnAdapter>();
        }
        else
        {
            services.AddSingleton<IExternalTenantResidualReturnAdapter, UnavailableTenantResidualReturnAdapter>();
        }

        var normalSettlementNotificationMode = configuration["ExternalAdapters:NormalSettlementNotification:Mode"];
        if (IsDevelopmentMock(normalSettlementNotificationMode))
        {
            services.AddSingleton<IExternalNormalSettlementNotificationAdapter, DevelopmentNormalSettlementNotificationAdapter>();
        }
        else
        {
            services.AddSingleton<IExternalNormalSettlementNotificationAdapter, UnavailableNormalSettlementNotificationAdapter>();
        }

        return services;
    }

    public static void ValidateExternalAdapterModes(
        IConfiguration configuration,
        bool allowDevelopmentMocks)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        if (allowDevelopmentMocks)
        {
            return;
        }

        foreach (var adapterName in ExternalAdapterNames)
        {
            var key = $"ExternalAdapters:{adapterName}:Mode";
            if (IsDevelopmentMock(configuration[key]))
            {
                throw new InvalidOperationException(
                    $"{key}=DevelopmentMock is allowed only in the Development environment.");
            }
        }
    }

    private static bool IsDevelopmentMock(string? mode) =>
        string.Equals(mode?.Trim(), "DevelopmentMock", StringComparison.OrdinalIgnoreCase);
}
