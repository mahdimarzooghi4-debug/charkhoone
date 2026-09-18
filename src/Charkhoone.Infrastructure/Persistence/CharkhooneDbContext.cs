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
    public DbSet<TenantContributionFundingRow> TenantContributionFundings => Set<TenantContributionFundingRow>();
    public DbSet<TenantContributionRow> TenantContributions => Set<TenantContributionRow>();
    public DbSet<TenantContributionReplenishmentRow> TenantContributionReplenishments => Set<TenantContributionReplenishmentRow>();
    public DbSet<CoveragePaymentRow> CoveragePayments => Set<CoveragePaymentRow>();
    public DbSet<LostFundReturnRow> LostFundReturns => Set<LostFundReturnRow>();
    public DbSet<CancellationSettlementRow> CancellationSettlements => Set<CancellationSettlementRow>();
    public DbSet<NormalSettlementRow> NormalSettlements => Set<NormalSettlementRow>();
    public DbSet<ExternalTransactionRow> ExternalTransactions => Set<ExternalTransactionRow>();
    public DbSet<LedgerAccountRow> LedgerAccounts => Set<LedgerAccountRow>();
    public DbSet<JournalEntryRow> JournalEntries => Set<JournalEntryRow>();
    public DbSet<JournalLineRow> JournalLines => Set<JournalLineRow>();
    public DbSet<LeaseContractRow> LeaseContracts => Set<LeaseContractRow>();
    public DbSet<LeaseContractTermsRow> LeaseContractTerms => Set<LeaseContractTermsRow>();
    public DbSet<LeaseContractScheduleMonthRow> LeaseContractScheduleMonths => Set<LeaseContractScheduleMonthRow>();
    public DbSet<WorkflowTransitionRow> WorkflowTransitions => Set<WorkflowTransitionRow>();
    public DbSet<AuditEventRow> AuditEvents => Set<AuditEventRow>();
    public DbSet<MonthlyObligationRow> MonthlyObligations => Set<MonthlyObligationRow>();
    public DbSet<MonthlyObligationComponentRow> MonthlyObligationComponents => Set<MonthlyObligationComponentRow>();
    public DbSet<ContractDelinquencyRow> ContractDelinquencies => Set<ContractDelinquencyRow>();
    public DbSet<PaymentInstructionRow> PaymentInstructions => Set<PaymentInstructionRow>();
    public DbSet<FrozenPrincipalRow> FrozenPrincipals => Set<FrozenPrincipalRow>();
    public DbSet<OutboxMessageRow> OutboxMessages => Set<OutboxMessageRow>();
    public DbSet<InboxMessageRow> InboxMessages => Set<InboxMessageRow>();

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        EnforcePostedLedgerImmutability();
        EnforceLeaseContractTermsImmutability();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default)
    {
        EnforcePostedLedgerImmutability();
        EnforceLeaseContractTermsImmutability();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CharkhooneDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }

    private void EnforcePostedLedgerImmutability()
    {
        ChangeTracker.DetectChanges();

        var mutation = ChangeTracker.Entries()
            .FirstOrDefault(entry =>
                entry.State is EntityState.Modified or EntityState.Deleted
                && (entry.Entity is JournalEntryRow || entry.Entity is JournalLineRow));

        if (mutation is not null)
        {
            throw new InvalidOperationException(
                "Posted journal entries and lines are immutable. Record corrections with a new reversal journal instead of updating or deleting posted ledger history.");
        }
    }

    private void EnforceLeaseContractTermsImmutability()
    {
        ChangeTracker.DetectChanges();

        var mutation = ChangeTracker.Entries()
            .FirstOrDefault(entry =>
                entry.State is EntityState.Modified or EntityState.Deleted
                && (entry.Entity is LeaseContractTermsRow
                    || entry.Entity is LeaseContractScheduleMonthRow));

        if (mutation is not null)
        {
            throw new InvalidOperationException(
                "Captured lease contract terms and schedule rows are immutable. Persist a new contract version rather than mutating an accepted snapshot.");
        }
    }
}
