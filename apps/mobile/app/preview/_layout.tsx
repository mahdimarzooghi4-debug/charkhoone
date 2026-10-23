import { Redirect, Stack, usePathname } from "expo-router";
import { MockPreviewProvider, useMockPreview } from "@/preview/MockPreviewProvider";

function PreviewAuthGate() {
  const pathname = usePathname();
  const { previewSignedIn, demoMobile } = useMockPreview();
  const entry = pathname === "/preview/login" || pathname === "/preview/otp";
  // An OTP deep link must also pass through the mobile-entry screen.
  if (pathname === "/preview/otp" && !/^09[0-9]{9}$/.test(demoMobile))
    return <Redirect href="/preview/login" />;
  // Deep links and refreshed demo pages cannot bypass the preview entry.
  if (!previewSignedIn && !entry) return <Redirect href="/preview/login" />;
  return <Stack screenOptions={{ headerShown: false, animation: "none" }} />;
}

export default function MockPreviewLayout() {
  return <MockPreviewProvider><PreviewAuthGate /></MockPreviewProvider>;
}
