using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.Payments;

namespace Charkhoone.Application.Contracts;

public sealed record ContractAccessView(
    Guid ContractId,
    Guid TenantUserId,
    Guid OwnerUserId,
    LeaseContractStatus Status);

public sealed record ContractAuditEventView(
    Guid Id,
    string ActorId,
    string Action,
    string Reason,
    DateTimeOffset OccurredAtUtc);

public sealed record ContractAuditPage(
    IReadOnlyList<ContractAuditEventView> Items,
    int Page,
    int PageSize,
    int TotalCount)
{
    public bool HasNextPage => (long)Page * PageSize < TotalCount;
}

public sealed record ContractDelinquencyView(
    int ConsecutiveMissedMonths,
    bool CancellationRequired,
    DateTimeOffset UpdatedAtUtc);

public sealed record FrozenPrincipalReadView(
    string BankId,
    decimal AmountRial,
    string FundReference,
    DateTimeOffset FrozenAtUtc);

public sealed record TenantContributionBalanceView(
    decimal InitialAmountRial,
    decimal ConfirmedReplenishmentsRial,
    decimal ConfirmedCoverageRial,
    decimal AvailableBalanceRial,
    string FundReference,
    DateTimeOffset FundedAtUtc);

public sealed record ContractPaymentComponentView(
    Guid PaymentInstructionId,
    MonthlyObligationComponentKind Kind,
    string BeneficiaryId,
    decimal AmountRial,
    PaymentInstructionStatus PaymentStatus,
    ExternalTransactionStatus? ExternalTransactionStatus,
    string? Provider,
    string? ExternalReference,
    string? ReasonCode,
    DateTimeOffset UpdatedAtUtc);

public sealed record ContractMonthlyObligationView(
    Guid Id,
    int ContractMonthNumber,
    DateTimeOffset DueAtUtc,
    MonthlyObligationStatus Status,
    IReadOnlyList<ContractPaymentComponentView> Components,
    DateTimeOffset UpdatedAtUtc,
    DateTimeOffset? ClosedAtUtc);

public sealed record PaymentReconciliationAttentionView(
    Guid PaymentInstructionId,
    Guid MonthlyObligationId,
    int ContractMonthNumber,
    MonthlyObligationComponentKind Kind,
    decimal AmountRial,
    PaymentInstructionStatus PaymentStatus,
    ExternalTransactionStatus? ExternalTransactionStatus,
    string? Provider,
    string? ExternalReference,
    string? ReasonCode,
    DateTimeOffset UpdatedAtUtc);

public sealed record ContractNormalSettlementReadView(
    Guid Id,
    decimal BankPrincipalAmountRial,
    NormalSettlementTransferStatus BankPrincipalStatus,
    decimal TenantResidualAmountRial,
    NormalSettlementTransferStatus TenantResidualStatus,
    DateTimeOffset UpdatedAtUtc,
    DateTimeOffset? CompletedAtUtc);

public sealed record ContractDetailView(
    Guid ContractId,
    Guid TenantUserId,
    Guid OwnerUserId,
    Guid PropertyId,
    Guid? CreditApplicationId,
    LeaseContractStatus Status,
    Guid? BankLoanPlanId,
    string? BankLoanPlanVersion,
    string? CreditGradePolicyVersion,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc,
    ContractDelinquencyView? Delinquency,
    FrozenPrincipalReadView? FrozenPrincipal,
    TenantContributionBalanceView? TenantContribution,
    IReadOnlyList<ContractMonthlyObligationView> MonthlyObligations,
    IReadOnlyList<PaymentReconciliationAttentionView> PaymentsRequiringReconciliation,
    ContractNormalSettlementReadView? Settlement,
    int OpenLostFundReturnExposureCount);

public interface IContractReadService
{
    Task<ContractAccessView?> GetAccessibleContractAsync(
        Guid contractId,
        Guid requestingUserId,
        CancellationToken cancellationToken = default);

    Task<ContractDetailView?> GetDetailAsync(
        Guid contractId,
        Guid requestingUserId,
        CancellationToken cancellationToken = default);

    Task<ContractAuditPage?> GetAuditEventsAsync(
        Guid contractId,
        Guid requestingUserId,
        int page,
        int pageSize,
        string? action = null,
        CancellationToken cancellationToken = default);
}
