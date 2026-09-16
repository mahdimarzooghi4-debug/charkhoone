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

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var authority = builder.Configuration["Authentication:Authority"];
        var audience = builder.Configuration["Authentication:Audience"];

        if (!string.IsNullOrWhiteSpace(authority))
        {
            options.Authority = authority;
        }

        if (!string.IsNullOrWhiteSpace(audience))
        {
            options.Audience = audience;
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

app.Run();

public partial class Program
{
}
