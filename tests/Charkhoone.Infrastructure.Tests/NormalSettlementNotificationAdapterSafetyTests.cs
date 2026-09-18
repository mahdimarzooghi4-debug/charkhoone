using Charkhoone.Application.Payments;
using Charkhoone.Infrastructure.Payments;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Charkhoone.Infrastructure.Tests;

public sealed class NormalSettlementNotificationAdapterSafetyTests
{
    [Fact]
    public void ProductionLikeConfiguration_RejectsNormalSettlementNotificationDevelopmentMock()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ExternalAdapters:NormalSettlementNotification:Mode"] = "DevelopmentMock",
            })
            .Build();

        Assert.Throws<InvalidOperationException>(() =>
            DependencyInjection.ValidateExternalAdapterModes(
                configuration,
                allowDevelopmentMocks: false));
    }

    [Fact]
    public void DefaultConfiguration_RegistersUnavailableNormalSettlementNotificationAdapter()
    {
        var configuration = new ConfigurationBuilder().Build();
        var services = new ServiceCollection();

        services.AddInfrastructure(configuration, allowDevelopmentMocks: false);

        using var provider = services.BuildServiceProvider();
        var adapter = provider.GetRequiredService<IExternalNormalSettlementNotificationAdapter>();

        Assert.IsType<UnavailableNormalSettlementNotificationAdapter>(adapter);
    }
}
