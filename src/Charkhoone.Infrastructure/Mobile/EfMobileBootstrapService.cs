using Charkhoone.Application.Mobile;
using Charkhoone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Infrastructure.Mobile;

public sealed class EfMobileBootstrapService(CharkhooneDbContext dbContext) : IMobileBootstrapService
{
    private const int ContractLimit = 20;
    private const int PaymentLimit = 50;

    public async Task<MobileBootstrapView> GetAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("User id is required.", nameof(userId));
        }

        var applicationRow = await dbContext.CreditApplications
            .AsNoTracking()
            .Where(x => x.ApplicantUserId == userId)
            .OrderByDescending(x => x.UpdatedAtUtc)
            .ThenByDescending(x => x.Id)
            .FirstOrDefaultAsync(cancellationToken);

        MobileCreditApplicationSummary? application = null;
        if (applicationRow is not null)
        {
            MobileSelectedPlanSummary? selectedPlan = null;
            if (applicationRow.BankLoanPlanId is not null
                && !string.IsNullOrWhiteSpace(applicationRow.BankLoanPlanVersion))
            {
                selectedPlan = await dbContext.BankLoanPlanVersions
                    .AsNoTracking()
                    .Where(x =>
                        x.PlanId == applicationRow.BankLoanPlanId.Value
                        && x.Version == applicationRow.BankLoanPlanVersion)
                    .Select(x => new MobileSelectedPlanSummary(
                        x.PlanId,
                        x.Version,
                        x.BankId,
                        x.Title,
                        x.InterestTerms,
                        x.TermMonths))
                    .SingleOrDefaultAsync(cancellationToken);
            }

            var bankApproval = await dbContext.BankApprovals
                .AsNoTracking()
                .Where(x => x.CreditApplicationId == applicationRow.Id)
                .Select(x => new MobileBankApprovalSummary(
                    x.Provider,
                    x.Status,
                    x.MaximumEligibleLoanRial,
                    x.ApprovedLoanRial,
                    x.ReasonCode,
                    x.UpdatedAtUtc))
                .SingleOrDefaultAsync(cancellationToken);

            var fundingAllocation = await dbContext.FundingAllocations
                .AsNoTracking()
                .Where(x => x.CreditApplicationId == applicationRow.Id)
                .Select(x => new MobileFundingAllocationSummary(
                    x.ContractId,
                    x.BankId,
                    x.FullDepositEquivalentRial,
                    x.MaximumEligibleLoanRial,
                    x.BankApprovedLoanRial,
                    x.TenantContributionRial,
                    x.UpdatedAtUtc))
                .SingleOrDefaultAsync(cancellationToken);

            application = new MobileCreditApplicationSummary(
                applicationRow.Id,
                applicationRow.Status,
                applicationRow.UpdatedAtUtc,
                selectedPlan,
                bankApproval,
                fundingAllocation);
        }

        var contractRows = await dbContext.LeaseContracts
            .AsNoTracking()
            .Where(x => x.TenantUserId == userId || x.OwnerUserId == userId)
            .OrderByDescending(x => x.UpdatedAtUtc)
            .ThenByDescending(x => x.Id)
            .Take(ContractLimit)
            .ToListAsync(cancellationToken);

        var contractIds = contractRows.Select(x => x.Id).ToArray();
        // Scope persisted lease terms to the already-authorized contract ids.
        // Do not expose beneficiaries, unrelated owner settlements or tenant payments.
        var termsByContract = contractIds.Length == 0
            ? new Dictionary<Guid, MobileContractTermsSummary>()
            : await dbContext.LeaseContractTerms
                .AsNoTracking()
                .Where(x => contractIds.Contains(x.ContractId))
                .Select(x => new MobileContractTermsSummary(
                    x.ContractId,
                    x.Calendar,
                    x.PersianStartYear,
                    x.PersianStartMonth,
                    x.PersianStartDay,
                    x.TermMonths,
                    x.CashDepositRial,
                    x.MonthlyRentRial,
                    x.FullDepositEquivalentRial,
                    x.CapturedAtUtc))
                .ToDictionaryAsync(x => x.ContractId, cancellationToken);

        var contracts = contractRows
            .Select(row =>
            {
                termsByContract.TryGetValue(row.Id, out var terms);
                return new MobileContractSummary(
                    row.Id,
                    row.TenantUserId == userId ? "Tenant" : "Owner",
                    row.Status,
                    terms?.MonthlyRentRial,
                    row.UpdatedAtUtc,
                    terms);
            })
            .ToArray();

        var tenantContractIds = contractRows
            .Where(x => x.TenantUserId == userId)
            .Select(x => x.Id)
            .ToArray();

        IReadOnlyList<MobilePaymentSummary> payments = [];
        if (tenantContractIds.Length > 0)
        {
            payments = await (
                    from payment in dbContext.PaymentInstructions.AsNoTracking()
                    join component in dbContext.MonthlyObligationComponents.AsNoTracking()
                        on payment.Id equals component.PaymentInstructionId
                    join obligation in dbContext.MonthlyObligations.AsNoTracking()
                        on component.MonthlyObligationId equals obligation.Id
                    where tenantContractIds.Contains(obligation.ContractId)
                        && payment.Status != Charkhoone.Domain.Payments.PaymentInstructionStatus.Succeeded
                        && payment.Status != Charkhoone.Domain.Payments.PaymentInstructionStatus.Reversed
                    orderby payment.DueAtUtc, obligation.ContractMonthNumber, component.Kind, payment.Id
                    select new MobilePaymentSummary(
                        payment.Id,
                        obligation.Id,
                        obligation.ContractId,
                        obligation.ContractMonthNumber,
                        component.Kind,
                        payment.DueAtUtc,
                        payment.AmountRial,
                        payment.Status,
                        payment.UpdatedAtUtc))
                .Take(PaymentLimit)
                .ToListAsync(cancellationToken);
        }

        return new MobileBootstrapView(
            userId,
            application,
            contracts,
            payments);
    }
}
