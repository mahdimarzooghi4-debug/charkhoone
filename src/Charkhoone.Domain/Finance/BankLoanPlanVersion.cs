namespace Charkhoone.Domain.Finance;

public enum BankLoanPlanScope
{
    Public,
    Organizational,
}

public enum BankLoanPlanStatus
{
    Draft,
    Published,
    Suspended,
    Retired,
}

public sealed record BankLoanPlanVersion
{
    public const int RequiredTermMonths = 12;

    public BankLoanPlanVersion(
        Guid planId,
        string version,
        string bankId,
        string title,
        string interestTerms,
        BankLoanPlanScope scope,
        IReadOnlySet<Guid>? allowedOrganizations,
        BankLoanPlanStatus status,
        int termMonths = RequiredTermMonths)
    {
        if (planId == Guid.Empty) throw new ArgumentException("Plan id is required.", nameof(planId));
        ArgumentException.ThrowIfNullOrWhiteSpace(version);
        ArgumentException.ThrowIfNullOrWhiteSpace(bankId);
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        ArgumentException.ThrowIfNullOrWhiteSpace(interestTerms);

        if (termMonths != RequiredTermMonths)
        {
            throw new ArgumentOutOfRangeException(nameof(termMonths), termMonths, "The approved loan term is one year (12 months).");
        }

        PlanId = planId;
        Version = version.Trim();
        BankId = bankId.Trim();
        Title = title.Trim();
        InterestTerms = interestTerms.Trim();
        Scope = scope;
        AllowedOrganizations = allowedOrganizations is null
            ? new HashSet<Guid>()
            : new HashSet<Guid>(allowedOrganizations);
        Status = status;
        TermMonths = termMonths;
    }

    public Guid PlanId { get; }
    public string Version { get; }
    public string BankId { get; }
    public string Title { get; }
    public string InterestTerms { get; }
    public BankLoanPlanScope Scope { get; }
    public IReadOnlySet<Guid> AllowedOrganizations { get; }
    public BankLoanPlanStatus Status { get; }
    public int TermMonths { get; }
}
