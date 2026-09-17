namespace Charkhoone.Infrastructure.Persistence.Models;

public sealed class BankApprovalRow
{
    public Guid Id { get; set; }
    public Guid CreditApplicationId { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal MaximumEligibleLoanRial { get; set; }
    public decimal? ApprovedLoanRial { get; set; }
    public string IdempotencyKey { get; set; } = string.Empty;
    public string? ExternalReference { get; set; }
    public string? ReasonCode { get; set; }
    public int AttemptCount { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}

public sealed class FundingAllocationRow
{
    public Guid Id { get; set; }
    public Guid CreditApplicationId { get; set; }
    public Guid ContractId { get; set; }
    public Guid BankLoanPlanId { get; set; }
    public string BankLoanPlanVersion { get; set; } = string.Empty;
    public string BankId { get; set; } = string.Empty;
    public decimal FullDepositEquivalentRial { get; set; }
    public decimal MaximumEligibleLoanRial { get; set; }
    public decimal BankApprovedLoanRial { get; set; }
    public decimal TenantContributionRial { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}

public sealed class FundPrincipalFreezeRow
{
    public Guid Id { get; set; }
    public Guid FundingAllocationId { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string IdempotencyKey { get; set; } = string.Empty;
    public string? FundReference { get; set; }
    public string? ExternalReference { get; set; }
    public string? ReasonCode { get; set; }
    public int AttemptCount { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}
