import { MockOwnerScreen } from "@/preview/MockOwnerScreen";

// Isolated Figma owner MOCK. Authenticated owner routes remain fail-closed.
export default function OwnerSettlementPreference() {
  return <MockOwnerScreen screen="settlement-preference" />;
}
