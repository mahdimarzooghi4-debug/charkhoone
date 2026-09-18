using System.Globalization;
using Charkhoone.Infrastructure;
using Charkhoone.Infrastructure.Observability;
using Charkhoone.Worker;

const string releaseConfigurationKey = "Release:GitSha";
const string releaseHeaderName = "X-Charkhoone-Release-Sha";

var builder = WebApplication.CreateBuilder(args);
var releaseGitSha = ResolveReleaseGitSha(builder.Configuration, releaseConfigurationKey);

builder.Services.AddInfrastructure(
    builder.Configuration,
    allowDevelopmentMocks: builder.Environment.IsDevelopment(),
    databasePoolName: "Charkhoone.Worker.Postgres");
builder.Services.AddCharkhooneObservability(builder.Configuration, "Charkhoone.Worker");
builder.Services.AddSingleton(TimeProvider.System);

var rabbitMqOptions = RabbitMqWorkerOptions.FromConfiguration(builder.Configuration);
builder.Services.AddSingleton(rabbitMqOptions);

var financialReconciliationOptions = FinancialReconciliationWorkerOptions.FromConfiguration(builder.Configuration);
builder.Services.AddSingleton(financialReconciliationOptions);

builder.Services.AddHostedService<OutboxWorker>();
builder.Services.AddHostedService<CreditApplicationSubmittedConsumer>();
builder.Services.AddHostedService<CancellationNotificationConsumer>();
builder.Services.AddHostedService<NormalSettlementNotificationConsumer>();
builder.Services.AddHostedService<FinancialReconciliationWorker>();

var app = builder.Build();

app.Use(async (context, next) =>
{
    context.Response.OnStarting(() =>
    {
        if (releaseGitSha is not null)
        {
            context.Response.Headers[releaseHeaderName] = releaseGitSha;
        }

        return Task.CompletedTask;
    });

    await next();
});

static IResult WorkerLiveness() => Results.Ok(new
{
    service = "Charkhoone.Worker",
    status = "live",
});

app.MapGet("/health", WorkerLiveness);
app.MapGet("/health/live", WorkerLiveness);

app.Run();

static string? ResolveReleaseGitSha(IConfiguration configuration, string configurationKey)
{
    var raw = configuration[configurationKey]?.Trim();
    if (string.IsNullOrWhiteSpace(raw))
    {
        return null;
    }

    if (raw.Length != 40 || raw.Any(character => !Uri.IsHexDigit(character)))
    {
        throw new InvalidOperationException(
            $"{configurationKey} must be a full 40-character hexadecimal git SHA when configured.");
    }

    return raw.ToLower(CultureInfo.InvariantCulture);
}
