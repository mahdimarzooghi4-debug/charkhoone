using Charkhoone.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHealthChecks();
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

app.MapHealthChecks("/health");
app.MapGet("/api/v1", () => Results.Ok(new
{
    service = "Charkhoone.Api",
    apiVersion = "v1",
    status = "bootstrap"
}));

app.Run();

public partial class Program;
