using Charkhoone.Application.Payments;
using Charkhoone.Infrastructure.Payments;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Charkhoone.Infrastructure.Tests;

public sealed class CancellationNotificationAdapterSafetyTests
{
    [Fact]
    public void ProductionLikeConfiguration_RejectsCancellationNotificationDevelopmentMock()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ExternalAdapters:CancellationNotification:Mode"] = "DevelopmentMock",
            })
            .Build();

        Assert.Throws<InvalidOperationException>(() =>
            DependencyInjection.ValidateExternalAdapterModes(
                configuration,
                allowDevelopmentMocks: false));
    }

    [Fact]
    public void DefaultConfiguration_RegistersUnavailableCancellationNotificationAdapter()
    {
        var configuration = new ConfigurationBuilder().Build();
        var services = new ServiceCollection();

        services.AddInfrastructure(configuration, allowDevelopmentMocks: false);

        using var provider = services.BuildServiceProvider();
        var adapter = provider.GetRequiredService<IExternalCancellationNotificationAdapter>();

        Assert.IsType<UnavailableCancellationNotificationAdapter>(adapter);
    }
}
