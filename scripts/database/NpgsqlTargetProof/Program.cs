using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Npgsql;

return await RunAsync(args);

static async Task<int> RunAsync(string[] args)
{
    if (args.Length != 4)
    {
        Console.Error.WriteLine("Usage: NpgsqlTargetProof <lock-key> <state-file> <release-file> <evidence-file>");
        return 2;
    }

    var connectionString = Environment.GetEnvironmentVariable("CHARKHOONE_DATABASE_TARGET_PROBE_CONNECTION");
    if (string.IsNullOrWhiteSpace(connectionString))
    {
        Console.Error.WriteLine("CHARKHOONE_DATABASE_TARGET_PROBE_CONNECTION is required.");
        return 2;
    }

    if (!long.TryParse(args[0], NumberStyles.None, CultureInfo.InvariantCulture, out var lockKey) || lockKey <= 0)
    {
        Console.Error.WriteLine("A positive advisory lock key is required.");
        return 2;
    }

    var stateFile = args[1];
    var releaseFile = args[2];
    var evidenceFile = args[3];
    var timeoutSeconds = 60;
    if (int.TryParse(Environment.GetEnvironmentVariable("CHARKHOONE_DATABASE_TARGET_PROBE_TIMEOUT_SECONDS"), out var configuredTimeout))
    {
        timeoutSeconds = Math.Clamp(configuredTimeout, 5, 300);
    }

    try
    {
        EnsureParentDirectory(stateFile);
        EnsureParentDirectory(evidenceFile);

        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();

        const string identitySql = """
            SELECT current_database(),
                   session_user,
                   pg_backend_pid(),
                   COALESCE(inet_server_addr()::text, ''),
                   COALESCE(inet_server_port(), 0),
                   current_setting('server_version_num')
            """;

        await using var identityCommand = new NpgsqlCommand(identitySql, connection);
        await using var reader = await identityCommand.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
        {
            Console.Error.WriteLine("Npgsql target proof could not read database identity.");
            return 1;
        }

        var database = reader.GetString(0);
        var sessionUser = reader.GetString(1);
        var backendPid = reader.GetInt32(2);
        var serverAddress = reader.GetString(3);
        var serverPort = reader.GetInt32(4);
        var serverVersion = reader.GetString(5);
        await reader.DisposeAsync();

        await using var lockCommand = new NpgsqlCommand("SELECT pg_advisory_lock(@key)", connection);
        lockCommand.Parameters.AddWithValue("key", lockKey);
        await lockCommand.ExecuteNonQueryAsync();

        try
        {
            var databaseHash = Sha256(database);
            var sessionUserHash = Sha256(sessionUser);
            var serverEndpointHash = Sha256($"{serverAddress}:{serverPort}");
            var connectionHash = Sha256(connectionString);

            WritePrivateFile(stateFile, string.Join('\n', new[]
            {
                $"database_sha256={databaseHash}",
                $"session_user_sha256={sessionUserHash}",
                $"connection_sha256={connectionHash}",
                $"server_endpoint_sha256={serverEndpointHash}",
                $"backend_pid={backendPid}",
                string.Empty
            }));

            File.WriteAllText(evidenceFile, string.Join('\n', new[]
            {
                "proof_version=1",
                "driver=npgsql",
                $"database_sha256={databaseHash}",
                $"session_user_sha256={sessionUserHash}",
                $"server_endpoint_sha256={serverEndpointHash}",
                $"server_version_num={serverVersion}",
                "advisory_lock_held=true",
                "connection_secret=not-recorded",
                string.Empty
            }));

            var deadline = DateTime.UtcNow.AddSeconds(timeoutSeconds);
            while (!File.Exists(releaseFile))
            {
                if (DateTime.UtcNow >= deadline)
                {
                    Console.Error.WriteLine("Npgsql target proof release signal timed out.");
                    return 1;
                }

                await Task.Delay(100);
            }
        }
        finally
        {
            await using var unlockCommand = new NpgsqlCommand("SELECT pg_advisory_unlock(@key)", connection);
            unlockCommand.Parameters.AddWithValue("key", lockKey);
            await unlockCommand.ExecuteNonQueryAsync();
        }

        return 0;
    }
    catch (Exception exception)
    {
        Console.Error.WriteLine($"Npgsql target proof failed: {exception.GetType().Name}");
        return 1;
    }
}

static string Sha256(string value)
{
    var digest = SHA256.HashData(Encoding.UTF8.GetBytes(value));
    return Convert.ToHexString(digest).ToLowerInvariant();
}

static void EnsureParentDirectory(string path)
{
    var directory = Path.GetDirectoryName(path);
    if (!string.IsNullOrEmpty(directory))
    {
        Directory.CreateDirectory(directory);
    }
}

static void WritePrivateFile(string path, string content)
{
    File.WriteAllText(path, content);
    if (!OperatingSystem.IsWindows())
    {
        File.SetUnixFileMode(path, UnixFileMode.UserRead | UnixFileMode.UserWrite);
    }
}
