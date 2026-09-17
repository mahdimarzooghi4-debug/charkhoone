import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { FigmaSvg } from "@/components/FigmaSvg";
import { figmaAssets } from "@/figmaAssets";
import { colors, fonts, radii } from "@/theme";

type PlanCardProps = {
  selected?: boolean;
  title: string;
  badge: string;
  rate: string;
  funding: string;
  contribution: string;
  monthly: string;
  benefit?: string;
};

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowValue, strong && styles.rowValueStrong]}>{value}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
  );
}

function PlanCard({ selected, title, badge, rate, funding, contribution, monthly, benefit }: PlanCardProps) {
  return (
    <View style={[styles.planCard, selected && styles.planCardSelected]}>
      <View style={styles.planHeader}>
        <FigmaSvg uri={selected ? figmaAssets.financingSelected : figmaAssets.financingUnselected} width={16} height={16} />
        <View style={[styles.badge, selected ? styles.badgeSpecial : styles.badgeGeneral]}><Text style={[styles.badgeText, !selected && styles.badgeTextMuted]}>{badge}</Text></View>
        <View style={styles.planTitleWrap}><Text style={styles.planTitle}>{title}</Text><Text style={styles.bank}>بانک ملت</Text></View>
      </View>
      <View style={styles.rows}>
        <Row label="نرخ" value={rate} strong={selected} />
        <Row label="مبلغ قابل تأمین" value={funding} />
        <Row label="آورده موردنیاز" value={contribution} />
        <Row label="پرداخت ماهانه تأمین مالی" value={monthly} strong={selected} />
      </View>
      {benefit ? <View style={styles.benefit}><Text style={styles.benefitText}>{benefit}</Text></View> : null}
    </View>
  );
}

export default function FinancingPlansScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="انتخاب طرح تامین مالی" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.title}>طرح‌های قابل استفاده برای شما</Text>
          <Text style={styles.description}>براساس اطلاعات قرارداد و شرایط شما، طرح‌های زیر قابل انتخاب هستند.</Text>
        </View>
        <PlanCard
          selected
          title="طرح ویژه کارکنان سازمان"
          badge="طرح ویژه"
          rate="۴٪"
          funding="۴۵۰٬۰۰۰٬۰۰۰ تومان"
          contribution="۱۸۰٬۰۰۰٬۰۰۰ تومان"
          monthly="۱۸٬۵۰۰٬۰۰۰ تومان"
          benefit="۶۵٬۰۰۰٬۰۰۰ تومان صرفه‌جویی نسبت به طرح عمومی"
        />
        <Text style={styles.sectionLabel}>سایر طرح‌های قابل استفاده</Text>
        <PlanCard
          title="طرح عمومی تأمین مسکن"
          badge="طرح عمومی"
          rate="۱۲٪"
          funding="۴۲۰٬۰۰۰٬۰۰۰ تومان"
          contribution="۲۰۰٬۰۰۰٬۰۰۰ تومان"
          monthly="۲۴٬۰۰۰٬۰۰۰ تومان"
        />
      </ScrollView>
      <View style={styles.actions}><AppButton onPress={() => router.push("/(tenant)/plan-confirmation")}>تأیید طرح و ادامه</AppButton></View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, gap: 20 },
  intro: { gap: 8, alignItems: "flex-end" },
  title: { width: "100%", color: colors.page, fontFamily: fonts.semibold, fontSize: 20, lineHeight: 28, textAlign: "right", writingDirection: "rtl" },
  description: { width: "100%", color: colors.muted, fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, textAlign: "right", writingDirection: "rtl" },
  planCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 16, gap: 12 },
  planCardSelected: { backgroundColor: colors.infoSoft, borderWidth: 2, borderColor: colors.primary },
  planHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.sm },
  badgeSpecial: { backgroundColor: colors.successSoft },
  badgeGeneral: { backgroundColor: colors.page },
  badgeText: { color: colors.primary, fontFamily: fonts.medium, fontSize: 12, writingDirection: "rtl" },
  badgeTextMuted: { color: colors.muted },
  planTitleWrap: { flex: 1, alignItems: "flex-end", gap: 2 },
  planTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14, textAlign: "right", writingDirection: "rtl" },
  bank: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, writingDirection: "rtl" },
  rows: { gap: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowValue: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 14 },
  rowValueStrong: { color: colors.primary, fontFamily: fonts.bold },
  rowLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  benefit: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent, borderRadius: radii.sm, padding: 10 },
  benefitText: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 12, textAlign: "right", writingDirection: "rtl" },
  sectionLabel: { color: colors.page, fontFamily: fonts.medium, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  actions: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, backgroundColor: colors.primary },
});
