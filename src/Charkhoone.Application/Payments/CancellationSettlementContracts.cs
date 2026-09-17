using Charkhoone.Domain.Payments;

namespace Charkhoone.Application.Payments;

public enum ExternalOwnerResidualTransferStatus
{
    Confirmed,
    Failed,
    Indeterminate,
}

public sealed record ExternalOwnerResidualTransferRequest(
    Guid SettlementId,
    Guid ContractId,
    Guid OwnerUserId,
    decimal ExpectedAmountRial,
    string IdempotencyKey);

public sealed record ExternalOwnerResidualTransferResponse(
    ExternalOwnerResidualTransferStatus Status,
    string Provider,
    decimal? ConfirmedAmountRial = null,
    string? ExternalReference = null,
    string? ReasonCode = null);

/// <summary>
/// Ensures or reconciles the cancellation residual transfer to the owner by idempotency key.
/// Indeterminate results remain queryable and are never treated as success.
/// </summary>
public interface IExternalOwnerResidualTransferAdapter
{
    string Provider { get; }

    Task<ExternalOwnerResidualTransferResponse> EnsureOrQueryAsync(
        ExternalOwnerResidualTransferRequest request,
        CancellationToken cancellationToken = default);
}

public sealed record CancellationSettlementView(
    Guid Id,
    Guid ContractId,
    Guid OwnerUserId,
    decimal AmountRial,
    CancellationSettlementStatus Status,
    Guid? ExternalTransactionId,
    string? ExternalReference,
    Guid? JournalEntryId,
    decimal? RemainingTenantContributionRial,
    DateTimeOffset UpdatedAtUtc,
    DateTimeOffset? CompletedAtUtc);

public enum SettleCancellationOutcome
{
    Completed,
    AlreadyCompleted,
    Failed,
    Indeterminate,
    NotFound,
    InvalidState,
}

public sealed record SettleCancellationResult(
    SettleCancellationOutcome Outcome,
    CancellationSettlementView? Settlement);

public interface ICancellationSettlementService
{
    Task<SettleCancellationResult> SettleAsync(
        Guid contractId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default);

    Task<CancellationSettlementView?> GetAsync(
        Guid contractId,
        CancellationToken cancellationToken = default);
}
