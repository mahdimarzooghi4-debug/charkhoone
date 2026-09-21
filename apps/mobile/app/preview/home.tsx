import { MockTenantScreen } from "@/preview/MockTenantScreen";

/** Explicit web route so /preview/home never falls through to app/index. */
export default function MockPreviewHome() {
  return <MockTenantScreen screen="home" />;
}
