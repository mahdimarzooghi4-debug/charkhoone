using System.Globalization;
using Charkhoone.Application.BankFunding;
using Microsoft.Extensions.Configuration;

namespace Charkhoone.Infrastructure.BankFunding;

public sealed class DevelopmentBankApprovalAdapter(IConfiguration configuration)
    : IExternalBankApprovalAdapter
{
    public string Provider => "development-mock";

    public Task<BankApprovalResponse> CheckAsync(
        BankApprovalRequest request,
        CancellationToken cancellationToken = default)
    {
        var configuredStatus = configuration["ExternalAdapters:BankApproval:DevelopmentStatus"];
        var status = Enum.TryParse<BankApprovalDecisionStatus>(configuredStatus, ignoreCase: true, out var parsed)
            ? parsed
            : BankApprovalDecisionStatus.Indeterminate;

        decimal? approvedLoanRial = null;
        var configuredAmount = configuration["ExternalAdapters:BankApproval:DevelopmentApprovedLoanRial"];
        if (status == BankApprovalDecisionStatus.Approved
            && decimal.TryParse(configuredAmount, NumberStyles.Number, CultureInfo.InvariantCulture, out var amount))
        {
            approvedLoanRial = amount;
        }

        return Task.FromResult(new BankApprovalResponse(
            status,
            Provider,
            approvedLoanRial,
            $"dev-bank:{request.ApprovalId:D}",
            "development_mock_response"));
    }
}

public sealed class UnavailableBankApprovalAdapter : IExternalBankApprovalAdapter
{
    public string Provider => "unconfigured";

    public Task<BankApprovalResponse> CheckAsync(
        BankApprovalRequest request,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(new BankApprovalResponse(
            BankApprovalDecisionStatus.Indeterminate,
            Provider,
            ReasonCode: "bank_approval_provider_unconfigured"));
}

public sealed class DevelopmentFundAdapter(IConfiguration configuration) : IExternalFundAdapter
{
    public string Provider => "development-mock";

    public Task<FundPrincipalFreezeResponse> FreezePrincipalAsync(
        FundPrincipalFreezeRequest request,
        CancellationToken cancellationToken = default)
    {
        var configuredStatus = configuration["ExternalAdapters:Fund:DevelopmentStatus"];
        var status = Enum.TryParse<FundPrincipalFreezeStatus>(configuredStatus, ignoreCase: true, out var parsed)
            ? parsed
            : FundPrincipalFreezeStatus.Indeterminate;

        var configuredReference = configuration["ExternalAdapters:Fund:DevelopmentFundReference"];
        var fundReference = status == FundPrincipalFreezeStatus.Confirmed
            ? (string.IsNullOrWhiteSpace(configuredReference)
                ? $"dev-fund:{request.FundingAllocationId:D}"
                : configuredReference.Trim())
            : null;

        return Task.FromResult(new FundPrincipalFreezeResponse(
            status,
            Provider,
            fundReference,
            $"dev-fund-request:{request.RequestId:D}",
            "development_mock_response"));
    }

    public Task<FundTenantContributionResponse> CheckTenantContributionAsync(
        FundTenantContributionRequest request,
        CancellationToken cancellationToken = default)
    {
        var configuredStatus = configuration["ExternalAdapters:Fund:TenantContributionDevelopmentStatus"];
        var status = Enum.TryParse<FundTenantContributionStatus>(configuredStatus, ignoreCase: true, out var parsed)
            ? parsed
            : FundTenantContributionStatus.Indeterminate;

        decimal? confirmedAmountRial = null;
        string? fundReference = null;

        if (status == FundTenantContributionStatus.Confirmed)
        {
            var configuredAmount = configuration["ExternalAdapters:Fund:TenantContributionDevelopmentAmountRial"];
            confirmedAmountRial = decimal.TryParse(
                configuredAmount,
                NumberStyles.Number,
                CultureInfo.InvariantCulture,
                out var amount)
                ? amount
                : request.ExpectedAmountRial;

            var configuredReference = configuration["ExternalAdapters:Fund:TenantContributionDevelopmentFundReference"];
            fundReference = string.IsNullOrWhiteSpace(configuredReference)
                ? $"dev-tenant-contribution:{request.FundingAllocationId:D}"
                : configuredReference.Trim();
        }

        return Task.FromResult(new FundTenantContributionResponse(
            status,
            Provider,
            confirmedAmountRial,
            fundReference,
            $"dev-tenant-contribution-request:{request.RequestId:D}",
            "development_mock_response"));
    }
}

public sealed class UnavailableFundAdapter : IExternalFundAdapter
{
    public string Provider => "unconfigured";

    public Task<FundPrincipalFreezeResponse> FreezePrincipalAsync(
        FundPrincipalFreezeRequest request,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(new FundPrincipalFreezeResponse(
            FundPrincipalFreezeStatus.Indeterminate,
            Provider,
            ReasonCode: "fund_provider_unconfigured"));

    public Task<FundTenantContributionResponse> CheckTenantContributionAsync(
        FundTenantContributionRequest request,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(new FundTenantContributionResponse(
            FundTenantContributionStatus.Indeterminate,
            Provider,
            ReasonCode: "fund_provider_unconfigured"));
}
