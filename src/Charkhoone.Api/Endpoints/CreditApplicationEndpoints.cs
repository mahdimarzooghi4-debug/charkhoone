using System.Security.Claims;
using Charkhoone.Application.CreditApplications;

namespace Charkhoone.Api.Endpoints;

public static class CreditApplicationEndpoints
{
    public static RouteGroupBuilder MapCreditApplicationEndpoints(this RouteGroupBuilder api)
    {
        api.MapPost("/credit-applications", CreateCreditApplicationAsync)
            .RequireAuthorization()
            .WithName("CreateCreditApplication")
            .Produces<CreditApplicationResponse>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        api.MapPost("/credit-applications/{id:guid}/submit", SubmitCreditApplicationAsync)
            .RequireAuthorization()
            .WithName("SubmitCreditApplication")
            .Produces<CreditApplicationResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);

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
