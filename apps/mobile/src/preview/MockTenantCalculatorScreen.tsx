import { Link } from "expo-router";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { BrandLogo } from "@/components/BrandLogo";
import { FigmaSvg } from "@/components/FigmaSvg";
import { figmaAssets } from "@/figmaAssets";
import { colors, fonts, radii } from "@/theme";
import { mockFinancialModel } from "./mockTenantData";

/**
 * Figma "Calculator / Manual Estimate" (65:55) for the isolated tenant MOCK.
 * The Figma figure of 18.5m is a stale visual fixture; C3-approved interest-only
 * amount is 6,708,333 toman. Controls are a labelled fixed sample, not fake inputs.
 */
function PreviewAmount({ label, value, limit, progress }: { label: string; value: string; limit: string; progress: number }) {
  return (
    <View style={styles.amountGroup}>
      <Text style={styles.amountLabel}>{label}</Text>
      <View style={styles.amountValueRow}>
        <Text style={styles.currency}>تومان</Text>
        <Text style={styles.amountValue}>{value}</Text>
      </View>
      <View accessibilityLabel={`${label}: ${value} تومان، نمونه ثابت`} style={styles.sliderTrack}>
        <View style={[styles.sliderFill, { width: `${progress * 100}%` }]} />
        <View style={[styles.sliderThumb, { right: `${progress * 100}%` }]} />
      </View>
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLimit}>۰</Text>
        <Text style={styles.sliderLimit}>{limit}</Text>
      </View>
    </View>
  );
}

export function MockTenantCalculatorScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.brand}><BrandLogo /></View>
      <View style={styles.appBar}>
        <Link href="/preview/home" accessibilityLabel="بازگشت به خانه مستأجر" style={styles.back}>‹</Link>
        <Text style={styles.appBarTitle}>محاسبه شرایط</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>شرایط قرارداد را وارد کنید</Text>
        <Text style={styles.intro}>با وارد کردن مبلغ رهن و اجاره، محدوده تقریبی قابل تأمین را مشاهده کنید.</Text>
        <View style={styles.card}>
          <PreviewAmount label="مبلغ رهن" value="۵۰۰٬۰۰۰٬۰۰۰" limit="۲ میلیارد" progress={0.25} />
          <View style={styles.divider} />
          <PreviewAmount label="اجاره ماهانه" value="۲۰٬۰۰۰٬۰۰۰" limit="۱۰۰ میلیون" progress={0.2} />
        </View>
        <View style={styles.estimate}>
          <Text style={styles.estimateTitle}>پرداخت ماهانه تقریبی شما (فقط سود)</Text>
          <Text style={styles.estimateValue}>{mockFinancialModel.monthlyInterest}</Text>
          <Text style={styles.estimateCaption}>مثال ثابت C3 با نرخ اسمی سالانه {mockFinancialModel.annualRate}؛ بازپرداخت اصل، مطابق قرارداد نهایی بانک خواهد بود.</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.infoTitle}>برآورد اولیه</Text>
          <Text style={styles.infoText}>پس از محاسبه، محدوده قابل تأمین، شرایط مالی و آورده نمونه برای شما نمایش داده می‌شود.</Text>
          <Text style={styles.mockNotice}>MOCK: رهن و اجاره در این نسخه نمونه ثابت‌اند؛ اسلایدرها هنوز ورودی قابل تغییر نیستند و استعلام بانک انجام نمی‌شود.</Text>
        </View>
        <View style={styles.grow} />
        <Link href="/preview/calculator-result" style={styles.cta}>محاسبه شرایط</Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const rtl = { textAlign: "right" as const, writingDirection: "rtl" as const };
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  brand: { height: 60, alignItems: "flex-end", paddingHorizontal: 16 },
  appBar: { height: 56, paddingHorizontal: 16, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { width: 40, height: 44, textAlign: "center", lineHeight: 44, color: colors.primary, fontSize: 30, textDecorationLine: "none" },
  appBarTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 18, ...rtl },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, gap: 12 },
  heading: { color: colors.surface, fontFamily: fonts.bold, fontSize: 18, ...rtl },
  intro: { color: colors.page, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, ...rtl },
  card: { marginTop: 4, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 24, paddingVertical: 20, gap: 16 },
  amountGroup: { width: "100%", gap: 12, alignItems: "flex-end" },
  amountLabel: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, ...rtl },
  amountValueRow: { width: "100%", flexDirection: "row", alignItems: "baseline", justifyContent: "flex-end", gap: 8 },
  currency: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, ...rtl },
  amountValue: { color: colors.primary, fontFamily: fonts.bold, fontSize: 25, ...rtl },
  sliderTrack: { height: 24, width: "100%", justifyContent: "center", overflow: "visible" },
  sliderFill: { height: 4, backgroundColor: colors.primary, borderRadius: 2, position: "absolute", right: 0 },
  sliderThumb: { height: 16, width: 16, borderRadius: 8, borderWidth: 3, borderColor: colors.primary, backgroundColor: colors.surface, position: "absolute" },
  sliderLabels: { width: "100%", flexDirection: "row", justifyContent: "space-between" },
  sliderLimit: { color: colors.muted, fontFamily: fonts.regular, fontSize: 10, ...rtl },
  divider: { height: 1, backgroundColor: colors.border },
  estimate: { borderRadius: radii.md, borderColor: colors.border, borderWidth: 1, backgroundColor: colors.surface, padding: 14, gap: 6, alignItems: "flex-end" },
  estimateTitle: { width: "100%", color: colors.primary, fontFamily: fonts.semibold, fontSize: 13, ...rtl },
  estimateValue: { width: "100%", color: colors.primary, fontFamily: fonts.bold, fontSize: 20, ...rtl },
  estimateCaption: { width: "100%", color: colors.muted, fontFamily: fonts.regular, fontSize: 11, lineHeight: 18, ...rtl },
  info: { marginTop: 8, gap: 6, alignItems: "flex-end" },
  infoTitle: { width: "100%", color: colors.page, fontFamily: fonts.semibold, fontSize: 14, ...rtl },
  infoText: { width: "100%", color: colors.page, fontFamily: fonts.regular, fontSize: 11, lineHeight: 19, ...rtl },
  mockNotice: { width: "100%", marginTop: 4, color: "#FAD39C", fontFamily: fonts.regular, fontSize: 10, lineHeight: 17, ...rtl },
  grow: { flexGrow: 1, minHeight: 6 },
  cta: { height: 48, lineHeight: 48, borderRadius: radii.md, backgroundColor: colors.page, color: colors.primary, fontFamily: fonts.semibold, fontSize: 15, textAlign: "center", textDecorationLine: "none" },
});
