using System.Security.Claims;
using Charkhoone.Api.Security;
using Charkhoone.Application.Contracts;
using Charkhoone.Application.CreditApplications;
using Charkhoone.Application.Payments;

namespace Charkhoone.Api.Endpoints;

public static class ContractEndpoints
{
    public static RouteGroupBuilder MapContractEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/contracts/{id:guid}", GetContractAsync)
            .RequireAuthorization()
            .WithName("GetContract")
            .Produces<ContractDetailResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound);

        api.MapPost("/contracts/{id:guid}/settlement/reconcile", ReconcileSettlementAsync)
            .RequireAuthorization()
            .RequireRateLimiting(ApiRateLimitPolicies.SensitiveMutation)
            .WithName("ReconcileNormalContractSettlement")
            .Produces<NormalSettlementReconciliationResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        api.MapGet("/contracts/{id:guid}/settlement", GetSettlementAsync)
            .RequireAuthorization()
            .WithName("GetNormalContractSettlement")
            .Produces<NormalSettlementResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound);

        api.MapGet("/contracts/{id:guid}/audit-events", GetAuditEventsAsync)
            .RequireAuthorization()
            .WithName("GetContractAuditEvents")
            .Produces<ContractAuditPageResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound);

        return api;
    }

    private static async Task<IResult> GetContractAsync(
        Guid id,
        ClaimsPrincipal principal,
        IUserIdentityLookup userIdentityLookup,
        IContractReadService contracts,
        CancellationToken cancellationToken)
    {
        var identity = await ResolveUserAsync(principal, userIdentityLookup, cancellationToken);
        if (identity.Error is not null)
        {
            return identity.Error;
        }

        var detail = await contracts.GetDetailAsync(
            id,
            identity.UserId!.Value,
            cancellationToken);

        return detail is null
            ? ContractNotFound()
            : Results.Ok(ToResponse(detail));
    }

    private static async Task<IResult> ReconcileSettlementAsync(
        Guid id,
        ClaimsPrincipal principal,
        IUserIdentityLookup userIdentityLookup,
        IContractReadService contracts,
        INormalSettlementService settlements,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var identity = await ResolveUserAsync(principal, userIdentityLookup, cancellationToken);
        if (identity.Error is not null)
        {
            return identity.Error;
        }

        var access = await contracts.GetAccessibleContractAsync(
            id,
            identity.UserId!.Value,
            cancellationToken);
        if (access is null)
        {
            return ContractNotFound();
        }

        var result = await settlements.SettleAsync(
            id,
            timeProvider.GetUtcNow(),
            cancellationToken);

        return result.Outcome switch
        {
            SettleNormalContractOutcome.Completed
                or SettleNormalContractOutcome.AlreadyCompleted
                or SettleNormalContractOutcome.Failed
                or SettleNormalContractOutcome.Indeterminate
                => Results.Ok(new NormalSettlementReconciliationResponse(
                    result.Outcome.ToString(),
                    ToResponse(result.Settlement!))),
            SettleNormalContractOutcome.NotFound => ContractNotFound(),
            SettleNormalContractOutcome.InvalidState => Results.Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Contract cannot be reconciled for normal settlement from its current state.",
                extensions: new Dictionary<string, object?>
                {
                    ["code"] = "normal_settlement_invalid_state",
                    ["contractStatus"] = access.Status.ToString(),
                }),
            _ => throw new InvalidOperationException("Unsupported normal settlement outcome."),
        };
    }

    private static async Task<IResult> GetSettlementAsync(
        Guid id,
        ClaimsPrincipal principal,
        IUserIdentityLookup userIdentityLookup,
        IContractReadService contracts,
        INormalSettlementService settlements,
        CancellationToken cancellationToken)
    {
        var identity = await ResolveUserAsync(principal, userIdentityLookup, cancellationToken);
        if (identity.Error is not null)
        {
            return identity.Error;
        }

        var access = await contracts.GetAccessibleContractAsync(
            id,
            identity.UserId!.Value,
            cancellationToken);
        if (access is null)
        {
            return ContractNotFound();
        }

        var settlement = await settlements.GetAsync(id, cancellationToken);
        return settlement is null
            ? Results.Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Normal settlement has not been created for this contract.",
                extensions: new Dictionary<string, object?>
                {
                    ["code"] = "normal_settlement_not_found",
                    ["contractStatus"] = access.Status.ToString(),
                })
            : Results.Ok(ToResponse(settlement));
    }

    private static async Task<IResult> GetAuditEventsAsync(
        Guid id,
        int? page,
        int? pageSize,
        string? action,
        ClaimsPrincipal principal,
        IUserIdentityLookup userIdentityLookup,
        IContractReadService contracts,
        CancellationToken cancellationToken)
    {
        var identity = await ResolveUserAsync(principal, userIdentityLookup, cancellationToken);
        if (identity.Error is not null)
        {
            return identity.Error;
        }

        var resolvedPage = page ?? 1;
        var resolvedPageSize = pageSize ?? 50;
        var normalizedAction = string.IsNullOrWhiteSpace(action) ? null : action.Trim();

        if (resolvedPage < 1 || resolvedPageSize is < 1 or > 100 || normalizedAction?.Length > 128)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Audit-event paging or filter parameters are invalid.",
                extensions: new Dictionary<string, object?>
                {
                    ["code"] = "invalid_audit_query",
                    ["page"] = resolvedPage,
                    ["pageSize"] = resolvedPageSize,
                });
        }

        var result = await contracts.GetAuditEventsAsync(
            id,
            identity.UserId!.Value,
            resolvedPage,
            resolvedPageSize,
            normalizedAction,
            cancellationToken);
        if (result is null)
        {
            return ContractNotFound();
        }

        return Results.Ok(new ContractAuditPageResponse(
            result.Items.Select(x => new ContractAuditEventResponse(
                x.Id,
                x.ActorId,
                x.Action,
                x.Reason,
                x.OccurredAtUtc)).ToArray(),
            result.Page,
            result.PageSize,
            result.TotalCount,
            result.HasNextPage));
    }

    private static async Task<(Guid? UserId, IResult? Error)> ResolveUserAsync(
        ClaimsPrincipal principal,
        IUserIdentityLookup userIdentityLookup,
        CancellationToken cancellationToken)
    {
        var subject = principal.FindFirst("sub")?.Value;
        if (string.IsNullOrWhiteSpace(subject))
        {
            return (null, Results.Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Authenticated subject is missing.",
                extensions: new Dictionary<string, object?>
                {
                    ["code"] = "missing_oidc_subject",
                }));
        }

        var internalUserId = await userIdentityLookup.FindInternalUserIdAsync(subject, cancellationToken);
        if (internalUserId is null)
        {
            return (null, Results.Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Authenticated user is not mapped to a Charkhoone user.",
                extensions: new Dictionary<string, object?>
                {
                    ["code"] = "local_user_not_found",
                }));
        }

        return (internalUserId.Value, null);
    }

    private static IResult ContractNotFound() =>
        Results.Problem(
            statusCode: StatusCodes.Status404NotFound,
            title: "Contract was not found.",
            extensions: new Dictionary<string, object?>
            {
                ["code"] = "contract_not_found",
            });

    private static ContractDetailResponse ToResponse(ContractDetailView detail) =>
        new(
            detail.ContractId,
            detail.TenantUserId,
            detail.OwnerUserId,
            detail.PropertyId,
            detail.CreditApplicationId,
            detail.Status.ToString(),
            detail.BankLoanPlanId,
            detail.BankLoanPlanVersion,
            detail.CreditGradePolicyVersion,
            detail.CreatedAtUtc,
            detail.UpdatedAtUtc,
            detail.Terms is null
                ? null
                : new LeaseContractTermsResponse(
                    detail.Terms.Calendar,
                    detail.Terms.PersianStartYear,
                    detail.Terms.PersianStartMonth,
                    detail.Terms.PersianStartDay,
                    detail.Terms.TermMonths,
                    detail.Terms.CashDepositRial,
                    detail.Terms.MonthlyRentRial,
                    detail.Terms.FullDepositEquivalentRial,
                    detail.Terms.OwnerBeneficiaryId,
                    detail.Terms.BankBeneficiaryId,
                    detail.Terms.SourceReference,
                    detail.Terms.CapturedAtUtc,
                    detail.Terms.ScheduleMonths.Select(month => new LeaseContractScheduleMonthResponse(
                        month.ContractMonthNumber,
                        month.DueAtUtc,
                        month.OwnerPaymentRial,
                        month.BankInterestRial)).ToArray()),
            detail.Delinquency is null
                ? null
                : new ContractDelinquencyResponse(
                    detail.Delinquency.ConsecutiveMissedMonths,
                    detail.Delinquency.CancellationRequired,
                    detail.Delinquency.UpdatedAtUtc),
            detail.FrozenPrincipal is null
                ? null
                : new FrozenPrincipalResponse(
                    detail.FrozenPrincipal.BankId,
                    detail.FrozenPrincipal.AmountRial,
                    detail.FrozenPrincipal.FundReference,
                    detail.FrozenPrincipal.FrozenAtUtc),
            detail.TenantContribution is null
                ? null
                : new TenantContributionBalanceResponse(
                    detail.TenantContribution.InitialAmountRial,
                    detail.TenantContribution.ConfirmedReplenishmentsRial,
                    detail.TenantContribution.ConfirmedCoverageRial,
                    detail.TenantContribution.AvailableBalanceRial,
                    detail.TenantContribution.FundReference,
                    detail.TenantContribution.FundedAtUtc),
            detail.MonthlyObligations.Select(obligation => new ContractMonthlyObligationResponse(
                obligation.Id,
                obligation.ContractMonthNumber,
                obligation.DueAtUtc,
                obligation.Status.ToString(),
                obligation.Components.Select(component => new ContractPaymentComponentResponse(
                    component.PaymentInstructionId,
                    component.Kind.ToString(),
                    component.BeneficiaryId,
                    component.AmountRial,
                    component.PaymentStatus.ToString(),
                    component.ExternalTransactionStatus?.ToString(),
                    component.Provider,
                    component.ExternalReference,
                    component.ReasonCode,
                    component.UpdatedAtUtc)).ToArray(),
                obligation.UpdatedAtUtc,
                obligation.ClosedAtUtc)).ToArray(),
            detail.PaymentsRequiringReconciliation.Select(payment => new PaymentReconciliationAttentionResponse(
                payment.PaymentInstructionId,
                payment.MonthlyObligationId,
                payment.ContractMonthNumber,
                payment.Kind.ToString(),
                payment.AmountRial,
                payment.PaymentStatus.ToString(),
                payment.ExternalTransactionStatus?.ToString(),
                payment.Provider,
                payment.ExternalReference,
                payment.ReasonCode,
                payment.UpdatedAtUtc)).ToArray(),
            detail.Settlement is null
                ? null
                : new ContractNormalSettlementResponse(
                    detail.Settlement.Id,
                    detail.Settlement.BankPrincipalAmountRial,
                    detail.Settlement.BankPrincipalStatus.ToString(),
                    detail.Settlement.TenantResidualAmountRial,
                    detail.Settlement.TenantResidualStatus.ToString(),
                    detail.Settlement.UpdatedAtUtc,
                    detail.Settlement.CompletedAtUtc),
            detail.OpenLostFundReturnExposureCount);

    private static NormalSettlementResponse ToResponse(NormalSettlementView settlement) =>
        new(
            settlement.Id,
            settlement.ContractId,
            settlement.TenantUserId,
            settlement.BankId,
            settlement.BankPrincipalAmountRial,
            settlement.BankPrincipalStatus.ToString(),
            settlement.BankExternalTransactionId,
            settlement.BankExternalReference,
            settlement.BankJournalEntryId,
            settlement.TenantResidualAmountRial,
            settlement.TenantResidualStatus.ToString(),
            settlement.TenantExternalTransactionId,
            settlement.TenantExternalReference,
            settlement.TenantJournalEntryId,
            settlement.UpdatedAtUtc,
            settlement.CompletedAtUtc);
}

public sealed record ContractDetailResponse(
    Guid ContractId,
    Guid TenantUserId,
    Guid OwnerUserId,
    Guid PropertyId,
    Guid? CreditApplicationId,
    string Status,
    Guid? BankLoanPlanId,
    string? BankLoanPlanVersion,
    string? CreditGradePolicyVersion,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc,
    LeaseContractTermsResponse? Terms,
    ContractDelinquencyResponse? Delinquency,
    FrozenPrincipalResponse? FrozenPrincipal,
    TenantContributionBalanceResponse? TenantContribution,
    IReadOnlyList<ContractMonthlyObligationResponse> MonthlyObligations,
    IReadOnlyList<PaymentReconciliationAttentionResponse> PaymentsRequiringReconciliation,
    ContractNormalSettlementResponse? Settlement,
    int OpenLostFundReturnExposureCount);

public sealed record LeaseContractScheduleMonthResponse(
    int ContractMonthNumber,
    DateTimeOffset DueAtUtc,
    decimal OwnerPaymentRial,
    decimal BankInterestRial);

public sealed record LeaseContractTermsResponse(
    string Calendar,
    int PersianStartYear,
    int PersianStartMonth,
    int PersianStartDay,
    int TermMonths,
    decimal CashDepositRial,
    decimal MonthlyRentRial,
    decimal FullDepositEquivalentRial,
    string OwnerBeneficiaryId,
    string BankBeneficiaryId,
    string SourceReference,
    DateTimeOffset CapturedAtUtc,
    IReadOnlyList<LeaseContractScheduleMonthResponse> ScheduleMonths);

public sealed record ContractDelinquencyResponse(
    int ConsecutiveMissedMonths,
    bool CancellationRequired,
    DateTimeOffset UpdatedAtUtc);

public sealed record FrozenPrincipalResponse(
    string BankId,
    decimal AmountRial,
    string FundReference,
    DateTimeOffset FrozenAtUtc);

public sealed record TenantContributionBalanceResponse(
    decimal InitialAmountRial,
    decimal ConfirmedReplenishmentsRial,
    decimal ConfirmedCoverageRial,
    decimal AvailableBalanceRial,
    string FundReference,
    DateTimeOffset FundedAtUtc);

public sealed record ContractMonthlyObligationResponse(
    Guid Id,
    int ContractMonthNumber,
    DateTimeOffset DueAtUtc,
    string Status,
    IReadOnlyList<ContractPaymentComponentResponse> Components,
    DateTimeOffset UpdatedAtUtc,
    DateTimeOffset? ClosedAtUtc);

public sealed record ContractPaymentComponentResponse(
    Guid PaymentInstructionId,
    string Kind,
    string BeneficiaryId,
    decimal AmountRial,
    string PaymentStatus,
    string? ExternalTransactionStatus,
    string? Provider,
    string? ExternalReference,
    string? ReasonCode,
    DateTimeOffset UpdatedAtUtc);

public sealed record PaymentReconciliationAttentionResponse(
    Guid PaymentInstructionId,
    Guid MonthlyObligationId,
    int ContractMonthNumber,
    string Kind,
    decimal AmountRial,
    string PaymentStatus,
    string? ExternalTransactionStatus,
    string? Provider,
    string? ExternalReference,
    string? ReasonCode,
    DateTimeOffset UpdatedAtUtc);

public sealed record ContractNormalSettlementResponse(
    Guid Id,
    decimal BankPrincipalAmountRial,
    string BankPrincipalStatus,
    decimal TenantResidualAmountRial,
    string TenantResidualStatus,
    DateTimeOffset UpdatedAtUtc,
    DateTimeOffset? CompletedAtUtc);

public sealed record NormalSettlementReconciliationResponse(
    string Outcome,
    NormalSettlementResponse Settlement);

public sealed record NormalSettlementResponse(
    Guid Id,
    Guid ContractId,
    Guid TenantUserId,
    string BankId,
    decimal BankPrincipalAmountRial,
    string BankPrincipalStatus,
    Guid? BankExternalTransactionId,
    string? BankExternalReference,
    Guid? BankJournalEntryId,
    decimal TenantResidualAmountRial,
    string TenantResidualStatus,
    Guid? TenantExternalTransactionId,
    string? TenantExternalReference,
    Guid? TenantJournalEntryId,
    DateTimeOffset UpdatedAtUtc,
    DateTimeOffset? CompletedAtUtc);

public sealed record ContractAuditEventResponse(
    Guid Id,
    string ActorId,
    string Action,
    string Reason,
    DateTimeOffset OccurredAtUtc);

public sealed record ContractAuditPageResponse(
    IReadOnlyList<ContractAuditEventResponse> Items,
    int Page,
    int PageSize,
    int TotalCount,
    bool HasNextPage);
