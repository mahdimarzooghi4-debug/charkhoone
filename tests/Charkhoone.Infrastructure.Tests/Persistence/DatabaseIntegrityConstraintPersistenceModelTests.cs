using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Xunit;

namespace Charkhoone.Infrastructure.Tests.Persistence;

public sealed class DatabaseIntegrityConstraintPersistenceModelTests
{
    [Fact]
    public void PaymentInstruction_RequiresPositiveAmount()
    {
        using var context = CreateContext();
        var entity = GetDesignTimeEntityType<PaymentInstructionRow>(context);

        Assert.Contains(entity.GetCheckConstraints(), check =>
            check.Name == "CK_payment_instructions_amount_rial_positive"
            && check.Sql == "\"AmountRial\" > 0");
    }

    [Fact]
    public void ExternalTransaction_RequiresPositiveAmount()
    {
        using var context = CreateContext();
        var entity = GetDesignTimeEntityType<ExternalTransactionRow>(context);

        Assert.Contains(entity.GetCheckConstraints(), check =>
            check.Name == "CK_external_transactions_amount_rial_positive"
            && check.Sql == "\"AmountRial\" > 0");
    }

    [Fact]
    public void TenantContribution_RequiresPositiveInitialAmount()
    {
        using var context = CreateContext();
        var entity = GetDesignTimeEntityType<TenantContributionRow>(context);

        Assert.Contains(entity.GetCheckConstraints(), check =>
            check.Name == "CK_tenant_contributions_initial_amount_rial_positive"
            && check.Sql == "\"InitialAmountRial\" > 0");
    }

    [Fact]
    public void JournalLine_RequiresExactlyOnePositiveSide()
    {
        using var context = CreateContext();
        var entity = GetDesignTimeEntityType<JournalLineRow>(context);

        Assert.Contains(entity.GetCheckConstraints(), check =>
            check.Name == "CK_journal_lines_single_sided_positive_amount"
            && check.Sql == "\"DebitRial\" >= 0 AND \"CreditRial\" >= 0 AND ((\"DebitRial\" > 0 AND \"CreditRial\" = 0) OR (\"CreditRial\" > 0 AND \"DebitRial\" = 0))");
    }

    private static IEntityType GetDesignTimeEntityType<TEntity>(CharkhooneDbContext context)
    {
        var entity = context.GetService<IDesignTimeModel>().Model.FindEntityType(typeof(TEntity));
        Assert.NotNull(entity);
        return entity!;
    }

    private static CharkhooneDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql("Host=localhost;Database=charkhoone_model_test;Username=test;Password=test")
            .Options;

        return new CharkhooneDbContext(options);
    }
}
