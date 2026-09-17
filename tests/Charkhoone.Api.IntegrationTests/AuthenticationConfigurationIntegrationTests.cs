using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class AuthenticationConfigurationIntegrationTests
{
    [Fact]
    public void ProductionStartup_RequiresAuthority()
    {
        using var factory = new ProductionAuthenticationFactory(
            authority: null,
            audience: "charkhoone-api");

        var exception = Assert.ThrowsAny<Exception>(() => factory.CreateClient());

        Assert.Contains("Authentication:Authority", exception.ToString(), StringComparison.Ordinal);
    }

    [Fact]
    public void ProductionStartup_RequiresAudience()
    {
        using var factory = new ProductionAuthenticationFactory(
            authority: "https://identity.example.test/realms/charkhoone",
            audience: null);

        var exception = Assert.ThrowsAny<Exception>(() => factory.CreateClient());

        Assert.Contains("Authentication:Audience", exception.ToString(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task ProductionStartup_WithAuthorityAndAudience_ExposesHealthEndpoint()
    {
        using var factory = new ProductionAuthenticationFactory(
            authority: "https://identity.example.test/realms/charkhoone",
            audience: "charkhoone-api");
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        response.EnsureSuccessStatusCode();
    }

    private sealed class ProductionAuthenticationFactory(
        string? authority,
        string? audience)
        : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Production");
            builder.UseSetting("Authentication:Authority", authority);
            builder.UseSetting("Authentication:Audience", audience);
        }
    }
}
