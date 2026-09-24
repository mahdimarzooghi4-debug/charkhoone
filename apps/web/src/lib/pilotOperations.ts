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
  creditApplicationId: string | null;
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

export function isAdminPreviewMode() {
  return process.env.CHARKHOONE_ADMIN_PREVIEW_MODE?.trim().toLowerCase() === "true";
}

const PREVIEW_CASES: PilotCaseQueueItem[] = [
  { creditApplicationId: "11111111-1111-4111-8111-111111111111", applicantUserId: "علی رضایی", applicationStatus: "DecisionReady", contractId: "contract-1405-1182", contractStatus: "Active", latestVerificationType: "Identity", latestVerificationStatus: "Verified", creditEligibilityStatus: "Approved", bankApprovalStatus: "Approved", fundFreezeStatus: "Confirmed", tenantContributionStatus: "Succeeded", suggestedOperation: null, updatedAtUtc: "2026-09-24T13:32:00Z" },
  { creditApplicationId: "22222222-2222-4222-8222-222222222222", applicantUserId: "مریم احمدی", applicationStatus: "ExternalChecksPending", contractId: "contract-1405-1181", contractStatus: "Draft", latestVerificationType: "CreditEligibility", latestVerificationStatus: "Pending", creditEligibilityStatus: "Pending", bankApprovalStatus: null, fundFreezeStatus: null, tenantContributionStatus: null, suggestedOperation: "CreditEligibility", updatedAtUtc: "2026-09-24T12:58:00Z" },
  { creditApplicationId: "33333333-3333-4333-8333-333333333333", applicantUserId: "رضا کاظمی", applicationStatus: "BankApprovalPending", contractId: "contract-1405-1178", contractStatus: "Active", latestVerificationType: "BankFunding", latestVerificationStatus: "Pending", creditEligibilityStatus: "Approved", bankApprovalStatus: "Pending", fundFreezeStatus: null, tenantContributionStatus: "Succeeded", suggestedOperation: "BankFunding", updatedAtUtc: "2026-09-24T12:40:00Z" },
  { creditApplicationId: "44444444-4444-4444-8444-444444444444", applicantUserId: "سارا محمدی", applicationStatus: "ExternalCheckIndeterminate", contractId: "contract-1405-1176", contractStatus: "Active", latestVerificationType: "PropertyContract", latestVerificationStatus: "Indeterminate", creditEligibilityStatus: "Approved", bankApprovalStatus: "Approved", fundFreezeStatus: "Unknown", tenantContributionStatus: "Succeeded", suggestedOperation: "PropertyContract", updatedAtUtc: "2026-09-24T11:22:00Z" },
  { creditApplicationId: "55555555-5555-4555-8555-555555555555", applicantUserId: "نگار کریمی", applicationStatus: "FundingPending", contractId: "contract-1405-1170", contractStatus: "Active", latestVerificationType: "TenantContributionFunding", latestVerificationStatus: "Verified", creditEligibilityStatus: "Approved", bankApprovalStatus: "Approved", fundFreezeStatus: "Confirmed", tenantContributionStatus: "Pending", suggestedOperation: "TenantContributionFunding", updatedAtUtc: "2026-09-24T10:48:00Z" },
  { creditApplicationId: "66666666-6666-4666-8666-666666666666", applicantUserId: "حسین جعفری", applicationStatus: "ApprovedFunded", contractId: "contract-1405-1168", contractStatus: "Active", latestVerificationType: "BankFunding", latestVerificationStatus: "Verified", creditEligibilityStatus: "Approved", bankApprovalStatus: "Approved", fundFreezeStatus: "Confirmed", tenantContributionStatus: "Succeeded", suggestedOperation: null, updatedAtUtc: "2026-09-23T16:10:00Z" },
  { creditApplicationId: "77777777-7777-4777-8777-777777777777", applicantUserId: "محمد مرادی", applicationStatus: "IdentityPending", contractId: null, contractStatus: null, latestVerificationType: "Identity", latestVerificationStatus: "Pending", creditEligibilityStatus: null, bankApprovalStatus: null, fundFreezeStatus: null, tenantContributionStatus: null, suggestedOperation: "Identity", updatedAtUtc: "2026-09-23T14:20:00Z" },
  { creditApplicationId: "88888888-8888-4888-8888-888888888888", applicantUserId: "زهرا یوسفی", applicationStatus: "PropertyContractPending", contractId: "contract-1405-1159", contractStatus: "Pending", latestVerificationType: "PropertyContract", latestVerificationStatus: "NeedsDocuments", creditEligibilityStatus: "Approved", bankApprovalStatus: null, fundFreezeStatus: null, tenantContributionStatus: null, suggestedOperation: "PropertyContract", updatedAtUtc: "2026-09-22T09:35:00Z" },
];

const PREVIEW_PAYMENTS: PilotPaymentQueueItem[] = [
  { paymentInstructionId: "PAY-1405-8421", monthlyObligationId: "obl-8421", contractId: "contract-1405-1182", creditApplicationId: PREVIEW_CASES[0].creditApplicationId, contractMonthNumber: 5, kind: "OwnerSettlement", beneficiaryId: "owner-1182", amountRial: "350000000", paymentStatus: "Succeeded", externalTransactionId: "trx-8421", externalTransactionStatus: "Succeeded", provider: "بانک نمونه", externalReference: "BR-8421", reasonCode: null, dueAtUtc: "2026-09-24T09:00:00Z", updatedAtUtc: "2026-09-24T14:32:00Z" },
  { paymentInstructionId: "PAY-1405-8418", monthlyObligationId: "obl-8418", contractId: "contract-1405-1181", creditApplicationId: PREVIEW_CASES[1].creditApplicationId, contractMonthNumber: 4, kind: "TenantPayment", beneficiaryId: "fund-01", amountRial: "180000000", paymentStatus: "Pending", externalTransactionId: null, externalTransactionStatus: "Pending", provider: "بانک نمونه", externalReference: null, reasonCode: null, dueAtUtc: "2026-09-24T09:30:00Z", updatedAtUtc: "2026-09-24T13:05:00Z" },
  { paymentInstructionId: "PAY-1405-8412", monthlyObligationId: "obl-8412", contractId: "contract-1405-1178", creditApplicationId: PREVIEW_CASES[2].creditApplicationId, contractMonthNumber: 6, kind: "BankFunding", beneficiaryId: "brokerage-01", amountRial: "350000000", paymentStatus: "Succeeded", externalTransactionId: "trx-8412", externalTransactionStatus: "Succeeded", provider: "کارگزاری نمونه", externalReference: "BR-8412", reasonCode: null, dueAtUtc: "2026-09-24T10:00:00Z", updatedAtUtc: "2026-09-24T12:40:00Z" },
  { paymentInstructionId: "PAY-1405-8408", monthlyObligationId: "obl-8408", contractId: "contract-1405-1176", creditApplicationId: PREVIEW_CASES[3].creditApplicationId, contractMonthNumber: 3, kind: "OwnerSettlement", beneficiaryId: "owner-1176", amountRial: "220000000", paymentStatus: "Failed", externalTransactionId: "trx-8408", externalTransactionStatus: "Failed", provider: "بانک نمونه", externalReference: "BR-8408", reasonCode: "provider_timeout", dueAtUtc: "2026-09-24T10:15:00Z", updatedAtUtc: "2026-09-24T11:22:00Z" },
  { paymentInstructionId: "PAY-1405-8401", monthlyObligationId: "obl-8401", contractId: "contract-1405-1170", creditApplicationId: PREVIEW_CASES[4].creditApplicationId, contractMonthNumber: 2, kind: "TenantPayment", beneficiaryId: "fund-02", amountRial: "160000000", paymentStatus: "ReconciliationRequired", externalTransactionId: "trx-8401", externalTransactionStatus: "Unknown", provider: "بانک نمونه", externalReference: "BR-8401", reasonCode: "status_unknown", dueAtUtc: "2026-09-24T08:45:00Z", updatedAtUtc: "2026-09-24T10:48:00Z" },
  { paymentInstructionId: "PAY-1405-8398", monthlyObligationId: "obl-8398", contractId: "contract-1405-1168", creditApplicationId: PREVIEW_CASES[5].creditApplicationId, contractMonthNumber: 7, kind: "OwnerSettlement", beneficiaryId: "owner-1168", amountRial: "210000000", paymentStatus: "Succeeded", externalTransactionId: "trx-8398", externalTransactionStatus: "Succeeded", provider: "بانک نمونه", externalReference: "BR-8398", reasonCode: null, dueAtUtc: "2026-09-23T11:00:00Z", updatedAtUtc: "2026-09-23T16:10:00Z" },
  { paymentInstructionId: "PAY-1405-8392", monthlyObligationId: "obl-8392", contractId: "contract-1405-1159", creditApplicationId: PREVIEW_CASES[7].creditApplicationId, contractMonthNumber: 1, kind: "TenantPayment", beneficiaryId: "fund-03", amountRial: "190000000", paymentStatus: "Created", externalTransactionId: null, externalTransactionStatus: null, provider: null, externalReference: null, reasonCode: null, dueAtUtc: "2026-09-25T09:00:00Z", updatedAtUtc: "2026-09-22T09:35:00Z" },
];

function previewPage<T>(items: T[], page: number, pageSize: number) {
  const start = Math.max(0, (page - 1) * pageSize);
  return items.slice(start, start + pageSize);
}

function previewCaseDetail(item: PilotCaseQueueItem): PilotCaseDetail {
  const now = item.updatedAtUtc;
  return {
    creditApplicationId: item.creditApplicationId,
    applicantUserId: item.applicantUserId,
    applicationStatus: item.applicationStatus,
    bankLoanPlanId: "plan-housing-1405",
    bankLoanPlanVersion: "v1",
    contractId: item.contractId,
    contractStatus: item.contractStatus,
    ownerUserId: item.contractId ? "owner-preview-01" : null,
    propertyId: item.contractId ? "property-preview-01" : null,
    verificationRequests: [
      { id: `verification-${item.creditApplicationId.slice(0, 8)}`, type: item.latestVerificationType ?? "Identity", provider: "سرویس آزمایشی", status: item.latestVerificationStatus ?? "Verified", externalReference: "preview-reference", reasonCode: null, attemptCount: 1, updatedAtUtc: now },
    ],
    creditEligibility: item.creditEligibilityStatus ? { provider: "سامانه اعتبارسنجی", status: item.creditEligibilityStatus, externalSubGrade: "A2", fullDepositEquivalentRial: "12500000000", loanRatio: "0.35", maximumEligibleLoanRial: "4375000000", externalReference: "credit-preview", reasonCode: null, attemptCount: 1, updatedAtUtc: now } : null,
    bankApproval: item.bankApprovalStatus ? { provider: "بانک نمونه", status: item.bankApprovalStatus, maximumEligibleLoanRial: "4375000000", approvedLoanRial: item.bankApprovalStatus === "Approved" ? "3500000000" : null, externalReference: "bank-preview", reasonCode: null, attemptCount: 1, updatedAtUtc: now } : null,
    fundingAllocation: item.contractId ? { id: `allocation-${item.creditApplicationId.slice(0, 8)}`, contractId: item.contractId, bankId: "bank-sample", fullDepositEquivalentRial: "12500000000", maximumEligibleLoanRial: "4375000000", bankApprovedLoanRial: "3500000000", tenantContributionRial: "9000000000", updatedAtUtc: now } : null,
    fundFreeze: item.fundFreezeStatus ? { provider: "کارگزاری نمونه", status: item.fundFreezeStatus, fundReference: "fund-preview-01", externalReference: "freeze-preview", reasonCode: null, attemptCount: 1, updatedAtUtc: now } : null,
    tenantContributionFunding: item.tenantContributionStatus ? { fundingId: `funding-${item.creditApplicationId.slice(0, 8)}`, externalTransactionId: `trx-${item.creditApplicationId.slice(0, 8)}`, provider: "شبکه پرداخت", status: item.tenantContributionStatus, amountRial: "9000000000", currency: "IRR", fundReference: "fund-preview-01", externalReference: "tenant-preview", reasonCode: null, attemptCount: 1, updatedAtUtc: now } : null,
    recentAuditEvents: [
      { id: `audit-${item.creditApplicationId.slice(0, 8)}-1`, actorId: "اپراتور آزمایشی", action: "CaseViewed", reason: "رویداد نمایشی محیط آزمایش", occurredAtUtc: now },
      { id: `audit-${item.creditApplicationId.slice(0, 8)}-2`, actorId: "system", action: "StateUpdated", reason: "رویداد چرخه آزمایشی", occurredAtUtc: "2026-09-23T09:00:00Z" },
    ],
    suggestedOperation: item.suggestedOperation,
    updatedAtUtc: now,
  };
}

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
  if (isAdminPreviewMode()) {
    const filtered = status ? PREVIEW_PAYMENTS.filter((item) => item.paymentStatus === status) : PREVIEW_PAYMENTS;
    return { page, pageSize, items: previewPage(filtered, page, pageSize) } satisfies PilotPaymentListResponse;
  }

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
  if (isAdminPreviewMode()) {
    const filtered = status ? PREVIEW_CASES.filter((item) => item.applicationStatus === status) : PREVIEW_CASES;
    return { page, pageSize, items: previewPage(filtered, page, pageSize) } satisfies PilotCaseListResponse;
  }

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
  if (isAdminPreviewMode()) {
    const item = PREVIEW_CASES.find((candidate) => candidate.creditApplicationId === applicationId);
    if (!item) {
      throw new PilotApiError(404, "pilot_preview_case_not_found", "Preview case was not found.");
    }
    return previewCaseDetail(item);
  }

  return pilotApiRequest<PilotCaseDetail>(
    `/api/v1/pilot/cases/${encodeURIComponent(applicationId)}`,
  );
}
