import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";
import type { MockFinancingPlan, MockMembership } from "./mockTenantData";

type MockPreviewState = {
  financingPlan: MockFinancingPlan;
  membership: MockMembership;
  setFinancingPlan: (value: MockFinancingPlan) => void;
  setMembership: (value: MockMembership) => void;
};

const PreviewContext = createContext<MockPreviewState | null>(null);

export function MockPreviewProvider({ children }: PropsWithChildren) {
  const [financingPlan, setFinancingPlan] = useState<MockFinancingPlan>("عمومی");
  const [membership, setMembership] = useState<MockMembership>("پایه");
  const value = useMemo(() => ({ financingPlan, membership, setFinancingPlan, setMembership }), [financingPlan, membership]);
  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
}

export function useMockPreview() {
  const context = useContext(PreviewContext);
  if (!context) throw new Error("mock_preview_provider_missing");
  return context;
}
