using Charkhoone.Domain.Payments;

namespace Charkhoone.Application.Payments;

public enum ExternalPaymentReconciliationStatus
{
    Succeeded,
    Failed,
    Indeterminate,
}

public sealed record ExternalPaymentReconciliationRequest(
    Guid PaymentInstructionId,
    Guid MonthlyObligationId,
    Guid ContractId,
    string BeneficiaryId,
    decimal ExpectedAmountRial);

public sealed record ExternalPaymentReconciliationResponse(
    ExternalPaymentReconciliationStatus Status,
    string Provider,
    decimal? ConfirmedAmountRial = null,
    string? ExternalReference = null,
    string? ReasonCode = null);

public interface IExternalPaymentReconciliationAdapter
{
    string Provider { get; }

    Task<ExternalPaymentReconciliationResponse> QueryAsync(
        ExternalPaymentReconciliationRequest request,
        CancellationToken cancellationToken = default);
}

public sealed record MonthlyObligationSetup(
    Guid ContractId,
    int ContractMonthNumber,
    DateTimeOffset DueAtUtc,
    string OwnerBeneficiaryId,
    decimal OwnerPaymentRial,
    string BankBeneficiaryId,
    decimal BankInterestRial);

public sealed record MonthlyObligationView(
    Guid Id,
    Guid ContractId,
    int ContractMonthNumber,
    DateTimeOffset DueAtUtc,
    MonthlyObligationStatus Status,
    int ConsecutiveMissedMonths,
    bool CancellationRequired,
    DateTimeOffset UpdatedAtUtc);

public enum EnsureMonthlyObligationOutcome
{
    Created,
    Existing,
    Conflict,
    ContractNotFound,
    InvalidContractState,
}

public sealed record EnsureMonthlyObligationResult(
    EnsureMonthlyObligationOutcome Outcome,
    MonthlyObligationView? Obligation);

public enum CloseMonthlyObligationOutcome
{
    Paid,
    Missed,
    AlreadyClosed,
    ReconciliationRequired,
    NotFound,
    InvalidState,
}

public sealed record CloseMonthlyObligationResult(
    CloseMonthlyObligationOutcome Outcome,
    MonthlyObligationView? Obligation);

public interface IMonthlyObligationService
{
    Task<EnsureMonthlyObligationResult> EnsureAsync(
        MonthlyObligationSetup setup,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default);

    Task<CloseMonthlyObligationResult> CloseAsync(
        Guid obligationId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default);
}

public enum ReconcilePaymentOutcome
{
    Reconciled,
    AlreadyReconciled,
    Failed,
    Indeterminate,
    ArrearsOutstanding,
    NotFound,
    InvalidState,
}

public sealed record PaymentReconciliationView(
    Guid PaymentInstructionId,
    Guid MonthlyObligationId,
    Guid ContractId,
    decimal AmountRial,
    string BeneficiaryId,
    PaymentInstructionStatus PaymentStatus,
    MonthlyObligationStatus ObligationStatus,
    string? ExternalReference,
    int ConsecutiveMissedMonths,
    bool CancellationRequired,
    DateTimeOffset UpdatedAtUtc);

public sealed record ReconcilePaymentResult(
    ReconcilePaymentOutcome Outcome,
    PaymentReconciliationView? Payment);

public interface IPaymentReconciliationService
{
    Task<ReconcilePaymentResult> ReconcileAsync(
        Guid paymentInstructionId,
        Guid requestingUserId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default);
}
