import { MockOwnerScreen } from "@/preview/MockOwnerScreen";

// Isolated Figma owner MOCK. Authenticated owner routes remain fail-closed.
export default function OwnerReceivePay() {
  return <MockOwnerScreen screen="receive-pay" />;
}
