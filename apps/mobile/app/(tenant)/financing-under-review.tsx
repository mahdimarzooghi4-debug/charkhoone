import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { FigmaSvg } from "@/components/FigmaSvg";
import { figmaAssets } from "@/figmaAssets";
import { colors, fonts, radii } from "@/theme";

function RequestRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.requestRow}><Text style={styles.requestValue}>{value}</Text><Text style={styles.requestLabel}>{label}</Text></View>;
}

function ProgressStep({ icon, label, current }: { icon: string; label: string; current?: boolean }) {
  return (
    <View style={styles.progressStep}>
      <FigmaSvg uri={icon} width={28} height={28} />
      <Text style={[styles.progressLabel, current && styles.progressLabelCurrent]}>{label}</Text>
    </View>
  );
}

export default function FinancingUnderReviewScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppHeader title="وضعیت درخواست" />
        <View style={styles.hero}>
          <View style={styles.heroCircle}><FigmaSvg uri={figmaAssets.reviewCheck} width={24} height={24} /></View>
          <Text style={styles.heroTitle}>درخواست شما ثبت شد</Text>
          <Text style={styles.heroDescription}>درخواست تأمین مالی با موفقیت ثبت شده و در حال بررسی است.</Text>
          <View style={styles.statusBadge}><Text style={styles.statusBadgeText}>در حال بررسی</Text></View>
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>خلاصه درخواست</Text>
            <RequestRow label="مبلغ درخواستی" value="۴۵۰٬۰۰۰٬۰۰۰ تومان" />
            <RequestRow label="طرح انتخاب‌شده" value="طرح ویژه تأمین مسکن" />
            <RequestRow label="بانک" value="بانک ملت" />
            <RequestRow label="تاریخ ثبت درخواست" value="۷ شهریور ۱۴۰۵" />
          </View>

          <View style={styles.progress}>
            <ProgressStep icon={figmaAssets.reviewStepIdle} label="اعلام نتیجه" />
            <View style={styles.progressLine} />
            <ProgressStep icon={figmaAssets.reviewStepIdle} label="بررسی بانک" />
            <View style={styles.progressLine} />
            <ProgressStep icon={figmaAssets.reviewStepCurrent} label="بررسی اطلاعات\nو اعتبار" current />
            <View style={[styles.progressLine, styles.progressLineDone]} />
            <ProgressStep icon={figmaAssets.reviewStepDone} label="ثبت درخواست" />
          </View>

          <View style={[styles.card, styles.infoCard]}>
            <Text style={styles.infoTitle}>در حال بررسی اطلاعات</Text>
            <Text style={styles.infoBody}>اطلاعات قرارداد، شرایط طرح و اعتبار شما در حال بررسی است.</Text>
            <Text style={styles.infoNote}>پس از تغییر وضعیت، نتیجه از طریق چارخونه به شما اطلاع داده می‌شود.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>قرارداد مرتبط</Text>
            <RequestRow label="کد رهگیری" value="۱۲۳۴۵۶۷۸۹۰۱۲" />
            <RequestRow label="ملک" value="تهران، سعادت‌آباد" />
          </View>
        </View>

        <View style={styles.actions}>
          <AppButton onPress={() => router.replace("/(tenant)/home")}>بازگشت به خانه</AppButton>
          <AppButton variant="outline">مشاهده جزئیات درخواست</AppButton>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { paddingBottom: 32, gap: 16 },
  hero: { alignItems: "center", paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12, gap: 12 },
  heroCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  heroTitle: { color: colors.page, fontFamily: fonts.bold, fontSize: 20, textAlign: "center", writingDirection: "rtl" },
  heroDescription: { color: colors.page, fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, textAlign: "center", writingDirection: "rtl" },
  statusBadge: { backgroundColor: colors.page, borderRadius: radii.sm, paddingHorizontal: 12, paddingVertical: 6 },
  statusBadgeText: { color: "#D97706", fontFamily: fonts.medium, fontSize: 12, writingDirection: "rtl" },
  content: { paddingHorizontal: 16, gap: 16 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 16, gap: 12 },
  cardTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15, textAlign: "right", writingDirection: "rtl" },
  requestRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  requestValue: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 14 },
  requestLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  progress: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  progressStep: { flex: 1, alignItems: "center", gap: 6 },
  progressLabel: { color: colors.page, fontFamily: fonts.regular, fontSize: 10, lineHeight: 15, textAlign: "center", writingDirection: "rtl" },
  progressLabelCurrent: { fontFamily: fonts.medium },
  progressLine: { width: 24, height: 2, backgroundColor: colors.border, marginTop: 12 },
  progressLineDone: { backgroundColor: colors.accent },
  infoCard: { backgroundColor: colors.infoSoft, borderColor: colors.primary },
  infoTitle: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 15, textAlign: "right", writingDirection: "rtl" },
  infoBody: { color: colors.text, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
  infoNote: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, textAlign: "right", writingDirection: "rtl" },
  actions: { paddingHorizontal: 16, paddingTop: 8, gap: 16 },
});
