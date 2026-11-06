import { useRouter, useSegments } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { colors, fonts } from "@/theme";

export function LegalText() {
  const router = useRouter();
  const segments = useSegments();
  const preview = segments[0] === "preview";

  return (
    <Text style={styles.base}>
      با ادامه،{" "}
      <Text
        accessibilityRole="link"
        accessibilityLabel="مطالعه قوانین استفاده چارخونه"
        onPress={() => router.push(preview ? "/preview/legal/terms" : "/legal/terms")}
        style={styles.link}
      >
        قوانین استفاده
      </Text>
      {" و "}
      <Text
        accessibilityRole="link"
        accessibilityLabel="مطالعه حریم خصوصی چارخونه"
        onPress={() => router.push(preview ? "/preview/legal/privacy" : "/legal/privacy")}
        style={styles.link}
      >
        حریم خصوصی
      </Text>
      {" چارخونه را می‌پذیرید"}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    width: "100%",
    color: colors.muted,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    writingDirection: "rtl",
  },
  link: { color: colors.accent, fontFamily: fonts.medium },
});
