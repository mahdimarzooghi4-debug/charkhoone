namespace Charkhoone.Application.Contracts;

public sealed record LeaseContractScheduleMonthInput(
    int ContractMonthNumber,
    DateTimeOffset DueAtUtc,
    decimal OwnerPaymentRial,
    decimal BankInterestRial);

public sealed record CaptureLeaseContractTermsCommand(
    Guid ContractId,
    int PersianStartYear,
    int PersianStartMonth,
    int PersianStartDay,
    decimal CashDepositRial,
    decimal MonthlyRentRial,
    string OwnerBeneficiaryId,
    string BankBeneficiaryId,
    string SourceReference,
    IReadOnlyList<LeaseContractScheduleMonthInput> ScheduleMonths);

public sealed record LeaseContractScheduleMonthSnapshot(
    int ContractMonthNumber,
    DateTimeOffset DueAtUtc,
    decimal OwnerPaymentRial,
    decimal BankInterestRial);

public sealed record LeaseContractTermsSnapshot(
    Guid ContractId,
    string Calendar,
    int PersianStartYear,
    int PersianStartMonth,
    int PersianStartDay,
    int TermMonths,
    decimal CashDepositRial,
    decimal MonthlyRentRial,
    decimal FullDepositEquivalentRial,
    string OwnerBeneficiaryId,
    string BankBeneficiaryId,
    string SourceReference,
    DateTimeOffset CapturedAtUtc,
    IReadOnlyList<LeaseContractScheduleMonthSnapshot> ScheduleMonths);

public enum CaptureLeaseContractTermsOutcome
{
    Captured,
    Existing,
    Conflict,
    NotFound,
    InvalidState,
}

public sealed record CaptureLeaseContractTermsResult(
    CaptureLeaseContractTermsOutcome Outcome,
    LeaseContractTermsSnapshot? Snapshot);

public interface ILeaseContractTermsService
{
    Task<CaptureLeaseContractTermsResult> CaptureAsync(
        CaptureLeaseContractTermsCommand command,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default);

    Task<LeaseContractTermsSnapshot?> GetAsync(
        Guid contractId,
        CancellationToken cancellationToken = default);
}
