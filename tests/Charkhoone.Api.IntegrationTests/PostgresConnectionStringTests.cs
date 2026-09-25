using Charkhoone.Infrastructure.Persistence;
using Npgsql;
using Xunit;

namespace Charkhoone.Api.IntegrationTests;

public sealed class PostgresConnectionStringTests
{
    [Fact]
    public void RenderInternalUrl_BecomesNpgsqlParametersWithoutLosingEscapedCredentials()
    {
        var result = new NpgsqlConnectionStringBuilder(PostgresConnectionString.Normalize(
            "postgresql://render_user:p%40ss%3Bword@internal-host:5433/charkhoone_staging"));
        Assert.Equal("internal-host", result.Host);
        Assert.Equal(5433, result.Port);
        Assert.Equal("render_user", result.Username);
        Assert.Equal("p@ss;word", result.Password);
        Assert.Equal("charkhoone_staging", result.Database);
    }

    [Fact]
    public void ExistingNpgsqlConnectionString_IsPreserved()
    {
        const string value = "Host=localhost;Database=charkhoone;Username=test;Password=test";
        Assert.Equal(value, PostgresConnectionString.Normalize(value));
    }
}
