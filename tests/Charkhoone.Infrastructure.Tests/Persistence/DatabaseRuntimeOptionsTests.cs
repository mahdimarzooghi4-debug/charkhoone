using Charkhoone.Infrastructure.Persistence;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Charkhoone.Infrastructure.Tests.Persistence;

public sealed class DatabaseRuntimeOptionsTests
{
    private const string BaseConnectionString =
        "Host=localhost;Database=charkhoone;Username=app;Password=test-only";

    [Fact]
    public void FromConfiguration_PreservesExplicitConnectionStringRuntimeValues()
    {
        var configuration = new ConfigurationManager();
        var connectionString = BaseConnectionString
            + ";Timeout=20;Command Timeout=40;Cancellation Timeout=2500"
            + ";Minimum Pool Size=3;Maximum Pool Size=17"
            + ";Connection Idle Lifetime=600;Connection Pruning Interval=15"
            + ";Connection Lifetime=1200;Keepalive=10";

        var options = DatabaseRuntimeOptions.FromConfiguration(configuration, connectionString);

        Assert.Equal(20, options.ConnectionTimeoutSeconds);
        Assert.Equal(40, options.CommandTimeoutSeconds);
        Assert.Equal(2500, options.CancellationTimeoutMilliseconds);
        Assert.Equal(3, options.MinimumPoolSize);
        Assert.Equal(17, options.MaximumPoolSize);
        Assert.Equal(600, options.ConnectionIdleLifetimeSeconds);
        Assert.Equal(15, options.ConnectionPruningIntervalSeconds);
        Assert.Equal(1200, options.ConnectionLifetimeSeconds);
        Assert.Equal(10, options.KeepAliveSeconds);
    }

    [Fact]
    public void ConfigurationOverridesRuntimeValuesAndApplyAddsStableApplicationName()
    {
        var configuration = new ConfigurationManager
        {
            ["Database:Runtime:ConnectionTimeoutSeconds"] = "11",
            ["Database:Runtime:CommandTimeoutSeconds"] = "45",
            ["Database:Runtime:CancellationTimeoutMilliseconds"] = "1500",
            ["Database:Runtime:MinimumPoolSize"] = "2",
            ["Database:Runtime:MaximumPoolSize"] = "30",
            ["Database:Runtime:ConnectionIdleLifetimeSeconds"] = "240",
            ["Database:Runtime:ConnectionPruningIntervalSeconds"] = "12",
            ["Database:Runtime:ConnectionLifetimeSeconds"] = "1800",
            ["Database:Runtime:KeepAliveSeconds"] = "20",
        };

        var options = DatabaseRuntimeOptions.FromConfiguration(configuration, BaseConnectionString);
        var applied = options.ApplyTo(BaseConnectionString, "Charkhoone.Api.Postgres");

        Assert.Equal(11, applied.Timeout);
        Assert.Equal(45, applied.CommandTimeout);
        Assert.Equal(1500, applied.CancellationTimeout);
        Assert.Equal(2, applied.MinPoolSize);
        Assert.Equal(30, applied.MaxPoolSize);
        Assert.Equal(240, applied.ConnectionIdleLifetime);
        Assert.Equal(12, applied.ConnectionPruningInterval);
        Assert.Equal(1800, applied.ConnectionLifetime);
        Assert.Equal(20, applied.KeepAlive);
        Assert.Equal("Charkhoone.Api.Postgres", applied.ApplicationName);
        Assert.False(applied.NoResetOnClose);
    }

    [Fact]
    public void ExistingApplicationNameIsPreserved()
    {
        var configuration = new ConfigurationManager();
        var options = DatabaseRuntimeOptions.FromConfiguration(
            configuration,
            BaseConnectionString + ";Application Name=deployment-specific");

        var applied = options.ApplyTo(
            BaseConnectionString + ";Application Name=deployment-specific",
            "Charkhoone.Api.Postgres");

        Assert.Equal("deployment-specific", applied.ApplicationName);
    }

    [Fact]
    public void MinimumPoolCannotExceedMaximumPool()
    {
        var configuration = new ConfigurationManager
        {
            ["Database:Runtime:MinimumPoolSize"] = "20",
            ["Database:Runtime:MaximumPoolSize"] = "10",
        };

        var exception = Assert.Throws<InvalidOperationException>(() =>
            DatabaseRuntimeOptions.FromConfiguration(configuration, BaseConnectionString));

        Assert.Contains("MinimumPoolSize", exception.Message, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("CommandTimeoutSeconds", "0")]
    [InlineData("ConnectionTimeoutSeconds", "0")]
    [InlineData("MaximumPoolSize", "0")]
    [InlineData("CancellationTimeoutMilliseconds", "0")]
    public void UnsafeOrUnboundedValuesAreRejected(string setting, string value)
    {
        var configuration = new ConfigurationManager
        {
            [$"Database:Runtime:{setting}"] = value,
        };

        Assert.Throws<InvalidOperationException>(() =>
            DatabaseRuntimeOptions.FromConfiguration(configuration, BaseConnectionString));
    }

    [Fact]
    public void NoResetOnCloseIsRejected()
    {
        var configuration = new ConfigurationManager();

        var exception = Assert.Throws<InvalidOperationException>(() =>
            DatabaseRuntimeOptions.FromConfiguration(
                configuration,
                BaseConnectionString + ";No Reset On Close=true"));

        Assert.Contains("No Reset On Close", exception.Message, StringComparison.Ordinal);
    }
}
