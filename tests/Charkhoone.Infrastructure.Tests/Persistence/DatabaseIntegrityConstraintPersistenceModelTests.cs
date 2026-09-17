using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Charkhoone.Infrastructure.Tests.Persistence;

public sealed class DatabaseIntegrityConstraintPersistenceModelTests
{
    [Fact]
    public void PaymentInstruction_RequiresPositiveAmount()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(PaymentInstructionRow));

        Assert.NotNull(entity);
        Assert.Contains(entity!.GetCheckConstraints(), check =>
            check.Name == "CK_payment_instructions_amount_rial_positive"
            && check.Sql == "\"AmountRial\" > 0");
    }

    [Fact]
    public void ExternalTransaction_RequiresPositiveAmount()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(ExternalTransactionRow));

        Assert.NotNull(entity);
        Assert.Contains(entity!.GetCheckConstraints(), check =>
            check.Name == "CK_external_transactions_amount_rial_positive"
            && check.Sql == "\"AmountRial\" > 0");
    }

    [Fact]
    public void TenantContribution_RequiresPositiveInitialAmount()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(TenantContributionRow));

        Assert.NotNull(entity);
        Assert.Contains(entity!.GetCheckConstraints(), check =>
            check.Name == "CK_tenant_contributions_initial_amount_rial_positive"
            && check.Sql == "\"InitialAmountRial\" > 0");
    }

    [Fact]
    public void JournalLine_RequiresExactlyOnePositiveSide()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(JournalLineRow));

        Assert.NotNull(entity);
        Assert.Contains(entity!.GetCheckConstraints(), check =>
            check.Name == "CK_journal_lines_single_sided_positive_amount"
            && check.Sql == "\"DebitRial\" >= 0 AND \"CreditRial\" >= 0 AND ((\"DebitRial\" > 0 AND \"CreditRial\" = 0) OR (\"CreditRial\" > 0 AND \"DebitRial\" = 0))");
    }

    private static CharkhooneDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql("Host=localhost;Database=charkhoone_model_test;Username=test;Password=test")
            .Options;

        return new CharkhooneDbContext(options);
    }
}
