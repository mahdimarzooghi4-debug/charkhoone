export type MobileCreditApplicationSummary = {
  creditApplicationId: string;
  status: string;
  updatedAtUtc: string;
};

export type MobileContractSummary = {
  contractId: string;
  role: "Tenant" | "Owner";
  status: string;
  monthlyRentRial: string | null;
  updatedAtUtc: string;
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
