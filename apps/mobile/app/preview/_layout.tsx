import { Stack } from "expo-router";
import { MockPreviewProvider } from "@/preview/MockPreviewProvider";

export default function MockPreviewLayout() {
  return <MockPreviewProvider><Stack screenOptions={{ headerShown: false, animation: "none" }} /></MockPreviewProvider>;
}
