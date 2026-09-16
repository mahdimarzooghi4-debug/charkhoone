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

        return api;
    }

    private static async Task<IResult> CreateCreditApplicationAsync(
        ClaimsPrincipal principal,
        IUserIdentityLookup userIdentityLookup,
        ICreditApplicationService creditApplications,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var subject = principal.FindFirst("sub")?.Value;
        if (string.IsNullOrWhiteSpace(subject))
        {
            return Results.Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Authenticated subject is missing.",
                extensions: new Dictionary<string, object?>
                {
                    ["code"] = "missing_oidc_subject",
                });
        }

        var internalUserId = await userIdentityLookup.FindInternalUserIdAsync(
            subject,
            cancellationToken);

        if (internalUserId is null)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Authenticated user is not mapped to a Charkhoone user.",
                extensions: new Dictionary<string, object?>
                {
                    ["code"] = "local_user_not_found",
                });
        }

        var created = await creditApplications.CreateDraftAsync(
            internalUserId.Value,
            timeProvider.GetUtcNow(),
            cancellationToken);

        return Results.Json(
            new CreditApplicationResponse(
                created.Id,
                created.Status.ToString(),
                created.CreatedAtUtc,
                created.UpdatedAtUtc),
            statusCode: StatusCodes.Status201Created);
    }
}

public sealed record CreditApplicationResponse(
    Guid Id,
    string Status,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);
