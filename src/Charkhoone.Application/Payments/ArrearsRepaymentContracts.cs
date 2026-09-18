using Charkhoone.Domain.Payments;

namespace Charkhoone.Application.Payments;

public enum ExternalTenantArrearsRepaymentStatus
{
    Confirmed,
    Failed,
    Indeterminate,
}

public sealed record ExternalTenantArrearsRepaymentRequest(
    Guid ExternalTransactionId,
    Guid ContractId,
    Guid TenantUserId,
    decimal OutstandingPrincipalRial,
    decimal QuotedLostFundReturnRial,
    decimal QuotedTotalRial,
    DateTimeOffset QuoteAtUtc,
    string IdempotencyKey);

public sealed record ExternalTenantArrearsRepaymentResponse(
    ExternalTenantArrearsRepaymentStatus Status,
    string Provider,
    decimal? ConfirmedAmountRial = null,
    string? ExternalReference = null,
    DateTimeOffset? SucceededAtUtc = null,
    string? ReasonCode = null);

/// <summary>
/// Ensures or queries one tenant arrears repayment attempt. A confirmed response must carry
/// the actual successful timestamp so Charkhoone can independently recompute the exact
/// principal plus simple Lost Fund Return at that economic cutoff.
/// </summary>
public interface IExternalTenantArrearsRepaymentAdapter
{
    string Provider { get; }

    Task<ExternalTenantArrearsRepaymentResponse> EnsureOrQueryAsync(
        ExternalTenantArrearsRepaymentRequest request,
        CancellationToken cancellationToken = default);
}

public enum ReconcileTenantArrearsRepaymentOutcome
{
    Reconciled,
    AlreadyReconciled,
    Failed,
    Indeterminate,
    NoArrears,
    NotFound,
    InvalidState,
}

public sealed record TenantArrearsRepaymentView(
    Guid ContractId,
    Guid ExternalTransactionId,
    ExternalTransactionStatus TransactionStatus,
    decimal OutstandingPrincipalRial,
    decimal LostFundReturnRial,
    decimal TotalRepaymentRial,
    string Provider,
    string? ExternalReference,
    DateTimeOffset QuoteAtUtc,
    DateTimeOffset? SucceededAtUtc);

public sealed record ReconcileTenantArrearsRepaymentResult(
    ReconcileTenantArrearsRepaymentOutcome Outcome,
    TenantArrearsRepaymentView? Repayment,
    TenantContributionReplenishmentView? Replenishment);

public interface ITenantArrearsRepaymentService
{
    Task<ReconcileTenantArrearsRepaymentResult> ReconcileAsync(
        Guid contractId,
        Guid requestingUserId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default);
}
