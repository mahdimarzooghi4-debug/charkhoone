using Charkhoone.Domain.Contracts;

namespace Charkhoone.Application.Contracts;

public sealed record ContractAccessView(
    Guid ContractId,
    Guid TenantUserId,
    Guid OwnerUserId,
    LeaseContractStatus Status);

public sealed record ContractAuditEventView(
    Guid Id,
    string ActorId,
    string Action,
    string Reason,
    DateTimeOffset OccurredAtUtc);

public sealed record ContractAuditPage(
    IReadOnlyList<ContractAuditEventView> Items,
    int Page,
    int PageSize,
    int TotalCount)
{
    public bool HasNextPage => (long)Page * PageSize < TotalCount;
}

public interface IContractReadService
{
    Task<ContractAccessView?> GetAccessibleContractAsync(
        Guid contractId,
        Guid requestingUserId,
        CancellationToken cancellationToken = default);

    Task<ContractAuditPage?> GetAuditEventsAsync(
        Guid contractId,
        Guid requestingUserId,
        int page,
        int pageSize,
        string? action = null,
        CancellationToken cancellationToken = default);
}
