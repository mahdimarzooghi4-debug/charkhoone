using Charkhoone.Application.Contracts;
using Charkhoone.Domain.Payments;
using Charkhoone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Infrastructure.Contracts;

public sealed class EfContractReadService(CharkhooneDbContext dbContext) : IContractReadService
{
    private const string AggregateType = "LeaseContract";
    private const string PaymentAggregateType = "PaymentInstruction";

    public async Task<ContractAccessView?> GetAccessibleContractAsync(
        Guid contractId,
        Guid requestingUserId,
        CancellationToken cancellationToken = default)
    {
        ValidateIds(contractId, requestingUserId);

        return await dbContext.LeaseContracts
            .AsNoTracking()
            .Where(x => x.Id == contractId
                && (x.TenantUserId == requestingUserId || x.OwnerUserId == requestingUserId))
            .Select(x => new ContractAccessView(
                x.Id,
                x.TenantUserId,
                x.OwnerUserId,
                x.Status))
            .SingleOrDefaultAsync(cancellationToken);
    }

    public async Task<ContractDetailView?> GetDetailAsync(
        Guid contractId,
        Guid requestingUserId,
        CancellationToken cancellationToken = default)
    {
        ValidateIds(contractId, requestingUserId);

        var contract = await dbContext.LeaseContracts
            .AsNoTracking()
            .SingleOrDefaultAsync(
                x => x.Id == contractId
                    && (x.TenantUserId == requestingUserId || x.OwnerUserId == requestingUserId),
                cancellationToken);
        if (contract is null)
        {
            return null;
        }

        var delinquencyRow = await dbContext.ContractDelinquencies
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.ContractId == contractId, cancellationToken);

        var frozenPrincipalRow = await dbContext.FrozenPrincipals
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.ContractId == contractId, cancellationToken);

        var contributionRow = await dbContext.TenantContributions
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.ContractId == contractId, cancellationToken);

        TenantContributionBalanceView? contribution = null;
        if (contributionRow is not null)
        {
            var replenishments = await dbContext.TenantContributionReplenishments
                .AsNoTracking()
                .Where(x => x.ContractId == contractId)
                .SumAsync(x => (decimal?)x.AmountRial, cancellationToken) ?? 0m;

            var confirmedCoverage = await dbContext.CoveragePayments
                .AsNoTracking()
                .Where(x => x.ContractId == contractId && x.Status == CoveragePaymentStatus.Succeeded)
                .SumAsync(x => (decimal?)x.AmountRial, cancellationToken) ?? 0m;

            contribution = new TenantContributionBalanceView(
                contributionRow.InitialAmountRial,
                replenishments,
                confirmedCoverage,
                contributionRow.InitialAmountRial + replenishments - confirmedCoverage,
                contributionRow.FundReference,
                contributionRow.FundedAtUtc);
        }

        var obligationRows = await dbContext.MonthlyObligations
            .AsNoTracking()
            .Where(x => x.ContractId == contractId)
            .OrderBy(x => x.ContractMonthNumber)
            .ToListAsync(cancellationToken);

        var obligationIds = obligationRows.Select(x => x.Id).ToArray();
        var paymentRows = obligationIds.Length == 0
            ? []
            : await (
                from component in dbContext.MonthlyObligationComponents.AsNoTracking()
                join payment in dbContext.PaymentInstructions.AsNoTracking()
                    on component.PaymentInstructionId equals payment.Id
                where obligationIds.Contains(component.MonthlyObligationId)
                select new PaymentComponentProjection
                {
                    PaymentInstructionId = payment.Id,
                    MonthlyObligationId = component.MonthlyObligationId,
                    Kind = component.Kind,
                    BeneficiaryId = payment.BeneficiaryId,
                    AmountRial = payment.AmountRial,
                    PaymentStatus = payment.Status,
                    UpdatedAtUtc = payment.UpdatedAtUtc,
                })
                .ToListAsync(cancellationToken);

        var paymentIds = paymentRows.Select(x => x.PaymentInstructionId).ToArray();
        var externalRows = paymentIds.Length == 0
            ? []
            : await dbContext.ExternalTransactions
                .AsNoTracking()
                .Where(x => x.AggregateType == PaymentAggregateType && paymentIds.Contains(x.AggregateId))
                .OrderByDescending(x => x.UpdatedAtUtc)
                .ThenByDescending(x => x.Id)
                .ToListAsync(cancellationToken);

        var externalByPayment = externalRows
            .GroupBy(x => x.AggregateId)
            .ToDictionary(x => x.Key, x => x.First());

        var componentsByObligation = paymentRows
            .GroupBy(x => x.MonthlyObligationId)
            .ToDictionary(
                x => x.Key,
                x => (IReadOnlyList<ContractPaymentComponentView>)x
                    .OrderBy(item => item.Kind)
                    .ThenBy(item => item.PaymentInstructionId)
                    .Select(item =>
                    {
                        externalByPayment.TryGetValue(item.PaymentInstructionId, out var external);
                        return new ContractPaymentComponentView(
                            item.PaymentInstructionId,
                            item.Kind,
                            item.BeneficiaryId,
                            item.AmountRial,
                            item.PaymentStatus,
                            external?.Status,
                            external?.Provider,
                            external?.ExternalReference,
                            external?.ReasonCode,
                            item.UpdatedAtUtc);
                    })
                    .ToArray());

        var obligations = obligationRows
            .Select(row => new ContractMonthlyObligationView(
                row.Id,
                row.ContractMonthNumber,
                row.DueAtUtc,
                row.Status,
                componentsByObligation.TryGetValue(row.Id, out var components)
                    ? components
                    : [],
                row.UpdatedAtUtc,
                row.ClosedAtUtc))
            .ToArray();

        var monthByObligation = obligationRows.ToDictionary(x => x.Id, x => x.ContractMonthNumber);
        var attention = paymentRows
            .Select(item =>
            {
                externalByPayment.TryGetValue(item.PaymentInstructionId, out var external);
                return new { Item = item, External = external };
            })
            .Where(x => x.Item.PaymentStatus is PaymentInstructionStatus.Unknown or PaymentInstructionStatus.ReconciliationRequired
                || x.External?.Status == ExternalTransactionStatus.Unknown)
            .OrderBy(x => monthByObligation[x.Item.MonthlyObligationId])
            .ThenBy(x => x.Item.Kind)
            .Select(x => new PaymentReconciliationAttentionView(
                x.Item.PaymentInstructionId,
                x.Item.MonthlyObligationId,
                monthByObligation[x.Item.MonthlyObligationId],
                x.Item.Kind,
                x.Item.AmountRial,
                x.Item.PaymentStatus,
                x.External?.Status,
                x.External?.Provider,
                x.External?.ExternalReference,
                x.External?.ReasonCode,
                x.Item.UpdatedAtUtc))
            .ToArray();

        var settlementRow = await dbContext.NormalSettlements
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.ContractId == contractId, cancellationToken);

        var openLostFundReturnExposureCount = await dbContext.LostFundReturns
            .AsNoTracking()
            .CountAsync(x => x.ContractId == contractId && x.CalculatedReturnRial == null, cancellationToken);

        return new ContractDetailView(
            contract.Id,
            contract.TenantUserId,
            contract.OwnerUserId,
            contract.PropertyId,
            contract.CreditApplicationId,
            contract.Status,
            contract.BankLoanPlanId,
            contract.BankLoanPlanVersion,
            contract.CreditGradePolicyVersion,
            contract.CreatedAtUtc,
            contract.UpdatedAtUtc,
            delinquencyRow is null
                ? null
                : new ContractDelinquencyView(
                    delinquencyRow.ConsecutiveMissedMonths,
                    delinquencyRow.CancellationRequired,
                    delinquencyRow.UpdatedAtUtc),
            frozenPrincipalRow is null
                ? null
                : new FrozenPrincipalReadView(
                    frozenPrincipalRow.BankId,
                    frozenPrincipalRow.AmountRial,
                    frozenPrincipalRow.FundReference,
                    frozenPrincipalRow.FrozenAtUtc),
            contribution,
            obligations,
            attention,
            settlementRow is null
                ? null
                : new ContractNormalSettlementReadView(
                    settlementRow.Id,
                    settlementRow.BankPrincipalAmountRial,
                    settlementRow.BankPrincipalStatus,
                    settlementRow.TenantResidualAmountRial,
                    settlementRow.TenantResidualStatus,
                    settlementRow.UpdatedAtUtc,
                    settlementRow.CompletedAtUtc),
            openLostFundReturnExposureCount);
    }

    public async Task<ContractAuditPage?> GetAuditEventsAsync(
        Guid contractId,
        Guid requestingUserId,
        int page,
        int pageSize,
        string? action = null,
        CancellationToken cancellationToken = default)
    {
        ValidateIds(contractId, requestingUserId);
        if (page < 1)
        {
            throw new ArgumentOutOfRangeException(nameof(page), "Page must be at least 1.");
        }

        if (pageSize is < 1 or > 100)
        {
            throw new ArgumentOutOfRangeException(nameof(pageSize), "Page size must be between 1 and 100.");
        }

        var accessible = await dbContext.LeaseContracts
            .AsNoTracking()
            .AnyAsync(
                x => x.Id == contractId
                    && (x.TenantUserId == requestingUserId || x.OwnerUserId == requestingUserId),
                cancellationToken);
        if (!accessible)
        {
            return null;
        }

        var query = dbContext.AuditEvents
            .AsNoTracking()
            .Where(x => x.AggregateType == AggregateType && x.AggregateId == contractId);

        if (!string.IsNullOrWhiteSpace(action))
        {
            var normalizedAction = action.Trim();
            query = query.Where(x => x.Action == normalizedAction);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var offset = (long)(page - 1) * pageSize;
        if (offset >= totalCount)
        {
            return new ContractAuditPage([], page, pageSize, totalCount);
        }

        var items = await query
            .OrderByDescending(x => x.OccurredAtUtc)
            .ThenByDescending(x => x.Id)
            .Skip((int)offset)
            .Take(pageSize)
            .Select(x => new ContractAuditEventView(
                x.Id,
                x.ActorId,
                x.Action,
                x.Reason,
                x.OccurredAtUtc))
            .ToListAsync(cancellationToken);

        return new ContractAuditPage(items, page, pageSize, totalCount);
    }

    private static void ValidateIds(Guid contractId, Guid requestingUserId)
    {
        if (contractId == Guid.Empty)
        {
            throw new ArgumentException("Contract id is required.", nameof(contractId));
        }

        if (requestingUserId == Guid.Empty)
        {
            throw new ArgumentException("Requesting user id is required.", nameof(requestingUserId));
        }
    }

    private sealed class PaymentComponentProjection
    {
        public Guid PaymentInstructionId { get; init; }
        public Guid MonthlyObligationId { get; init; }
        public MonthlyObligationComponentKind Kind { get; init; }
        public string BeneficiaryId { get; init; } = string.Empty;
        public decimal AmountRial { get; init; }
        public PaymentInstructionStatus PaymentStatus { get; init; }
        public DateTimeOffset UpdatedAtUtc { get; init; }
    }
}
