import { headers } from "next/headers";

export const PILOT_RECONCILE_OPERATIONS = [
  "Identity",
  "PropertyContract",
  "CreditEligibility",
  "BankFunding",
  "TenantContributionFunding",
] as const;

export type PilotReconcileOperation = (typeof PILOT_RECONCILE_OPERATIONS)[number];

export type PilotPaymentQueueItem = {
  paymentInstructionId: string;
  monthlyObligationId: string;
  contractId: string;
  contractMonthNumber: number;
  kind: string;
  beneficiaryId: string;
  amountRial: string;
  paymentStatus: string;
  externalTransactionId: string | null;
  externalTransactionStatus: string | null;
  provider: string | null;
  externalReference: string | null;
  reasonCode: string | null;
  dueAtUtc: string;
  updatedAtUtc: string;
};

export type PilotPaymentListResponse = {
  page: number;
  pageSize: number;
  items: PilotPaymentQueueItem[];
};

export type PilotCaseQueueItem = {
  creditApplicationId: string;
  applicantUserId: string;
  applicationStatus: string;
  contractId: string | null;
  contractStatus: string | null;
  latestVerificationType: string | null;
  latestVerificationStatus: string | null;
  creditEligibilityStatus: string | null;
  bankApprovalStatus: string | null;
  fundFreezeStatus: string | null;
  tenantContributionStatus: string | null;
  suggestedOperation: PilotReconcileOperation | null;
  updatedAtUtc: string;
};

export type PilotCaseListResponse = {
  page: number;
  pageSize: number;
  items: PilotCaseQueueItem[];
};

export type PilotVerificationView = {
  id: string;
  type: string;
  provider: string;
  status: string;
  externalReference: string | null;
  reasonCode: string | null;
  attemptCount: number;
  updatedAtUtc: string;
};

export type PilotCreditEligibilityView = {
  provider: string;
  status: string;
  externalSubGrade: string | null;
  fullDepositEquivalentRial: string;
  loanRatio: string | null;
  maximumEligibleLoanRial: string | null;
  externalReference: string | null;
  reasonCode: string | null;
  attemptCount: number;
  updatedAtUtc: string;
};

export type PilotBankApprovalView = {
  provider: string;
  status: string;
  maximumEligibleLoanRial: string;
  approvedLoanRial: string | null;
  externalReference: string | null;
  reasonCode: string | null;
  attemptCount: number;
  updatedAtUtc: string;
};

export type PilotFundingAllocationView = {
  id: string;
  contractId: string;
  bankId: string;
  fullDepositEquivalentRial: string;
  maximumEligibleLoanRial: string;
  bankApprovedLoanRial: string;
  tenantContributionRial: string;
  updatedAtUtc: string;
};

export type PilotFundFreezeView = {
  provider: string;
  status: string;
  fundReference: string | null;
  externalReference: string | null;
  reasonCode: string | null;
  attemptCount: number;
  updatedAtUtc: string;
};

export type PilotTenantContributionFundingView = {
  fundingId: string;
  externalTransactionId: string;
  provider: string;
  status: string;
  amountRial: string;
  currency: string;
  fundReference: string | null;
  externalReference: string | null;
  reasonCode: string | null;
  attemptCount: number;
  updatedAtUtc: string;
};

export type PilotAuditEventView = {
  id: string;
  actorId: string;
  action: string;
  reason: string;
  occurredAtUtc: string;
};

export type PilotCaseDetail = {
  creditApplicationId: string;
  applicantUserId: string;
  applicationStatus: string;
  bankLoanPlanId: string | null;
  bankLoanPlanVersion: string | null;
  contractId: string | null;
  contractStatus: string | null;
  ownerUserId: string | null;
  propertyId: string | null;
  verificationRequests: PilotVerificationView[];
  creditEligibility: PilotCreditEligibilityView | null;
  bankApproval: PilotBankApprovalView | null;
  fundingAllocation: PilotFundingAllocationView | null;
  fundFreeze: PilotFundFreezeView | null;
  tenantContributionFunding: PilotTenantContributionFundingView | null;
  recentAuditEvents: PilotAuditEventView[];
  suggestedOperation: PilotReconcileOperation | null;
  updatedAtUtc: string;
};

type ProblemDetails = {
  title?: string;
  detail?: string;
  code?: string;
  operationOutcome?: string;
};

export class PilotApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "PilotApiError";
  }
}

function getApiBaseUrl(): URL {
  const configured = process.env.CHARKHOONE_API_BASE_URL?.trim();
  if (!configured) {
    throw new PilotApiError(
      503,
      "pilot_api_not_configured",
      "CHARKHOONE_API_BASE_URL is not configured for the admin web runtime.",
    );
  }

  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new PilotApiError(
      503,
      "pilot_api_base_url_invalid",
      "CHARKHOONE_API_BASE_URL must be an absolute HTTP(S) origin.",
    );
  }

  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.pathname !== "/" && url.pathname !== "")
  ) {
    throw new PilotApiError(
      503,
      "pilot_api_base_url_invalid",
      "CHARKHOONE_API_BASE_URL must be an absolute HTTP(S) origin without credentials, path, query, or fragment.",
    );
  }

  return url;
}

function requireBearerAuthorization(value: string | null | undefined): string {
  const authorization = value?.trim();
  if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) {
    throw new PilotApiError(
      401,
      "pilot_operator_authentication_required",
      "A bearer token from the real OIDC boundary is required.",
    );
  }

  return authorization;
}

async function readRequestAuthorization(): Promise<string> {
  const requestHeaders = await headers();
  return requireBearerAuthorization(requestHeaders.get("authorization"));
}

async function parseProblem(response: Response): Promise<ProblemDetails> {
  try {
    return (await response.json()) as ProblemDetails;
  } catch {
    return {};
  }
}

export function isPilotReconcileOperation(value: string): value is PilotReconcileOperation {
  return PILOT_RECONCILE_OPERATIONS.includes(value as PilotReconcileOperation);
}

export async function pilotApiRequest<T>(
  path: string,
  init: RequestInit = {},
  authorizationOverride?: string | null,
): Promise<T> {
  const authorization = authorizationOverride
    ? requireBearerAuthorization(authorizationOverride)
    : await readRequestAuthorization();

  const baseUrl = getApiBaseUrl();
  const target = new URL(path, baseUrl);
  if (target.origin !== baseUrl.origin || !target.pathname.startsWith("/api/v1/pilot/")) {
    throw new PilotApiError(
      500,
      "pilot_api_path_invalid",
      "The admin web attempted to call a non-pilot API path.",
    );
  }

  const requestHeaders = new Headers(init.headers);
  requestHeaders.set("authorization", authorization);
  requestHeaders.set("accept", "application/json");

  const response = await fetch(target, {
    ...init,
    headers: requestHeaders,
    cache: "no-store",
    redirect: "error",
  });

  if (!response.ok) {
    const problem = await parseProblem(response);
    throw new PilotApiError(
      response.status,
      problem.code ?? "pilot_api_request_failed",
      problem.detail ?? problem.title ?? `Pilot API request failed with HTTP ${response.status}.`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getPilotPayments(page: number, pageSize: number, status?: string) {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (status) {
    query.set("status", status);
  }

  return pilotApiRequest<PilotPaymentListResponse>(`/api/v1/pilot/payments?${query.toString()}`);
}

export async function getPilotCases(page: number, pageSize: number, status?: string) {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (status) {
    query.set("status", status);
  }

  return pilotApiRequest<PilotCaseListResponse>(`/api/v1/pilot/cases?${query.toString()}`);
}

export async function getPilotCase(applicationId: string) {
  return pilotApiRequest<PilotCaseDetail>(
    `/api/v1/pilot/cases/${encodeURIComponent(applicationId)}`,
  );
}
