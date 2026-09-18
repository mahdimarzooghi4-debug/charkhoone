using System.Security.Claims;
using Charkhoone.Api.Security;
using Charkhoone.Application.CreditApplications;
using Charkhoone.Application.Payments;

namespace Charkhoone.Api.Endpoints;

public static class PaymentEndpoints
{
    public static RouteGroupBuilder MapPaymentEndpoints(this RouteGroupBuilder api)
    {
        api.MapPost("/payments/{id:guid}/reconcile", ReconcilePaymentAsync)
            .RequireAuthorization()
            .RequireRateLimiting(ApiRateLimitPolicies.SensitiveMutation)
            .WithName("ReconcilePayment")
            .Produces<PaymentReconciliationResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        return api;
    }

    private static async Task<IResult> ReconcilePaymentAsync(
        Guid id,
        ClaimsPrincipal principal,
        IUserIdentityLookup userIdentityLookup,
        IPaymentReconciliationService payments,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var identity = await ResolveUserAsync(principal, userIdentityLookup, cancellationToken);
        if (identity.Error is not null)
        {
            return identity.Error;
        }

        var result = await payments.ReconcileAsync(
            id,
            identity.UserId!.Value,
            timeProvider.GetUtcNow(),
            cancellationToken);

        return result.Outcome switch
        {
            ReconcilePaymentOutcome.Reconciled
                or ReconcilePaymentOutcome.AlreadyReconciled
                or ReconcilePaymentOutcome.Failed
                or ReconcilePaymentOutcome.Indeterminate
                => Results.Ok(ToResponse(result)),
            ReconcilePaymentOutcome.ArrearsOutstanding
                => Results.Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "Older tenant arrears must be settled in full before a newer monthly payment can be started.",
                    extensions: new Dictionary<string, object?>
                    {
                        ["code"] = "older_arrears_outstanding",
                        ["contractId"] = result.Payment?.ContractId,
                    }),
            ReconcilePaymentOutcome.NotFound
                => Results.Problem(
                    statusCode: StatusCodes.Status404NotFound,
                    title: "Payment instruction was not found.",
                    extensions: new Dictionary<string, object?>
                    {
                        ["code"] = "payment_instruction_not_found",
                    }),
            ReconcilePaymentOutcome.InvalidState
                => Results.Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "Payment instruction cannot be reconciled from its current state.",
                    extensions: new Dictionary<string, object?>
                    {
                        ["code"] = "payment_instruction_invalid_state",
                        ["currentStatus"] = result.Payment?.PaymentStatus.ToString(),
                    }),
            _ => throw new InvalidOperationException("Unsupported payment reconciliation outcome."),
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

    private static PaymentReconciliationResponse ToResponse(ReconcilePaymentResult result)
    {
        var payment = result.Payment!;
        return new PaymentReconciliationResponse(
            result.Outcome.ToString(),
            payment.PaymentInstructionId,
            payment.MonthlyObligationId,
            payment.ContractId,
            payment.AmountRial,
            payment.BeneficiaryId,
            payment.PaymentStatus.ToString(),
            payment.ObligationStatus.ToString(),
            payment.ExternalReference,
            payment.ConsecutiveMissedMonths,
            payment.CancellationRequired,
            payment.UpdatedAtUtc);
    }
}

public sealed record PaymentReconciliationResponse(
    string Outcome,
    Guid PaymentInstructionId,
    Guid MonthlyObligationId,
    Guid ContractId,
    decimal AmountRial,
    string BeneficiaryId,
    string PaymentStatus,
    string ObligationStatus,
    string? ExternalReference,
    int ConsecutiveMissedMonths,
    bool CancellationRequired,
    DateTimeOffset UpdatedAtUtc);
