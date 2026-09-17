using Charkhoone.Domain.Payments;

namespace Charkhoone.Application.Payments;

public enum ExternalCoverageTransferStatus
{
    Confirmed,
    Failed,
    Indeterminate,
}

public sealed record ExternalCoverageTransferRequest(
    Guid CoveragePaymentId,
    Guid MonthlyObligationId,
    Guid PaymentInstructionId,
    Guid ContractId,
    MonthlyObligationComponentKind Kind,
    string BeneficiaryId,
    decimal ExpectedAmountRial,
    string IdempotencyKey);

public sealed record ExternalCoverageTransferResponse(
    ExternalCoverageTransferStatus Status,
    string Provider,
    decimal? ConfirmedAmountRial = null,
    string? ExternalReference = null,
    string? ReasonCode = null);

/// <summary>
/// Ensures or reconciles a coverage transfer using the provided idempotency key.
/// An indeterminate result must remain queryable and must never be treated as success.
/// </summary>
public interface IExternalCoverageTransferAdapter
{
    string Provider { get; }

    Task<ExternalCoverageTransferResponse> EnsureOrQueryAsync(
        ExternalCoverageTransferRequest request,
        CancellationToken cancellationToken = default);
}

public sealed record TenantContributionBalanceView(
    Guid ContractId,
    decimal InitialContributionRial,
    decimal ConfirmedReplenishmentsRial,
    decimal ConfirmedCoverageRial,
    decimal ReservedCoverageRial,
    decimal PostedBalanceRial,
    decimal AvailableForCoverageRial);

public sealed record CoveragePaymentView(
    Guid Id,
    Guid MonthlyObligationId,
    Guid PaymentInstructionId,
    MonthlyObligationComponentKind Kind,
    decimal AmountRial,
    string BeneficiaryId,
    CoveragePaymentStatus Status,
    string? ExternalReference,
    Guid? JournalEntryId,
    decimal? RemainingTenantContributionRial,
    DateTimeOffset UpdatedAtUtc);

public enum CoverMonthlyObligationOutcome
{
    Covered,
    AlreadyCovered,
    InsufficientTenantContribution,
    TransferFailed,
    Indeterminate,
    NotFound,
    InvalidState,
}

public sealed record CoverMonthlyObligationResult(
    CoverMonthlyObligationOutcome Outcome,
    Guid? MonthlyObligationId,
    TenantContributionBalanceView? Balance,
    IReadOnlyList<CoveragePaymentView> CoveragePayments);

public sealed record TenantContributionReplenishmentView(
    Guid Id,
    Guid ContractId,
    Guid ExternalTransactionId,
    Guid JournalEntryId,
    decimal AmountRial,
    decimal RemainingTenantContributionRial,
    string ExternalReference,
    DateTimeOffset ReplenishedAtUtc);

public enum PostConfirmedReplenishmentOutcome
{
    Posted,
    AlreadyPosted,
    NotFound,
    InvalidState,
}

public sealed record PostConfirmedReplenishmentResult(
    PostConfirmedReplenishmentOutcome Outcome,
    TenantContributionReplenishmentView? Replenishment,
    TenantContributionBalanceView? Balance);

public interface ITenantContributionCoverageService
{
    Task<CoverMonthlyObligationResult> CoverAsync(
        Guid monthlyObligationId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default);

    Task<TenantContributionBalanceView?> GetBalanceAsync(
        Guid contractId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Posts a replenishment only after another trusted integration has persisted a succeeded
    /// external transaction with operation type tenant_contribution_replenishment.
    /// This method does not infer or manufacture external payment success.
    /// </summary>
    Task<PostConfirmedReplenishmentResult> PostConfirmedReplenishmentAsync(
        Guid externalTransactionId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default);
}
