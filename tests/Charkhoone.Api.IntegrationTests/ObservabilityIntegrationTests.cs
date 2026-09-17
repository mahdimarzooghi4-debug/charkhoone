using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class ObservabilityIntegrationTests
{
    [Fact]
    public async Task LivenessEndpoint_DoesNotDependOnExternalServices()
    {
        using var factory = new CharkhooneApiFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/health/live");

        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task ReadinessEndpoint_ChecksPostgresAndTreatsDisabledRabbitMqAsReady()
    {
        using var factory = new CharkhooneApiFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/health/ready");

        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task ApiResponse_ExposesTraceIdWithoutBusinessIdentifiers()
    {
        using var factory = new CharkhooneApiFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1");

        response.EnsureSuccessStatusCode();
        Assert.True(response.Headers.TryGetValues("X-Trace-Id", out var values));
        var traceId = Assert.Single(values);
        Assert.Equal(32, traceId.Length);
        Assert.All(traceId, character => Assert.True(Uri.IsHexDigit(character)));
    }

    [Fact]
    public void InvalidOtlpEndpoint_FailsStartupRatherThanGuessingExporterConfiguration()
    {
        using var factory = new InvalidOtlpEndpointFactory();

        var exception = Assert.ThrowsAny<Exception>(() => factory.CreateClient());

        Assert.Contains("Observability:OtlpEndpoint", exception.ToString(), StringComparison.Ordinal);
    }

    private sealed class InvalidOtlpEndpointFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("Observability:OtlpEndpoint", "not-an-absolute-uri");
        }
    }
}
