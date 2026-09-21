import { MockTenantScreen } from "@/preview/MockTenantScreen";

// Explicit Expo Router route for the isolated Figma tenant MOCK walkthrough.
export default function PreviewRejected() {
  return <MockTenantScreen screen="rejected" />;
}
