namespace Charkhoone.Application.Payments;

public sealed record FinancialRecoveryBatch(
    int MaximumItems,
    TimeSpan MinimumRequeryAge)
{
    public static FinancialRecoveryBatch Create(int maximumItems, TimeSpan minimumRequeryAge)
    {
        if (maximumItems is < 1 or > 500)
        {
            throw new ArgumentOutOfRangeException(nameof(maximumItems), "Recovery batch size must be between 1 and 500.");
        }

        if (minimumRequeryAge < TimeSpan.Zero || minimumRequeryAge > TimeSpan.FromHours(24))
        {
            throw new ArgumentOutOfRangeException(nameof(minimumRequeryAge));
        }

        return new FinancialRecoveryBatch(maximumItems, minimumRequeryAge);
    }
}

public sealed record FinancialRecoveryRunResult(
    int PaymentReconciliationAttempts,
    int MonthlyObligationCloseAttempts,
    int CoverageAttempts,
    int CancellationSettlementAttempts,
    int NormalSettlementAttempts);

public interface IFinancialRecoveryService
{
    Task<FinancialRecoveryRunResult> RunOnceAsync(
        FinancialRecoveryBatch batch,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default);
}
