using Charkhoone.Domain.Contracts;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Finance;
using Charkhoone.Domain.Payments;

namespace Charkhoone.Infrastructure.Persistence.Models;

public sealed class BankLoanPlanVersionRow
{
    public Guid Id { get; set; }
    public Guid PlanId { get; set; }
    public string Version { get; set; } = string.Empty;
    public string BankId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string InterestTerms { get; set; } = string.Empty;
    public BankLoanPlanScope Scope { get; set; }
    public BankLoanPlanStatus Status { get; set; }
    public int TermMonths { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public ICollection<BankLoanPlanOrganizationRow> AllowedOrganizations { get; set; } = [];
}

public sealed class BankLoanPlanOrganizationRow
{
    public Guid PlanVersionId { get; set; }
    public Guid OrganizationId { get; set; }
}

public sealed class CreditGradePolicyVersionRow
{
    public Guid Id { get; set; }
    public string Version { get; set; } = string.Empty;
    public DateTimeOffset EffectiveFromUtc { get; set; }
    public ICollection<CreditGradePolicyEntryRow> Entries { get; set; } = [];
}

public sealed class CreditGradePolicyEntryRow
{
    public Guid PolicyVersionId { get; set; }
    public string ExternalSubGrade { get; set; } = string.Empty;
    public decimal LoanRatio { get; set; }
}

public sealed class CreditApplicationRow
{
    public Guid Id { get; set; }
    public Guid ApplicantUserId { get; set; }
    public CreditApplicationStatus Status { get; set; }
    public Guid? BankLoanPlanId { get; set; }
    public string? BankLoanPlanVersion { get; set; }
    public string? CreditGradePolicyVersion { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}

public sealed class LeaseContractRow
{
    public Guid Id { get; set; }
    public Guid TenantUserId { get; set; }
    public Guid OwnerUserId { get; set; }
    public Guid PropertyId { get; set; }
    public Guid? CreditApplicationId { get; set; }
    public LeaseContractStatus Status { get; set; }
    public Guid? BankLoanPlanId { get; set; }
    public string? BankLoanPlanVersion { get; set; }
    public string? CreditGradePolicyVersion { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}

public sealed class WorkflowTransitionRow
{
    public Guid Id { get; set; }
    public string AggregateType { get; set; } = string.Empty;
    public Guid AggregateId { get; set; }
    public string FromStatus { get; set; } = string.Empty;
    public string ToStatus { get; set; } = string.Empty;
    public string ActorId { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public DateTimeOffset OccurredAtUtc { get; set; }
}

public sealed class PaymentInstructionRow
{
    public Guid Id { get; set; }
    public Guid ObligationId { get; set; }
    public DateTimeOffset DueAtUtc { get; set; }
    public string BeneficiaryId { get; set; } = string.Empty;
    public decimal AmountRial { get; set; }
    public string IdempotencyKey { get; set; } = string.Empty;
    public PaymentInstructionStatus Status { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}

public sealed class FrozenPrincipalRow
{
    public Guid ContractId { get; set; }
    public string BankId { get; set; } = string.Empty;
    public decimal AmountRial { get; set; }
    public string FundReference { get; set; } = string.Empty;
    public DateTimeOffset FrozenAtUtc { get; set; }
}

public sealed class OutboxMessageRow
{
    public Guid Id { get; set; }
    public DateTimeOffset OccurredAtUtc { get; set; }
    public string Type { get; set; } = string.Empty;
    public string PayloadJson { get; set; } = string.Empty;
    public DateTimeOffset? ProcessedAtUtc { get; set; }
    public int AttemptCount { get; set; }
    public string? LastError { get; set; }
}
