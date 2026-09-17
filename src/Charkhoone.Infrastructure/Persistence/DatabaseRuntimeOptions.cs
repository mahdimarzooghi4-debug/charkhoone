using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Charkhoone.Infrastructure.Persistence;

public sealed record DatabaseRuntimeOptions(
    int ConnectionTimeoutSeconds,
    int CommandTimeoutSeconds,
    int CancellationTimeoutMilliseconds,
    int MinimumPoolSize,
    int MaximumPoolSize,
    int ConnectionIdleLifetimeSeconds,
    int ConnectionPruningIntervalSeconds,
    int ConnectionLifetimeSeconds,
    int KeepAliveSeconds)
{
    private const string Prefix = "Database:Runtime";

    public static DatabaseRuntimeOptions FromConfiguration(
        IConfiguration configuration,
        string connectionString)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);

        var baseline = new NpgsqlConnectionStringBuilder(connectionString);
        if (baseline.NoResetOnClose)
        {
            throw new InvalidOperationException(
                "Postgres No Reset On Close must not be enabled because pooled session state must be reset between borrowers.");
        }

        var options = new DatabaseRuntimeOptions(
            ReadInt(configuration, "ConnectionTimeoutSeconds", baseline.Timeout, 1, 120),
            ReadInt(configuration, "CommandTimeoutSeconds", baseline.CommandTimeout, 1, 600),
            ReadInt(configuration, "CancellationTimeoutMilliseconds", baseline.CancellationTimeout, 1, 10_000),
            ReadInt(configuration, "MinimumPoolSize", baseline.MinPoolSize, 0, 500),
            ReadInt(configuration, "MaximumPoolSize", baseline.MaxPoolSize, 1, 500),
            ReadInt(configuration, "ConnectionIdleLifetimeSeconds", baseline.ConnectionIdleLifetime, 10, 3_600),
            ReadInt(configuration, "ConnectionPruningIntervalSeconds", baseline.ConnectionPruningInterval, 1, 300),
            ReadInt(configuration, "ConnectionLifetimeSeconds", baseline.ConnectionLifetime, 0, 86_400),
            ReadInt(configuration, "KeepAliveSeconds", baseline.KeepAlive, 0, 300));

        if (options.MinimumPoolSize > options.MaximumPoolSize)
        {
            throw new InvalidOperationException(
                $"{Prefix}:MinimumPoolSize cannot exceed {Prefix}:MaximumPoolSize.");
        }

        return options;
    }

    public NpgsqlConnectionStringBuilder ApplyTo(
        string connectionString,
        string applicationName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);
        ArgumentException.ThrowIfNullOrWhiteSpace(applicationName);

        var builder = new NpgsqlConnectionStringBuilder(connectionString)
        {
            Timeout = ConnectionTimeoutSeconds,
            CommandTimeout = CommandTimeoutSeconds,
            CancellationTimeout = CancellationTimeoutMilliseconds,
            MinPoolSize = MinimumPoolSize,
            MaxPoolSize = MaximumPoolSize,
            ConnectionIdleLifetime = ConnectionIdleLifetimeSeconds,
            ConnectionPruningInterval = ConnectionPruningIntervalSeconds,
            ConnectionLifetime = ConnectionLifetimeSeconds,
            KeepAlive = KeepAliveSeconds,
            NoResetOnClose = false,
        };

        if (string.IsNullOrWhiteSpace(builder.ApplicationName))
        {
            builder.ApplicationName = applicationName.Trim();
        }

        return builder;
    }

    private static int ReadInt(
        IConfiguration configuration,
        string name,
        int fallback,
        int minimum,
        int maximum)
    {
        var key = $"{Prefix}:{name}";
        var value = configuration[key];
        if (string.IsNullOrWhiteSpace(value))
        {
            if (fallback < minimum || fallback > maximum)
            {
                throw new InvalidOperationException(
                    $"Postgres connection-string value for {name} must be between {minimum} and {maximum}.");
            }

            return fallback;
        }

        if (!int.TryParse(value.Trim(), out var parsed)
            || parsed < minimum
            || parsed > maximum)
        {
            throw new InvalidOperationException(
                $"{key} must be an integer between {minimum} and {maximum}.");
        }

        return parsed;
    }
}
