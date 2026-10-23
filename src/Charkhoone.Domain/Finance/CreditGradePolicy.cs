namespace Charkhoone.Domain.Finance;

public static class CreditGradePolicy
{
    private static readonly IReadOnlyDictionary<string, decimal> LoanRatios =
        new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
        {
            ["A1"] = 0.55m,
            ["A2"] = 0.55m,
            ["A3"] = 0.55m,
            ["B1"] = 0.45m,
            ["B2"] = 0.45m,
            ["B3"] = 0.45m,
            ["C1"] = 0.40m,
            ["C2"] = 0.40m,
            ["C3"] = 0.40m,
            ["D1"] = 0.35m,
            ["D2"] = 0.35m,
            ["D3"] = 0.35m,
            ["E1"] = 0.30m,
            ["E2"] = 0.30m,
            ["E3"] = 0.30m,
        };

    public static decimal GetLoanRatio(string externalSubGrade)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(externalSubGrade);

        if (LoanRatios.TryGetValue(externalSubGrade.Trim(), out var ratio))
        {
            return ratio;
        }

        throw new ArgumentOutOfRangeException(
            nameof(externalSubGrade),
            externalSubGrade,
            "Unknown external credit sub-grade. No default loan ratio is allowed.");
    }
}
