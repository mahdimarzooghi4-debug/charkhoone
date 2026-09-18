using System.Security.Claims;
using Charkhoone.Api.Security;
using Charkhoone.Application.BankFunding;
using Charkhoone.Application.Contracts;
using Charkhoone.Application.CreditApplications;
using Charkhoone.Application.CreditEligibility;

namespace Charkhoone.Api.Endpoints;

public static class CreditApplicationEndpoints
{
    public static RouteGroupBuilder MapCreditApplicationEndpoints(this RouteGroupBuilder api)
    {
        api.MapPost("/credit-applications", CreateCreditApplicationAsync)
            .RequireAuthorization()
            .RequireRateLimiting(ApiRateLimitPolicies.SensitiveMutation)
            .WithName("CreateCreditApplication")
            .Produces<CreditApplicationResponse>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        api.MapPost("/credit-applications/{id:guid}/submit", SubmitCreditApplicationAsync)
            .RequireAuthorization()
            .RequireRateLimiting(ApiRateLimitPolicies.SensitiveMutation)
            .WithName("SubmitCreditApplication")
            .Produces<CreditApplicationResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        api.MapGet("/credit-applications/{id:guid}/loan-plans", ListBankLoanPlansAsync)
            .RequireAuthorization()
            .WithName("ListBankLoanPlans")
            .Produces<BankLoanPlanListResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);

        api.MapPost("/credit-applications/{id:guid}/loan-plan", SelectBankLoanPlanAsync)
            .RequireAuthorization()
            .RequireRateLimiting(ApiRateLimitPolicies.SensitiveMutation)
            .WithName("SelectBankLoanPlan")
            .Produces<BankLoanPlanSelectionResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        api.MapPost("/credit-applications/{id:guid}/property-contract/reconcile", ReconcilePropertyContractAsync)
            .RequireAuthorization()
            .RequireRateLimiting(ApiRateLimitPolicies.SensitiveMutation)
            .WithName("ReconcilePropertyContract")
            .Produces<PropertyContractRegistrationResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        api.MapPost("/credit-applications/{id:guid}/credit-eligibility/reconcile", ReconcileCreditEligibilityAsync)
            .RequireAuthorization()
            .RequireRateLimiting(ApiRateLimitPolicies.SensitiveMutation)
            .WithName("ReconcileCreditEligibility")
            .Produces<CreditEligibilityResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        api.MapPost("/credit-applications/{id:guid}/bank-funding/reconcile", ReconcileBankFundingAsync)
            .RequireAuthorization()
            .RequireRateLimiting(ApiRateLimitPolicies.SensitiveMutation)
            .WithName("ReconcileBankFunding")
            .Produces<BankFundingResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        return api;
    }

    private static async Task<IResult> CreateCreditApplicationAsync(
        ClaimsPrincipal principal,
        IUserIdentityLookup userIdentityLookup,
        ICreditApplicationService creditApplications,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var identity = await ResolveUserAsync(principal, userIdentityLookup, cancellationToken);
        if (identity.Error is not null)
        {
            return identity.Error;
        }

        var created = await creditApplications.CreateDraftAsync(
            identity.UserId!.Value,
            timeProvider.GetUtcNow(),
            cancellationToken);

        return Results.Json(ToResponse(created), statusCode: StatusCodes.Status201Created);
    }

    private static async Task<IResult> SubmitCreditApplicationAsync(
        Guid id,
        ClaimsPrincipal principal,
        IUserIdentityLookup userIdentityLookup,
        ICreditApplicationService creditApplications,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var identity = await ResolveUserAsync(principal, userIdentityLookup, cancellationToken);
        if (identity.Error is not null)
        {
            return identity.Error;
        }

        var result = await creditApplications.SubmitAsync(
            id,
            identity.UserId!.Value,
            timeProvider.GetUtcNow(),
            cancellationToken);

        return result.Outcome switch
        {
            SubmitCreditApplicationOutcome.Submitted or SubmitCreditApplicationOutcome.AlreadySubmitted
                => Results.Ok(ToResponse(result.Application!)),
            SubmitCreditApplicationOutcome.NotFound
                => Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Credit application was not found.",
                    extensions: new Dictionary<string, object?>
                    {
                        ["code"] = "credit_application_not_found",
                    }),
            SubmitCreditApplicationOutcome.InvalidState
                => Results.Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "Credit application cannot be submitted from its current state.",
                    extensions: new Dictionary<string, object?>
                    {
                        ["code"] = "credit_application_invalid_state",
                        ["currentStatus"] = result.Application?.Status.ToString(),
                    }),
            _ => throw new InvalidOperationException("Unsupported credit application submission outcome."),
        };
    }

    private static async Task<IResult> ListBankLoanPlansAsync(
        Guid id,
        ClaimsPrincipal principal,
        IUserIdentityLookup userIdentityLookup,
        IBankLoanPlanReadService planReader,
        CancellationToken cancellationToken)
    {
        var identity = await ResolveUserAsync(principal, userIdentityLookup, cancellationToken);
        if (identity.Error is not null)
        {
            return identity.Error;
        }

        var result = await planReader.ListAvailableAsync(
            id,
            identity.UserId!.Value,
            cancellationToken);

        return result.Outcome switch
        {
            ListBankLoanPlansOutcome.Available
                => Results.Ok(new BankLoanPlanListResponse(
                    result.CreditApplicationId,
                    result.ApplicationStatus!.Value.ToString(),
                    result.Plans
                        .Select(plan => new BankLoanPlanListItemResponse(
                            plan.PlanId,
                            plan.Version,
                            plan.BankId,
                            plan.Title,
                            plan.InterestTerms,
                            plan.TermMonths))
                        .ToArray())),
            ListBankLoanPlansOutcome.NotFound
                => Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Credit application was not found.",
                    extensions: new Dictionary<string, object?>
                    {
                        ["code"] = "credit_application_not_found",
                    }),
            ListBankLoanPlansOutcome.InvalidState
                => Results.Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "Bank loan plans are available only while the application is awaiting plan selection.",
                    extensions: new Dictionary<string, object?>
                    {
                        ["code"] = "bank_loan_plan_list_invalid_state",
                        ["currentStatus"] = result.ApplicationStatus?.ToString(),
                    }),
            _ => throw new InvalidOperationException("Unsupported bank-loan plan list outcome."),
        };
    }

    private static async Task<IResult> SelectBankLoanPlanAsync(
        Guid id,
        SelectBankLoanPlanRequest request,
        ClaimsPrincipal principal,
        IUserIdentityLookup userIdentityLookup,
        ICreditApplicationService creditApplications,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        if (request.PlanId == Guid.Empty || string.IsNullOrWhiteSpace(request.Version))
        {
            return Results.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Bank loan plan id and version are required.",
                extensions: new Dictionary<string, object?>
                {
                    ["code"] = "invalid_bank_loan_plan_selection",
                });
        }

        var identity = await ResolveUserAsync(principal, userIdentityLookup, cancellationToken);
        if (identity.Error is not null)
        {
            return identity.Error;
        }

        var result = await creditApplications.SelectBankLoanPlanAsync(
            id,
            identity.UserId!.Value,
            request.PlanId,
            request.Version,
            timeProvider.GetUtcNow(),
            cancellationToken);

        return result.Outcome switch
        {
            SelectBankLoanPlanOutcome.Selected or SelectBankLoanPlanOutcome.AlreadySelected
                => Results.Ok(ToResponse(result)),
            SelectBankLoanPlanOutcome.NotFound
                => Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Credit application was not found.",
                    extensions: new Dictionary<string, object?>
                    {
                        ["code"] = "credit_application_not_found",
                    }),
            SelectBankLoanPlanOutcome.PlanNotFound
                => Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Bank loan plan version was not found.",
                    extensions: new Dictionary<string, object?>
                    {
                        ["code"] = "bank_loan_plan_not_found",
                    }),
            SelectBankLoanPlanOutcome.PlanUnavailable
                => Results.Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "Bank loan plan version is not available for public applicant selection.",
                    extensions: new Dictionary<string, object?>
                    {
                        ["code"] = "bank_loan_plan_unavailable",
                    }),
            SelectBankLoanPlanOutcome.Conflict
                => Results.Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "A different bank loan plan version is already bound to this application.",
                    extensions: new Dictionary<string, object?>
                    {
                        ["code"] = "bank_loan_plan_selection_conflict",
                    }),
            SelectBankLoanPlanOutcome.InvalidState
                => Results.Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "Bank loan plan cannot be selected from the current application state.",
                    extensions: new Dictionary<string, object?>
                    {
                        ["code"] = "bank_loan_plan_selection_invalid_state",
                    }),
            _ => throw new InvalidOperationException("Unsupported bank loan plan selection outcome."),
        };
    }

    private static async Task<IResult> ReconcilePropertyContractAsync(
        Guid id,
        ClaimsPrincipal principal,
        IUserIdentityLookup userIdentityLookup,
        IPropertyContractRegistrationService registrations,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var identity = await ResolveUserAsync(principal, userIdentityLookup, cancellationToken);
        if (identity.Error is not null)
        {
            return identity.Error;
        }

        var result = await registrations.ReconcileAsync(
            id,
            identity.UserId!.Value,
            timeProvider.GetUtcNow(),
            cancellationToken);

        return result.Outcome switch
        {
            ReconcilePropertyContractOutcome.Registered
                or ReconcilePropertyContractOutcome.AlreadyRegistered
                or ReconcilePropertyContractOutcome.NeedsDocuments
                or ReconcilePropertyContractOutcome.Indeterminate
                => Results.Ok(ToResponse(result)),
            ReconcilePropertyContractOutcome.NotFound
                => Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Credit application was not found.",
                    extensions: new Dictionary<string, object?>
                    {
                        ["code"] = "credit_application_not_found",
                    }),
            ReconcilePropertyContractOutcome.Conflict
                => Results.Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "Trusted property-contract evidence conflicts with persisted contract state.",
                    extensions: new Dictionary<string, object?>
                    {
                        ["code"] = "property_contract_conflict",
                    }),
            ReconcilePropertyContractOutcome.InvalidState
                => Results.Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "Property-contract evidence cannot be reconciled from the current application state.",
                    extensions: new Dictionary<string, object?>
                    {
                        ["code"] = "property_contract_invalid_state",
                    }),
            _ => throw new InvalidOperationException("Unsupported property-contract reconciliation outcome."),
        };
    }

    private static async Task<IResult> ReconcileCreditEligibilityAsync(
        Guid id,
        ClaimsPrincipal principal,
        IUserIdentityLookup userIdentityLookup,
        ICreditEligibilityService creditEligibility,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var identity = await ResolveUserAsync(principal, userIdentityLookup, cancellationToken);
        if (identity.Error is not null)
        {
            return identity.Error;
        }

        var result = await creditEligibility.EvaluateAsync(
            id,
            identity.UserId!.Value,
            timeProvider.GetUtcNow(),
            cancellationToken);

        return result.Outcome switch
        {
            EvaluateCreditEligibilityOutcome.Applied
                or EvaluateCreditEligibilityOutcome.AlreadyEvaluated
                or EvaluateCreditEligibilityOutcome.Indeterminate
                => Results.Ok(ToResponse(result)),
            EvaluateCreditEligibilityOutcome.NotFound
                => Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Credit application was not found.",
                    extensions: new Dictionary<string, object?>
                    {
                        ["code"] = "credit_application_not_found",
                    }),
            EvaluateCreditEligibilityOutcome.Conflict
                => Results.Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "Persisted credit-eligibility evidence conflicts with the trusted contract snapshot.",
                    extensions: new Dictionary<string, object?>
                    {
                        ["code"] = "credit_eligibility_snapshot_conflict",
                    }),
            EvaluateCreditEligibilityOutcome.InvalidState
                => Results.Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "Credit eligibility cannot be reconciled from the current trusted application state.",
                    extensions: new Dictionary<string, object?>
                    {
                        ["code"] = "credit_eligibility_invalid_state",
                    }),
            _ => throw new InvalidOperationException("Unsupported credit-eligibility outcome."),
        };
    }

    private static async Task<IResult> ReconcileBankFundingAsync(
        Guid id,
        ClaimsPrincipal principal,
        IUserIdentityLookup userIdentityLookup,
        IBankFundingService bankFunding,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var identity = await ResolveUserAsync(principal, userIdentityLookup, cancellationToken);
        if (identity.Error is not null)
        {
            return identity.Error;
        }

        var result = await bankFunding.ProcessAsync(
            id,
            identity.UserId!.Value,
            timeProvider.GetUtcNow(),
            cancellationToken);

        return result.Outcome switch
        {
            ProcessBankFundingOutcome.Funded
                or ProcessBankFundingOutcome.AlreadyFunded
                or ProcessBankFundingOutcome.BankApprovalIndeterminate
                or ProcessBankFundingOutcome.BankDeclined
                or ProcessBankFundingOutcome.FundingIndeterminate
                => Results.Ok(ToResponse(result)),
            ProcessBankFundingOutcome.NotFound
                => Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Credit application was not found.",
                    extensions: new Dictionary<string, object?>
                    {
                        ["code"] = "credit_application_not_found",
                    }),
            ProcessBankFundingOutcome.Conflict
                => Results.Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "Persisted bank/funding evidence conflicts with trusted eligibility or contract state.",
                    extensions: new Dictionary<string, object?>
                    {
                        ["code"] = "bank_funding_evidence_conflict",
                    }),
            ProcessBankFundingOutcome.InvalidState
                => Results.Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "Bank funding cannot be reconciled from the current trusted application state.",
                    extensions: new Dictionary<string, object?>
                    {
                        ["code"] = "bank_funding_invalid_state",
                    }),
            _ => throw new InvalidOperationException("Unsupported bank-funding outcome."),
        };
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

        var internalUserId = await userIdentityLookup.FindInternalUserIdAsync(
            subject,
            cancellationToken);

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

    private static BankFundingResponse ToResponse(ProcessBankFundingResult result)
    {
        var funding = result.Funding;
        return new BankFundingResponse(
            result.Outcome.ToString(),
            funding?.CreditApplicationId,
            funding?.ApplicationStatus.ToString(),
            funding?.ContractId,
            funding?.BankId,
            funding?.FullDepositEquivalentRial,
            funding?.MaximumEligibleLoanRial,
            funding?.BankApprovedLoanRial,
            funding?.TenantContributionRial,
            funding?.FundReference,
            funding?.UpdatedAtUtc);
    }

    private static CreditEligibilityResponse ToResponse(
        EvaluateCreditEligibilityResult result)
    {
        var eligibility = result.Eligibility;
        return new CreditEligibilityResponse(
            result.Outcome.ToString(),
            eligibility?.CreditApplicationId,
            eligibility?.ApplicationStatus.ToString(),
            eligibility?.ExternalCreditStatus.ToString(),
            eligibility?.Provider,
            eligibility?.ExternalSubGrade,
            eligibility?.FullDepositEquivalentRial,
            eligibility?.LoanRatio,
            eligibility?.MaximumEligibleLoanRial,
            eligibility?.UpdatedAtUtc);
    }

    private static PropertyContractRegistrationResponse ToResponse(
        ReconcilePropertyContractResult result)
    {
        var registration = result.Registration;
        return new PropertyContractRegistrationResponse(
            result.Outcome.ToString(),
            registration?.CreditApplicationId,
            registration?.ApplicationStatus.ToString(),
            registration?.ContractId,
            registration?.ContractStatus.ToString(),
            registration?.OwnerUserId,
            registration?.PropertyId,
            registration?.BankLoanPlanId,
            registration?.BankLoanPlanVersion,
            registration?.FullDepositEquivalentRial,
            registration?.SourceReference,
            registration?.UpdatedAtUtc);
    }

    private static BankLoanPlanSelectionResponse ToResponse(SelectBankLoanPlanResult result)
    {
        var selection = result.Selection!;
        return new BankLoanPlanSelectionResponse(
            result.Outcome.ToString(),
            selection.CreditApplicationId,
            selection.ApplicationStatus.ToString(),
            selection.PlanId,
            selection.PlanVersion,
            selection.BankId,
            selection.Title,
            selection.UpdatedAtUtc);
    }

    private static CreditApplicationResponse ToResponse(CreditApplicationView application) =>
        new(
            application.Id,
            application.Status.ToString(),
            application.CreatedAtUtc,
            application.UpdatedAtUtc);
}

public sealed record CreditApplicationResponse(
    Guid Id,
    string Status,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);


public sealed record BankLoanPlanListResponse(
    Guid CreditApplicationId,
    string ApplicationStatus,
    IReadOnlyList<BankLoanPlanListItemResponse> Items);

public sealed record BankLoanPlanListItemResponse(
    Guid PlanId,
    string Version,
    string BankId,
    string Title,
    string InterestTerms,
    int TermMonths);


public sealed record SelectBankLoanPlanRequest(
    Guid PlanId,
    string Version);

public sealed record BankLoanPlanSelectionResponse(
    string Outcome,
    Guid CreditApplicationId,
    string ApplicationStatus,
    Guid PlanId,
    string PlanVersion,
    string BankId,
    string Title,
    DateTimeOffset UpdatedAtUtc);


public sealed record PropertyContractRegistrationResponse(
    string Outcome,
    Guid? CreditApplicationId,
    string? ApplicationStatus,
    Guid? ContractId,
    string? ContractStatus,
    Guid? OwnerUserId,
    Guid? PropertyId,
    Guid? BankLoanPlanId,
    string? BankLoanPlanVersion,
    decimal? FullDepositEquivalentRial,
    string? SourceReference,
    DateTimeOffset? UpdatedAtUtc);


public sealed record CreditEligibilityResponse(
    string Outcome,
    Guid? CreditApplicationId,
    string? ApplicationStatus,
    string? ExternalCreditStatus,
    string? Provider,
    string? ExternalSubGrade,
    decimal? FullDepositEquivalentRial,
    decimal? LoanRatio,
    decimal? MaximumEligibleLoanRial,
    DateTimeOffset? UpdatedAtUtc);


public sealed record BankFundingResponse(
    string Outcome,
    Guid? CreditApplicationId,
    string? ApplicationStatus,
    Guid? ContractId,
    string? BankId,
    decimal? FullDepositEquivalentRial,
    decimal? MaximumEligibleLoanRial,
    decimal? BankApprovedLoanRial,
    decimal? TenantContributionRial,
    string? FundReference,
    DateTimeOffset? UpdatedAtUtc);
