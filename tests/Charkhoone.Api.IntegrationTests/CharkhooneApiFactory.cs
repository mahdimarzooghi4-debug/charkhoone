using System.Security.Claims;
using System.Text.Encodings.Web;
using Charkhoone.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Charkhoone.Api.IntegrationTests;

public sealed class CharkhooneApiFactory : WebApplicationFactory<Program>
{
    public const string TestAuthenticationScheme = "IntegrationTest";

    public string ConnectionString { get; } =
        Environment.GetEnvironmentVariable("CHARKHOONE_INTEGRATION_POSTGRES")
        ?? "Host=localhost;Port=5432;Database=charkhoone_integration;Username=postgres;Password=postgres";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseSetting("ConnectionStrings:Postgres", ConnectionString);
        builder.UseSetting("ExternalAdapters:Payment:Mode", "DevelopmentMock");
        builder.UseSetting("ExternalAdapters:Payment:DevelopmentMock:Result", "Indeterminate");

        builder.ConfigureServices(services =>
        {
            services
                .AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = TestAuthenticationScheme;
                    options.DefaultChallengeScheme = TestAuthenticationScheme;
                    options.DefaultScheme = TestAuthenticationScheme;
                })
                .AddScheme<AuthenticationSchemeOptions, IntegrationTestAuthenticationHandler>(
                    TestAuthenticationScheme,
                    _ => { });
        });
    }

    public async Task MigrateAsync(CancellationToken cancellationToken = default)
    {
        _ = Server;
        await using var scope = Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
        await dbContext.Database.MigrateAsync(cancellationToken);
    }

    public HttpClient CreateAuthenticatedClient(string oidcSubject)
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Subject", oidcSubject);
        return client;
    }
}

internal sealed class IntegrationTestAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("X-Test-Subject", out var subjectValues))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var subject = subjectValues.ToString().Trim();
        if (string.IsNullOrWhiteSpace(subject))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var identity = new ClaimsIdentity(
            [new Claim("sub", subject)],
            CharkhooneApiFactory.TestAuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(
            principal,
            CharkhooneApiFactory.TestAuthenticationScheme);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
