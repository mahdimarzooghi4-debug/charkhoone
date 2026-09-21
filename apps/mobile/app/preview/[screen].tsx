import { Redirect } from "expo-router";

// Unknown deep links must not silently render the home screen at /preview/undefined.
// All real MOCK journey steps are explicit Expo Router files in this directory.
export default function UnknownPreviewRoute() {
  return <Redirect href="/preview/home" />;
}
