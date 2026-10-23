import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";
import { calculateMockFinancialModel, type MockFinancingPlan, type MockMembership } from "./mockTenantData";

export type MockContractRole = "Tenant" | "Owner";
export type MockOwnerSettlement = "monthly" | "fund";

type MockPreviewState = {
  previewSignedIn: boolean;
  enterPreview: () => void;
  exitPreview: () => void;
  demoMobile: string;
  setDemoMobile: (value: string) => void;
  hasLoan: boolean;
  displayName: string;
  setDisplayName: (name: string) => void;
  photoUri: string | null;
  setPhotoUri: (uri: string | null) => void;
  previewSeen: string[];
  setPreviewSeen: (ids: string[]) => void;
  setHasLoan: (value: boolean) => void;
  financingPlan: MockFinancingPlan;
  membership: MockMembership;
  contractRole: MockContractRole;
  setContractRole: (role: MockContractRole) => void;
  ownerSettlement: MockOwnerSettlement;
  setOwnerSettlement: (method: MockOwnerSettlement) => void;
  setFinancingPlan: (value: MockFinancingPlan) => void;
  setMembership: (value: MockMembership) => void;
  selfReportedGrade: string;
  setSelfReportedGrade: (grade: string) => void;
  bankRateInput: string;
  setBankRateInput: (value: string) => void;
  cashDeposit: number;
  monthlyRent: number;
  setCashDeposit: (value: number) => void;
  setMonthlyRent: (value: number) => void;
  financialModel: ReturnType<typeof calculateMockFinancialModel>;
};

const PreviewContext = createContext<MockPreviewState | null>(null);

export function MockPreviewProvider({ children }: PropsWithChildren) {
  const [previewSignedIn, setPreviewSignedIn] = useState(false);
  const [demoMobile, setDemoMobile] = useState("09121234567"); // local fixture; no SMS or identity check
  const enterPreview = () => setPreviewSignedIn(true);
  const exitPreview = () => setPreviewSignedIn(false);
  const [hasLoan, setHasLoan] = useState(false);
  const [displayName, setDisplayName] = useState("کاربر پیش‌نمایش");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [previewSeen, setPreviewSeen] = useState<string[]>([]);
  const [financingPlan, setFinancingPlan] = useState<MockFinancingPlan>("عمومی");
  const [membership, setMembership] = useState<MockMembership>("۱ بار استفاده");
  const [contractRole, setContractRole] = useState<MockContractRole>("Tenant");
  const [ownerSettlement, setOwnerSettlement] = useState<MockOwnerSettlement>("monthly");
  const [bankRateInput, setBankRateInput] = useState("23");
  const [selfReportedGrade, setSelfReportedGrade] = useState("C3");
  const [cashDeposit, setCashDeposit] = useState(500_000_000);
  const [monthlyRent, setMonthlyRent] = useState(20_000_000);
  const parsedRate = bankRateInput.trim() === "" ? null : Number(bankRateInput);
  const bankAnnualRate = parsedRate !== null && Number.isFinite(parsedRate) && parsedRate >= 0 && parsedRate <= 100 ? parsedRate : null;
  const financialModel = useMemo(() => calculateMockFinancialModel(cashDeposit, monthlyRent, bankAnnualRate, selfReportedGrade), [cashDeposit, monthlyRent, bankAnnualRate, selfReportedGrade]);
  const value = useMemo(() => ({ previewSignedIn, enterPreview, exitPreview, demoMobile, setDemoMobile, hasLoan, setHasLoan, displayName, setDisplayName, photoUri, setPhotoUri, previewSeen, setPreviewSeen, financingPlan, membership, contractRole, setContractRole, ownerSettlement, setOwnerSettlement, setFinancingPlan, setMembership, selfReportedGrade, setSelfReportedGrade, bankRateInput, setBankRateInput, cashDeposit, monthlyRent, setCashDeposit, setMonthlyRent, financialModel }), [previewSignedIn, demoMobile, hasLoan, displayName, photoUri, previewSeen, financingPlan, membership, contractRole, ownerSettlement, selfReportedGrade, bankRateInput, cashDeposit, monthlyRent, financialModel]);
  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
}

export function useMockPreview() {
  const context = useContext(PreviewContext);
  if (!context) throw new Error("mock_preview_provider_missing");
  return context;
}
