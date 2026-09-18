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

        var application = await dbContext.CreditApplications
            .AsNoTracking()
            .Where(x => x.ApplicantUserId == userId)
            .OrderByDescending(x => x.UpdatedAtUtc)
            .ThenByDescending(x => x.Id)
            .Select(x => new MobileCreditApplicationSummary(
                x.Id,
                x.Status,
                x.UpdatedAtUtc))
            .FirstOrDefaultAsync(cancellationToken);

        var contractRows = await dbContext.LeaseContracts
            .AsNoTracking()
            .Where(x => x.TenantUserId == userId || x.OwnerUserId == userId)
            .OrderByDescending(x => x.UpdatedAtUtc)
            .ThenByDescending(x => x.Id)
            .Take(ContractLimit)
            .ToListAsync(cancellationToken);

        var contractIds = contractRows.Select(x => x.Id).ToArray();
        var monthlyRentByContract = contractIds.Length == 0
            ? new Dictionary<Guid, decimal>()
            : await dbContext.LeaseContractTerms
                .AsNoTracking()
                .Where(x => contractIds.Contains(x.ContractId))
                .ToDictionaryAsync(x => x.ContractId, x => x.MonthlyRentRial, cancellationToken);

        var contracts = contractRows
            .Select(row => new MobileContractSummary(
                row.Id,
                row.TenantUserId == userId ? "Tenant" : "Owner",
                row.Status,
                monthlyRentByContract.TryGetValue(row.Id, out var monthlyRent)
                    ? monthlyRent
                    : null,
                row.UpdatedAtUtc))
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
