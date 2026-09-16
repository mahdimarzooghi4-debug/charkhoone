using Charkhoone.Domain.Payments;

namespace Charkhoone.Infrastructure.Persistence.Models;

public sealed class TenantContributionFundingRow
{
    public Guid Id { get; set; }
    public Guid FundingAllocationId { get; set; }
    public Guid ExternalTransactionId { get; set; }
    public string? FundReference { get; set; }
    public int AttemptCount { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}

public sealed class TenantContributionRow
{
    public Guid ContractId { get; set; }
    public Guid FundingAllocationId { get; set; }
    public decimal InitialAmountRial { get; set; }
    public string FundReference { get; set; } = string.Empty;
    public DateTimeOffset FundedAtUtc { get; set; }
}

public sealed class ExternalTransactionRow
{
    public Guid Id { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string OperationType { get; set; } = string.Empty;
    public string AggregateType { get; set; } = string.Empty;
    public Guid AggregateId { get; set; }
    public ExternalTransactionStatus Status { get; set; }
    public decimal AmountRial { get; set; }
    public string Currency { get; set; } = "IRR";
    public string IdempotencyKey { get; set; } = string.Empty;
    public string? ExternalReference { get; set; }
    public string? ReasonCode { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}

public sealed class LedgerAccountRow
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Currency { get; set; } = "IRR";
    public Guid? ContractId { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
}

public sealed class JournalEntryRow
{
    public Guid Id { get; set; }
    public string ReferenceType { get; set; } = string.Empty;
    public Guid ReferenceId { get; set; }
    public string IdempotencyKey { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTimeOffset OccurredAtUtc { get; set; }
    public DateTimeOffset PostedAtUtc { get; set; }
    public Guid? ReversalOfJournalEntryId { get; set; }
}

public sealed class JournalLineRow
{
    public Guid Id { get; set; }
    public Guid JournalEntryId { get; set; }
    public Guid LedgerAccountId { get; set; }
    public decimal DebitRial { get; set; }
    public decimal CreditRial { get; set; }
}
