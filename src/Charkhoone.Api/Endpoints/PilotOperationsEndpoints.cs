using Charkhoone.Api.Security;
using Charkhoone.Application.PilotOperations;
using Charkhoone.Domain.CreditApplications;
using Microsoft.AspNetCore.Mvc;

namespace Charkhoone.Api.Endpoints;

public static class PilotOperationsEndpoints
{
    public static RouteGroupBuilder MapPilotOperationsEndpoints(this RouteGroupBuilder api)
    {
        var pilot = api.MapGroup("/pilot")
            .RequireAuthorization(PilotOperationsOptions.AuthorizationPolicy);

        pilot.MapGet("/cases", ListCasesAsync);
        pilot.MapGet("/cases/{applicationId:guid}", GetCaseAsync);
        pilot.MapPost("/cases/{applicationId:guid}/reconcile", ReconcileAsync)
            .RequireRateLimiting(ApiRateLimitPolicies.SensitiveMutation);

        return api;
    }

    private static async Task<IResult> ListCasesAsync(
        [FromQuery] string? status,
        [FromQuery] int page,
        [FromQuery] int pageSize,
        IPilotOperationsService service,
        CancellationToken cancellationToken)
    {
        CreditApplicationStatus? parsedStatus = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<CreditApplicationStatus>(status.Trim(), true, out var value))
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Pilot case status is invalid.",
                    extensions: new Dictionary<string, object?>
                    {
                        ["code"] = "pilot_case_status_invalid",
                    });
            }

            parsedStatus = value;
        }

        var normalizedPage = page <= 0 ? 1 : page;
        var normalizedPageSize = pageSize <= 0 ? 50 : pageSize;
        if (normalizedPageSize > 200)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Pilot case page size cannot exceed 200.",
                extensions: new Dictionary<string, object?>
                {
                    ["code"] = "pilot_case_page_size_invalid",
                });
        }

        var items = await service.ListCasesAsync(
            new PilotCaseQueueQuery(parsedStatus, normalizedPage, normalizedPageSize),
            cancellationToken);

        return Results.Ok(new
        {
            page = normalizedPage,
            pageSize = normalizedPageSize,
            items,
        });
    }

    private static async Task<IResult> GetCaseAsync(
        Guid applicationId,
        IPilotOperationsService service,
        CancellationToken cancellationToken)
    {
        var detail = await service.GetCaseAsync(applicationId, cancellationToken);
        return detail is null
            ? Results.Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Pilot case was not found.",
                extensions: new Dictionary<string, object?>
                {
                    ["code"] = "pilot_case_not_found",
                })
            : Results.Ok(detail);
    }

    private static async Task<IResult> ReconcileAsync(
        Guid applicationId,
        PilotReconcileRequest request,
        ClaimsPrincipal principal,
        IPilotOperationsService service,
        TimeProvider timeProvider,
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

        if (request is null
            || string.IsNullOrWhiteSpace(request.Operation)
            || !Enum.TryParse<PilotReconcileOperation>(request.Operation.Trim(), true, out var operation))
        {
            return Results.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Pilot reconcile operation is invalid.",
                extensions: new Dictionary<string, object?>
                {
                    ["code"] = "pilot_reconcile_operation_invalid",
                });
        }

        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Trim().Length > 1000)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Pilot reconcile reason is required and must be 1000 characters or fewer.",
                extensions: new Dictionary<string, object?>
                {
                    ["code"] = "pilot_reconcile_reason_invalid",
                });
        }

        var result = await service.ReconcileAsync(
            applicationId,
            operation,
            subject,
            request.Reason,
            timeProvider.GetUtcNow(),
            cancellationToken);

        return result.Outcome switch
        {
            PilotReconcileOutcome.Executed => Results.Ok(result),
            PilotReconcileOutcome.NotFound => Results.Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Pilot case was not found.",
                extensions: new Dictionary<string, object?>
                {
                    ["code"] = "pilot_case_not_found",
                }),
            PilotReconcileOutcome.Conflict => Results.Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Pilot reconciliation conflicts with persisted trusted evidence.",
                extensions: new Dictionary<string, object?>
                {
                    ["code"] = "pilot_reconcile_conflict",
                    ["operationOutcome"] = result.OperationOutcome,
                }),
            PilotReconcileOutcome.InvalidState => Results.Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "Pilot reconciliation is invalid from the current case state.",
                extensions: new Dictionary<string, object?>
                {
                    ["code"] = "pilot_reconcile_invalid_state",
                    ["operationOutcome"] = result.OperationOutcome,
                }),
            _ => throw new InvalidOperationException("Unsupported pilot reconciliation outcome."),
        };
    }
}

public sealed record PilotReconcileRequest(
    string Operation,
    string Reason);
