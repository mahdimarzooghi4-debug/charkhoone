using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Xunit;

namespace Charkhoone.Infrastructure.Tests.Persistence;

public sealed class DatabaseIntegrityEnforcementPersistenceTests
{
    [Fact]
    public void PostedJournalEntryMutation_IsRejectedBeforeDatabaseWrite()
    {
        using var context = CreateContext();
        var row = new JournalEntryRow
        {
            Id = Guid.NewGuid(),
            ReferenceType = "Test",
            ReferenceId = Guid.NewGuid(),
            IdempotencyKey = $"test:{Guid.NewGuid():D}",
            Description = "posted",
            OccurredAtUtc = DateTimeOffset.UtcNow.AddMinutes(-1),
            PostedAtUtc = DateTimeOffset.UtcNow,
        };

        context.Attach(row);
        row.Description = "mutated";

        var exception = Assert.Throws<InvalidOperationException>(() => context.SaveChanges());
        Assert.Contains("immutable", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("reversal", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void PostedJournalLineDeletion_IsRejectedBeforeDatabaseWrite()
    {
        using var context = CreateContext();
        var row = new JournalLineRow
        {
            Id = Guid.NewGuid(),
            JournalEntryId = Guid.NewGuid(),
            LedgerAccountId = Guid.NewGuid(),
            DebitRial = 1m,
            CreditRial = 0m,
        };

        context.Attach(row);
        context.Remove(row);

        var exception = Assert.Throws<InvalidOperationException>(() => context.SaveChanges());
        Assert.Contains("immutable", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void RelationalModel_ContainsRequiredFinancialForeignKeysAndRestrictiveLedgerRetention()
    {
        using var context = CreateContext();

        AssertForeignKey(
            context,
            typeof(FrozenPrincipalRow),
            typeof(LeaseContractRow),
            DeleteBehavior.Restrict,
            nameof(FrozenPrincipalRow.ContractId));
        AssertForeignKey(
            context,
            typeof(LeaseContractRow),
            typeof(CreditApplicationRow),
            DeleteBehavior.Restrict,
            nameof(LeaseContractRow.CreditApplicationId));
        AssertForeignKey(
            context,
            typeof(JournalLineRow),
            typeof(JournalEntryRow),
            DeleteBehavior.Restrict,
            nameof(JournalLineRow.JournalEntryId));
    }

    [Fact]
    public void RelationalModel_ContainsDeterministicFinancialCheckConstraints()
    {
        using var context = CreateContext();

        AssertCheck(context, typeof(JournalLineRow), "CK_journal_lines_one_sided_positive_finite_amount");
        AssertCheck(context, typeof(JournalEntryRow), "CK_journal_entries_posted_at_or_after_occurred_at");
        AssertCheck(context, typeof(JournalEntryRow), "CK_journal_entries_not_self_reversal");
        AssertCheck(context, typeof(JournalEntryRow), "CK_journal_entries_idempotency_key_nonblank");
        AssertCheck(context, typeof(ExternalTransactionRow), "CK_external_transactions_currency_irr");
        AssertCheck(context, typeof(LedgerAccountRow), "CK_ledger_accounts_currency_irr");
        AssertCheck(context, typeof(PaymentInstructionRow), "CK_payment_instructions_positive_finite_amount");
        AssertCheck(context, typeof(FrozenPrincipalRow), "CK_frozen_principals_positive_finite_amount");
        AssertCheck(context, typeof(FundingAllocationRow), "CK_funding_allocations_amounts_and_equation");
    }

    private static void AssertForeignKey(
        CharkhooneDbContext context,
        Type dependentType,
        Type principalType,
        DeleteBehavior deleteBehavior,
        params string[] properties)
    {
        var entity = context.Model.FindEntityType(dependentType);
        Assert.NotNull(entity);
        Assert.Contains(entity!.GetForeignKeys(), foreignKey =>
            foreignKey.PrincipalEntityType.ClrType == principalType
            && foreignKey.DeleteBehavior == deleteBehavior
            && foreignKey.Properties.Select(x => x.Name).SequenceEqual(properties));
    }

    private static void AssertCheck(CharkhooneDbContext context, Type entityType, string name)
    {
        var designTimeModel = context.GetService<IDesignTimeModel>().Model;
        var entity = designTimeModel.FindEntityType(entityType);
        Assert.NotNull(entity);
        Assert.Contains(entity!.GetCheckConstraints(), constraint => constraint.Name == name);
    }

    private static CharkhooneDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql("Host=localhost;Database=charkhoone_model_test;Username=test;Password=test")
            .Options;

        return new CharkhooneDbContext(options);
    }
}
