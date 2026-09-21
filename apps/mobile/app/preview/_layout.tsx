import { Stack } from "expo-router";
import { MockPreviewProvider } from "@/preview/MockPreviewProvider";

export default function MockPreviewLayout() {
  return <MockPreviewProvider><Stack screenOptions={{ headerShown: false, animation: "slide_from_left" }} /></MockPreviewProvider>;
}
