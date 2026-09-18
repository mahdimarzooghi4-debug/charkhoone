using System.Globalization;
using System.Text.Json;
using Charkhoone.Application.Contracts;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.Finance;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Infrastructure.Contracts;

public sealed class EfLeaseContractTermsService(CharkhooneDbContext dbContext)
    : ILeaseContractTermsService
{
    private const string CalendarName = "Persian";
    private const int RequiredTermMonths = 12;
    private const string ActorId = "system:contract-registration";
    private static readonly PersianCalendar PersianCalendar = new();

    public async Task<CaptureLeaseContractTermsResult> CaptureAsync(
        CaptureLeaseContractTermsCommand command,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default)
    {
        ValidateCommand(command);

        var normalizedOwnerBeneficiaryId = command.OwnerBeneficiaryId.Trim();
        var normalizedBankBeneficiaryId = command.BankBeneficiaryId.Trim();
        var normalizedSourceReference = command.SourceReference.Trim();
        var fullDepositEquivalentRial = FullDepositCalculator.Calculate(
            command.CashDepositRial,
            command.MonthlyRentRial);
        if (fullDepositEquivalentRial <= 0m)
        {
            throw new ArgumentOutOfRangeException(
                nameof(command),
                "Contract full-deposit equivalent must be positive.");
        }

        var normalizedSchedule = command.ScheduleMonths
            .OrderBy(x => x.ContractMonthNumber)
            .Select(x => new LeaseContractScheduleMonthInput(
                x.ContractMonthNumber,
                x.DueAtUtc,
                x.OwnerPaymentRial,
                x.BankInterestRial))
            .ToArray();

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var contract = await dbContext.LeaseContracts
            .FromSqlInterpolated($"SELECT * FROM lease_contracts WHERE \"Id\" = {command.ContractId} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);
        if (contract is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return new CaptureLeaseContractTermsResult(
                CaptureLeaseContractTermsOutcome.NotFound,
                null);
        }

        var existing = await dbContext.LeaseContractTerms
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.ContractId == contract.Id, cancellationToken);
        if (existing is not null)
        {
            var existingSnapshot = await LoadSnapshotAsync(contract.Id, cancellationToken);
            await transaction.RollbackAsync(cancellationToken);

            return new CaptureLeaseContractTermsResult(
                SnapshotMatches(
                    existingSnapshot!,
                    command,
                    fullDepositEquivalentRial,
                    normalizedOwnerBeneficiaryId,
                    normalizedBankBeneficiaryId,
                    normalizedSourceReference,
                    normalizedSchedule)
                    ? CaptureLeaseContractTermsOutcome.Existing
                    : CaptureLeaseContractTermsOutcome.Conflict,
                existingSnapshot);
        }

        if (contract.Status is not (
            LeaseContractStatus.Draft
            or LeaseContractStatus.AwaitingFunding
            or LeaseContractStatus.AwaitingCompletion))
        {
            await transaction.RollbackAsync(cancellationToken);
            return new CaptureLeaseContractTermsResult(
                CaptureLeaseContractTermsOutcome.InvalidState,
                null);
        }

        if (contract.CreditApplicationId is not null)
        {
            var eligibility = await dbContext.CreditEligibilityAssessments
                .AsNoTracking()
                .SingleOrDefaultAsync(
                    x => x.CreditApplicationId == contract.CreditApplicationId.Value,
                    cancellationToken);
            if (eligibility is not null
                && eligibility.FullDepositEquivalentRial != fullDepositEquivalentRial)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new CaptureLeaseContractTermsResult(
                    CaptureLeaseContractTermsOutcome.Conflict,
                    null);
            }
        }

        var allocation = await dbContext.FundingAllocations
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.ContractId == contract.Id, cancellationToken);
        if (allocation is not null
            && allocation.FullDepositEquivalentRial != fullDepositEquivalentRial)
        {
            await transaction.RollbackAsync(cancellationToken);
            return new CaptureLeaseContractTermsResult(
                CaptureLeaseContractTermsOutcome.Conflict,
                null);
        }

        var terms = new LeaseContractTermsRow
        {
            ContractId = contract.Id,
            Calendar = CalendarName,
            PersianStartYear = command.PersianStartYear,
            PersianStartMonth = command.PersianStartMonth,
            PersianStartDay = command.PersianStartDay,
            TermMonths = RequiredTermMonths,
            CashDepositRial = command.CashDepositRial,
            MonthlyRentRial = command.MonthlyRentRial,
            FullDepositEquivalentRial = fullDepositEquivalentRial,
            OwnerBeneficiaryId = normalizedOwnerBeneficiaryId,
            BankBeneficiaryId = normalizedBankBeneficiaryId,
            SourceReference = normalizedSourceReference,
            CapturedAtUtc = occurredAtUtc,
        };
        dbContext.LeaseContractTerms.Add(terms);

        foreach (var month in normalizedSchedule)
        {
            dbContext.LeaseContractScheduleMonths.Add(new LeaseContractScheduleMonthRow
            {
                ContractId = contract.Id,
                ContractMonthNumber = month.ContractMonthNumber,
                DueAtUtc = month.DueAtUtc,
                OwnerPaymentRial = month.OwnerPaymentRial,
                BankInterestRial = month.BankInterestRial,
            });
        }

        const string reason =
            "Trusted Persian-calendar lease terms and the exact 12-month payment schedule were captured before contract activation.";

        dbContext.AuditEvents.Add(new AuditEventRow
        {
            Id = Guid.NewGuid(),
            AggregateType = "LeaseContract",
            AggregateId = contract.Id,
            ActorId = ActorId,
            Action = "contract_terms_schedule_captured",
            Reason = reason,
            OccurredAtUtc = occurredAtUtc,
        });

        dbContext.OutboxMessages.Add(new OutboxMessageRow
        {
            Id = Guid.NewGuid(),
            OccurredAtUtc = occurredAtUtc,
            Type = "lease-contract.terms-schedule-captured.v1",
            PayloadJson = JsonSerializer.Serialize(new
            {
                contractId = contract.Id,
                calendar = CalendarName,
                persianStartYear = command.PersianStartYear,
                persianStartMonth = command.PersianStartMonth,
                persianStartDay = command.PersianStartDay,
                termMonths = RequiredTermMonths,
                cashDepositRial = command.CashDepositRial,
                monthlyRentRial = command.MonthlyRentRial,
                fullDepositEquivalentRial,
                ownerBeneficiaryId = normalizedOwnerBeneficiaryId,
                bankBeneficiaryId = normalizedBankBeneficiaryId,
                sourceReference = normalizedSourceReference,
                scheduleMonths = normalizedSchedule.Select(x => new
                {
                    contractMonthNumber = x.ContractMonthNumber,
                    dueAtUtc = x.DueAtUtc,
                    ownerPaymentRial = x.OwnerPaymentRial,
                    bankInterestRial = x.BankInterestRial,
                }),
                occurredAtUtc,
            }),
            AttemptCount = 0,
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return new CaptureLeaseContractTermsResult(
            CaptureLeaseContractTermsOutcome.Captured,
            await LoadSnapshotAsync(contract.Id, cancellationToken));
    }

    public Task<LeaseContractTermsSnapshot?> GetAsync(
        Guid contractId,
        CancellationToken cancellationToken = default)
    {
        if (contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract id is required.", nameof(contractId));
        }

        return LoadSnapshotAsync(contractId, cancellationToken);
    }

    private async Task<LeaseContractTermsSnapshot?> LoadSnapshotAsync(
        Guid contractId,
        CancellationToken cancellationToken)
    {
        var terms = await dbContext.LeaseContractTerms
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.ContractId == contractId, cancellationToken);
        if (terms is null)
        {
            return null;
        }

        var schedule = await dbContext.LeaseContractScheduleMonths
            .AsNoTracking()
            .Where(x => x.ContractId == contractId)
            .OrderBy(x => x.ContractMonthNumber)
            .Select(x => new LeaseContractScheduleMonthSnapshot(
                x.ContractMonthNumber,
                x.DueAtUtc,
                x.OwnerPaymentRial,
                x.BankInterestRial))
            .ToListAsync(cancellationToken);

        return new LeaseContractTermsSnapshot(
            terms.ContractId,
            terms.Calendar,
            terms.PersianStartYear,
            terms.PersianStartMonth,
            terms.PersianStartDay,
            terms.TermMonths,
            terms.CashDepositRial,
            terms.MonthlyRentRial,
            terms.FullDepositEquivalentRial,
            terms.OwnerBeneficiaryId,
            terms.BankBeneficiaryId,
            terms.SourceReference,
            terms.CapturedAtUtc,
            schedule);
    }

    private static bool SnapshotMatches(
        LeaseContractTermsSnapshot snapshot,
        CaptureLeaseContractTermsCommand command,
        decimal fullDepositEquivalentRial,
        string ownerBeneficiaryId,
        string bankBeneficiaryId,
        string sourceReference,
        IReadOnlyList<LeaseContractScheduleMonthInput> normalizedSchedule)
    {
        if (snapshot.Calendar != CalendarName
            || snapshot.PersianStartYear != command.PersianStartYear
            || snapshot.PersianStartMonth != command.PersianStartMonth
            || snapshot.PersianStartDay != command.PersianStartDay
            || snapshot.TermMonths != RequiredTermMonths
            || snapshot.CashDepositRial != command.CashDepositRial
            || snapshot.MonthlyRentRial != command.MonthlyRentRial
            || snapshot.FullDepositEquivalentRial != fullDepositEquivalentRial
            || snapshot.OwnerBeneficiaryId != ownerBeneficiaryId
            || snapshot.BankBeneficiaryId != bankBeneficiaryId
            || snapshot.SourceReference != sourceReference
            || snapshot.ScheduleMonths.Count != normalizedSchedule.Count)
        {
            return false;
        }

        return snapshot.ScheduleMonths
            .Zip(normalizedSchedule)
            .All(pair =>
                pair.First.ContractMonthNumber == pair.Second.ContractMonthNumber
                && pair.First.DueAtUtc == pair.Second.DueAtUtc
                && pair.First.OwnerPaymentRial == pair.Second.OwnerPaymentRial
                && pair.First.BankInterestRial == pair.Second.BankInterestRial);
    }

    private static void ValidateCommand(CaptureLeaseContractTermsCommand command)
    {
        ArgumentNullException.ThrowIfNull(command);

        if (command.ContractId == Guid.Empty)
        {
            throw new ArgumentException("Contract id is required.", nameof(command));
        }

        ArgumentException.ThrowIfNullOrWhiteSpace(command.OwnerBeneficiaryId);
        ArgumentException.ThrowIfNullOrWhiteSpace(command.BankBeneficiaryId);
        ArgumentException.ThrowIfNullOrWhiteSpace(command.SourceReference);

        RialAmountPolicy.RequireWholeNonNegative(command.CashDepositRial, nameof(command.CashDepositRial));
        RialAmountPolicy.RequireWholeNonNegative(command.MonthlyRentRial, nameof(command.MonthlyRentRial));

        if (command.ScheduleMonths is null || command.ScheduleMonths.Count != RequiredTermMonths)
        {
            throw new ArgumentException(
                "Exactly 12 schedule months are required.",
                nameof(command));
        }

        if (command.PersianYearOutOfRange())
        {
            throw new ArgumentOutOfRangeException(
                nameof(command),
                "Persian start year is outside the supported calendar range.");
        }

        var daysInStartMonth = PersianCalendar.GetDaysInMonth(
            command.PersianStartYear,
            command.PersianStartMonth);
        if (command.PersianStartDay < 1 || command.PersianStartDay > daysInStartMonth)
        {
            throw new ArgumentOutOfRangeException(
                nameof(command),
                "Persian start day is invalid for the specified Persian month.");
        }

        var ordered = command.ScheduleMonths
            .OrderBy(x => x.ContractMonthNumber)
            .ToArray();

        for (var index = 0; index < RequiredTermMonths; index++)
        {
            var month = ordered[index];
            var expectedMonth = index + 1;
            if (month.ContractMonthNumber != expectedMonth)
            {
                throw new ArgumentException(
                    "Schedule month numbers must be exactly 1 through 12.",
                    nameof(command));
            }

            RialAmountPolicy.RequireWholeNonNegative(month.OwnerPaymentRial, nameof(month.OwnerPaymentRial));
            RialAmountPolicy.RequireWholeNonNegative(month.BankInterestRial, nameof(month.BankInterestRial));

            if (month.OwnerPaymentRial == 0m && month.BankInterestRial == 0m)
            {
                throw new ArgumentException(
                    $"Schedule month {expectedMonth} must contain at least one positive payment component.",
                    nameof(command));
            }

            if (index > 0 && ordered[index - 1].DueAtUtc >= month.DueAtUtc)
            {
                throw new ArgumentException(
                    "Schedule due timestamps must be strictly increasing.",
                    nameof(command));
            }
        }
    }
}

file static class CaptureLeaseContractTermsCommandExtensions
{
    private static readonly PersianCalendar PersianCalendar = new();

    public static bool PersianYearOutOfRange(this CaptureLeaseContractTermsCommand command) =>
        command.PersianStartYear < 1
        || command.PersianStartYear > PersianCalendar.GetYear(PersianCalendar.MaxSupportedDateTime)
        || command.PersianStartMonth is < 1 or > 12;
}
