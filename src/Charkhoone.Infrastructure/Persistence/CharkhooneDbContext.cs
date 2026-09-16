using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace Charkhoone.Infrastructure.Persistence;

public sealed class CharkhooneDbContext(DbContextOptions<CharkhooneDbContext> options)
    : DbContext(options)
{
    public DbSet<UserRow> Users => Set<UserRow>();
    public DbSet<BankLoanPlanVersionRow> BankLoanPlanVersions => Set<BankLoanPlanVersionRow>();
    public DbSet<BankLoanPlanOrganizationRow> BankLoanPlanOrganizations => Set<BankLoanPlanOrganizationRow>();
    public DbSet<CreditGradePolicyVersionRow> CreditGradePolicyVersions => Set<CreditGradePolicyVersionRow>();
    public DbSet<CreditGradePolicyEntryRow> CreditGradePolicyEntries => Set<CreditGradePolicyEntryRow>();
    public DbSet<CreditApplicationRow> CreditApplications => Set<CreditApplicationRow>();
    public DbSet<VerificationRequestRow> VerificationRequests => Set<VerificationRequestRow>();
    public DbSet<CreditEligibilityAssessmentRow> CreditEligibilityAssessments => Set<CreditEligibilityAssessmentRow>();
    public DbSet<BankApprovalRow> BankApprovals => Set<BankApprovalRow>();
    public DbSet<FundingAllocationRow> FundingAllocations => Set<FundingAllocationRow>();
    public DbSet<FundPrincipalFreezeRow> FundPrincipalFreezes => Set<FundPrincipalFreezeRow>();
    public DbSet<LeaseContractRow> LeaseContracts => Set<LeaseContractRow>();
    public DbSet<WorkflowTransitionRow> WorkflowTransitions => Set<WorkflowTransitionRow>();
    public DbSet<AuditEventRow> AuditEvents => Set<AuditEventRow>();
    public DbSet<PaymentInstructionRow> PaymentInstructions => Set<PaymentInstructionRow>();
    public DbSet<FrozenPrincipalRow> FrozenPrincipals => Set<FrozenPrincipalRow>();
    public DbSet<OutboxMessageRow> OutboxMessages => Set<OutboxMessageRow>();
    public DbSet<InboxMessageRow> InboxMessages => Set<InboxMessageRow>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CharkhooneDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
