using Charkhoone.Application.Contracts;
using Charkhoone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Infrastructure.Contracts;

public sealed class EfContractReadService(CharkhooneDbContext dbContext) : IContractReadService
{
    private const string AggregateType = "LeaseContract";

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
}
