import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { FigmaSvg } from "@/components/FigmaSvg";
import { figmaAssets } from "@/figmaAssets";
import { colors, fonts, radii } from "@/theme";

function KeyValue({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return <View style={styles.kv}><Text style={[styles.value, accent && styles.accent]}>{value}</Text><Text style={styles.label}>{label}</Text></View>;
}

export default function FinancingApprovedScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppHeader title="وضعیت درخواست" />
        <View style={styles.hero}>
          <View style={styles.heroCircle}><FigmaSvg uri={figmaAssets.approvedCheck} width={24} height={24} /></View>
          <View style={styles.approvedBadge}><Text style={styles.approvedBadgeText}>تأیید شده</Text></View>
          <Text style={styles.heroTitle}>درخواست تأمین مالی شما تأیید شد</Text>
          <Text style={styles.heroText}>درخواست شما توسط بانک تأیید شده است. برای ادامه، عضویت چارخونه را تکمیل کنید.</Text>
        </View>

        <View style={styles.nextCard}>
          <View style={styles.nextHeader}><View style={styles.nextBadge}><Text style={styles.nextBadgeText}>مرحله بعد</Text></View><Text style={styles.nextTitle}>عضویت چارخونه</Text></View>
          <Text style={styles.nextMain}>انتخاب و پرداخت حق عضویت</Text>
          <KeyValue label="وضعیت" value="نیازمند اقدام" accent />
          <Text style={styles.nextNote}>در مرحله بعد، طرح عضویت چارخونه را انتخاب و حق عضویت را پرداخت می‌کنید.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>شرایط تأییدشده</Text>
          <KeyValue label="مبلغ تأمین مالی" value="۴۵۰٬۰۰۰٬۰۰۰ تومان" />
          <KeyValue label="آورده موردنیاز شما" value="۱۸۰٬۰۰۰٬۰۰۰ تومان" />
          <KeyValue label="پرداخت ماهانه تأمین مالی" value="۱۸٬۵۰۰٬۰۰۰ تومان" accent />
          <KeyValue label="نرخ طرح" value="۴٪" accent />
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepper}>
            <View style={styles.step}><FigmaSvg uri={figmaAssets.approvedStepIdle} width={24} height={24} /><Text style={styles.idleStep}>تأیید نهایی</Text></View>
            <View style={styles.lineIdle} />
            <View style={styles.step}><FigmaSvg uri={figmaAssets.approvedStepCurrent} width={24} height={24} /><Text style={styles.currentStep}>عضویت چارخونه</Text></View>
            <View style={styles.lineDone} />
            <View style={styles.step}><View style={styles.doneCircle}><Text style={styles.doneCheck}>✓</Text></View><Text style={styles.doneStep}>تأیید بانک</Text></View>
            <View style={styles.lineDone} />
            <View style={styles.step}><View style={styles.doneCircle}><Text style={styles.doneCheck}>✓</Text></View><Text style={styles.doneStep}>بررسی اطلاعات</Text></View>
            <View style={styles.lineDone} />
            <View style={styles.step}><View style={styles.doneCircle}><Text style={styles.doneCheck}>✓</Text></View><Text style={styles.doneStep}>ثبت درخواست</Text></View>
          </View>
        </View>

        <View style={styles.info}><Text style={styles.infoText}>ابتدا عضویت چارخونه را تکمیل می‌کنید و سپس وارد مرحله پرداخت آورده می‌شوید.</Text><Text style={styles.infoIcon}>ⓘ</Text></View>
        <View style={styles.card}><Text style={styles.cardTitle}>قرارداد مرتبط</Text><KeyValue label="کد رهگیری" value="۱۲۳۴۵۶۷۸۹۰۱۲" /><KeyValue label="ملک" value="تهران، سعادت‌آباد" /></View>
        <AppButton onPress={() => router.push("/(tenant)/membership")}>ادامه</AppButton>
        <Text style={styles.detailsLink}>مشاهده جزئیات تأیید</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { paddingBottom: 24, gap: 16 },
  hero: { paddingHorizontal: 16, paddingTop: 16, alignItems: "center", gap: 12 },
  heroCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  approvedBadge: { backgroundColor: colors.page, borderRadius: radii.sm, paddingHorizontal: 12, paddingVertical: 6 },
  approvedBadgeText: { color: colors.primary, fontFamily: fonts.regular, fontSize: 12, writingDirection: "rtl" },
  heroTitle: { color: colors.page, fontFamily: fonts.bold, fontSize: 18, lineHeight: 26, textAlign: "center", writingDirection: "rtl" },
  heroText: { color: colors.page, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, textAlign: "center", writingDirection: "rtl" },
  nextCard: { marginHorizontal: 16, backgroundColor: "#FFFBF2", borderWidth: 1.5, borderColor: colors.accent, borderRadius: radii.lg, padding: 16, gap: 12 },
  nextHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nextBadge: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  nextBadgeText: { color: colors.accent, fontFamily: fonts.medium, fontSize: 11, writingDirection: "rtl" },
  nextTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 14, writingDirection: "rtl" },
  nextMain: { color: colors.text, fontFamily: fonts.bold, fontSize: 24, textAlign: "center", writingDirection: "rtl" },
  nextNote: { color: "#6B7280", fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, textAlign: "right", writingDirection: "rtl" },
  card: { marginHorizontal: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 16, gap: 12 },
  cardTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, textAlign: "right", writingDirection: "rtl" },
  kv: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  value: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 13 },
  label: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
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
  detailsLink: { marginHorizontal: 16, color: colors.page, fontFamily: fonts.semibold, fontSize: 14, textAlign: "center", writingDirection: "rtl" },
});
