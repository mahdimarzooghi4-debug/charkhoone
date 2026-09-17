import { useRef, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { colors, fonts, radii } from "@/theme";

export default function VerifyNewMobileScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState("48216");
  const digits = Array.from({ length: 5 }, (_, index) => code[index] ?? "");

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.appBar}><Text style={styles.appBarTitle}>تأیید شماره جدید</Text></View>
      <View style={styles.body}>
        <View style={styles.intro}><Text style={styles.title}>کد تأیید را وارد کنید</Text><Text style={styles.description}>کد ارسال‌شده به شماره موبایل جدید را وارد کنید.</Text></View>
        <View style={styles.numberRow}><Pressable onPress={() => router.back()}><Text style={styles.change}>تغییر شماره</Text></Pressable><Text style={styles.mobile}>۰۹۱۲۳۴۵۶۷۸۹</Text></View>
        <Pressable onPress={() => inputRef.current?.focus()} style={styles.otpRow}>
          {digits.map((digit, index) => <View key={index} style={styles.digit}><Text style={styles.digitText}>{digit}</Text></View>)}
        </Pressable>
        <TextInput ref={inputRef} value={code} onChangeText={setCode} maxLength={5} keyboardType="number-pad" style={styles.hidden} accessibilityLabel="کد تأیید شماره جدید" />
        <Text style={styles.countdown}>ارسال مجدد کد تا ۰۰:۴۵</Text>
        <View style={styles.buttonWrap}><AppButton variant="primary" onPress={() => router.replace("/(shared)/profile")}>تأیید شماره موبایل</AppButton></View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page, borderWidth: 1, borderColor: colors.border },
  appBar: { height: 56, backgroundColor: colors.surface, paddingHorizontal: 16, justifyContent: "center" },
  appBarTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 18, textAlign: "right", writingDirection: "rtl" },
  body: { padding: 24, gap: 24 },
  intro: { gap: 8 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 20, textAlign: "right", writingDirection: "rtl" },
  description: { color: "#4B5563", fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, textAlign: "right", writingDirection: "rtl" },
  numberRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8 },
  change: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 14, textDecorationLine: "underline", writingDirection: "rtl" },
  mobile: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14 },
  otpRow: { flexDirection: "row", justifyContent: "center", gap: 12, paddingVertical: 16 },
  digit: { width: 48, height: 56, borderRadius: radii.md, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  digitText: { color: colors.text, fontFamily: fonts.semibold, fontSize: 24 },
  hidden: { position: "absolute", width: 1, height: 1, opacity: 0 },
  countdown: { color: "#6B7280", fontFamily: fonts.regular, fontSize: 14, textAlign: "center", writingDirection: "rtl" },
  buttonWrap: { paddingTop: 16 },
});
