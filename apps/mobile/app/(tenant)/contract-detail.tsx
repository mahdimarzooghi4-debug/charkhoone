import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { colors, fonts, radii } from "@/theme";

function Row({ label, value, primary }: { label: string; value: string; primary?: boolean }) {
  return <View style={styles.row}><Text style={[styles.value, primary && styles.primaryValue]}>{value}</Text><Text style={styles.label}>{label}</Text></View>;
}

function MiniField({ label, value, primary }: { label: string; value: string; primary?: boolean }) {
  return <View style={styles.miniField}><Text style={styles.miniLabel}>{label}</Text><Text style={[styles.miniValue, primary && styles.primaryValue]}>{value}</Text></View>;
}

export default function TenantContractDetailScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.badgeRow}><View style={styles.roleBadge}><Text style={styles.roleBadgeText}>مستأجر</Text></View><View style={styles.activeBadge}><Text style={styles.activeBadgeText}>فعال</Text></View></View>
          <Text style={styles.city}>تهران، سعادت‌آباد</Text>
          <Text style={styles.muted}>خیابان نمونه، پلاک ۲۴، واحد ۳</Text>
          <Text style={styles.mutedSmall}>کد رهگیری: ۱۲۳۴۵۶۷۸۹۰۱۲</Text>
        </View>

        <View style={styles.card}><Row label="شروع قرارداد" value="۱۵ مهر ۱۴۰۵" /><Row label="پایان قرارداد" value="۱۵ مهر ۱۴۰۶" /></View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>شرایط مالی قرارداد</Text>
          <View style={styles.twoCol}><MiniField label="اجاره ماهانه" value="۲۰٬۰۰۰٬۰۰۰ تومان" /><MiniField label="مبلغ رهن" value="۵۰۰٬۰۰۰٬۰۰۰ تومان" /></View>
          <View style={styles.twoCol}><MiniField label="آورده پرداخت‌شده" value="۱۸۰٬۰۰۰٬۰۰۰ تومان" /><MiniField label="مبلغ تأمین مالی" value="۴۵۰٬۰۰۰٬۰۰۰ تومان" primary /></View>
        </View>

        <View style={styles.card}><Text style={styles.cardTitle}>طرح تأمین مالی</Text><Row label="طرح انتخاب‌شده" value="طرح تأمین مسکن" /><Row label="بانک" value="بانک ملت" /><Row label="نرخ قرارداد" value="۴٪" primary /></View>

        <View style={styles.card}><Text style={styles.cardTitle}>تعهد ماهانه</Text><View style={styles.obligation}><Text style={styles.obligationValue}>۲۰٬۰۰۰٬۰۰۰ تومان</Text><Text style={styles.obligationLabel}>اجاره ماهانه قرارداد</Text></View><View style={styles.obligation}><Text style={[styles.obligationValue, styles.primaryValue]}>۱۸٬۵۰۰٬۰۰۰ تومان</Text><Text style={styles.obligationLabel}>پرداخت ماهانه تأمین مالی</Text></View></View>

        <View style={styles.nextPayment}>
          <View style={styles.nextHeader}><Text style={styles.nextTitle}>پرداخت بعدی</Text><View style={styles.pendingBadge}><Text style={styles.pendingText}>در انتظار پرداخت</Text></View></View>
          <Text style={styles.nextAmount}>۱۸٬۵۰۰٬۰۰۰ تومان</Text>
          <Text style={styles.nextLabel}>پرداخت ماهانه تأمین مالی</Text>
          <Row label="موعد پرداخت" value="۱۵ آبان ۱۴۰۵" />
          <AppButton variant="primary" onPress={() => router.push("/(tenant)/payments")}>مشاهده پرداخت‌ها</AppButton>
        </View>

        <View style={styles.card}><Text style={styles.cardTitle}>اطلاعات ملک</Text><Text style={styles.miniLabel}>آدرس</Text><Text style={styles.address}>تهران، سعادت‌آباد، خیابان نمونه، پلاک ۲۴، واحد ۳</Text><Row label="کدپستی" value="۱۹۹۸۷۶۵۴۳۲" /></View>
        <View style={styles.card}><Text style={styles.cardTitle}>طرفین قرارداد</Text><View style={styles.party}><Text style={styles.partyName}>علی رضایی <Text style={styles.partyRole}>مستأجر</Text></Text><Text style={styles.mutedSmall}>کد ملی: ۰۰۱•••••۷۸۹</Text></View><View style={styles.party}><Text style={styles.partyName}>محمد رضایی <Text style={styles.partyRole}>مالک</Text></Text><Text style={styles.mutedSmall}>کد ملی: ۰۰۲•••••۴۵۶</Text></View></View>
        <View style={styles.links}><Pressable onPress={() => router.push("/(tenant)/payments")}><Text style={styles.link}>مشاهده پرداخت‌ها</Text></Pressable><Text style={styles.link}>مشاهده طرح تأمین مالی</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { padding: 16, paddingBottom: 32, gap: 12 },
  heroCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 20, gap: 12 },
  badgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  roleBadge: { backgroundColor: colors.primary, borderRadius: radii.sm, paddingHorizontal: 12, paddingVertical: 6 },
  roleBadgeText: { color: colors.surface, fontFamily: fonts.medium, fontSize: 12, writingDirection: "rtl" },
  activeBadge: { backgroundColor: colors.successSoft, borderRadius: radii.sm, paddingHorizontal: 12, paddingVertical: 6 },
  activeBadgeText: { color: colors.primary, fontFamily: fonts.medium, fontSize: 12, writingDirection: "rtl" },
  city: { color: colors.text, fontFamily: fonts.bold, fontSize: 20, textAlign: "right", writingDirection: "rtl" },
  muted: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  mutedSmall: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, textAlign: "right", writingDirection: "rtl" },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 16, gap: 12 },
  cardTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, textAlign: "right", writingDirection: "rtl" },
  row: { minHeight: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  value: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14 },
  primaryValue: { color: colors.primary },
  label: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  twoCol: { flexDirection: "row", gap: 12 },
  miniField: { flex: 1, alignItems: "flex-end", gap: 4 },
  miniLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, writingDirection: "rtl" },
  miniValue: { color: colors.text, fontFamily: fonts.bold, fontSize: 14, textAlign: "right", writingDirection: "rtl" },
  obligation: { backgroundColor: "#F9FAFB", borderRadius: 10, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  obligationValue: { color: colors.text, fontFamily: fonts.bold, fontSize: 14 },
  obligationLabel: { color: "#4B5563", fontFamily: fonts.regular, fontSize: 13, writingDirection: "rtl" },
  nextPayment: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.accent, borderRadius: radii.lg, padding: 20, gap: 16 },
  nextHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  nextTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 16, writingDirection: "rtl" },
  pendingBadge: { backgroundColor: "#FFF3E0", borderRadius: radii.sm, paddingHorizontal: 12, paddingVertical: 6 },
  pendingText: { color: colors.accent, fontFamily: fonts.medium, fontSize: 12, writingDirection: "rtl" },
  nextAmount: { color: colors.primary, fontFamily: fonts.bold, fontSize: 24, textAlign: "right", writingDirection: "rtl" },
  nextLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  address: { color: colors.text, fontFamily: fonts.medium, fontSize: 13, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
  party: { alignItems: "flex-end", gap: 4 },
  partyName: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14, writingDirection: "rtl" },
  partyRole: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11 },
  links: { gap: 8, paddingVertical: 8, alignItems: "center" },
  link: { color: colors.page, fontFamily: fonts.semibold, fontSize: 14, writingDirection: "rtl" },
});
