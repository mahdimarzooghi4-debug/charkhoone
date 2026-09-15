import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { FigmaSvg } from "@/components/FigmaSvg";
import { OwnerRow } from "@/components/OwnerUi";
import { ownerAssets } from "@/ownerAssets";
import { colors, fonts, radii } from "@/theme";

type Method = "monthly" | "fund";

export default function OwnerSettlementPreferenceScreen() {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("monthly");

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="روش دریافت" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.title}>روش دریافت خود را انتخاب کنید</Text>
          <Text style={styles.description}>مشخص کنید دریافتی‌های این قرارداد چگونه برای شما تسویه شوند.</Text>
        </View>

        <View style={styles.contextCard}>
          <OwnerRow label="ملک" value="تهران، سعادت‌آباد" />
          <OwnerRow label="اجاره ماهانه قرارداد" value="۲۰٬۰۰۰٬۰۰۰ تومان" valueStyle={styles.primaryValue} />
          <OwnerRow label="مدت قرارداد" value="۱۵ مهر ۱۴۰۵ تا ۱۵ مهر ۱۴۰۶" />
        </View>

        <Pressable style={[styles.optionCard, method === "monthly" && styles.optionSelected]} onPress={() => setMethod("monthly")}>
          <View style={styles.optionHeader}>
            <FigmaSvg uri={method === "monthly" ? ownerAssets.settlementRadioSelected : ownerAssets.settlementRadioEmpty} width={20} height={20} />
            <View style={styles.optionTitleRow}>
              <Text style={styles.optionTitle}>دریافت ماهانه</Text>
              <FigmaSvg uri={ownerAssets.settlementWallet} width={18} height={18} />
            </View>
          </View>
          <Text style={styles.optionDesc}>مبلغ خالص قابل تسویه هر ماه طبق شرایط قرارداد برای شما پرداخت می‌شود.</Text>
          <View style={styles.valueBox}>
            <OwnerRow label="مبلغ ناخالص دریافتی" value="۲۰٬۰۰۰٬۰۰۰ تومان" valueStyle={styles.primaryValue} />
            <OwnerRow label="کارمزد خدمات چارخونه - ۰٫۵٪" value="−۱۰۰٬۰۰۰ تومان" valueStyle={styles.primaryValue} />
            <OwnerRow label="مبلغ خالص قابل تسویه" value="۱۹٬۹۰۰٬۰۰۰ تومان" valueStyle={styles.boldPrimaryValue} />
          </View>
          <View style={styles.bullets}>
            <Text style={styles.bullet}>• دسترسی منظم به دریافتی ماهانه</Text>
            <Text style={styles.bullet}>• تسویه طبق برنامه قرارداد</Text>
          </View>
        </Pressable>

        <Pressable style={[styles.optionCard, method === "fund" && styles.optionSelected]} onPress={() => setMethod("fund")}>
          <View style={styles.optionHeader}>
            <FigmaSvg uri={method === "fund" ? ownerAssets.settlementRadioSelected : ownerAssets.settlementRadioEmpty} width={20} height={20} />
            <View style={styles.optionTitleRow}>
              <Text style={styles.optionTitle}>تجمیع دریافتی در صندوق</Text>
              <FigmaSvg uri={ownerAssets.settlementChartPie} width={18} height={18} />
            </View>
          </View>
          <Text style={styles.optionMutedDesc}>به‌جای دریافت ماهانه، مبالغ واجد شرایط در صندوق باقی می‌مانند و طبق شرایط صندوق امکان بهره‌مندی از بازده ایجاد می‌شود.</Text>
          <View style={styles.details}>
            <OwnerRow label="مبلغ ناخالص دریافتی" value="۲۰٬۰۰۰٬۰۰۰ تومان" />
            <OwnerRow label="کارمزد خدمات چارخونه - ۰٫۵٪" value="−۱۰۰٬۰۰۰ تومان" />
            <OwnerRow label="مبلغ خالص قابل تجمیع" value="۱۹٬۹۰۰٬۰۰۰ تومان" valueStyle={styles.boldPrimaryValue} />
            <OwnerRow label="بازده تخمینی" value="براساس شرایط فعلی صندوق" valueStyle={styles.primaryValue} />
            <OwnerRow label="ارزش برآوردی پایان دوره" value="براساس نرخ و مدت انتخاب‌شده محاسبه می‌شود" />
          </View>
        </Pressable>

        <View style={styles.comparison}>
          <View style={styles.compareBox}><Text style={styles.compareTitle}>تجمیع در صندوق</Text><Text style={styles.compareText}>عدم برداشت ماهانه و امکان بهره‌مندی از بازده</Text></View>
          <View style={styles.divider} />
          <View style={styles.compareBox}><Text style={styles.compareTitle}>دریافت ماهانه</Text><Text style={styles.compareText}>دسترسی به مبلغ در هر دوره</Text></View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoText}>شرایط و بازده صندوق ممکن است تغییر کند. اطلاعات نهایی پیش از تأیید قرارداد به شما نمایش داده می‌شود.</Text>
          <FigmaSvg uri={ownerAssets.settlementInfo} width={14} height={14} />
        </View>

        <AppButton onPress={() => router.push("/(owner)/final-confirmation")}>انتخاب و ادامه</AppButton>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { padding: 16, paddingBottom: 60, gap: 16 },
  intro: { gap: 8 },
  title: { color: colors.page, fontFamily: fonts.bold, fontSize: 18, textAlign: "right", writingDirection: "rtl" },
  description: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 21, textAlign: "right", writingDirection: "rtl" },
  contextCard: { backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 10 },
  primaryValue: { color: colors.primary, fontFamily: fonts.semibold },
  boldPrimaryValue: { color: colors.primary, fontFamily: fonts.bold },
  optionCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 16, gap: 12 },
  optionSelected: { backgroundColor: colors.infoSoft, borderColor: colors.primary, borderWidth: 1.5 },
  optionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  optionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  optionTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15, writingDirection: "rtl" },
  optionDesc: { color: colors.text, fontFamily: fonts.regular, fontSize: 12, lineHeight: 19, textAlign: "right", writingDirection: "rtl" },
  optionMutedDesc: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 19, textAlign: "right", writingDirection: "rtl" },
  valueBox: { backgroundColor: colors.surface, borderRadius: radii.sm, padding: 10, gap: 8 },
  details: { gap: 8 },
  bullets: { gap: 6, alignItems: "flex-end" },
  bullet: { color: colors.text, fontFamily: fonts.regular, fontSize: 12, writingDirection: "rtl" },
  comparison: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: 12, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  compareBox: { flex: 1, minHeight: 84, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 12, alignItems: "flex-end", gap: 4 },
  compareTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 14, writingDirection: "rtl" },
  compareText: { color: "#4B5563", fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, textAlign: "right", writingDirection: "rtl" },
  divider: { width: 1, height: 40, backgroundColor: colors.border },
  infoRow: { backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FDE68A", borderRadius: radii.md, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { flex: 1, color: colors.muted, fontFamily: fonts.regular, fontSize: 11, lineHeight: 17, textAlign: "right", writingDirection: "rtl" },
});
