using System.Net;
using System.Text.Json;
using Charkhoone.Api.Release;
using Charkhoone.Api.Security;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class ApiSecurityIntegrationTests
{
    [Fact]
    public void SecurityOptions_DefaultToConservativeOperationalLimits()
    {
        var configuration = new ConfigurationBuilder().Build();

        var options = ApiSecurityOptions.FromConfiguration(configuration);

        Assert.Equal(30, options.PermitLimit);
        Assert.Equal(60, options.WindowSeconds);
    }

    [Fact]
    public void SecurityOptions_ClampConfiguredBounds()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Security:RateLimits:SensitiveMutation:PermitLimit"] = "0",
                ["Security:RateLimits:SensitiveMutation:WindowSeconds"] = "99999",
            })
            .Build();

        var options = ApiSecurityOptions.FromConfiguration(configuration);

        Assert.Equal(1, options.PermitLimit);
        Assert.Equal(3600, options.WindowSeconds);
    }

    [Fact]
    public async Task ApiResponses_UseNoStoreAndDefensiveHeaders()
    {
        await using var factory = new DevelopmentFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1");

        response.EnsureSuccessStatusCode();
        AssertHeader(response, "X-Content-Type-Options", "nosniff");
        AssertHeader(response, "X-Frame-Options", "DENY");
        AssertHeader(response, "Referrer-Policy", "no-referrer");
        AssertHeaderContains(response, "Cache-Control", "no-store");
        AssertHeaderContains(response, "Pragma", "no-cache");
    }

    [Fact]
    public async Task ApiResponses_ExposeNormalizedConfiguredReleaseGitSha()
    {
        const string configuredSha = "ABCDEF0123456789ABCDEF0123456789ABCDEF01";
        const string expectedSha = "abcdef0123456789abcdef0123456789abcdef01";

        await using var factory = new ReleaseIdentityFactory(configuredSha);
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1");

        response.EnsureSuccessStatusCode();
        AssertHeader(response, ReleaseIdentity.HeaderName, expectedSha);
    }

    [Fact]
    public void ReleaseIdentity_RejectsNonFullGitSha()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                [ReleaseIdentity.ConfigurationKey] = "not-a-full-sha",
            })
            .Build();

        Assert.Throws<InvalidOperationException>(() => ReleaseIdentity.Resolve(configuration));
    }

    [Fact]
    public async Task SensitiveMutation_ReturnsProblemDetailsAfterRateLimitIsExhausted()
    {
        await using var factory = new LowRateLimitFactory();
        using var client = factory.CreateClient();

        var first = await client.PostAsync("/api/v1/credit-applications", content: null);
        var second = await client.PostAsync("/api/v1/credit-applications", content: null);
        var rejected = await client.PostAsync("/api/v1/credit-applications", content: null);

        Assert.Equal(HttpStatusCode.Unauthorized, first.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, second.StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, rejected.StatusCode);
        Assert.Equal("application/problem+json", rejected.Content.Headers.ContentType?.MediaType);

        using var document = JsonDocument.Parse(await rejected.Content.ReadAsStringAsync());
        Assert.Equal("rate_limit_exceeded", document.RootElement.GetProperty("code").GetString());
        Assert.Equal(429, document.RootElement.GetProperty("status").GetInt32());
    }

    private static void AssertHeader(HttpResponseMessage response, string name, string expected)
    {
        Assert.True(response.Headers.TryGetValues(name, out var values));
        Assert.Contains(expected, values);
    }

    private static void AssertHeaderContains(HttpResponseMessage response, string name, string expected)
    {
        Assert.True(response.Headers.TryGetValues(name, out var values));
        Assert.Contains(values, value => value.Contains(expected, StringComparison.OrdinalIgnoreCase));
    }

    private class DevelopmentFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.UseSetting(
                "ConnectionStrings:Postgres",
                Environment.GetEnvironmentVariable("CHARKHOONE_INTEGRATION_POSTGRES")
                ?? "Host=localhost;Port=5432;Database=charkhoone_integration;Username=postgres;Password=postgres");
        }
    }

    private sealed class ReleaseIdentityFactory(string gitSha) : DevelopmentFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseSetting(ReleaseIdentity.ConfigurationKey, gitSha);
        }
    }

    private sealed class LowRateLimitFactory : DevelopmentFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseSetting("Security:RateLimits:SensitiveMutation:PermitLimit", "2");
            builder.UseSetting("Security:RateLimits:SensitiveMutation:WindowSeconds", "3600");
        }
    }
}
