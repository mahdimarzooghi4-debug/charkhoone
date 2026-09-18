using System.Globalization;
using System.Security.Claims;
using Charkhoone.Application.CreditApplications;
using Charkhoone.Application.Mobile;

namespace Charkhoone.Api.Endpoints;

public static class MobileBootstrapEndpoints
{
    public static RouteGroupBuilder MapMobileBootstrapEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/mobile/bootstrap", GetBootstrapAsync)
            .RequireAuthorization()
            .WithName("GetMobileBootstrap")
            .Produces<MobileBootstrapResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        return api;
    }

    private static async Task<IResult> GetBootstrapAsync(
        ClaimsPrincipal principal,
        IUserIdentityLookup userIdentityLookup,
        IMobileBootstrapService bootstrap,
        CancellationToken cancellationToken)
    {
        var subject = principal.FindFirst("sub")?.Value?.Trim();
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

        var userId = await userIdentityLookup.FindInternalUserIdAsync(subject, cancellationToken);
        if (userId is null)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Authenticated user is not mapped to a Charkhoone user.",
                extensions: new Dictionary<string, object?>
                {
                    ["code"] = "local_user_not_found",
                });
        }

        var view = await bootstrap.GetAsync(userId.Value, cancellationToken);
        return Results.Ok(ToResponse(view));
    }

    private static MobileBootstrapResponse ToResponse(MobileBootstrapView view) =>
        new(
            view.UserId,
            view.LatestCreditApplication is null
                ? null
                : new MobileCreditApplicationResponse(
                    view.LatestCreditApplication.CreditApplicationId,
                    view.LatestCreditApplication.Status.ToString(),
                    view.LatestCreditApplication.UpdatedAtUtc),
            view.Contracts
                .Select(contract => new MobileContractResponse(
                    contract.ContractId,
                    contract.Role,
                    contract.Status.ToString(),
                    DecimalText(contract.MonthlyRentRial),
                    contract.UpdatedAtUtc))
                .ToArray(),
            view.Payments
                .Select(payment => new MobilePaymentResponse(
                    payment.PaymentInstructionId,
                    payment.MonthlyObligationId,
                    payment.ContractId,
                    payment.ContractMonthNumber,
                    payment.Kind.ToString(),
                    payment.DueAtUtc,
                    DecimalText(payment.AmountRial)!,
                    payment.Status.ToString(),
                    payment.UpdatedAtUtc))
                .ToArray());

    private static string? DecimalText(decimal? value) =>
        value?.ToString("0.############################", CultureInfo.InvariantCulture);
}

public sealed record MobileBootstrapResponse(
    Guid UserId,
    MobileCreditApplicationResponse? LatestCreditApplication,
    IReadOnlyList<MobileContractResponse> Contracts,
    IReadOnlyList<MobilePaymentResponse> Payments);

public sealed record MobileCreditApplicationResponse(
    Guid CreditApplicationId,
    string Status,
    DateTimeOffset UpdatedAtUtc);

public sealed record MobileContractResponse(
    Guid ContractId,
    string Role,
    string Status,
    string? MonthlyRentRial,
    DateTimeOffset UpdatedAtUtc);

public sealed record MobilePaymentResponse(
    Guid PaymentInstructionId,
    Guid MonthlyObligationId,
    Guid ContractId,
    int ContractMonthNumber,
    string Kind,
    DateTimeOffset DueAtUtc,
    string AmountRial,
    string Status,
    DateTimeOffset UpdatedAtUtc);
