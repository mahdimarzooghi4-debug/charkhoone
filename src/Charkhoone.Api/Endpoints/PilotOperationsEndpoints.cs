using System.Globalization;
using System.Security.Claims;
using Charkhoone.Api.Security;
using Charkhoone.Application.PilotOperations;
using Charkhoone.Domain.CreditApplications;
using Charkhoone.Domain.Payments;
using Microsoft.AspNetCore.Mvc;

namespace Charkhoone.Api.Endpoints;

public static class PilotOperationsEndpoints
{
    public static RouteGroupBuilder MapPilotOperationsEndpoints(this RouteGroupBuilder api)
    {
        var pilot = api.MapGroup("/pilot")
            .RequireAuthorization(PilotOperationsOptions.AuthorizationPolicy);

        pilot.MapGet("/payments", ListPaymentsAsync);
        pilot.MapGet("/cases", ListCasesAsync);
        pilot.MapGet("/cases/{applicationId:guid}", GetCaseAsync);
        pilot.MapPost("/cases/{applicationId:guid}/reconcile", ReconcileAsync)
            .RequireRateLimiting(ApiRateLimitPolicies.SensitiveMutation);

        return api;
    }

    private static async Task<IResult> ListPaymentsAsync(
        [FromQuery] string? status,
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        IPilotOperationsService service,
        CancellationToken cancellationToken)
    {
        PaymentInstructionStatus? parsedStatus = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!Enum.TryParse<PaymentInstructionStatus>(status.Trim(), true, out var value))
            {
                return Results.Problem(
                    statusCode: StatusCodes.Status400BadRequest,
                    title: "Pilot payment status is invalid.",
                    extensions: new Dictionary<string, object?>
                    {
                        ["code"] = "pilot_payment_status_invalid",
                    });
            }

            parsedStatus = value;
        }

        var normalizedPage = page is null or <= 0 ? 1 : page.Value;
        var normalizedPageSize = pageSize is null or <= 0 ? 50 : pageSize.Value;
        if (normalizedPageSize > 200)
        {
            return Results.Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Pilot payment page size cannot exceed 200.",
                extensions: new Dictionary<string, object?>
                {
                    ["code"] = "pilot_payment_page_size_invalid",
                });
        }

        var items = await service.ListPaymentsAsync(
            new PilotPaymentQueueQuery(parsedStatus, normalizedPage, normalizedPageSize),
            cancellationToken);

        return Results.Ok(new
        {
            page = normalizedPage,
            pageSize = normalizedPageSize,
            items = items.Select(ToPaymentQueueResponse).ToArray(),
        });
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
            items = items.Select(ToQueueResponse).ToArray(),
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
            : Results.Ok(ToDetailResponse(detail));
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
            PilotReconcileOutcome.Executed => Results.Ok(ToReconcileResponse(result)),
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

    private static object ToPaymentQueueResponse(PilotPaymentQueueItem item) => new
    {
        paymentInstructionId = item.PaymentInstructionId,
        monthlyObligationId = item.MonthlyObligationId,
        contractId = item.ContractId,
        creditApplicationId = item.CreditApplicationId,
        contractMonthNumber = item.ContractMonthNumber,
        kind = item.Kind.ToString(),
        beneficiaryId = item.BeneficiaryId,
        amountRial = DecimalText(item.AmountRial),
        paymentStatus = item.PaymentStatus.ToString(),
        externalTransactionId = item.ExternalTransactionId,
        externalTransactionStatus = item.ExternalTransactionStatus?.ToString(),
        provider = item.Provider,
        externalReference = item.ExternalReference,
        reasonCode = item.ReasonCode,
        dueAtUtc = item.DueAtUtc,
        updatedAtUtc = item.UpdatedAtUtc,
    };

    private static object ToQueueResponse(PilotCaseQueueItem item) => new
    {
        creditApplicationId = item.CreditApplicationId,
        applicantUserId = item.ApplicantUserId,
        applicationStatus = item.ApplicationStatus.ToString(),
        contractId = item.ContractId,
        contractStatus = item.ContractStatus?.ToString(),
        latestVerificationType = item.LatestVerificationType,
        latestVerificationStatus = item.LatestVerificationStatus,
        creditEligibilityStatus = item.CreditEligibilityStatus,
        bankApprovalStatus = item.BankApprovalStatus,
        fundFreezeStatus = item.FundFreezeStatus,
        tenantContributionStatus = item.TenantContributionStatus,
        suggestedOperation = item.SuggestedOperation?.ToString(),
        updatedAtUtc = item.UpdatedAtUtc,
    };

    private static object ToDetailResponse(PilotCaseDetail detail) => new
    {
        creditApplicationId = detail.CreditApplicationId,
        applicantUserId = detail.ApplicantUserId,
        applicationStatus = detail.ApplicationStatus.ToString(),
        bankLoanPlanId = detail.BankLoanPlanId,
        bankLoanPlanVersion = detail.BankLoanPlanVersion,
        contractId = detail.ContractId,
        contractStatus = detail.ContractStatus?.ToString(),
        ownerUserId = detail.OwnerUserId,
        propertyId = detail.PropertyId,
        verificationRequests = detail.VerificationRequests,
        creditEligibility = detail.CreditEligibility is null ? null : ToCreditEligibilityResponse(detail.CreditEligibility),
        bankApproval = detail.BankApproval is null ? null : ToBankApprovalResponse(detail.BankApproval),
        fundingAllocation = detail.FundingAllocation is null ? null : ToFundingAllocationResponse(detail.FundingAllocation),
        fundFreeze = detail.FundFreeze,
        tenantContributionFunding = detail.TenantContributionFunding is null
            ? null
            : ToTenantContributionFundingResponse(detail.TenantContributionFunding),
        recentAuditEvents = detail.RecentAuditEvents,
        suggestedOperation = detail.SuggestedOperation?.ToString(),
        updatedAtUtc = detail.UpdatedAtUtc,
    };

    private static string DecimalText(decimal value) =>
        value.ToString(CultureInfo.InvariantCulture);

    private static string? DecimalText(decimal? value) =>
        value?.ToString(CultureInfo.InvariantCulture);

    private static object ToCreditEligibilityResponse(PilotCreditEligibilityView value) => new
    {
        provider = value.Provider,
        status = value.Status,
        externalSubGrade = value.ExternalSubGrade,
        fullDepositEquivalentRial = DecimalText(value.FullDepositEquivalentRial),
        loanRatio = DecimalText(value.LoanRatio),
        maximumEligibleLoanRial = DecimalText(value.MaximumEligibleLoanRial),
        externalReference = value.ExternalReference,
        reasonCode = value.ReasonCode,
        attemptCount = value.AttemptCount,
        updatedAtUtc = value.UpdatedAtUtc,
    };

    private static object ToBankApprovalResponse(PilotBankApprovalView value) => new
    {
        provider = value.Provider,
        status = value.Status,
        maximumEligibleLoanRial = DecimalText(value.MaximumEligibleLoanRial),
        approvedLoanRial = DecimalText(value.ApprovedLoanRial),
        externalReference = value.ExternalReference,
        reasonCode = value.ReasonCode,
        attemptCount = value.AttemptCount,
        updatedAtUtc = value.UpdatedAtUtc,
    };

    private static object ToFundingAllocationResponse(PilotFundingAllocationView value) => new
    {
        id = value.Id,
        contractId = value.ContractId,
        bankId = value.BankId,
        fullDepositEquivalentRial = DecimalText(value.FullDepositEquivalentRial),
        maximumEligibleLoanRial = DecimalText(value.MaximumEligibleLoanRial),
        bankApprovedLoanRial = DecimalText(value.BankApprovedLoanRial),
        tenantContributionRial = DecimalText(value.TenantContributionRial),
        updatedAtUtc = value.UpdatedAtUtc,
    };

    private static object ToTenantContributionFundingResponse(PilotTenantContributionFundingView value) => new
    {
        fundingId = value.FundingId,
        externalTransactionId = value.ExternalTransactionId,
        provider = value.Provider,
        status = value.Status,
        amountRial = DecimalText(value.AmountRial),
        currency = value.Currency,
        fundReference = value.FundReference,
        externalReference = value.ExternalReference,
        reasonCode = value.ReasonCode,
        attemptCount = value.AttemptCount,
        updatedAtUtc = value.UpdatedAtUtc,
    };

    private static object ToReconcileResponse(PilotReconcileResult result) => new
    {
        outcome = result.Outcome.ToString(),
        operation = result.Operation.ToString(),
        operationOutcome = result.OperationOutcome,
        applicationStatus = result.ApplicationStatus?.ToString(),
        contractStatus = result.ContractStatus?.ToString(),
        auditEventId = result.AuditEventId,
        occurredAtUtc = result.OccurredAtUtc,
    };
}

public sealed record PilotReconcileRequest(
    string Operation,
    string Reason);
