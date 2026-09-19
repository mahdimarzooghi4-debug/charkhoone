using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Payments;

namespace Charkhoone.Application.Mobile;

public sealed record MobileSelectedPlanSummary(
    Guid PlanId,
    string Version,
    string BankId,
    string Title,
    string InterestTerms,
    int TermMonths);

public sealed record MobileBankApprovalSummary(
    string Provider,
    string Status,
    decimal MaximumEligibleLoanRial,
    decimal? ApprovedLoanRial,
    string? ReasonCode,
    DateTimeOffset UpdatedAtUtc);

public sealed record MobileFundingAllocationSummary(
    Guid ContractId,
    string BankId,
    decimal FullDepositEquivalentRial,
    decimal MaximumEligibleLoanRial,
    decimal BankApprovedLoanRial,
    decimal TenantContributionRial,
    DateTimeOffset UpdatedAtUtc);

public sealed record MobileCreditApplicationSummary(
    Guid CreditApplicationId,
    CreditApplicationStatus Status,
    DateTimeOffset UpdatedAtUtc,
    MobileSelectedPlanSummary? SelectedPlan,
    MobileBankApprovalSummary? BankApproval,
    MobileFundingAllocationSummary? FundingAllocation);

public sealed record MobileContractTermsSummary(
    Guid ContractId,
    string Calendar,
    int PersianStartYear,
    int PersianStartMonth,
    int PersianStartDay,
    int TermMonths,
    decimal CashDepositRial,
    decimal MonthlyRentRial,
    decimal FullDepositEquivalentRial,
    DateTimeOffset CapturedAtUtc);

public sealed record MobileContractSummary(
    Guid ContractId,
    string Role,
    LeaseContractStatus Status,
    decimal? MonthlyRentRial,
    DateTimeOffset UpdatedAtUtc,
    MobileContractTermsSummary? Terms);

public sealed record MobilePaymentSummary(
    Guid PaymentInstructionId,
    Guid MonthlyObligationId,
    Guid ContractId,
    int ContractMonthNumber,
    MonthlyObligationComponentKind Kind,
    DateTimeOffset DueAtUtc,
    decimal AmountRial,
    PaymentInstructionStatus Status,
    DateTimeOffset UpdatedAtUtc);

public sealed record MobileBootstrapView(
    Guid UserId,
    MobileCreditApplicationSummary? LatestCreditApplication,
    IReadOnlyList<MobileContractSummary> Contracts,
    IReadOnlyList<MobilePaymentSummary> Payments);

public interface IMobileBootstrapService
{
    Task<MobileBootstrapView> GetAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
}
