import { Redirect, Stack, usePathname } from "expo-router";
import { MockPreviewProvider, useMockPreview } from "@/preview/MockPreviewProvider";

function PreviewAuthGate() {
  const pathname = usePathname();
  const { previewSignedIn } = useMockPreview();
  const entry = pathname === "/preview/login" || pathname === "/preview/otp";
  // Deep links and refreshed demo pages cannot bypass the preview entry.
  if (!previewSignedIn && !entry) return <Redirect href="/preview/login" />;
  return <Stack screenOptions={{ headerShown: false, animation: "none" }} />;
}

export default function MockPreviewLayout() {
  return <MockPreviewProvider><PreviewAuthGate /></MockPreviewProvider>;
}
