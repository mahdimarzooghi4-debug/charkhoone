using System.Text.Json;
using Charkhoone.Application.Payments;
using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Infrastructure.Payments;

public sealed class EfPaymentService(
    CharkhooneDbContext dbContext,
    IExternalPaymentReconciliationAdapter reconciliationAdapter)
    : IPaymentReconciliationService, IMonthlyObligationService
{
    private const string PaymentOperationType = "payment_reconciliation";

    public async Task<EnsureMonthlyObligationResult> EnsureAsync(
        MonthlyObligationSetup setup,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default)
    {
        ValidateSetup(setup);

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var contract = await dbContext.LeaseContracts
            .FromSqlInterpolated($"SELECT * FROM lease_contracts WHERE \"Id\" = {setup.ContractId} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);

        if (contract is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return new EnsureMonthlyObligationResult(EnsureMonthlyObligationOutcome.ContractNotFound, null);
        }

        if (contract.Status != LeaseContractStatus.Active)
        {
            await transaction.RollbackAsync(cancellationToken);
            return new EnsureMonthlyObligationResult(EnsureMonthlyObligationOutcome.InvalidContractState, null);
        }

        var existing = await dbContext.MonthlyObligations
            .SingleOrDefaultAsync(
                x => x.ContractId == setup.ContractId && x.ContractMonthNumber == setup.ContractMonthNumber,
                cancellationToken);

        if (existing is not null)
        {
            var matches = await MatchesExistingSetupAsync(existing, setup, cancellationToken);
            var view = await ToObligationViewAsync(existing, contract.Id, cancellationToken);
            await transaction.RollbackAsync(cancellationToken);
            return new EnsureMonthlyObligationResult(
                matches ? EnsureMonthlyObligationOutcome.Existing : EnsureMonthlyObligationOutcome.Conflict,
                view);
        }

        var obligation = new MonthlyObligationRow
        {
            Id = Guid.NewGuid(),
            ContractId = contract.Id,
            ContractMonthNumber = setup.ContractMonthNumber,
            DueAtUtc = setup.DueAtUtc,
            Status = MonthlyObligationStatus.Open,
            CreatedAtUtc = occurredAtUtc,
            UpdatedAtUtc = occurredAtUtc,
        };
        dbContext.MonthlyObligations.Add(obligation);

        if (setup.OwnerPaymentRial > 0m)
        {
            AddPaymentInstruction(
                obligation,
                MonthlyObligationComponentKind.OwnerPayment,
                setup.OwnerBeneficiaryId,
                setup.OwnerPaymentRial,
                occurredAtUtc);
        }

        if (setup.BankInterestRial > 0m)
        {
            AddPaymentInstruction(
                obligation,
                MonthlyObligationComponentKind.BankInterest,
                setup.BankBeneficiaryId,
                setup.BankInterestRial,
                occurredAtUtc);
        }

        if (!await dbContext.ContractDelinquencies.AnyAsync(x => x.ContractId == contract.Id, cancellationToken))
        {
            dbContext.ContractDelinquencies.Add(new ContractDelinquencyRow
            {
                ContractId = contract.Id,
                ConsecutiveMissedMonths = 0,
                CancellationRequired = false,
                UpdatedAtUtc = occurredAtUtc,
            });
        }

        AddAudit(
            "LeaseContract",
            contract.Id,
            "system:monthly-obligation",
            "monthly_obligation_created",
            $"Contract month {setup.ContractMonthNumber} payment obligations were created from trusted amounts without recalculating bank interest.",
            occurredAtUtc);

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return new EnsureMonthlyObligationResult(
            EnsureMonthlyObligationOutcome.Created,
            await ToObligationViewAsync(obligation, contract.Id, cancellationToken));
    }

    public async Task<ReconcilePaymentResult> ReconcileAsync(
        Guid paymentInstructionId,
        Guid requestingUserId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default)
    {
        if (paymentInstructionId == Guid.Empty)
        {
            throw new ArgumentException("Payment instruction id is required.", nameof(paymentInstructionId));
        }

        if (requestingUserId == Guid.Empty)
        {
            throw new ArgumentException("Requesting user id is required.", nameof(requestingUserId));
        }

        Guid obligationId;
        Guid contractId;
        Guid externalTransactionId;
        string beneficiaryId;
        decimal expectedAmountRial;

        await using (var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken))
        {
            var instruction = await dbContext.PaymentInstructions
                .FromSqlInterpolated($"SELECT * FROM payment_instructions WHERE \"Id\" = {paymentInstructionId} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);

            if (instruction is null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new ReconcilePaymentResult(ReconcilePaymentOutcome.NotFound, null);
            }

            var obligation = await dbContext.MonthlyObligations
                .SingleOrDefaultAsync(x => x.Id == instruction.ObligationId, cancellationToken);
            var contract = obligation is null
                ? null
                : await dbContext.LeaseContracts.SingleOrDefaultAsync(x => x.Id == obligation.ContractId, cancellationToken);

            if (obligation is null || contract is null || contract.TenantUserId != requestingUserId)
            {
                await transaction.RollbackAsync(cancellationToken);
                return new ReconcilePaymentResult(ReconcilePaymentOutcome.NotFound, null);
            }

            if (instruction.Status == PaymentInstructionStatus.Succeeded)
            {
                var view = await ToPaymentViewAsync(instruction, obligation, contract, cancellationToken);
                await transaction.RollbackAsync(cancellationToken);
                return new ReconcilePaymentResult(ReconcilePaymentOutcome.AlreadyReconciled, view);
            }

            if (instruction.Status == PaymentInstructionStatus.Failed)
            {
                var view = await ToPaymentViewAsync(instruction, obligation, contract, cancellationToken);
                await transaction.RollbackAsync(cancellationToken);
                return new ReconcilePaymentResult(ReconcilePaymentOutcome.Failed, view);
            }

            if (instruction.Status == PaymentInstructionStatus.Reversed)
            {
                var view = await ToPaymentViewAsync(instruction, obligation, contract, cancellationToken);
                await transaction.RollbackAsync(cancellationToken);
                return new ReconcilePaymentResult(ReconcilePaymentOutcome.InvalidState, view);
            }

            if (instruction.Status == PaymentInstructionStatus.Created)
            {
                instruction.Status = PaymentInstructionStateMachine.Transition(
                    instruction.Status,
                    PaymentInstructionStatus.Pending);
            }
            else if (instruction.Status == PaymentInstructionStatus.Unknown)
            {
                instruction.Status = PaymentInstructionStateMachine.Transition(
                    instruction.Status,
                    PaymentInstructionStatus.ReconciliationRequired);
            }

            instruction.UpdatedAtUtc = occurredAtUtc;

            var transactionKey = ExternalTransactionIdempotencyKey(instruction.Id);
            var externalTransaction = await dbContext.ExternalTransactions
                .SingleOrDefaultAsync(x => x.IdempotencyKey == transactionKey, cancellationToken);

            if (externalTransaction is null)
            {
                externalTransaction = new ExternalTransactionRow
                {
                    Id = Guid.NewGuid(),
                    Provider = reconciliationAdapter.Provider,
                    OperationType = PaymentOperationType,
                    AggregateType = "PaymentInstruction",
                    AggregateId = instruction.Id,
                    Status = ExternalTransactionStatus.Pending,
                    AmountRial = instruction.AmountRial,
                    Currency = "IRR",
                    IdempotencyKey = transactionKey,
                    CreatedAtUtc = occurredAtUtc,
                    UpdatedAtUtc = occurredAtUtc,
                };
                dbContext.ExternalTransactions.Add(externalTransaction);
            }
            else
            {
                if (externalTransaction.AggregateId != instruction.Id
                    || externalTransaction.AmountRial != instruction.AmountRial
                    || externalTransaction.Currency != "IRR"
                    || externalTransaction.OperationType != PaymentOperationType
                    || externalTransaction.Status == ExternalTransactionStatus.Succeeded)
                {
                    var view = await ToPaymentViewAsync(instruction, obligation, contract, cancellationToken);
                    await transaction.RollbackAsync(cancellationToken);
                    return new ReconcilePaymentResult(ReconcilePaymentOutcome.InvalidState, view);
                }

                externalTransaction.Status = ExternalTransactionStatus.Pending;
                externalTransaction.UpdatedAtUtc = occurredAtUtc;
            }

            obligationId = obligation.Id;
            contractId = contract.Id;
            externalTransactionId = externalTransaction.Id;
            beneficiaryId = instruction.BeneficiaryId;
            expectedAmountRial = instruction.AmountRial;

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }

        var externalResponse = await reconciliationAdapter.QueryAsync(
            new ExternalPaymentReconciliationRequest(
                paymentInstructionId,
                obligationId,
                contractId,
                beneficiaryId,
                expectedAmountRial),
            cancellationToken);

        dbContext.ChangeTracker.Clear();
        await using var resultTransaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var lockedInstruction = await dbContext.PaymentInstructions
            .FromSqlInterpolated($"SELECT * FROM payment_instructions WHERE \"Id\" = {paymentInstructionId} FOR UPDATE")
            .SingleAsync(cancellationToken);
        var lockedObligation = await dbContext.MonthlyObligations
            .FromSqlInterpolated($"SELECT * FROM monthly_obligations WHERE \"Id\" = {obligationId} FOR UPDATE")
            .SingleAsync(cancellationToken);
        var lockedContract = await dbContext.LeaseContracts.SingleAsync(x => x.Id == contractId, cancellationToken);
        var lockedExternalTransaction = await dbContext.ExternalTransactions
            .FromSqlInterpolated($"SELECT * FROM external_transactions WHERE \"Id\" = {externalTransactionId} FOR UPDATE")
            .SingleAsync(cancellationToken);

        if (lockedInstruction.Status == PaymentInstructionStatus.Succeeded)
        {
            var view = await ToPaymentViewAsync(lockedInstruction, lockedObligation, lockedContract, cancellationToken);
            await resultTransaction.RollbackAsync(cancellationToken);
            return new ReconcilePaymentResult(ReconcilePaymentOutcome.AlreadyReconciled, view);
        }

        if (lockedInstruction.Status == PaymentInstructionStatus.Failed)
        {
            var view = await ToPaymentViewAsync(lockedInstruction, lockedObligation, lockedContract, cancellationToken);
            await resultTransaction.RollbackAsync(cancellationToken);
            return new ReconcilePaymentResult(ReconcilePaymentOutcome.Failed, view);
        }

        lockedExternalTransaction.Provider = string.IsNullOrWhiteSpace(externalResponse.Provider)
            ? reconciliationAdapter.Provider
            : externalResponse.Provider.Trim();
        lockedExternalTransaction.ExternalReference = externalResponse.ExternalReference;
        lockedExternalTransaction.ReasonCode = externalResponse.ReasonCode;
        lockedExternalTransaction.UpdatedAtUtc = occurredAtUtc;
        lockedInstruction.UpdatedAtUtc = occurredAtUtc;

        var exactSuccess = externalResponse.Status == ExternalPaymentReconciliationStatus.Succeeded
            && externalResponse.ConfirmedAmountRial == lockedInstruction.AmountRial
            && !string.IsNullOrWhiteSpace(externalResponse.ExternalReference);

        ReconcilePaymentOutcome outcome;
        if (exactSuccess)
        {
            lockedInstruction.Status = PaymentInstructionStateMachine.Transition(
                lockedInstruction.Status,
                PaymentInstructionStatus.Succeeded);
            lockedExternalTransaction.Status = ExternalTransactionStatus.Succeeded;
            outcome = ReconcilePaymentOutcome.Reconciled;

            AddAudit(
                "PaymentInstruction",
                lockedInstruction.Id,
                $"payment:{lockedExternalTransaction.Provider}",
                "payment_reconciled",
                "External payment was confirmed with the exact expected amount and a valid external reference.",
                occurredAtUtc);
        }
        else if (externalResponse.Status == ExternalPaymentReconciliationStatus.Failed)
        {
            lockedInstruction.Status = PaymentInstructionStateMachine.Transition(
                lockedInstruction.Status,
                PaymentInstructionStatus.Failed);
            lockedExternalTransaction.Status = ExternalTransactionStatus.Failed;
            outcome = ReconcilePaymentOutcome.Failed;
        }
        else
        {
            lockedInstruction.Status = PaymentInstructionStateMachine.Transition(
                lockedInstruction.Status,
                PaymentInstructionStatus.Unknown);
            lockedExternalTransaction.Status = ExternalTransactionStatus.Unknown;
            lockedExternalTransaction.ReasonCode ??= externalResponse.Status == ExternalPaymentReconciliationStatus.Succeeded
                ? "payment_confirmation_mismatch"
                : "payment_reconciliation_indeterminate";
            outcome = ReconcilePaymentOutcome.Indeterminate;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        if (outcome == ReconcilePaymentOutcome.Reconciled
            && lockedObligation.Status == MonthlyObligationStatus.Open)
        {
            var allPaid = await dbContext.PaymentInstructions
                .Where(x => x.ObligationId == lockedObligation.Id)
                .AllAsync(x => x.Status == PaymentInstructionStatus.Succeeded, cancellationToken);

            if (allPaid)
            {
                await MarkObligationPaidAsync(lockedObligation, lockedContract, occurredAtUtc, cancellationToken);
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await resultTransaction.CommitAsync(cancellationToken);

        return new ReconcilePaymentResult(
            outcome,
            await ToPaymentViewAsync(lockedInstruction, lockedObligation, lockedContract, cancellationToken));
    }

    public async Task<CloseMonthlyObligationResult> CloseAsync(
        Guid obligationId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default)
    {
        if (obligationId == Guid.Empty)
        {
            throw new ArgumentException("Monthly obligation id is required.", nameof(obligationId));
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var obligation = await dbContext.MonthlyObligations
            .FromSqlInterpolated($"SELECT * FROM monthly_obligations WHERE \"Id\" = {obligationId} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);

        if (obligation is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return new CloseMonthlyObligationResult(CloseMonthlyObligationOutcome.NotFound, null);
        }

        var contract = await dbContext.LeaseContracts
            .FromSqlInterpolated($"SELECT * FROM lease_contracts WHERE \"Id\" = {obligation.ContractId} FOR UPDATE")
            .SingleAsync(cancellationToken);

        if (obligation.Status != MonthlyObligationStatus.Open)
        {
            var view = await ToObligationViewAsync(obligation, contract.Id, cancellationToken);
            await transaction.RollbackAsync(cancellationToken);
            return new CloseMonthlyObligationResult(CloseMonthlyObligationOutcome.AlreadyClosed, view);
        }

        if (occurredAtUtc < obligation.DueAtUtc || contract.Status != LeaseContractStatus.Active)
        {
            var view = await ToObligationViewAsync(obligation, contract.Id, cancellationToken);
            await transaction.RollbackAsync(cancellationToken);
            return new CloseMonthlyObligationResult(CloseMonthlyObligationOutcome.InvalidState, view);
        }

        var instructions = await dbContext.PaymentInstructions
            .Where(x => x.ObligationId == obligation.Id)
            .ToListAsync(cancellationToken);

        if (instructions.Count == 0)
        {
            var view = await ToObligationViewAsync(obligation, contract.Id, cancellationToken);
            await transaction.RollbackAsync(cancellationToken);
            return new CloseMonthlyObligationResult(CloseMonthlyObligationOutcome.InvalidState, view);
        }

        var hasUnresolvedPayment = instructions.Any(x => x.Status is
            PaymentInstructionStatus.Created or
            PaymentInstructionStatus.Pending or
            PaymentInstructionStatus.Unknown or
            PaymentInstructionStatus.ReconciliationRequired);

        if (hasUnresolvedPayment)
        {
            var view = await ToObligationViewAsync(obligation, contract.Id, cancellationToken);
            await transaction.RollbackAsync(cancellationToken);
            return new CloseMonthlyObligationResult(CloseMonthlyObligationOutcome.ReconciliationRequired, view);
        }

        var allPaid = instructions.All(x => x.Status == PaymentInstructionStatus.Succeeded);
        if (allPaid)
        {
            await MarkObligationPaidAsync(obligation, contract, occurredAtUtc, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return new CloseMonthlyObligationResult(
                CloseMonthlyObligationOutcome.Paid,
                await ToObligationViewAsync(obligation, contract.Id, cancellationToken));
        }

        var delinquency = await GetOrCreateDelinquencyAsync(contract.Id, occurredAtUtc, cancellationToken);
        if (delinquency.CancellationRequired)
        {
            var view = await ToObligationViewAsync(obligation, contract.Id, cancellationToken);
            await transaction.RollbackAsync(cancellationToken);
            return new CloseMonthlyObligationResult(CloseMonthlyObligationOutcome.InvalidState, view);
        }

        obligation.Status = MonthlyObligationStatus.Missed;
        obligation.ClosedAtUtc = occurredAtUtc;
        obligation.UpdatedAtUtc = occurredAtUtc;
        delinquency.ConsecutiveMissedMonths = checked(delinquency.ConsecutiveMissedMonths + 1);
        delinquency.UpdatedAtUtc = occurredAtUtc;

        var cancellationNowRequired = delinquency.ConsecutiveMissedMonths >= ConsecutiveMissedMonths.CancellationThreshold;
        if (cancellationNowRequired)
        {
            delinquency.CancellationRequired = true;
            var previousStatus = contract.Status;
            contract.Status = LeaseContractStatus.CancellationPending;
            contract.UpdatedAtUtc = occurredAtUtc;
            dbContext.WorkflowTransitions.Add(new WorkflowTransitionRow
            {
                Id = Guid.NewGuid(),
                AggregateType = "LeaseContract",
                AggregateId = contract.Id,
                FromStatus = previousStatus.ToString(),
                ToStatus = contract.Status.ToString(),
                ActorId = "system:delinquency",
                Reason = "Three consecutive contractual months closed without full tenant payment.",
                OccurredAtUtc = occurredAtUtc,
            });
        }

        AddAudit(
            "LeaseContract",
            contract.Id,
            "system:delinquency",
            "monthly_obligation_missed",
            $"Contract month {obligation.ContractMonthNumber} closed without full payment. Prior debt remains independent from later current-month payments.",
            occurredAtUtc);

        AddOutbox("monthly-obligation.missed.v1", occurredAtUtc, new
        {
            obligationId = obligation.Id,
            contractId = contract.Id,
            contractMonthNumber = obligation.ContractMonthNumber,
            consecutiveMissedMonths = delinquency.ConsecutiveMissedMonths,
            cancellationRequired = delinquency.CancellationRequired,
            paymentInstructions = instructions.Select(x => new
            {
                x.Id,
                status = x.Status.ToString(),
                x.AmountRial,
                x.BeneficiaryId,
            }),
            occurredAtUtc,
        });

        if (cancellationNowRequired)
        {
            AddAudit(
                "LeaseContract",
                contract.Id,
                "system:delinquency",
                "contract_cancellation_required",
                "Cancellation became mandatory after three consecutive months without full tenant payment.",
                occurredAtUtc);
            AddOutbox("lease-contract.cancellation-required.v1", occurredAtUtc, new
            {
                contractId = contract.Id,
                triggeringObligationId = obligation.Id,
                consecutiveMissedMonths = delinquency.ConsecutiveMissedMonths,
                occurredAtUtc,
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return new CloseMonthlyObligationResult(
            CloseMonthlyObligationOutcome.Missed,
            await ToObligationViewAsync(obligation, contract.Id, cancellationToken));
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
            IdempotencyKey = $"monthly-obligation:{obligation.ContractId:D}:{obligation.ContractMonthNumber}:{kind}:v1".ToLowerInvariant(),
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

    private async Task<bool> MatchesExistingSetupAsync(
        MonthlyObligationRow obligation,
        MonthlyObligationSetup setup,
        CancellationToken cancellationToken)
    {
        if (obligation.DueAtUtc != setup.DueAtUtc)
        {
            return false;
        }

        var components = await (
            from component in dbContext.MonthlyObligationComponents
            join payment in dbContext.PaymentInstructions on component.PaymentInstructionId equals payment.Id
            where component.MonthlyObligationId == obligation.Id
            select new ExistingComponent(component.Kind, payment.BeneficiaryId, payment.AmountRial))
            .ToListAsync(cancellationToken);

        var expectedCount = (setup.OwnerPaymentRial > 0m ? 1 : 0) + (setup.BankInterestRial > 0m ? 1 : 0);
        if (components.Count != expectedCount)
        {
            return false;
        }

        return MatchesComponent(
                components,
                MonthlyObligationComponentKind.OwnerPayment,
                setup.OwnerBeneficiaryId,
                setup.OwnerPaymentRial)
            && MatchesComponent(
                components,
                MonthlyObligationComponentKind.BankInterest,
                setup.BankBeneficiaryId,
                setup.BankInterestRial);
    }

    private static bool MatchesComponent(
        IReadOnlyCollection<ExistingComponent> components,
        MonthlyObligationComponentKind kind,
        string beneficiaryId,
        decimal amountRial)
    {
        if (amountRial == 0m)
        {
            return true;
        }

        var component = components.SingleOrDefault(x => x.Kind == kind);
        return component is not null
            && component.BeneficiaryId == beneficiaryId.Trim()
            && component.AmountRial == amountRial;
    }

    private async Task MarkObligationPaidAsync(
        MonthlyObligationRow obligation,
        LeaseContractRow contract,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken)
    {
        obligation.Status = MonthlyObligationStatus.Paid;
        obligation.ClosedAtUtc = occurredAtUtc;
        obligation.UpdatedAtUtc = occurredAtUtc;

        var delinquency = await GetOrCreateDelinquencyAsync(contract.Id, occurredAtUtc, cancellationToken);
        if (!delinquency.CancellationRequired)
        {
            delinquency.ConsecutiveMissedMonths = 0;
            delinquency.UpdatedAtUtc = occurredAtUtc;
        }

        AddAudit(
            "LeaseContract",
            contract.Id,
            "system:payment-reconciliation",
            "monthly_obligation_paid",
            $"Contract month {obligation.ContractMonthNumber} was paid in full. Older debt, if any, was not automatically settled.",
            occurredAtUtc);
        AddOutbox("monthly-obligation.paid.v1", occurredAtUtc, new
        {
            obligationId = obligation.Id,
            contractId = contract.Id,
            contractMonthNumber = obligation.ContractMonthNumber,
            occurredAtUtc,
        });
    }

    private async Task<ContractDelinquencyRow> GetOrCreateDelinquencyAsync(
        Guid contractId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken)
    {
        var row = await dbContext.ContractDelinquencies
            .SingleOrDefaultAsync(x => x.ContractId == contractId, cancellationToken);
        if (row is not null)
        {
            return row;
        }

        row = new ContractDelinquencyRow
        {
            ContractId = contractId,
            ConsecutiveMissedMonths = 0,
            CancellationRequired = false,
            UpdatedAtUtc = occurredAtUtc,
        };
        dbContext.ContractDelinquencies.Add(row);
        return row;
    }

    private async Task<MonthlyObligationView> ToObligationViewAsync(
        MonthlyObligationRow obligation,
        Guid contractId,
        CancellationToken cancellationToken)
    {
        var delinquency = await dbContext.ContractDelinquencies
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.ContractId == contractId, cancellationToken);

        return new MonthlyObligationView(
            obligation.Id,
            obligation.ContractId,
            obligation.ContractMonthNumber,
            obligation.DueAtUtc,
            obligation.Status,
            delinquency?.ConsecutiveMissedMonths ?? 0,
            delinquency?.CancellationRequired ?? false,
            obligation.UpdatedAtUtc);
    }

    private async Task<PaymentReconciliationView> ToPaymentViewAsync(
        PaymentInstructionRow instruction,
        MonthlyObligationRow obligation,
        LeaseContractRow contract,
        CancellationToken cancellationToken)
    {
        var delinquency = await dbContext.ContractDelinquencies
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.ContractId == contract.Id, cancellationToken);
        var externalReference = await dbContext.ExternalTransactions
            .AsNoTracking()
            .Where(x => x.IdempotencyKey == ExternalTransactionIdempotencyKey(instruction.Id))
            .Select(x => x.ExternalReference)
            .SingleOrDefaultAsync(cancellationToken);

        return new PaymentReconciliationView(
            instruction.Id,
            obligation.Id,
            contract.Id,
            instruction.AmountRial,
            instruction.BeneficiaryId,
            instruction.Status,
            obligation.Status,
            externalReference,
            delinquency?.ConsecutiveMissedMonths ?? 0,
            delinquency?.CancellationRequired ?? false,
            instruction.UpdatedAtUtc);
    }

    private void AddAudit(
        string aggregateType,
        Guid aggregateId,
        string actorId,
        string action,
        string reason,
        DateTimeOffset occurredAtUtc) =>
        dbContext.AuditEvents.Add(new AuditEventRow
        {
            Id = Guid.NewGuid(),
            AggregateType = aggregateType,
            AggregateId = aggregateId,
            ActorId = actorId,
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
        });

    private static string ExternalTransactionIdempotencyKey(Guid paymentInstructionId) =>
        $"payment-reconciliation:{paymentInstructionId:D}:v1";

    private static void ValidateSetup(MonthlyObligationSetup setup)
    {
        if (setup.ContractId == Guid.Empty)
        {
            throw new ArgumentException("Contract id is required.", nameof(setup));
        }

        if (setup.ContractMonthNumber is < 1 or > 12)
        {
            throw new ArgumentOutOfRangeException(nameof(setup), "Contract month must be between 1 and 12.");
        }

        if (setup.OwnerPaymentRial < 0m || setup.BankInterestRial < 0m)
        {
            throw new ArgumentOutOfRangeException(nameof(setup), "Monthly obligation amounts cannot be negative.");
        }

        if (setup.OwnerPaymentRial == 0m && setup.BankInterestRial == 0m)
        {
            throw new ArgumentException("At least one monthly obligation amount must be positive.", nameof(setup));
        }

        if (setup.OwnerPaymentRial > 0m)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(setup.OwnerBeneficiaryId);
        }

        if (setup.BankInterestRial > 0m)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(setup.BankBeneficiaryId);
        }
    }

    private sealed record ExistingComponent(
        MonthlyObligationComponentKind Kind,
        string BeneficiaryId,
        decimal AmountRial);
}
