using Microsoft.Extensions.Configuration;

namespace Charkhoone.Infrastructure;

public static class ExternalAdapterSafety
{
    private const string DevelopmentEnvironmentName = "Development";
    private const string DevelopmentMockMode = "DevelopmentMock";

    public static void Validate(IConfiguration configuration, string environmentName)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        if (string.IsNullOrWhiteSpace(environmentName))
        {
            throw new ArgumentException("Environment name is required.", nameof(environmentName));
        }

        if (string.Equals(
                environmentName.Trim(),
                DevelopmentEnvironmentName,
                StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var unsafeModePaths = EnumerateSections(configuration.GetSection("ExternalAdapters"))
            .Where(section => string.Equals(section.Key, "Mode", StringComparison.OrdinalIgnoreCase))
            .Where(section => string.Equals(
                section.Value?.Trim(),
                DevelopmentMockMode,
                StringComparison.OrdinalIgnoreCase))
            .Select(section => section.Path)
            .OrderBy(path => path, StringComparer.Ordinal)
            .ToArray();

        if (unsafeModePaths.Length == 0)
        {
            return;
        }

        throw new InvalidOperationException(
            $"DevelopmentMock external adapters are allowed only in the Development environment. " +
            $"Disallowed configuration: {string.Join(", ", unsafeModePaths)}.");
    }

    private static IEnumerable<IConfigurationSection> EnumerateSections(IConfigurationSection section)
    {
        foreach (var child in section.GetChildren())
        {
            yield return child;

            foreach (var descendant in EnumerateSections(child))
            {
                yield return descendant;
            }
        }
    }
}
