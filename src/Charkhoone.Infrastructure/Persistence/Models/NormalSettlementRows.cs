using Charkhoone.Domain.Payments;

namespace Charkhoone.Infrastructure.Persistence.Models;

public sealed class NormalSettlementRow
{
    public Guid Id { get; set; }
    public Guid ContractId { get; set; }
    public Guid TenantUserId { get; set; }
    public string BankId { get; set; } = string.Empty;
    public string FundReference { get; set; } = string.Empty;
    public decimal BankPrincipalAmountRial { get; set; }
    public NormalSettlementTransferStatus BankPrincipalStatus { get; set; }
    public Guid? BankExternalTransactionId { get; set; }
    public string? BankExternalReference { get; set; }
    public Guid? BankJournalEntryId { get; set; }
    public DateTimeOffset? BankPrincipalReturnedAtUtc { get; set; }
    public decimal TenantResidualAmountRial { get; set; }
    public NormalSettlementTransferStatus TenantResidualStatus { get; set; }
    public Guid? TenantExternalTransactionId { get; set; }
    public string? TenantExternalReference { get; set; }
    public Guid? TenantJournalEntryId { get; set; }
    public DateTimeOffset? TenantResidualReturnedAtUtc { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public DateTimeOffset? CompletedAtUtc { get; set; }
}
