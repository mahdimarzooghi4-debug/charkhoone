import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AuthScaffold } from "@/components/AuthScaffold";
import { colors, fonts, radii } from "@/theme";

export default function OtpErrorScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState("48216");
  const digits = Array.from({ length: 5 }, (_, index) => code[index] ?? "");

  return (
    <AuthScaffold>
      <View style={styles.titleGroup}>
        <Text style={styles.title}>کد تأیید</Text>
        <Text style={styles.description}>کد ارسال‌شده به شماره موبایل خود را وارد کنید.</Text>
      </View>
      <View style={styles.mobileRow}>
        <Pressable onPress={() => router.replace("/(auth)/login")}><Text style={styles.edit}>ویرایش شماره موبایل</Text></Pressable>
        <Text style={styles.mobile}>۰۹۱۲۱۲۳۴۵۶۷</Text>
      </View>
      <Pressable onPress={() => inputRef.current?.focus()} style={styles.otpRow}>
        {digits.map((digit, index) => <View key={index} style={styles.digit}><Text style={styles.digitText}>{digit}</Text></View>)}
      </Pressable>
      <TextInput ref={inputRef} accessibilityLabel="کد تأیید" keyboardType="number-pad" maxLength={5} onChangeText={setCode} value={code} style={styles.hiddenInput} />
      <Text style={styles.error}>کد واردشده صحیح نیست. لطفاً دوباره تلاش کنید.</Text>
      <View style={styles.gap32} />
      <AppButton onPress={() => router.push("/(auth)/identity")}>تأیید و ادامه</AppButton>
      <View style={styles.gap20} />
      <Text style={styles.countdown}>ارسال مجدد کد تا ۰۰:۴۵</Text>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  titleGroup: { width: "100%", gap: 12, alignItems: "flex-end", marginTop: 24 },
  title: { width: "100%", color: colors.page, fontFamily: fonts.semibold, fontSize: 20, lineHeight: 28, textAlign: "right", writingDirection: "rtl" },
  description: { width: "100%", color: colors.border, fontFamily: fonts.regular, fontSize: 16, lineHeight: 26, textAlign: "right", writingDirection: "rtl" },
  mobileRow: { width: "100%", marginTop: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  edit: { color: colors.accent, fontFamily: fonts.medium, fontSize: 12, textDecorationLine: "underline", writingDirection: "rtl" },
  mobile: { color: colors.page, fontFamily: fonts.medium, fontSize: 14 },
  otpRow: { width: "100%", marginTop: 16, flexDirection: "row", justifyContent: "center", gap: 12 },
  digit: { width: 48, height: 56, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  digitText: { color: colors.text, fontFamily: fonts.semibold, fontSize: 20 },
  hiddenInput: { position: "absolute", width: 1, height: 1, opacity: 0 },
  error: { width: "100%", marginTop: 12, color: "#FF383C", fontFamily: fonts.regular, fontSize: 12, textAlign: "right", writingDirection: "rtl" },
  gap32: { height: 32 },
  gap20: { height: 20 },
  countdown: { width: "100%", color: colors.border, fontFamily: fonts.regular, fontSize: 12, textAlign: "center", writingDirection: "rtl" },
});
