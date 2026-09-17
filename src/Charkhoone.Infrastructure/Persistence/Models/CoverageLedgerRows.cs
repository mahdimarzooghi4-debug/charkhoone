using Charkhoone.Domain.Payments;

namespace Charkhoone.Infrastructure.Persistence.Models;

public sealed class CoveragePaymentRow
{
    public Guid Id { get; set; }
    public Guid ContractId { get; set; }
    public Guid MonthlyObligationId { get; set; }
    public Guid PaymentInstructionId { get; set; }
    public MonthlyObligationComponentKind Kind { get; set; }
    public decimal AmountRial { get; set; }
    public string BeneficiaryId { get; set; } = string.Empty;
    public CoveragePaymentStatus Status { get; set; }
    public Guid ExternalTransactionId { get; set; }
    public Guid? JournalEntryId { get; set; }
    public decimal? RemainingTenantContributionRial { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public DateTimeOffset? CoveredAtUtc { get; set; }
}

public sealed class TenantContributionReplenishmentRow
{
    public Guid Id { get; set; }
    public Guid ContractId { get; set; }
    public Guid ExternalTransactionId { get; set; }
    public Guid JournalEntryId { get; set; }
    public decimal AmountRial { get; set; }
    public decimal RemainingTenantContributionRial { get; set; }
    public string ExternalReference { get; set; } = string.Empty;
    public DateTimeOffset ReplenishedAtUtc { get; set; }
}
