import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { FigmaSvg } from "@/components/FigmaSvg";
import { figmaAssets } from "@/figmaAssets";
import { colors, fonts, radii } from "@/theme";

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return <View style={styles.row}><Text style={[styles.rowValue, accent && styles.accent]}>{value}</Text><Text style={styles.rowLabel}>{label}</Text></View>;
}

export default function ContributionRequiredScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppHeader title="وضعیت درخواست" />
        <View style={styles.hero}>
          <View style={styles.circle}><FigmaSvg uri={figmaAssets.contributionCheck} width={24} height={24} /></View>
          <View style={styles.status}><Text style={styles.statusText}>تأیید شده</Text></View>
          <Text style={styles.heroTitle}>پرداخت آورده</Text>
          <Text style={styles.heroText}>عضویت چارخونه فعال است. برای ادامه، آورده موردنیاز را پرداخت کنید.</Text>
        </View>

        <View style={styles.contributionCard}>
          <View style={styles.header}><View style={styles.pending}><Text style={styles.pendingText}>در انتظار پرداخت</Text></View><Text style={styles.headerTitle}>آورده شما</Text></View>
          <Text style={styles.amount}>۱۸۰٬۰۰۰٬۰۰۰ تومان</Text>
          <Row label="مهلت پرداخت" value="۱۲ شهریور ۱۴۰۵" accent />
          <Text style={styles.note}>برای ادامه فرایند تأمین مالی، این مبلغ باید پرداخت شود.</Text>
        </View>

        <View style={styles.card}><Text style={styles.cardTitle}>شرایط تأییدشده</Text><Row label="مبلغ تأمین مالی" value="۴۵۰٬۰۰۰٬۰۰۰ تومان" /><Row label="آورده موردنیاز شما" value="۱۸۰٬۰۰۰٬۰۰۰ تومان" /><Row label="پرداخت ماهانه تأمین مالی" value="۱۸٬۵۰۰٬۰۰۰ تومان" accent /><Row label="نرخ طرح" value="۴٪" accent /></View>

        <View style={styles.stepCard}>
          <View style={styles.stepper}>
            <View style={styles.step}><FigmaSvg uri={figmaAssets.contributionStepIdle} width={24} height={24} /><Text style={styles.idleStep}>تأیید نهایی</Text></View>
            <View style={styles.lineIdle} />
            <View style={styles.step}><FigmaSvg uri={figmaAssets.contributionStepCurrent} width={24} height={24} /><Text style={styles.currentStep}>پرداخت آورده</Text></View>
            <View style={styles.lineDone} />
            <View style={styles.step}><View style={styles.doneCircle}><Text style={styles.doneCheck}>✓</Text></View><Text style={styles.doneStep}>عضویت چارخونه</Text></View>
            <View style={styles.lineDone} />
            <View style={styles.step}><View style={styles.doneCircle}><Text style={styles.doneCheck}>✓</Text></View><Text style={styles.doneStep}>بررسی اطلاعات</Text></View>
            <View style={styles.lineDone} />
            <View style={styles.step}><View style={styles.doneCircle}><Text style={styles.doneCheck}>✓</Text></View><Text style={styles.doneStep}>ثبت درخواست</Text></View>
          </View>
        </View>

        <View style={styles.info}><Text style={styles.infoText}>پس از پرداخت آورده، تأیید نهایی طرفین قرارداد انجام می‌شود.</Text><Text style={styles.infoIcon}>ⓘ</Text></View>
        <View style={styles.card}><Text style={styles.cardTitle}>قرارداد مرتبط</Text><Row label="کد رهگیری" value="۱۲۳۴۵۶۷۸۹۰۱۲" /><Row label="ملک" value="تهران، سعادت‌آباد" /></View>
        <AppButton onPress={() => router.push("/(tenant)/final-confirmation")}>پرداخت آورده</AppButton>
        <Text style={styles.details}>مشاهده جزئیات تأیید</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { paddingBottom: 24, gap: 16 },
  hero: { paddingHorizontal: 16, paddingTop: 16, alignItems: "center", gap: 12 },
  circle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  status: { backgroundColor: colors.page, borderRadius: radii.sm, paddingHorizontal: 12, paddingVertical: 6 },
  statusText: { color: colors.primary, fontFamily: fonts.regular, fontSize: 12, writingDirection: "rtl" },
  heroTitle: { color: colors.page, fontFamily: fonts.bold, fontSize: 18, lineHeight: 26, writingDirection: "rtl" },
  heroText: { color: colors.page, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, textAlign: "center", writingDirection: "rtl" },
  contributionCard: { marginHorizontal: 16, backgroundColor: "#FFFBF2", borderWidth: 1.5, borderColor: colors.accent, borderRadius: radii.lg, padding: 16, gap: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pending: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  pendingText: { color: colors.accent, fontFamily: fonts.medium, fontSize: 11, writingDirection: "rtl" },
  headerTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 14, writingDirection: "rtl" },
  amount: { color: colors.text, fontFamily: fonts.bold, fontSize: 24, textAlign: "center", writingDirection: "rtl" },
  note: { color: "#6B7280", fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, textAlign: "right", writingDirection: "rtl" },
  card: { marginHorizontal: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 16, gap: 12 },
  cardTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, textAlign: "right", writingDirection: "rtl" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  rowValue: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 13 },
  rowLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, writingDirection: "rtl" },
  accent: { color: colors.primary },
  stepCard: { marginHorizontal: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 16 },
  stepper: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  step: { flex: 1, alignItems: "center", gap: 6 },
  idleStep: { color: colors.muted, fontFamily: fonts.regular, fontSize: 9, textAlign: "center", writingDirection: "rtl" },
  currentStep: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 9, textAlign: "center", writingDirection: "rtl" },
  doneStep: { color: colors.primary, fontFamily: fonts.regular, fontSize: 9, textAlign: "center", writingDirection: "rtl" },
  lineIdle: { width: 16, height: 2, backgroundColor: colors.border, marginTop: 11 },
  lineDone: { width: 16, height: 2, backgroundColor: colors.primary, marginTop: 11 },
  doneCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  doneCheck: { color: colors.surface, fontFamily: fonts.bold, fontSize: 12 },
  info: { marginHorizontal: 16, backgroundColor: "#F2F7FA", borderWidth: 1, borderColor: "#D9E5ED", borderRadius: radii.md, padding: 12, flexDirection: "row", gap: 8, alignItems: "center" },
  infoText: { flex: 1, color: "#597385", fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, textAlign: "right", writingDirection: "rtl" },
  infoIcon: { color: "#668CA6", fontSize: 16 },
  details: { color: colors.page, fontFamily: fonts.semibold, fontSize: 14, textAlign: "center", writingDirection: "rtl" },
});
