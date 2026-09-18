using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Payments;

namespace Charkhoone.Application.Mobile;

public sealed record MobileCreditApplicationSummary(
    Guid CreditApplicationId,
    CreditApplicationStatus Status,
    DateTimeOffset UpdatedAtUtc);

public sealed record MobileContractSummary(
    Guid ContractId,
    string Role,
    LeaseContractStatus Status,
    decimal? MonthlyRentRial,
    DateTimeOffset UpdatedAtUtc);

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
