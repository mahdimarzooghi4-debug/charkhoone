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
    public DbSet<LeaseContractRow> LeaseContracts => Set<LeaseContractRow>();
    public DbSet<WorkflowTransitionRow> WorkflowTransitions => Set<WorkflowTransitionRow>();
    public DbSet<AuditEventRow> AuditEvents => Set<AuditEventRow>();
    public DbSet<PaymentInstructionRow> PaymentInstructions => Set<PaymentInstructionRow>();
    public DbSet<FrozenPrincipalRow> FrozenPrincipals => Set<FrozenPrincipalRow>();
    public DbSet<OutboxMessageRow> OutboxMessages => Set<OutboxMessageRow>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CharkhooneDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
