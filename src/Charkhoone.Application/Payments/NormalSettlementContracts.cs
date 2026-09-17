using Charkhoone.Domain.Payments;

namespace Charkhoone.Application.Payments;

public enum ExternalNormalSettlementTransferStatus
{
    Confirmed,
    Failed,
    Indeterminate,
}

public sealed record ExternalBankPrincipalReturnRequest(
    Guid SettlementId,
    Guid ContractId,
    string BankId,
    string FundReference,
    decimal ExpectedAmountRial,
    string IdempotencyKey);

public sealed record ExternalBankPrincipalReturnResponse(
    ExternalNormalSettlementTransferStatus Status,
    string Provider,
    decimal? ConfirmedAmountRial = null,
    string? ExternalReference = null,
    string? ReasonCode = null);

public interface IExternalBankPrincipalReturnAdapter
{
    string Provider { get; }

    Task<ExternalBankPrincipalReturnResponse> EnsureOrQueryAsync(
        ExternalBankPrincipalReturnRequest request,
        CancellationToken cancellationToken = default);
}

public sealed record ExternalTenantResidualReturnRequest(
    Guid SettlementId,
    Guid ContractId,
    Guid TenantUserId,
    decimal ExpectedAmountRial,
    string IdempotencyKey);

public sealed record ExternalTenantResidualReturnResponse(
    ExternalNormalSettlementTransferStatus Status,
    string Provider,
    decimal? ConfirmedAmountRial = null,
    string? ExternalReference = null,
    string? ReasonCode = null);

public interface IExternalTenantResidualReturnAdapter
{
    string Provider { get; }

    Task<ExternalTenantResidualReturnResponse> EnsureOrQueryAsync(
        ExternalTenantResidualReturnRequest request,
        CancellationToken cancellationToken = default);
}

public sealed record NormalSettlementView(
    Guid Id,
    Guid ContractId,
    Guid TenantUserId,
    string BankId,
    decimal BankPrincipalAmountRial,
    NormalSettlementTransferStatus BankPrincipalStatus,
    Guid? BankExternalTransactionId,
    string? BankExternalReference,
    Guid? BankJournalEntryId,
    decimal TenantResidualAmountRial,
    NormalSettlementTransferStatus TenantResidualStatus,
    Guid? TenantExternalTransactionId,
    string? TenantExternalReference,
    Guid? TenantJournalEntryId,
    DateTimeOffset UpdatedAtUtc,
    DateTimeOffset? CompletedAtUtc);

public enum SettleNormalContractOutcome
{
    Completed,
    AlreadyCompleted,
    Failed,
    Indeterminate,
    NotFound,
    InvalidState,
}

public sealed record SettleNormalContractResult(
    SettleNormalContractOutcome Outcome,
    NormalSettlementView? Settlement);

public interface INormalSettlementService
{
    Task<SettleNormalContractResult> SettleAsync(
        Guid contractId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default);

    Task<NormalSettlementView?> GetAsync(
        Guid contractId,
        CancellationToken cancellationToken = default);
}
