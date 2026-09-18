using Charkhoone.Domain.Contracts;

namespace Charkhoone.Application.Contracts;

public enum AdvanceLeaseFundingLifecycleOutcome
{
    Activated,
    Advanced,
    AlreadyActivated,
    NotReady,
    NotFound,
    InvalidState,
}

public sealed record AdvanceLeaseFundingLifecycleResult(
    AdvanceLeaseFundingLifecycleOutcome Outcome,
    Guid ContractId,
    LeaseContractStatus? Status,
    int AppliedTransitions);

public interface ILeaseFundingLifecycleService
{
    Task<AdvanceLeaseFundingLifecycleResult> AdvanceAsync(
        Guid contractId,
        DateTimeOffset occurredAtUtc,
        CancellationToken cancellationToken = default);
}
