import { Stack, useSegments } from "expo-router";
import { MobileAuthProvider } from "@/auth/MobileAuthProvider";
import { StatusBar } from "expo-status-bar";
import { I18nManager } from "react-native";
import {
  useFonts,
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_600SemiBold,
  Vazirmatn_700Bold,
} from "@expo-google-fonts/vazirmatn";

I18nManager.allowRTL(true);

export default function RootLayout() {
  const segments = useSegments();
  const [loaded] = useFonts({
    Vazirmatn_400Regular,
    Vazirmatn_500Medium,
    Vazirmatn_600SemiBold,
    Vazirmatn_700Bold,
  });

  if (!loaded) return null;

  const navigator = (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: "slide_from_left" }} />
    </>
  );

  // The MOCK walkthrough is intentionally isolated from OIDC/API runtime.
  // All real routes remain wrapped in MobileAuthProvider below.
  if (segments[0] === "preview") return navigator;

  return (
    <MobileAuthProvider>
      {navigator}
    </MobileAuthProvider>
  );
}
