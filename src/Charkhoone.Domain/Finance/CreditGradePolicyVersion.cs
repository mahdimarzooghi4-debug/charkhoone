namespace Charkhoone.Domain.Finance;

public sealed class CreditGradePolicyVersion
{
    private readonly IReadOnlyDictionary<string, decimal> _loanRatios;

    public CreditGradePolicyVersion(
        string version,
        DateTimeOffset effectiveFrom,
        IReadOnlyDictionary<string, decimal> loanRatios)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(version);
        ArgumentNullException.ThrowIfNull(loanRatios);

        var copy = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        foreach (var (grade, ratio) in loanRatios)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(grade);
            if (ratio is < 0m or > 1m)
            {
                throw new ArgumentOutOfRangeException(nameof(loanRatios), ratio, "Loan ratio must be between zero and one.");
            }

            copy[grade.Trim()] = ratio;
        }

        Version = version.Trim();
        EffectiveFrom = effectiveFrom;
        _loanRatios = copy;
    }

    public string Version { get; }
    public DateTimeOffset EffectiveFrom { get; }

    public decimal GetLoanRatio(string externalSubGrade)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(externalSubGrade);

        if (_loanRatios.TryGetValue(externalSubGrade.Trim(), out var ratio))
        {
            return ratio;
        }

        throw new ArgumentOutOfRangeException(
            nameof(externalSubGrade),
            externalSubGrade,
            "Unknown or invalid external credit sub-grade. No default ratio is allowed.");
    }
}
