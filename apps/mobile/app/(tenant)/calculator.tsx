import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { FigmaSvg } from "@/components/FigmaSvg";
import { figmaAssets } from "@/figmaAssets";
import { colors, fonts, radii } from "@/theme";

function StaticSlider({ label, value, max }: { label: string; value: string; max: string }) {
  return (
    <View style={styles.control}>
      <Text style={styles.controlLabel}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.unit}>تومان</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      <View style={styles.trackWrap}>
        <View style={styles.track} />
        <View style={styles.trackFill} />
        <View style={styles.thumb}><FigmaSvg uri={figmaAssets.sliderThumb} width={16} height={16} /></View>
      </View>
      <View style={styles.sliderLabels}><Text style={styles.sliderLabel}>۰</Text><Text style={styles.sliderLabel}>{max}</Text></View>
    </View>
  );
}

export default function CalculatorScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="محاسبه شرایط" />
      <View style={styles.intro}>
        <Text style={styles.title}>شرایط قرارداد را وارد کنید</Text>
        <Text style={styles.description}>با وارد کردن مبلغ رهن و اجاره، محدوده تقریبی قابل تأمین را مشاهده کنید.</Text>
      </View>
      <View style={styles.cardWrap}>
        <View style={styles.card}>
          <StaticSlider label="مبلغ رهن" value="۵۰۰٬۰۰۰٬۰۰۰" max="۲ میلیارد" />
          <View style={styles.divider} />
          <StaticSlider label="اجاره ماهانه" value="۲۰٬۰۰۰٬۰۰۰" max="۱۰۰ میلیون" />
        </View>
      </View>
      <View style={styles.estimateWrap}>
        <View style={styles.estimateCard}>
          <Text style={styles.estimateTitle}>پرداخت ماهانه تقریبی شما</Text>
          <Text style={styles.estimateValue}>۱۸٬۵۰۰٬۰۰۰ تومان</Text>
          <Text style={styles.estimateNote}>این مبلغ با تغییر شرایط بالا به‌صورت تقریبی به‌روزرسانی می‌شود.</Text>
        </View>
      </View>
      <View style={styles.preliminary}>
        <Text style={styles.preliminaryTitle}>برآورد اولیه</Text>
        <Text style={styles.preliminaryText}>پس از محاسبه، محدوده قابل تأمین، شرایط مالی و مزایای قابل استفاده برای شما نمایش داده می‌شود.</Text>
      </View>
      <View style={styles.flex} />
      <View style={styles.actions}><AppButton onPress={() => router.push("/(tenant)/calculator-result")}>محاسبه شرایط</AppButton></View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  intro: { paddingHorizontal: 20, paddingTop: 16, gap: 8 },
  title: { color: colors.surface, fontFamily: fonts.bold, fontSize: 18, textAlign: "right", writingDirection: "rtl" },
  description: { color: colors.page, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
  cardWrap: { paddingHorizontal: 20, paddingTop: 16 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, paddingHorizontal: 24, paddingVertical: 20, gap: 16 },
  control: { gap: 12, alignItems: "flex-end" },
  controlLabel: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, writingDirection: "rtl" },
  valueRow: { width: "100%", flexDirection: "row", alignItems: "baseline", justifyContent: "flex-end", gap: 8 },
  unit: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, writingDirection: "rtl" },
  value: { color: colors.primary, fontFamily: fonts.bold, fontSize: 28 },
  trackWrap: { width: "100%", height: 24, position: "relative", justifyContent: "center" },
  track: { position: "absolute", left: 0, right: 0, height: 4, borderRadius: 2, backgroundColor: colors.border },
  trackFill: { position: "absolute", right: 0, width: "73%", height: 4, borderRadius: 2, backgroundColor: colors.primary },
  thumb: { position: "absolute", left: "25%", width: 16, height: 16 },
  sliderLabels: { width: "100%", flexDirection: "row", justifyContent: "space-between" },
  sliderLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 10, writingDirection: "rtl" },
  divider: { height: 1, backgroundColor: colors.border, opacity: 0.8 },
  estimateWrap: { paddingHorizontal: 20, paddingTop: 12 },
  estimateCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 16, paddingVertical: 12, gap: 6, alignItems: "flex-end" },
  estimateTitle: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 13, writingDirection: "rtl" },
  estimateValue: { color: colors.primary, fontFamily: fonts.bold, fontSize: 20, writingDirection: "rtl" },
  estimateNote: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, lineHeight: 16, textAlign: "right", writingDirection: "rtl" },
  preliminary: { paddingHorizontal: 20, paddingTop: 20, gap: 4, alignItems: "flex-end" },
  preliminaryTitle: { color: colors.page, fontFamily: fonts.semibold, fontSize: 14, writingDirection: "rtl" },
  preliminaryText: { color: colors.page, fontFamily: fonts.regular, fontSize: 11, lineHeight: 17, textAlign: "right", writingDirection: "rtl" },
  flex: { flex: 1 },
  actions: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
});
