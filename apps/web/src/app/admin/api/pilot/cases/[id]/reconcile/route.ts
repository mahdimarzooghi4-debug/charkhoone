import { NextRequest, NextResponse } from "next/server";
import {
  isPilotReconcileOperation,
  pilotApiRequest,
  PilotApiError,
} from "@/lib/pilotOperations";

const guidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function redirectResult(request: NextRequest, applicationId: string, result: "ok" | "error", code?: string) {
  const target = new URL(`/admin/cases/${applicationId}`, request.url);
  target.searchParams.set("reconcile", result);
  if (code) target.searchParams.set("code", code);
  return NextResponse.redirect(target, 303);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!guidPattern.test(id)) {
    return redirectResult(request, id, "error", "pilot_application_id_invalid");
  }

  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    return redirectResult(request, id, "error", "pilot_reconcile_origin_rejected");
  }

  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return redirectResult(request, id, "error", "pilot_operator_authentication_required");
  }

  const form = await request.formData();
  const operationValue = form.get("operation");
  const reasonValue = form.get("reason");
  const operation = typeof operationValue === "string" ? operationValue.trim() : "";
  const reason = typeof reasonValue === "string" ? reasonValue.trim() : "";

  if (!isPilotReconcileOperation(operation)) {
    return redirectResult(request, id, "error", "pilot_reconcile_operation_invalid");
  }

  if (!reason || reason.length > 1000) {
    return redirectResult(request, id, "error", "pilot_reconcile_reason_invalid");
  }

  try {
    await pilotApiRequest(
      `/api/v1/pilot/cases/${encodeURIComponent(id)}/reconcile`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ operation, reason }),
      },
      authorization,
    );

    return redirectResult(request, id, "ok");
  } catch (error) {
    if (error instanceof PilotApiError) {
      return redirectResult(request, id, "error", error.code);
    }

    return redirectResult(request, id, "error", "pilot_reconcile_unexpected_error");
  }
}
