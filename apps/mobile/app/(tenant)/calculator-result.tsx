import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { FigmaSvg } from "@/components/FigmaSvg";
import { figmaAssets } from "@/figmaAssets";
import { colors, fonts, radii } from "@/theme";

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

export default function CalculatorResultScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppHeader title="نتیجه محاسبه" />
        <View style={styles.gaugeWrap}>
          <FigmaSvg uri={figmaAssets.gauge} width={240} height={120} />
          <View style={styles.gaugeText}>
            <Text style={styles.gaugeLabel}>محدوده قابل تأمین</Text>
            <Text style={styles.gaugeValue}>تا ۴۵۰٬۰۰۰٬۰۰۰ تومان</Text>
          </View>
        </View>
        <View style={styles.grid}>
          <View style={styles.row}><MetricCard label="حداکثر قابل تأمین" value="۴۵۰٬۰۰۰٬۰۰۰ تومان" /><MetricCard label="حداقل قابل تأمین" value="۳۲۰٬۰۰۰٬۰۰۰ تومان" /></View>
          <View style={styles.row}><MetricCard label="اجاره ماهانه قرارداد" value="۲۰٬۰۰۰٬۰۰۰ تومان" /><MetricCard label="حداقل آورده موردنیاز شما" value="۱۸۰٬۰۰۰٬۰۰۰ تومان" /></View>
          <View style={styles.wideMetric}><Text style={styles.metricLabel}>پرداخت ماهانه شما در چارخونه</Text><Text style={styles.metricValue}>۱۸٬۵۰۰٬۰۰۰ تومان</Text></View>
          <View style={styles.benefitCard}>
            <Text style={styles.benefitTitle}>مزیت شما</Text>
            <View style={styles.kv}><Text style={styles.kvValue}>۲۰٬۰۰۰٬۰۰۰ تومان</Text><Text style={styles.kvLabel}>شرایط عادی</Text></View>
            <View style={styles.kv}><Text style={styles.kvValue}>۱۸٬۵۰۰٬۰۰۰ تومان</Text><Text style={styles.kvLabel}>با چارخونه</Text></View>
            <View style={styles.highlight}>
              <Text style={styles.highlightTitle}>۱٬۵۰۰٬۰۰۰ تومان صرفه‌جویی ماهانه</Text>
              <Text style={styles.highlightNote}>صرفه‌جویی تقریبی کل دوره: ۱۸٬۰۰۰٬۰۰۰ تومان</Text>
            </View>
            <Text style={styles.comparisonNote}>براساس مقایسه با شرایط عادی قابل استفاده</Text>
          </View>
        </View>
        <View style={styles.disclaimerRow}>
          <Text style={styles.disclaimer}>این برآورد اولیه است و مبلغ نهایی پس از ثبت قرارداد، بررسی اعتبار و طرح‌های قابل استفاده مشخص می‌شود.</Text>
          <View style={styles.infoBubble}><Text style={styles.infoBubbleText}>i</Text></View>
        </View>
      </ScrollView>
      <View style={styles.actions}>
        <AppButton variant="primary" onPress={() => router.push("/(shared)/contract-tracking")}>ثبت کد رهگیری قرارداد</AppButton>
        <AppButton variant="outline" onPress={() => router.back()}>محاسبه مجدد</AppButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { paddingBottom: 16 },
  gaugeWrap: { height: 192, alignItems: "center", justifyContent: "center", position: "relative", paddingTop: 12 },
  gaugeText: { position: "absolute", top: 86, alignItems: "center", gap: 4 },
  gaugeLabel: { color: colors.page, fontFamily: fonts.medium, fontSize: 13, writingDirection: "rtl" },
  gaugeValue: { color: colors.page, fontFamily: fonts.bold, fontSize: 22, writingDirection: "rtl" },
  grid: { paddingHorizontal: 20, gap: 12 },
  row: { flexDirection: "row", gap: 12 },
  metricCard: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: 16, gap: 4, alignItems: "flex-end" },
  wideMetric: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: 16, gap: 4, alignItems: "center" },
  metricLabel: { width: "100%", color: colors.muted, fontFamily: fonts.regular, fontSize: 12, textAlign: "right", writingDirection: "rtl" },
  metricValue: { width: "100%", color: colors.text, fontFamily: fonts.semibold, fontSize: 15, textAlign: "right", writingDirection: "rtl" },
  benefitCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 20, gap: 12 },
  benefitTitle: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 16, textAlign: "right", writingDirection: "rtl" },
  kv: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  kvValue: { color: colors.text, fontFamily: fonts.semibold, fontSize: 12 },
  kvLabel: { color: colors.primary, fontFamily: fonts.regular, fontSize: 12, writingDirection: "rtl" },
  highlight: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent, borderRadius: radii.sm, padding: 12, gap: 4 },
  highlightTitle: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  highlightNote: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "right", writingDirection: "rtl" },
  comparisonNote: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "right", writingDirection: "rtl" },
  disclaimerRow: { marginHorizontal: 20, marginTop: 16, flexDirection: "row", alignItems: "center", gap: 8 },
  disclaimer: { flex: 1, color: colors.page, fontFamily: fonts.regular, fontSize: 11, lineHeight: 18, textAlign: "right", writingDirection: "rtl" },
  infoBubble: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#EDEDED", alignItems: "center", justifyContent: "center" },
  infoBubbleText: { color: colors.muted, fontFamily: fonts.bold, fontSize: 10, lineHeight: 12 },
  actions: { backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, gap: 12 },
});
