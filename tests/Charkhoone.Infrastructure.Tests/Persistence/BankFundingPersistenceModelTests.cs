using Charkhoone.Infrastructure.Persistence;
using Charkhoone.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Charkhoone.Infrastructure.Tests.Persistence;

public sealed class BankFundingPersistenceModelTests
{
    [Fact]
    public void BankApproval_IsIdempotentPerCreditApplication()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(BankApprovalRow));

        Assert.NotNull(entity);
        Assert.Equal("bank_approvals", entity!.GetTableName());
        Assert.Contains(entity.GetIndexes(), index =>
            index.IsUnique
            && index.Properties.Count == 1
            && index.Properties[0].Name == nameof(BankApprovalRow.CreditApplicationId));
        Assert.Contains(entity.GetIndexes(), index =>
            index.IsUnique
            && index.Properties.Count == 1
            && index.Properties[0].Name == nameof(BankApprovalRow.IdempotencyKey));
    }

    [Fact]
    public void FundingAllocation_SeparatesTheoreticalCeilingFromBankApprovedAmount()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(FundingAllocationRow));

        Assert.NotNull(entity);
        Assert.Equal("funding_allocations", entity!.GetTableName());

        var maximum = entity.FindProperty(nameof(FundingAllocationRow.MaximumEligibleLoanRial));
        var approved = entity.FindProperty(nameof(FundingAllocationRow.BankApprovedLoanRial));
        var contribution = entity.FindProperty(nameof(FundingAllocationRow.TenantContributionRial));

        Assert.Equal(38, maximum!.GetPrecision());
        Assert.Equal(18, maximum.GetScale());
        Assert.Equal(38, approved!.GetPrecision());
        Assert.Equal(18, approved.GetScale());
        Assert.Equal(38, contribution!.GetPrecision());
        Assert.Equal(18, contribution.GetScale());
    }

    [Fact]
    public void FundFreeze_IsIdempotentAndFrozenPrincipalStillHasNoDebitField()
    {
        using var context = CreateContext();
        var freeze = context.Model.FindEntityType(typeof(FundPrincipalFreezeRow));
        var principal = context.Model.FindEntityType(typeof(FrozenPrincipalRow));

        Assert.NotNull(freeze);
        Assert.Contains(freeze!.GetIndexes(), index =>
            index.IsUnique
            && index.Properties.Count == 1
            && index.Properties[0].Name == nameof(FundPrincipalFreezeRow.FundingAllocationId));

        Assert.NotNull(principal);
        Assert.DoesNotContain(principal!.GetProperties(), property =>
            property.Name.Contains("Debit", StringComparison.OrdinalIgnoreCase)
            || property.Name.Contains("Available", StringComparison.OrdinalIgnoreCase));
    }

    private static CharkhooneDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<CharkhooneDbContext>()
            .UseNpgsql("Host=localhost;Database=charkhoone_model_test;Username=test;Password=test")
            .Options;

        return new CharkhooneDbContext(options);
    }
}
