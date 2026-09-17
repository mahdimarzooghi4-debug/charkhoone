using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
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
    public void ProductionStartup_RejectsNonHttpsAuthority()
    {
        using var factory = new ProductionAuthenticationFactory(
            authority: "http://identity.example.test/realms/charkhoone",
            audience: "charkhoone-api");

        var exception = Assert.ThrowsAny<Exception>(() => factory.CreateClient());

        Assert.Contains("absolute HTTPS URI", exception.ToString(), StringComparison.Ordinal);
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

    [Theory]
    [InlineData("Identity")]
    [InlineData("CreditGrade")]
    [InlineData("BankApproval")]
    [InlineData("Fund")]
    [InlineData("Payment")]
    [InlineData("Coverage")]
    [InlineData("CancellationSettlement")]
    [InlineData("NormalSettlementBank")]
    [InlineData("NormalSettlementTenant")]
    public void ProductionStartup_RejectsDevelopmentMockAdapters(string adapterName)
    {
        using var factory = new ProductionAuthenticationFactory(
            authority: "https://identity.example.test/realms/charkhoone",
            audience: "charkhoone-api",
            adapterName: adapterName,
            adapterMode: "DevelopmentMock");

        var exception = Assert.ThrowsAny<Exception>(() => factory.CreateClient());

        Assert.Contains(
            $"ExternalAdapters:{adapterName}:Mode=DevelopmentMock",
            exception.ToString(),
            StringComparison.Ordinal);
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

    [Fact]
    public void JwtBearer_PreservesStandardOidcClaimNames()
    {
        using var factory = new ProductionAuthenticationFactory(
            authority: "https://identity.example.test/realms/charkhoone",
            audience: "charkhoone-api");

        _ = factory.Server;
        var options = factory.Services
            .GetRequiredService<IOptionsMonitor<JwtBearerOptions>>()
            .Get(JwtBearerDefaults.AuthenticationScheme);

        Assert.False(options.MapInboundClaims);
        Assert.True(options.RequireHttpsMetadata);
        Assert.Equal("charkhoone-api", options.Audience);
    }

    [Fact]
    public async Task ApiRoot_IsExplicitlyAnonymousButVersionedEndpointsAreSecureByDefault()
    {
        using var factory = new CharkhooneApiFactory();
        using var client = factory.CreateClient();

        var root = await client.GetAsync("/api/v1");
        var protectedRoute = await client.PostAsync("/api/v1/credit-applications", content: null);

        root.EnsureSuccessStatusCode();
        Assert.Equal(System.Net.HttpStatusCode.Unauthorized, protectedRoute.StatusCode);
    }

    private sealed class ProductionAuthenticationFactory(
        string? authority,
        string? audience,
        string? adapterName = null,
        string? adapterMode = null)
        : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Production");
            builder.UseSetting("Authentication:Authority", authority);
            builder.UseSetting("Authentication:Audience", audience);

            if (!string.IsNullOrWhiteSpace(adapterName))
            {
                builder.UseSetting($"ExternalAdapters:{adapterName}:Mode", adapterMode);
            }
        }
    }
}
