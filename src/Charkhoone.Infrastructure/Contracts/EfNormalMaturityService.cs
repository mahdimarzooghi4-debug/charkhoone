using System.Text.Json;
using Charkhoone.Application.Contracts;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Infrastructure.Contracts;

public sealed class EfNormalMaturityService(CharkhooneDbContext dbContext)
    : INormalMaturityService
{
    private const int ContractMonthCount = 12;

    public async Task<PrepareNormalMaturityResult> PrepareAsync(
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
            return new PrepareNormalMaturityResult(
                PrepareNormalMaturityOutcome.NotFound,
                contractId);
        }

        if (contract.Status is LeaseContractStatus.SettlementPending or LeaseContractStatus.Settled)
        {
            await transaction.RollbackAsync(cancellationToken);
            return new PrepareNormalMaturityResult(
                PrepareNormalMaturityOutcome.AlreadyPrepared,
                contract.Id);
        }

        if (contract.Status != LeaseContractStatus.Active)
        {
            await transaction.RollbackAsync(cancellationToken);
            return new PrepareNormalMaturityResult(
                PrepareNormalMaturityOutcome.InvalidState,
                contract.Id);
        }

        var obligations = await dbContext.MonthlyObligations
            .Where(x => x.ContractId == contract.Id)
            .OrderBy(x => x.ContractMonthNumber)
            .ToListAsync(cancellationToken);

        if (obligations.Count != ContractMonthCount
            || !obligations.Select(x => x.ContractMonthNumber)
                .SequenceEqual(Enumerable.Range(1, ContractMonthCount)))
        {
            await transaction.RollbackAsync(cancellationToken);
            return new PrepareNormalMaturityResult(
                PrepareNormalMaturityOutcome.NotMature,
                contract.Id);
        }

        var finalMonth = obligations[^1];
        if (finalMonth.DueAtUtc > occurredAtUtc
            || finalMonth.ClosedAtUtc is null
            || finalMonth.ClosedAtUtc > occurredAtUtc
            || obligations.Any(x =>
                x.ClosedAtUtc is null
                || x.Status is MonthlyObligationStatus.Open or MonthlyObligationStatus.Missed))
        {
            await transaction.RollbackAsync(cancellationToken);
            return new PrepareNormalMaturityResult(
                PrepareNormalMaturityOutcome.NotMature,
                contract.Id,
                finalMonth.DueAtUtc,
                finalMonth.ClosedAtUtc);
        }

        var delinquency = await dbContext.ContractDelinquencies
            .SingleOrDefaultAsync(x => x.ContractId == contract.Id, cancellationToken);
        if (delinquency?.CancellationRequired == true
            || delinquency?.ConsecutiveMissedMonths >= ConsecutiveMissedMonths.CancellationThreshold)
        {
            await transaction.RollbackAsync(cancellationToken);
            return new PrepareNormalMaturityResult(
                PrepareNormalMaturityOutcome.Blocked,
                contract.Id,
                finalMonth.DueAtUtc,
                finalMonth.ClosedAtUtc);
        }

        if (await dbContext.CancellationSettlements.AnyAsync(
                x => x.ContractId == contract.Id,
                cancellationToken)
            || await dbContext.NormalSettlements.AnyAsync(
                x => x.ContractId == contract.Id,
                cancellationToken))
        {
            await transaction.RollbackAsync(cancellationToken);
            return new PrepareNormalMaturityResult(
                PrepareNormalMaturityOutcome.Blocked,
                contract.Id,
                finalMonth.DueAtUtc,
                finalMonth.ClosedAtUtc);
        }

        var coveredObligationIds = obligations
            .Where(x => x.Status == MonthlyObligationStatus.Covered)
            .Select(x => x.Id)
            .ToArray();
        if (coveredObligationIds.Length > 0)
        {
            var coveredWithSucceededTransferCount = await dbContext.CoveragePayments
                .Where(x => coveredObligationIds.Contains(x.MonthlyObligationId)
                    && x.Status == CoveragePaymentStatus.Succeeded)
                .Select(x => x.MonthlyObligationId)
                .Distinct()
                .CountAsync(cancellationToken);

            if (coveredWithSucceededTransferCount != coveredObligationIds.Length)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new PrepareNormalMaturityResult(
                    PrepareNormalMaturityOutcome.Blocked,
                    contract.Id,
                    finalMonth.DueAtUtc,
                    finalMonth.ClosedAtUtc);
            }
        }

        var hasUnresolvedCoverage = await dbContext.CoveragePayments
            .AnyAsync(
                x => x.ContractId == contract.Id
                    && x.Status != CoveragePaymentStatus.Succeeded,
                cancellationToken);
        if (hasUnresolvedCoverage)
        {
            await transaction.RollbackAsync(cancellationToken);
            return new PrepareNormalMaturityResult(
                PrepareNormalMaturityOutcome.Blocked,
                contract.Id,
                finalMonth.DueAtUtc,
                finalMonth.ClosedAtUtc);
        }

        var hasOpenLostFundReturn = await dbContext.LostFundReturns
            .AnyAsync(
                x => x.ContractId == contract.Id
                    && x.CalculatedReturnRial == null,
                cancellationToken);
        if (hasOpenLostFundReturn)
        {
            await transaction.RollbackAsync(cancellationToken);
            return new PrepareNormalMaturityResult(
                PrepareNormalMaturityOutcome.Blocked,
                contract.Id,
                finalMonth.DueAtUtc,
                finalMonth.ClosedAtUtc);
        }

        var previousStatus = contract.Status;
        contract.Status = LeaseContractStatus.SettlementPending;
        contract.UpdatedAtUtc = occurredAtUtc;

        const string actorId = "system:normal-maturity";
        const string reason = "All 12 contractual months are present and closed, the final contractual due date has passed, and no unresolved cancellation, coverage, or lost-fund-return prerequisite remains.";

        dbContext.WorkflowTransitions.Add(new WorkflowTransitionRow
        {
            Id = Guid.NewGuid(),
            AggregateType = "LeaseContract",
            AggregateId = contract.Id,
            FromStatus = previousStatus.ToString(),
            ToStatus = contract.Status.ToString(),
            ActorId = actorId,
            Reason = reason,
            OccurredAtUtc = occurredAtUtc,
        });

        dbContext.AuditEvents.Add(new AuditEventRow
        {
            Id = Guid.NewGuid(),
            AggregateType = "LeaseContract",
            AggregateId = contract.Id,
            ActorId = actorId,
            Action = "contract_entered_normal_settlement_pending",
            Reason = reason,
            OccurredAtUtc = occurredAtUtc,
        });

        dbContext.OutboxMessages.Add(new OutboxMessageRow
        {
            Id = Guid.NewGuid(),
            OccurredAtUtc = occurredAtUtc,
            Type = "lease-contract.normal-settlement-pending.v1",
            PayloadJson = JsonSerializer.Serialize(new
            {
                contractId = contract.Id,
                contractMonthCount = ContractMonthCount,
                finalMonthNumber = finalMonth.ContractMonthNumber,
                finalMonthDueAtUtc = finalMonth.DueAtUtc,
                finalMonthClosedAtUtc = finalMonth.ClosedAtUtc,
                occurredAtUtc,
            }),
            AttemptCount = 0,
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return new PrepareNormalMaturityResult(
            PrepareNormalMaturityOutcome.Prepared,
            contract.Id,
            finalMonth.DueAtUtc,
            finalMonth.ClosedAtUtc);
    }
}
