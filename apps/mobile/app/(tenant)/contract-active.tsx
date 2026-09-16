import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { FigmaSvg } from "@/components/FigmaSvg";
import { figmaAssets } from "@/figmaAssets";
import { colors, fonts, radii } from "@/theme";

function Row({ label, value, primary }: { label: string; value: string; primary?: boolean }) {
  return <View style={styles.row}><Text style={[styles.value, primary && styles.primaryValue]}>{value}</Text><Text style={styles.label}>{label}</Text></View>;
}

function Party({ name, role }: { name: string; role: string }) {
  return <View style={styles.party}><View style={styles.approved}><Text style={styles.approvedText}>تأیید شده</Text><View style={styles.approvedIcon}><Text style={styles.approvedCheck}>✓</Text></View></View><View style={styles.partyInfo}><Text style={styles.partyName}>{name}</Text><Text style={styles.partyRole}>{role}</Text></View></View>;
}

export default function ContractActiveScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AppHeader title="وضعیت درخواست" />
        <View style={styles.hero}>
          <View style={styles.circle}><FigmaSvg uri={figmaAssets.activeCheck} width={24} height={24} /></View>
          <View style={styles.activeBadge}><Text style={styles.activeBadgeText}>فعال</Text></View>
          <Text style={styles.heroTitle}>قرارداد شما فعال شد</Text>
          <Text style={styles.heroText}>فرایند تأمین مالی تکمیل شده و قرارداد شما در چارخونه فعال است.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.statusRow}><View style={styles.financedBadge}><Text style={styles.financedText}>تأمین مالی انجام شد</Text></View><Text style={styles.cardTitle}>وضعیت تأمین مالی</Text></View>
          <Text style={styles.mutedText}>تأمین مالی قرارداد تکمیل شده و مبلغ تأییدشده وارد مسیر مالی تعیین‌شده قرارداد شده است.</Text>
        </View>

        <View style={styles.card}><Text style={styles.cardTitle}>خلاصه قرارداد</Text><Row label="مبلغ رهن" value="۵۰۰٬۰۰۰٬۰۰۰ تومان" /><Row label="اجاره ماهانه قرارداد" value="۲۰٬۰۰۰٬۰۰۰ تومان" /><Row label="مبلغ تأمین مالی" value="۴۵۰٬۰۰۰٬۰۰۰ تومان" /><Row label="آورده پرداخت‌شده" value="۱۸۰٬۰۰۰٬۰۰۰ تومان" /><Row label="تاریخ شروع" value="۱۵ مهر ۱۴۰۵" /><Row label="تاریخ پایان" value="۱۵ مهر ۱۴۰۶" /></View>

        <View style={styles.paymentCard}>
          <View style={styles.statusRow}><View style={styles.pendingBadge}><Text style={styles.pendingText}>در انتظار پرداخت</Text></View><Text style={styles.cardTitle}>پرداخت بعدی</Text></View>
          <Text style={styles.paymentLabel}>پرداخت ماهانه تأمین مالی</Text>
          <Text style={styles.paymentAmount}>۱۸٬۵۰۰٬۰۰۰ تومان</Text>
          <Row label="سررسید" value="۱۵ آبان ۱۴۰۵" primary />
          <AppButton variant="outline" onPress={() => router.push("/(tenant)/payments")}>مشاهده پرداخت</AppButton>
        </View>

        <View style={styles.card}><Text style={styles.cardTitle}>تعهدات ماهانه</Text><Row label="اجاره ماهانه قرارداد" value="۲۰٬۰۰۰٬۰۰۰ تومان" /><Row label="پرداخت ماهانه تأمین مالی" value="۱۸٬۵۰۰٬۰۰۰ تومان" primary /></View>
        <View style={styles.card}><Text style={styles.cardTitle}>طرفین قرارداد</Text><Party name="علی رضایی" role="مستأجر" /><Party name="محمد رضایی" role="مالک" /></View>
        <View style={styles.actions}><AppButton onPress={() => router.push("/(tenant)/payments")}>مشاهده پرداخت‌ها</AppButton><Text style={styles.link}>مشاهده جزئیات قرارداد</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { paddingBottom: 32, gap: 16 },
  hero: { marginHorizontal: 16, paddingVertical: 16, alignItems: "center", gap: 12 },
  circle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  activeBadge: { backgroundColor: colors.successSoft, borderRadius: radii.sm, paddingHorizontal: 12, paddingVertical: 6 },
  activeBadgeText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 12, writingDirection: "rtl" },
  heroTitle: { color: colors.page, fontFamily: fonts.bold, fontSize: 20, lineHeight: 28, writingDirection: "rtl" },
  heroText: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, textAlign: "center", writingDirection: "rtl" },
  card: { marginHorizontal: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 16, gap: 8 },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  financedBadge: { backgroundColor: colors.successSoft, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  financedText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 11, writingDirection: "rtl" },
  cardTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 14, textAlign: "right", writingDirection: "rtl" },
  mutedText: { color: "#6B7280", fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, textAlign: "right", writingDirection: "rtl" },
  row: { minHeight: 42, borderBottomWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  value: { color: colors.text, fontFamily: fonts.medium, fontSize: 14 },
  primaryValue: { color: colors.primary, fontFamily: fonts.bold },
  label: { color: "#6B7280", fontFamily: fonts.regular, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  paymentCard: { marginHorizontal: 16, backgroundColor: "#FFFBF2", borderWidth: 1.5, borderColor: colors.accent, borderRadius: radii.lg, padding: 16, gap: 12 },
  pendingBadge: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  pendingText: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 11, writingDirection: "rtl" },
  paymentLabel: { color: "#6B7280", fontFamily: fonts.regular, fontSize: 12, textAlign: "right", writingDirection: "rtl" },
  paymentAmount: { color: colors.text, fontFamily: fonts.bold, fontSize: 24, textAlign: "right", writingDirection: "rtl" },
  party: { backgroundColor: "#F9FAFB", borderRadius: radii.sm, padding: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  approved: { flexDirection: "row", alignItems: "center", gap: 6 },
  approvedText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 12, writingDirection: "rtl" },
  approvedIcon: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center" },
  approvedCheck: { color: colors.primary, fontFamily: fonts.bold, fontSize: 9 },
  partyInfo: { alignItems: "flex-end", gap: 2 },
  partyName: { color: colors.text, fontFamily: fonts.semibold, fontSize: 13, writingDirection: "rtl" },
  partyRole: { color: colors.muted, fontFamily: fonts.regular, fontSize: 10, writingDirection: "rtl" },
  actions: { marginHorizontal: 16, gap: 16 },
  link: { color: colors.page, fontFamily: fonts.semibold, fontSize: 14, textAlign: "center", writingDirection: "rtl" },
});
