import { MockTenantScreen } from "@/preview/MockTenantScreen";

// Separate MOCK owner continuation. Never route owner into the tenant financing plan.
export default function PreviewOwnerContract() {
  return <MockTenantScreen screen="owner-contract" />;
}
