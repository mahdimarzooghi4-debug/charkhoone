using Charkhoone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using RabbitMQ.Client;

namespace Charkhoone.Api.Health;

public sealed class PostgresReadinessHealthCheck(IServiceScopeFactory scopeFactory) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<CharkhooneDbContext>();
            return await dbContext.Database.CanConnectAsync(cancellationToken)
                ? HealthCheckResult.Healthy("PostgreSQL is reachable.")
                : HealthCheckResult.Unhealthy("PostgreSQL is not reachable.");
        }
        catch
        {
            return HealthCheckResult.Unhealthy("PostgreSQL readiness check failed.");
        }
    }
}

public sealed class RabbitMqReadinessHealthCheck(IConfiguration configuration) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var section = configuration.GetSection("RabbitMq");
        if (!bool.TryParse(section["Enabled"], out var enabled) || !enabled)
        {
            return HealthCheckResult.Healthy("RabbitMQ is disabled for this deployment.");
        }

        try
        {
            var factory = new ConnectionFactory
            {
                HostName = ValueOrDefault(section["Host"], "localhost"),
                Port = IntOrDefault(section["Port"], 5672),
                UserName = ValueOrDefault(section["UserName"], "guest"),
                Password = ValueOrDefault(section["Password"], "guest"),
                VirtualHost = ValueOrDefault(section["VirtualHost"], "/"),
            };

            await using var connection = await factory.CreateConnectionAsync(cancellationToken);
            return connection.IsOpen
                ? HealthCheckResult.Healthy("RabbitMQ is reachable.")
                : HealthCheckResult.Unhealthy("RabbitMQ connection is not open.");
        }
        catch
        {
            return HealthCheckResult.Unhealthy("RabbitMQ readiness check failed.");
        }
    }

    private static string ValueOrDefault(string? value, string fallback) =>
        string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();

    private static int IntOrDefault(string? value, int fallback) =>
        int.TryParse(value, out var parsed) && parsed is > 0 and <= 65535 ? parsed : fallback;
}
