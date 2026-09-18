using Charkhoone.Domain.CreditApplications;

namespace Charkhoone.Application.CreditApplications;

public sealed record CreditApplicationView(
    Guid Id,
    CreditApplicationStatus Status,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);

public enum SubmitCreditApplicationOutcome
{
    Submitted,
    AlreadySubmitted,
    NotFound,
    InvalidState,
}

public sealed record SubmitCreditApplicationResult(
    SubmitCreditApplicationOutcome Outcome,
    CreditApplicationView? Application);

public enum SelectBankLoanPlanOutcome
{
    Selected,
    AlreadySelected,
    NotFound,
    PlanNotFound,
    PlanUnavailable,
    Conflict,
    InvalidState,
}

public sealed record BankLoanPlanSelectionView(
    Guid CreditApplicationId,
    CreditApplicationStatus ApplicationStatus,
    Guid PlanId,
    string PlanVersion,
    string BankId,
    string Title,
    DateTimeOffset UpdatedAtUtc);

public sealed record SelectBankLoanPlanResult(
    SelectBankLoanPlanOutcome Outcome,
    BankLoanPlanSelectionView? Selection);


public enum ListBankLoanPlansOutcome
{
    Available,
    NotFound,
    InvalidState,
}

public sealed record BankLoanPlanListItem(
    Guid PlanId,
    string Version,
    string BankId,
    string Title,
    string InterestTerms,
    int TermMonths);

public sealed record ListBankLoanPlansResult(
    ListBankLoanPlansOutcome Outcome,
    Guid CreditApplicationId,
    CreditApplicationStatus? ApplicationStatus,
    IReadOnlyList<BankLoanPlanListItem> Plans);

public interface IBankLoanPlanReadService
{
    Task<ListBankLoanPlansResult> ListAvailableAsync(
        Guid applicationId,
        Guid applicantUserId,
        CancellationToken cancellationToken = default);
}

public interface IUserIdentityLookup
{
    Task<Guid?> FindInternalUserIdAsync(
        string oidcSubject,
        CancellationToken cancellationToken = default);
}

public interface ICreditApplicationService
{
    Task<CreditApplicationView> CreateDraftAsync(
        Guid applicantUserId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default);

    Task<SubmitCreditApplicationResult> SubmitAsync(
        Guid applicationId,
        Guid applicantUserId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default);

    Task<SelectBankLoanPlanResult> SelectBankLoanPlanAsync(
        Guid applicationId,
        Guid applicantUserId,
        Guid planId,
        string planVersion,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default);
}
