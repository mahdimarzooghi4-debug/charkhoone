export type MobileSelectedPlanSummary = {
  planId: string;
  version: string;
  bankId: string;
  title: string;
  interestTerms: string;
  termMonths: number;
};

export type MobileBankApprovalSummary = {
  provider: string;
  status: string;
  maximumEligibleLoanRial: string;
  approvedLoanRial: string | null;
  reasonCode: string | null;
  updatedAtUtc: string;
};

export type MobileFundingAllocationSummary = {
  contractId: string;
  bankId: string;
  fullDepositEquivalentRial: string;
  maximumEligibleLoanRial: string;
  bankApprovedLoanRial: string;
  tenantContributionRial: string;
  updatedAtUtc: string;
};

export type MobileCreditApplicationSummary = {
  creditApplicationId: string;
  status: string;
  updatedAtUtc: string;
  selectedPlan: MobileSelectedPlanSummary | null;
  bankApproval: MobileBankApprovalSummary | null;
  fundingAllocation: MobileFundingAllocationSummary | null;
};

export type MobileContractTermsSummary = {
  calendar: string;
  persianStartYear: number;
  persianStartMonth: number;
  persianStartDay: number;
  termMonths: number;
  cashDepositRial: string;
  fullDepositEquivalentRial: string;
  capturedAtUtc: string;
};

export type MobileContractSummary = {
  contractId: string;
  role: "Tenant" | "Owner";
  status: string;
  monthlyRentRial: string | null;
  updatedAtUtc: string;
  terms: MobileContractTermsSummary | null;
};

export type MobilePaymentSummary = {
  paymentInstructionId: string;
  monthlyObligationId: string;
  contractId: string;
  contractMonthNumber: number;
  kind: string;
  dueAtUtc: string;
  amountRial: string;
  status: string;
  updatedAtUtc: string;
};


export type MobileFinancingPlan = {
  planId: string;
  version: string;
  bankId: string;
  title: string;
  interestTerms: string;
  termMonths: number;
};

export type MobileFinancingPlansResponse = {
  creditApplicationId: string;
  applicationStatus: string;
  items: MobileFinancingPlan[];
};

export type MobileFinancingPlanSelectionResponse = {
  outcome: string;
  creditApplicationId: string;
  applicationStatus: string;
  planId: string;
  planVersion: string;
  bankId: string;
  title: string;
  updatedAtUtc: string;
};

export type MobileBootstrapResponse = {
  userId: string;
  latestCreditApplication: MobileCreditApplicationSummary | null;
  contracts: MobileContractSummary[];
  payments: MobilePaymentSummary[];
};

type ApiRequest = <T>(path: string, init?: RequestInit) => Promise<T>;

export function getMobileBootstrap(apiRequest: ApiRequest) {
  return apiRequest<MobileBootstrapResponse>("/api/v1/mobile/bootstrap");
}


export function getMobileFinancingPlans(
  apiRequest: ApiRequest,
  creditApplicationId: string,
) {
  return apiRequest<MobileFinancingPlansResponse>(
    `/api/v1/credit-applications/${encodeURIComponent(creditApplicationId)}/loan-plans`,
  );
}

export function selectMobileFinancingPlan(
  apiRequest: ApiRequest,
  creditApplicationId: string,
  plan: Pick<MobileFinancingPlan, "planId" | "version">,
) {
  return apiRequest<MobileFinancingPlanSelectionResponse>(
    `/api/v1/credit-applications/${encodeURIComponent(creditApplicationId)}/loan-plan`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        planId: plan.planId,
        version: plan.version,
      }),
    },
  );
}

export function formatRial(value: string) {
  const [integerPart, fractionPart] = value.split(".", 2);
  const sign = integerPart.startsWith("-") ? "-" : "";
  const digits = sign ? integerPart.slice(1) : integerPart;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const exact = fractionPart === undefined
    ? `${sign}${grouped}`
    : `${sign}${grouped}.${fractionPart}`;
  return `${exact} ریال`;
}
