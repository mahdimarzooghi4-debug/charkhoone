import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";
import { calculateMockFinancialModel, type MockFinancingPlan, type MockMembership } from "./mockTenantData";

export type MockContractRole = "Tenant" | "Owner";

type MockPreviewState = {
  financingPlan: MockFinancingPlan;
  membership: MockMembership;
  contractRole: MockContractRole;
  setContractRole: (role: MockContractRole) => void;
  setFinancingPlan: (value: MockFinancingPlan) => void;
  setMembership: (value: MockMembership) => void;
  cashDeposit: number;
  monthlyRent: number;
  setCashDeposit: (value: number) => void;
  setMonthlyRent: (value: number) => void;
  financialModel: ReturnType<typeof calculateMockFinancialModel>;
};

const PreviewContext = createContext<MockPreviewState | null>(null);

export function MockPreviewProvider({ children }: PropsWithChildren) {
  const [financingPlan, setFinancingPlan] = useState<MockFinancingPlan>("عمومی");
  const [membership, setMembership] = useState<MockMembership>("۱ بار استفاده");
  const [contractRole, setContractRole] = useState<MockContractRole>("Tenant");
  const [cashDeposit, setCashDeposit] = useState(500_000_000);
  const [monthlyRent, setMonthlyRent] = useState(20_000_000);
  const financialModel = useMemo(() => calculateMockFinancialModel(cashDeposit, monthlyRent), [cashDeposit, monthlyRent]);
  const value = useMemo(() => ({ financingPlan, membership, contractRole, setContractRole, setFinancingPlan, setMembership, cashDeposit, monthlyRent, setCashDeposit, setMonthlyRent, financialModel }), [financingPlan, membership, contractRole, cashDeposit, monthlyRent, financialModel]);
  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
}

export function useMockPreview() {
  const context = useContext(PreviewContext);
  if (!context) throw new Error("mock_preview_provider_missing");
  return context;
}
