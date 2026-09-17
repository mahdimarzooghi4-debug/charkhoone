using Microsoft.Extensions.Configuration;

namespace Charkhoone.Api.Security;

public sealed class ApiSecurityOptions
{
    public const string SectionName = "Security:RateLimits:SensitiveMutation";

    public int PermitLimit { get; init; } = 30;
    public int WindowSeconds { get; init; } = 60;

    public TimeSpan Window => TimeSpan.FromSeconds(WindowSeconds);

    public static ApiSecurityOptions FromConfiguration(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        var section = configuration.GetSection(SectionName);

        return new ApiSecurityOptions
        {
            PermitLimit = PositiveInt(section["PermitLimit"], 30, 1, 10_000),
            WindowSeconds = PositiveInt(section["WindowSeconds"], 60, 1, 3_600),
        };
    }

    private static int PositiveInt(string? value, int fallback, int minimum, int maximum) =>
        int.TryParse(value, out var parsed)
            ? Math.Clamp(parsed, minimum, maximum)
            : fallback;
}

public static class ApiRateLimitPolicies
{
    public const string SensitiveMutation = "sensitive-mutation";
}
