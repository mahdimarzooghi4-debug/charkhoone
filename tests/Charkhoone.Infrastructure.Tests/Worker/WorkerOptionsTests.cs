using Charkhoone.Worker;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Charkhoone.Infrastructure.Tests.Worker;

public sealed class WorkerOptionsTests
{
    [Fact]
    public void FinancialReconciliation_DefaultsToDisabledAndBoundedBatch()
    {
        var configuration = new ConfigurationBuilder().Build();

        var options = FinancialReconciliationWorkerOptions.FromConfiguration(configuration);

        Assert.False(options.Enabled);
        Assert.Equal(30000, options.PollMilliseconds);
        Assert.Equal(32, options.BatchSize);
    }

    [Fact]
    public void FinancialReconciliation_ParsesAndClampsOperationalBounds()
    {
        var configuration = Build(new Dictionary<string, string?>
        {
            ["FinancialReconciliation:Enabled"] = "true",
            ["FinancialReconciliation:PollMilliseconds"] = "250",
            ["FinancialReconciliation:BatchSize"] = "900",
        });

        var options = FinancialReconciliationWorkerOptions.FromConfiguration(configuration);

        Assert.True(options.Enabled);
        Assert.Equal(1000, options.PollMilliseconds);
        Assert.Equal(500, options.BatchSize);
    }

    [Fact]
    public void RabbitMq_ParsesReviewQueueAndMaximumDeliveryAttempts()
    {
        var configuration = Build(new Dictionary<string, string?>
        {
            ["RabbitMq:IdentityReviewQueue"] = "review.identity",
            ["RabbitMq:MaxDeliveryAttempts"] = "7",
        });

        var options = RabbitMqWorkerOptions.FromConfiguration(configuration);

        Assert.Equal("review.identity", options.IdentityReviewQueue);
        Assert.Equal(7, options.MaxDeliveryAttempts);
    }

    [Fact]
    public void RabbitMq_ParsesCancellationNotificationQueues()
    {
        var configuration = Build(new Dictionary<string, string?>
        {
            ["RabbitMq:CancellationNotificationQueue"] = "notifications.cancellation",
            ["RabbitMq:CancellationNotificationReviewQueue"] = "notifications.cancellation.review",
        });

        var options = RabbitMqWorkerOptions.FromConfiguration(configuration);

        Assert.Equal("notifications.cancellation", options.CancellationNotificationQueue);
        Assert.Equal(
            "notifications.cancellation.review",
            options.CancellationNotificationReviewQueue);
    }

    [Fact]
    public void RabbitMq_ParsesNormalSettlementNotificationQueues()
    {
        var configuration = Build(new Dictionary<string, string?>
        {
            ["RabbitMq:NormalSettlementNotificationQueue"] = "notifications.normal-settlement",
            ["RabbitMq:NormalSettlementNotificationReviewQueue"] = "notifications.normal-settlement.review",
        });

        var options = RabbitMqWorkerOptions.FromConfiguration(configuration);

        Assert.Equal(
            "notifications.normal-settlement",
            options.NormalSettlementNotificationQueue);
        Assert.Equal(
            "notifications.normal-settlement.review",
            options.NormalSettlementNotificationReviewQueue);
    }

    [Fact]
    public void RabbitMq_MaxDeliveryAttemptsIsNeverZero()
    {
        var configuration = Build(new Dictionary<string, string?>
        {
            ["RabbitMq:MaxDeliveryAttempts"] = "0",
        });

        var options = RabbitMqWorkerOptions.FromConfiguration(configuration);

        Assert.Equal(1, options.MaxDeliveryAttempts);
    }

    private static IConfiguration Build(IReadOnlyDictionary<string, string?> values) =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(values)
            .Build();
}
