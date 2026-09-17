namespace Charkhoone.Infrastructure.Persistence.Models;

public sealed class LostFundReturnRow
{
    public Guid Id { get; set; }
    public Guid ContractId { get; set; }
    public Guid CoveragePaymentId { get; set; }
    public decimal WithdrawnAmountRial { get; set; }
    public decimal MonthlyRate { get; set; }
    public DateTimeOffset WithdrawnAtUtc { get; set; }
    public DateTimeOffset CalculationPeriodStartUtc { get; set; }
    public DateTimeOffset? ReplacedAtUtc { get; set; }
    public DateTimeOffset? CalculationPeriodEndUtc { get; set; }
    public string? CalculationPolicyVersion { get; set; }
    public decimal? CalculatedReturnRial { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}
