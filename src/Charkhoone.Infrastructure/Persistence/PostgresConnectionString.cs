using Npgsql;

namespace Charkhoone.Infrastructure.Persistence;

public static class PostgresConnectionString
{
    public static string Normalize(string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);
        if (!value.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase) &&
            !value.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase))
            return value;

        var uri = new Uri(value, UriKind.Absolute);
        if (uri.Scheme is not ("postgresql" or "postgres") ||
            string.IsNullOrWhiteSpace(uri.Host) || uri.AbsolutePath is "/" or "" ||
            !string.IsNullOrEmpty(uri.Query) || !string.IsNullOrEmpty(uri.Fragment))
            throw new ArgumentException("Invalid internal PostgreSQL connection URL.", nameof(value));

        var separator = uri.UserInfo.IndexOf(':');
        if (separator <= 0 || separator == uri.UserInfo.Length - 1)
            throw new ArgumentException("PostgreSQL URL must include user and password.", nameof(value));

        return new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort ? 5432 : uri.Port,
            Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
            Username = Uri.UnescapeDataString(uri.UserInfo[..separator]),
            Password = Uri.UnescapeDataString(uri.UserInfo[(separator + 1)..]),
        }.ConnectionString;
    }
}
