import { Redirect } from "expo-router";
import { Platform } from "react-native";

export default function Index() {
  // The separately labeled demo APK opts into the isolated MOCK walkthrough.
  // Normal production builds still start at the real OIDC login. The
  // explicitly opted-in web preview must also work when statically exported.
  const previewWeb = Platform.OS === "web" &&
    process.env.EXPO_PUBLIC_CHARKHOONE_MOCK_PREVIEW === "1";
  const demoApk = Platform.OS === "android" && process.env.EXPO_PUBLIC_CHARKHOONE_DEMO_APK === "1";
  return <Redirect href={previewWeb || demoApk ? "/preview/login" : "/(auth)/login"} />;
}
