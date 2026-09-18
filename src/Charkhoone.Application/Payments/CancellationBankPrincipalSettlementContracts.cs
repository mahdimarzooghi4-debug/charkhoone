namespace Charkhoone.Application.Payments;

public enum CancellationBankPrincipalReturnStatus
{
    Pending,
    Unknown,
    Failed,
    Succeeded,
}

public sealed record CancellationBankPrincipalReturnView(
    Guid ContractId,
    Guid CancellationSettlementId,
    string BankId,
    decimal AmountRial,
    CancellationBankPrincipalReturnStatus Status,
    Guid ExternalTransactionId,
    string? ExternalReference,
    Guid? JournalEntryId,
    DateTimeOffset UpdatedAtUtc);

public enum SettleCancellationBankPrincipalOutcome
{
    Completed,
    AlreadyCompleted,
    Failed,
    Indeterminate,
    NotFound,
    InvalidState,
}

public sealed record SettleCancellationBankPrincipalResult(
    SettleCancellationBankPrincipalOutcome Outcome,
    CancellationBankPrincipalReturnView? Return);

public interface ICancellationBankPrincipalSettlementService
{
    Task<SettleCancellationBankPrincipalResult> SettleAsync(
        Guid contractId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default);

    Task<CancellationBankPrincipalReturnView?> GetAsync(
        Guid contractId,
        CancellationToken cancellationToken = default);
}
