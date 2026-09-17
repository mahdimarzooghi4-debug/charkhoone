using Charkhoone.Worker;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Charkhoone.Infrastructure.Tests.Workers;

public sealed class FinancialReconciliationWorkerOptionsTests
{
    [Fact]
    public void FromConfiguration_DefaultsToDisabled()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection([])
            .Build();

        var options = FinancialReconciliationWorkerOptions.FromConfiguration(configuration);

        Assert.False(options.Enabled);
        Assert.Equal(30000, options.PollMilliseconds);
        Assert.Equal(50, options.BatchSize);
    }

    [Fact]
    public void FromConfiguration_ClampsOperationalBounds()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["FinancialReconciliation:Enabled"] = "true",
                ["FinancialReconciliation:PollMilliseconds"] = "50",
                ["FinancialReconciliation:BatchSize"] = "9999",
            })
            .Build();

        var options = FinancialReconciliationWorkerOptions.FromConfiguration(configuration);

        Assert.True(options.Enabled);
        Assert.Equal(1000, options.PollMilliseconds);
        Assert.Equal(500, options.BatchSize);
    }
}
