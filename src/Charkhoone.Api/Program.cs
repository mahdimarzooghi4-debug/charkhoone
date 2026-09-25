using System.Diagnostics;
using Charkhoone.Api.Endpoints;
using Charkhoone.Api.Health;
using Charkhoone.Api.Release;
using Charkhoone.Api.Security;
using Charkhoone.Infrastructure;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Observability;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;

var builder = WebApplication.CreateBuilder(args);
var releaseGitSha = ReleaseIdentity.Resolve(builder.Configuration);

builder.Services
    .AddHealthChecks()
    .AddCheck<PostgresReadinessHealthCheck>("postgres", tags: ["ready"])
    .AddCheck<RabbitMqReadinessHealthCheck>("rabbitmq", tags: ["ready"]);
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
        context.ProblemDetails.Extensions["traceId"] =
            Activity.Current?.TraceId.ToString() ?? context.HttpContext.TraceIdentifier;
});

var authenticationAuthority = builder.Configuration["Authentication:Authority"]?.Trim();
var authenticationAudience = builder.Configuration["Authentication:Audience"]?.Trim();

if (!builder.Environment.IsDevelopment())
{
    if (string.IsNullOrWhiteSpace(authenticationAuthority))
    {
        throw new InvalidOperationException(
            "Authentication:Authority must be configured outside the Development environment.");
    }

    if (!Uri.TryCreate(authenticationAuthority, UriKind.Absolute, out var authorityUri)
        || authorityUri.Scheme != Uri.UriSchemeHttps)
    {
        throw new InvalidOperationException(
            "Authentication:Authority must be an absolute HTTPS URI outside the Development environment.");
    }

    if (string.IsNullOrWhiteSpace(authenticationAudience))
    {
        throw new InvalidOperationException(
            "Authentication:Audience must be configured outside the Development environment.");
    }
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        if (!string.IsNullOrWhiteSpace(authenticationAuthority))
        {
            options.Authority = authenticationAuthority;
        }

        if (!string.IsNullOrWhiteSpace(authenticationAudience))
        {
            options.Audience = authenticationAudience;
        }

        // Application authorization explicitly relies on the OIDC `sub` claim.
        // Preserve standard OIDC claim names rather than mapping them to WS-* claim URIs.
        options.MapInboundClaims = false;
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
    });
var pilotOperationsOptions = PilotOperationsOptions.FromConfiguration(builder.Configuration);
builder.Services.AddSingleton(pilotOperationsOptions);
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(
        PilotOperationsOptions.AuthorizationPolicy,
        policy =>
        {
            policy.RequireAuthenticatedUser();
            policy.RequireAssertion(context => pilotOperationsOptions.IsAllowed(context.User));
        });
});
builder.Services.AddCharkhooneApiSecurity(builder.Configuration);
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddInfrastructure(
    builder.Configuration,
    allowDevelopmentMocks: builder.Environment.IsDevelopment(),
    databasePoolName: "Charkhoone.Api.Postgres");
builder.Services.AddCharkhooneObservability(builder.Configuration, "Charkhoone.Api");
builder.Services
    .AddOpenTelemetry()
    .WithTracing(tracing => tracing.AddAspNetCoreInstrumentation(options =>
    {
        options.Filter = context =>
            !context.Request.Path.StartsWithSegments("/health", StringComparison.OrdinalIgnoreCase);
    }))
    .WithMetrics(metrics => metrics.AddAspNetCoreInstrumentation());

var app = builder.Build();

// One-instance staging only: initialize a new Render database before serving.
// Production migrations remain an explicit, separately reviewed release operation.
if (app.Environment.IsStaging() && builder.Configuration.GetValue<bool>("Database:AutoMigrate"))
{
    await using var migrationScope = app.Services.CreateAsyncScope();
    var db = migrationScope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
    await db.Database.MigrateAsync();
}

app.UseExceptionHandler();
app.UseCharkhooneApiSecurityHeaders();
app.Use(async (context, next) =>
{
    context.Response.OnStarting(() =>
    {
        if (releaseGitSha is not null)
        {
            context.Response.Headers[ReleaseIdentity.HeaderName] = releaseGitSha;
        }

        if (Activity.Current is { } activity)
        {
            context.Response.Headers["X-Trace-Id"] = activity.TraceId.ToString();
        }

        return Task.CompletedTask;
    });

    await next();
});
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();

var livenessOptions = new HealthCheckOptions
{
    Predicate = _ => false,
};
app.MapHealthChecks("/health", livenessOptions);
app.MapHealthChecks("/health/live", livenessOptions);
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = registration => registration.Tags.Contains("ready"),
});
app.MapOpenApi();

// Secure the versioned API by default so newly added endpoints cannot accidentally
// become anonymous. The service-info route is intentionally public.
var api = app.MapGroup("/api/v1").RequireAuthorization();
api.MapGet("", () => Results.Ok(new
{
    service = "Charkhoone.Api",
    apiVersion = "v1",
    status = "ready"
})).AllowAnonymous();
api.MapCreditApplicationEndpoints();
api.MapPaymentEndpoints();
api.MapMobileBootstrapEndpoints();
api.MapMobileAccountEndpoints();
api.MapContractEndpoints();
api.MapPilotOperationsEndpoints();

app.Run();

public partial class Program
{
}
