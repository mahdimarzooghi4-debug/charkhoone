import { useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppTextField } from "@/components/AppTextField";
import { colors, fonts, radii } from "@/theme";

export default function ChangeMobileScreen() {
  const router = useRouter();
  const [mobile, setMobile] = useState("09123456789");
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.appBar}><Text style={styles.appBarTitle}>تغییر شماره موبایل</Text></View>
      <View style={styles.body}>
        <View style={styles.intro}><Text style={styles.title}>شماره موبایل جدید را وارد کنید</Text><Text style={styles.description}>برای تغییر شماره حساب، شماره موبایل جدید را وارد کنید.</Text></View>
        <View style={styles.current}><Text style={styles.currentValue}>۰۹۱۲•••••۶۷</Text><Text style={styles.currentLabel}>شماره فعلی</Text></View>
        <AppTextField label="شماره موبایل جدید" helper="کد تأیید به این شماره ارسال خواهد شد." keyboardType="phone-pad" maxLength={11} value={mobile} onChangeText={setMobile} />
        <View style={styles.buttonWrap}><AppButton variant="primary" onPress={() => router.push("/(shared)/verify-new-mobile")}>دریافت کد تأیید</AppButton></View>
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
  current: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  currentValue: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14 },
  currentLabel: { color: "#6B7280", fontFamily: fonts.regular, fontSize: 14, writingDirection: "rtl" },
  buttonWrap: { paddingTop: 16 },
});
