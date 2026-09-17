using Charkhoone.Domain.Payments;

namespace Charkhoone.Infrastructure.Persistence.Models;

public sealed class CancellationSettlementRow
{
    public Guid Id { get; set; }
    public Guid ContractId { get; set; }
    public Guid OwnerUserId { get; set; }
    public decimal AmountRial { get; set; }
    public CancellationSettlementStatus Status { get; set; }
    public Guid? ExternalTransactionId { get; set; }
    public Guid? JournalEntryId { get; set; }
    public string? ExternalReference { get; set; }
    public decimal? RemainingTenantContributionRial { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public DateTimeOffset? CompletedAtUtc { get; set; }
}
