namespace Charkhoone.Infrastructure.Persistence.Models;

public sealed class CreditEligibilityAssessmentRow
{
    public Guid Id { get; set; }
    public Guid CreditApplicationId { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? ExternalSubGrade { get; set; }
    public decimal FullDepositEquivalentRial { get; set; }
    public decimal? LoanRatio { get; set; }
    public decimal? MaximumEligibleLoanRial { get; set; }
    public string IdempotencyKey { get; set; } = string.Empty;
    public string? ExternalReference { get; set; }
    public string? ReasonCode { get; set; }
    public int AttemptCount { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}
