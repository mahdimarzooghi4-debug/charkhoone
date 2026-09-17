import { useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { AppTextField } from "@/components/AppTextField";
import { colors, fonts, radii } from "@/theme";

export default function ContractTrackingScreen() {
  const router = useRouter();
  const [trackingCode, setTrackingCode] = useState("123456789012");

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="ثبت قرارداد" />
      <View style={styles.intro}>
        <Text style={styles.title}>کد رهگیری قرارداد را وارد کنید</Text>
        <Text style={styles.description}>کد رهگیری قرارداد ثبت‌شده در سامانه خودنویس را وارد کنید تا اطلاعات قرارداد بررسی شود.</Text>
      </View>
      <View style={styles.cardWrap}>
        <View style={styles.inputCard}>
          <AppTextField
            label="کد رهگیری خودنویس"
            helper="کد رهگیری در قرارداد ثبت‌شده در سامانه خودنویس درج شده است."
            keyboardType="number-pad"
            maxLength={12}
            onChangeText={setTrackingCode}
            value={trackingCode}
          />
        </View>
      </View>
      <View style={styles.infoWrap}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>پس از استعلام چه اتفاقی می‌افتد؟</Text>
          <Text style={styles.infoText}>۱. اطلاعات قرارداد از خودنویس دریافت می‌شود.</Text>
          <Text style={styles.infoText}>۲. کد ملی شما با طرفین قرارداد تطبیق داده می‌شود.</Text>
          <Text style={styles.infoText}>۳. پس از دریافت اطلاعات قرارداد، طرفین قرارداد نمایش داده می‌شوند و نقش خود را در این قرارداد انتخاب می‌کنید.</Text>
        </View>
      </View>
      <View style={styles.flex} />
      <View style={styles.actions}>
        <AppButton onPress={() => router.push("/(shared)/role-selection")}>استعلام قرارداد</AppButton>
        <Text style={styles.help}>کد رهگیری را از کجا پیدا کنم؟</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  intro: { width: "100%", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, gap: 8 },
  title: { color: colors.surface, fontFamily: fonts.semibold, fontSize: 20, lineHeight: 28, textAlign: "right", writingDirection: "rtl" },
  description: { color: colors.border, fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, textAlign: "right", writingDirection: "rtl" },
  cardWrap: { paddingHorizontal: 20 },
  inputCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: 20 },
  infoWrap: { paddingHorizontal: 20, marginTop: 20 },
  infoCard: { backgroundColor: colors.infoSoft, borderRadius: radii.md, padding: 16, gap: 8 },
  infoTitle: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 14, textAlign: "right", writingDirection: "rtl" },
  infoText: { color: colors.text, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
  flex: { flex: 1 },
  actions: { width: "100%", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, gap: 16, alignItems: "center" },
  help: { color: colors.surface, opacity: 0.7, fontFamily: fonts.medium, fontSize: 13, textDecorationLine: "underline", writingDirection: "rtl" },
});
