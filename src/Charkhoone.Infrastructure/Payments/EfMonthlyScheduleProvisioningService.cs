using System.Text.Json;
using Charkhoone.Application.Payments;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Infrastructure.Payments;

public sealed class EfMonthlyScheduleProvisioningService(CharkhooneDbContext dbContext)
    : IMonthlyScheduleProvisioningService
{
    private const string ActorId = "system:monthly-schedule-provisioning";
    private const string ProvisionedAuditAction = "monthly_schedule_provisioned";
    private const string ConflictAuditAction = "monthly_schedule_provisioning_conflict";

    public async Task<ProvisionMonthlyScheduleResult> ProvisionAsync(
        Guid contractId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default)
    {
        if (contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract id is required.", nameof(contractId));
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var contract = await dbContext.LeaseContracts
            .FromSqlInterpolated($"SELECT * FROM lease_contracts WHERE \"Id\" = {contractId} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);
        if (contract is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return new ProvisionMonthlyScheduleResult(
                ProvisionMonthlyScheduleOutcome.ContractNotFound,
                contractId,
                0,
                0);
        }

        if (contract.Status != LeaseContractStatus.Active)
        {
            await transaction.RollbackAsync(cancellationToken);
            return new ProvisionMonthlyScheduleResult(
                ProvisionMonthlyScheduleOutcome.InvalidContractState,
                contract.Id,
                0,
                0);
        }

        var terms = await dbContext.LeaseContractTerms
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.ContractId == contract.Id, cancellationToken);
        if (terms is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return new ProvisionMonthlyScheduleResult(
                ProvisionMonthlyScheduleOutcome.TermsMissing,
                contract.Id,
                0,
                0);
        }

        var schedule = await dbContext.LeaseContractScheduleMonths
            .AsNoTracking()
            .Where(x => x.ContractId == contract.Id)
            .OrderBy(x => x.ContractMonthNumber)
            .ToListAsync(cancellationToken);

        if (!HasValidSnapshot(terms, schedule))
        {
            return await ConflictAsync(
                contract.Id,
                "The trusted contract schedule snapshot is incomplete or invalid and cannot be materialized.",
                occurredAtUtc,
                0,
                cancellationToken);
        }

        var existingObligations = await dbContext.MonthlyObligations
            .Where(x => x.ContractId == contract.Id)
            .OrderBy(x => x.ContractMonthNumber)
            .ToListAsync(cancellationToken);

        if (existingObligations.Any(x => x.ContractMonthNumber is < 1 or > 12))
        {
            return await ConflictAsync(
                contract.Id,
                "Existing monthly obligations contain a contract month outside the immutable 1 through 12 schedule.",
                occurredAtUtc,
                existingObligations.Count,
                cancellationToken);
        }

        var existingIds = existingObligations.Select(x => x.Id).ToArray();
        var existingComponents = existingIds.Length == 0
            ? []
            : await (
                from component in dbContext.MonthlyObligationComponents.AsNoTracking()
                join payment in dbContext.PaymentInstructions.AsNoTracking()
                    on component.PaymentInstructionId equals payment.Id
                where existingIds.Contains(component.MonthlyObligationId)
                select new ExistingComponent(
                    component.MonthlyObligationId,
                    component.Kind,
                    payment.DueAtUtc,
                    payment.BeneficiaryId,
                    payment.AmountRial,
                    payment.IdempotencyKey))
                .ToListAsync(cancellationToken);

        foreach (var obligation in existingObligations)
        {
            var expected = schedule[obligation.ContractMonthNumber - 1];
            if (!MatchesSnapshot(
                    obligation,
                    expected,
                    terms.OwnerBeneficiaryId,
                    terms.BankBeneficiaryId,
                    existingComponents))
            {
                return await ConflictAsync(
                    contract.Id,
                    $"Existing contract month {obligation.ContractMonthNumber} does not match the trusted immutable schedule snapshot.",
                    occurredAtUtc,
                    existingObligations.Count,
                    cancellationToken);
            }
        }

        var provisionedAuditExists = await dbContext.AuditEvents
            .AsNoTracking()
            .AnyAsync(
                x => x.AggregateType == "LeaseContract"
                    && x.AggregateId == contract.Id
                    && x.Action == ProvisionedAuditAction,
                cancellationToken);

        var existingMonths = existingObligations
            .Select(x => x.ContractMonthNumber)
            .ToHashSet();

        var createdCount = 0;
        foreach (var month in schedule)
        {
            if (existingMonths.Contains(month.ContractMonthNumber))
            {
                continue;
            }

            var obligation = new MonthlyObligationRow
            {
                Id = Guid.NewGuid(),
                ContractId = contract.Id,
                ContractMonthNumber = month.ContractMonthNumber,
                DueAtUtc = month.DueAtUtc,
                Status = MonthlyObligationStatus.Open,
                CreatedAtUtc = occurredAtUtc,
                UpdatedAtUtc = occurredAtUtc,
            };
            dbContext.MonthlyObligations.Add(obligation);

            if (month.OwnerPaymentRial > 0m)
            {
                AddPaymentInstruction(
                    obligation,
                    MonthlyObligationComponentKind.OwnerPayment,
                    terms.OwnerBeneficiaryId,
                    month.OwnerPaymentRial,
                    occurredAtUtc);
            }

            if (month.BankInterestRial > 0m)
            {
                AddPaymentInstruction(
                    obligation,
                    MonthlyObligationComponentKind.BankInterest,
                    terms.BankBeneficiaryId,
                    month.BankInterestRial,
                    occurredAtUtc);
            }

            AddAudit(
                contract.Id,
                "monthly_obligation_created",
                $"Contract month {month.ContractMonthNumber} was materialized exactly from trusted immutable schedule amounts.",
                occurredAtUtc);
            createdCount++;
        }

        if (!await dbContext.ContractDelinquencies.AnyAsync(
                x => x.ContractId == contract.Id,
                cancellationToken))
        {
            dbContext.ContractDelinquencies.Add(new ContractDelinquencyRow
            {
                ContractId = contract.Id,
                ConsecutiveMissedMonths = 0,
                CancellationRequired = false,
                UpdatedAtUtc = occurredAtUtc,
            });
        }

        if (!provisionedAuditExists)
        {
            AddAudit(
                contract.Id,
                ProvisionedAuditAction,
                "All 12 contractual months match the trusted immutable schedule snapshot and are materialized for payment processing.",
                occurredAtUtc);

            AddOutbox(
                "lease-contract.monthly-schedule-provisioned.v1",
                occurredAtUtc,
                new
                {
                    contractId = contract.Id,
                    sourceReference = terms.SourceReference,
                    capturedAtUtc = terms.CapturedAtUtc,
                    createdObligationCount = createdCount,
                    existingObligationCount = existingObligations.Count,
                    schedule = schedule.Select(x => new
                    {
                        contractMonthNumber = x.ContractMonthNumber,
                        dueAtUtc = x.DueAtUtc,
                        ownerBeneficiaryId = terms.OwnerBeneficiaryId,
                        ownerPaymentRial = x.OwnerPaymentRial,
                        bankBeneficiaryId = terms.BankBeneficiaryId,
                        bankInterestRial = x.BankInterestRial,
                    }),
                    occurredAtUtc,
                });
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return new ProvisionMonthlyScheduleResult(
            createdCount > 0 || !provisionedAuditExists
                ? ProvisionMonthlyScheduleOutcome.Provisioned
                : ProvisionMonthlyScheduleOutcome.AlreadyProvisioned,
            contract.Id,
            createdCount,
            existingObligations.Count);
    }

    private async Task<ProvisionMonthlyScheduleResult> ConflictAsync(
        Guid contractId,
        string reason,
        DateTimeOffset occurredAtUtc,
        int existingObligationCount,
        CancellationToken cancellationToken)
    {
        var alreadyRecorded = await dbContext.AuditEvents
            .AsNoTracking()
            .AnyAsync(
                x => x.AggregateType == "LeaseContract"
                    && x.AggregateId == contractId
                    && x.Action == ConflictAuditAction,
                cancellationToken);

        if (!alreadyRecorded)
        {
            AddAudit(contractId, ConflictAuditAction, reason, occurredAtUtc);
            AddOutbox(
                "lease-contract.monthly-schedule-provisioning-review-required.v1",
                occurredAtUtc,
                new
                {
                    contractId,
                    reason,
                    occurredAtUtc,
                });
            await dbContext.SaveChangesAsync(cancellationToken);
            await dbContext.Database.CommitTransactionAsync(cancellationToken);
        }
        else
        {
            await dbContext.Database.RollbackTransactionAsync(cancellationToken);
        }

        return new ProvisionMonthlyScheduleResult(
            ProvisionMonthlyScheduleOutcome.Conflict,
            contractId,
            0,
            existingObligationCount);
    }

    private void AddPaymentInstruction(
        MonthlyObligationRow obligation,
        MonthlyObligationComponentKind kind,
        string beneficiaryId,
        decimal amountRial,
        DateTimeOffset occurredAtUtc)
    {
        var instruction = new PaymentInstructionRow
        {
            Id = Guid.NewGuid(),
            ObligationId = obligation.Id,
            DueAtUtc = obligation.DueAtUtc,
            BeneficiaryId = beneficiaryId.Trim(),
            AmountRial = amountRial,
            IdempotencyKey = PaymentInstructionKey(
                obligation.ContractId,
                obligation.ContractMonthNumber,
                kind),
            Status = PaymentInstructionStatus.Created,
            CreatedAtUtc = occurredAtUtc,
            UpdatedAtUtc = occurredAtUtc,
        };
        dbContext.PaymentInstructions.Add(instruction);
        dbContext.MonthlyObligationComponents.Add(new MonthlyObligationComponentRow
        {
            PaymentInstructionId = instruction.Id,
            MonthlyObligationId = obligation.Id,
            Kind = kind,
        });
    }

    private void AddAudit(
        Guid contractId,
        string action,
        string reason,
        DateTimeOffset occurredAtUtc) =>
        dbContext.AuditEvents.Add(new AuditEventRow
        {
            Id = Guid.NewGuid(),
            AggregateType = "LeaseContract",
            AggregateId = contractId,
            ActorId = ActorId,
            Action = action,
            Reason = reason,
            OccurredAtUtc = occurredAtUtc,
        });

    private void AddOutbox(string type, DateTimeOffset occurredAtUtc, object payload) =>
        dbContext.OutboxMessages.Add(new OutboxMessageRow
        {
            Id = Guid.NewGuid(),
            OccurredAtUtc = occurredAtUtc,
            Type = type,
            PayloadJson = JsonSerializer.Serialize(payload),
            AttemptCount = 0,
        });

    private static bool HasValidSnapshot(
        LeaseContractTermsRow terms,
        IReadOnlyList<LeaseContractScheduleMonthRow> schedule)
    {
        if (terms.Calendar != "Persian"
            || terms.TermMonths != 12
            || string.IsNullOrWhiteSpace(terms.OwnerBeneficiaryId)
            || string.IsNullOrWhiteSpace(terms.BankBeneficiaryId)
            || string.IsNullOrWhiteSpace(terms.SourceReference)
            || schedule.Count != 12)
        {
            return false;
        }

        for (var index = 0; index < schedule.Count; index++)
        {
            var month = schedule[index];
            if (month.ContractMonthNumber != index + 1
                || month.OwnerPaymentRial < 0m
                || month.BankInterestRial < 0m
                || month.OwnerPaymentRial != decimal.Truncate(month.OwnerPaymentRial)
                || month.BankInterestRial != decimal.Truncate(month.BankInterestRial)
                || (month.OwnerPaymentRial == 0m && month.BankInterestRial == 0m)
                || (index > 0 && schedule[index - 1].DueAtUtc >= month.DueAtUtc))
            {
                return false;
            }
        }

        return true;
    }

    private static bool MatchesSnapshot(
        MonthlyObligationRow obligation,
        LeaseContractScheduleMonthRow expected,
        string ownerBeneficiaryId,
        string bankBeneficiaryId,
        IReadOnlyList<ExistingComponent> components)
    {
        if (obligation.DueAtUtc != expected.DueAtUtc)
        {
            return false;
        }

        var actual = components
            .Where(x => x.MonthlyObligationId == obligation.Id)
            .ToArray();
        var expectedCount =
            (expected.OwnerPaymentRial > 0m ? 1 : 0)
            + (expected.BankInterestRial > 0m ? 1 : 0);
        if (actual.Length != expectedCount)
        {
            return false;
        }

        return MatchesComponent(
                actual,
                obligation.ContractId,
                expected.ContractMonthNumber,
                MonthlyObligationComponentKind.OwnerPayment,
                expected.DueAtUtc,
                ownerBeneficiaryId,
                expected.OwnerPaymentRial)
            && MatchesComponent(
                actual,
                obligation.ContractId,
                expected.ContractMonthNumber,
                MonthlyObligationComponentKind.BankInterest,
                expected.DueAtUtc,
                bankBeneficiaryId,
                expected.BankInterestRial);
    }

    private static bool MatchesComponent(
        IReadOnlyCollection<ExistingComponent> components,
        Guid contractId,
        int contractMonthNumber,
        MonthlyObligationComponentKind kind,
        DateTimeOffset dueAtUtc,
        string beneficiaryId,
        decimal amountRial)
    {
        if (amountRial == 0m)
        {
            return true;
        }

        var component = components.SingleOrDefault(x => x.Kind == kind);
        return component is not null
            && component.DueAtUtc == dueAtUtc
            && component.BeneficiaryId == beneficiaryId.Trim()
            && component.AmountRial == amountRial
            && component.IdempotencyKey == PaymentInstructionKey(
                contractId,
                contractMonthNumber,
                kind);
    }

    private static string PaymentInstructionKey(
        Guid contractId,
        int contractMonthNumber,
        MonthlyObligationComponentKind kind) =>
        $"monthly-obligation:{contractId:D}:{contractMonthNumber}:{kind}:v1".ToLowerInvariant();

    private sealed record ExistingComponent(
        Guid MonthlyObligationId,
        MonthlyObligationComponentKind Kind,
        DateTimeOffset DueAtUtc,
        string BeneficiaryId,
        decimal AmountRial,
        string IdempotencyKey);
}
