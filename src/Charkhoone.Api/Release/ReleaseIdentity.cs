using System.Globalization;

namespace Charkhoone.Api.Release;

public static class ReleaseIdentity
{
    public const string ConfigurationKey = "Release:GitSha";
    public const string HeaderName = "X-Charkhoone-Release-Sha";

    public static string? Resolve(IConfiguration configuration)
    {
        var raw = configuration[ConfigurationKey]?.Trim();
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        if (raw.Length != 40 || raw.Any(character => !Uri.IsHexDigit(character)))
        {
            throw new InvalidOperationException(
                $"{ConfigurationKey} must be a full 40-character hexadecimal git SHA when configured.");
        }

        return raw.ToLower(CultureInfo.InvariantCulture);
    }
}
