import { Redirect } from "expo-router";
import { Platform } from "react-native";

export default function Index() {
  // Opt-in LOCAL WEB ONLY. Production and native builds keep the real OIDC login.
  const previewWeb = __DEV__ && Platform.OS === "web" &&
    process.env.EXPO_PUBLIC_CHARKHOONE_MOCK_PREVIEW === "1";
  return <Redirect href={previewWeb ? "/preview/home" : "/(auth)/login"} />;
}
