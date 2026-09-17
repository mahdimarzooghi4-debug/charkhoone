using System.Diagnostics;
using Charkhoone.Api.Endpoints;
using Charkhoone.Api.Health;
using Charkhoone.Api.Security;
using Charkhoone.Infrastructure;
using Charkhoone.Infrastructure.Observability;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;

var builder = WebApplication.CreateBuilder(args);

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

        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
    });
builder.Services.AddAuthorization();
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

app.UseExceptionHandler();
app.UseCharkhooneApiSecurityHeaders();
app.Use(async (context, next) =>
{
    context.Response.OnStarting(() =>
    {
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

var api = app.MapGroup("/api/v1");
api.MapGet("", () => Results.Ok(new
{
    service = "Charkhoone.Api",
    apiVersion = "v1",
    status = "ready"
}));
api.MapCreditApplicationEndpoints();
api.MapPaymentEndpoints();
api.MapContractEndpoints();

app.Run();

public partial class Program
{
}
