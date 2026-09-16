import { StyleSheet, Text } from "react-native";
import { colors, fonts } from "@/theme";

export function LegalText() {
  return (
    <Text style={styles.base}>
      با ادامه، <Text style={styles.link}>قوانین استفاده</Text> و <Text style={styles.link}>حریم خصوصی</Text> چارخونه را می‌پذیرید
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
