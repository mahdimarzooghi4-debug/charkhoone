import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";
import { calculateMockFinancialModel, type MockFinancingPlan, type MockMembership } from "./mockTenantData";

type MockPreviewState = {
  financingPlan: MockFinancingPlan;
  membership: MockMembership;
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
  const [cashDeposit, setCashDeposit] = useState(500_000_000);
  const [monthlyRent, setMonthlyRent] = useState(20_000_000);
  const financialModel = useMemo(() => calculateMockFinancialModel(cashDeposit, monthlyRent), [cashDeposit, monthlyRent]);
  const value = useMemo(() => ({ financingPlan, membership, setFinancingPlan, setMembership, cashDeposit, monthlyRent, setCashDeposit, setMonthlyRent, financialModel }), [financingPlan, membership, cashDeposit, monthlyRent, financialModel]);
  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
}

export function useMockPreview() {
  const context = useContext(PreviewContext);
  if (!context) throw new Error("mock_preview_provider_missing");
  return context;
}
