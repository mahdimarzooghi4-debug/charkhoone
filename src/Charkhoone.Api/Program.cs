using Charkhoone.Api.Endpoints;
using Charkhoone.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHealthChecks();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
        context.ProblemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
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
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

app.UseExceptionHandler();
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");
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
