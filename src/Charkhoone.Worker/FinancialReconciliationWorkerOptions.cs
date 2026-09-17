using Microsoft.Extensions.Configuration;

namespace Charkhoone.Worker;

public sealed class FinancialReconciliationWorkerOptions
{
    public const string SectionName = "FinancialReconciliation";

    public bool Enabled { get; init; }
    public int PollMilliseconds { get; init; } = 30000;
    public int BatchSize { get; init; } = 32;

    public TimeSpan PollInterval => TimeSpan.FromMilliseconds(PollMilliseconds);

    public static FinancialReconciliationWorkerOptions FromConfiguration(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        var section = configuration.GetSection(SectionName);

        return new FinancialReconciliationWorkerOptions
        {
            Enabled = bool.TryParse(section["Enabled"], out var enabled) && enabled,
            PollMilliseconds = PositiveInt(section["PollMilliseconds"], 30000, 1000, 3600000),
            BatchSize = PositiveInt(section["BatchSize"], 32, 1, 500),
        };
    }

    private static int PositiveInt(string? value, int fallback, int minimum, int maximum) =>
        int.TryParse(value, out var parsed)
            ? Math.Clamp(parsed, minimum, maximum)
            : fallback;
}
