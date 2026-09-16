using Charkhoone.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHealthChecks();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
        context.ProblemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
});
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

app.UseExceptionHandler();
app.MapHealthChecks("/health");
app.MapOpenApi();

var api = app.MapGroup("/api/v1");
api.MapGet("", () => Results.Ok(new
{
    service = "Charkhoone.Api",
    apiVersion = "v1",
    status = "ready"
}));

app.Run();

public partial class Program
{
}
