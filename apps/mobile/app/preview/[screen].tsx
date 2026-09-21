import { MockTenantScreen } from "@/preview/MockTenantScreen";
import { useLocalSearchParams } from "expo-router";

export default function MockPreviewRoute() {
  const { screen } = useLocalSearchParams<{ screen: string }>();
  return <MockTenantScreen screen={screen ?? "home"} />;
}
