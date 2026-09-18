using System.Security.Claims;

namespace Charkhoone.Api.Security;

public sealed class PilotOperationsOptions
{
    public const string SectionName = "PilotOperations";
    public const string AuthorizationPolicy = "pilot-operator";

    private readonly HashSet<string> _allowedSubjects;

    private PilotOperationsOptions(bool enabled, IEnumerable<string> allowedSubjects)
    {
        Enabled = enabled;
        _allowedSubjects = allowedSubjects
            .Select(subject => subject.Trim())
            .Where(subject => !string.IsNullOrWhiteSpace(subject))
            .ToHashSet(StringComparer.Ordinal);
    }

    public bool Enabled { get; }

    public bool IsAllowed(ClaimsPrincipal principal)
    {
        if (!Enabled)
        {
            return false;
        }

        var subject = principal.FindFirstValue("sub")?.Trim();
        return !string.IsNullOrWhiteSpace(subject) && _allowedSubjects.Contains(subject);
    }

    public static PilotOperationsOptions FromConfiguration(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        var section = configuration.GetSection(SectionName);
        var enabled = bool.TryParse(section["Enabled"], out var parsed) && parsed;
        var allowedSubjects = section.GetSection("AllowedSubjects")
            .GetChildren()
            .Select(child => child.Value)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Cast<string>()
            .ToArray();

        if (enabled && allowedSubjects.Length == 0)
        {
            throw new InvalidOperationException(
                "PilotOperations:AllowedSubjects must contain at least one OIDC subject when PilotOperations:Enabled=true.");
        }

        if (allowedSubjects.Any(subject => subject.Trim().Length > 220))
        {
            throw new InvalidOperationException(
                "PilotOperations OIDC subjects must be 220 characters or fewer.");
        }

        return new PilotOperationsOptions(enabled, allowedSubjects);
    }
}
