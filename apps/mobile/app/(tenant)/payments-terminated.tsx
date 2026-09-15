import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { colors, fonts, radii } from "@/theme";

function SettlementRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <View style={styles.settlementRow}>
      <Text style={[styles.settlementValue, muted && styles.mutedValue]}>{value}</Text>
      <Text style={styles.settlementLabel}>{label}</Text>
    </View>
  );
}

function HistoryRow({ installment, paid }: { installment: string; paid?: boolean }) {
  return (
    <View style={styles.historyRow}>
      <View style={styles.historyTop}>
        <Text style={styles.historyAmount}>۱۸٬۵۰۰٬۰۰۰ تومان</Text>
        <Text style={styles.historyTitle}>{installment}</Text>
      </View>
      <View style={styles.historyBottom}>
        <View style={[styles.historyBadge, paid ? styles.paidBadge : styles.overdueHistoryBadge]}>
          <Text style={[styles.historyBadgeText, !paid && styles.overdueHistoryText]}>{paid ? "پرداخت شده" : "معوق"}</Text>
        </View>
        <Text style={styles.historySubtitle}>{paid ? "پرداخت ثبت‌شده" : "سررسید گذشته"}</Text>
      </View>
    </View>
  );
}

export default function PaymentsTerminatedScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="دریافت و پرداخت" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.terminationCard}>
          <View style={styles.terminationTop}>
            <View style={styles.terminatedBadge}><Text style={styles.terminatedText}>فسخ شده</Text></View>
            <Text style={styles.terminationTitle}>پرداخت‌های این قرارداد متوقف شده‌اند</Text>
          </View>
          <Text style={styles.body}>این قرارداد به‌دلیل ۳ قسط معوق فسخ شده است و پرداخت جدیدی برای آن در دسترس نیست.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>وضعیت تسویه نهایی</Text>
          <SettlementRow label="جمع بدهی معوق" value="در حال محاسبه" />
          <SettlementRow label="مبلغ کسرشده از آورده" value="در حال محاسبه" />
          <SettlementRow label="مانده نهایی" value="پس از نهایی‌شدن نمایش داده می‌شود" muted />
          <Text style={styles.note}>تسویه مالی قرارداد از طریق چارخونه انجام می‌شود و نیازی به پرداخت مستقیم به مالک نیست.</Text>
        </View>

        <View style={styles.historyCard}>
          <Text style={styles.cardTitle}>سوابق پرداخت قرارداد</Text>
          <HistoryRow installment="قسط ۱ از ۱۲" paid />
          <HistoryRow installment="قسط ۲ از ۱۲" />
          <HistoryRow installment="قسط ۳ از ۱۲" />
          <HistoryRow installment="قسط ۴ از ۱۲" />
        </View>

        <View style={styles.noPaymentCard}>
          <Text style={styles.noPaymentTitle}>امکان پرداخت جدید وجود ندارد</Text>
          <Text style={styles.note}>برای مشاهده نتیجه نهایی قرارداد و وضعیت تسویه، به جزئیات قرارداد مراجعه کنید.</Text>
        </View>

        <AppButton variant="primary" onPress={() => router.push("/(tenant)/contract-detail-terminated")}>مشاهده وضعیت قرارداد</AppButton>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 14 },
  terminationCard: { backgroundColor: "#FEF0F0", borderRadius: radii.lg, paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  terminationTop: { minHeight: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  terminatedBadge: { minWidth: 72, minHeight: 24, borderRadius: 14, backgroundColor: "#FEE6E6", alignItems: "center", justifyContent: "center" },
  terminatedText: { color: "#B62B2B", fontFamily: fonts.medium, fontSize: 12, writingDirection: "rtl" },
  terminationTitle: { flex: 1, color: "#B62B2B", fontFamily: fonts.semibold, fontSize: 14, textAlign: "right", writingDirection: "rtl" },
  body: { width: "100%", color: "#6B7280", fontFamily: fonts.regular, fontSize: 12, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, paddingHorizontal: 16, paddingVertical: 14, gap: 6 },
  cardTitle: { width: "100%", color: colors.text, fontFamily: fonts.semibold, fontSize: 15, lineHeight: 24, textAlign: "right", writingDirection: "rtl" },
  settlementRow: { minHeight: 30, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  settlementValue: { width: 170, color: "#CC6C00", fontFamily: fonts.regular, fontSize: 13, lineHeight: 24, writingDirection: "rtl" },
  mutedValue: { color: "#6B7280" },
  settlementLabel: { width: 146, color: "#6B7280", fontFamily: fonts.medium, fontSize: 13, lineHeight: 24, textAlign: "right", writingDirection: "rtl" },
  note: { width: "100%", color: "#6B7280", fontFamily: fonts.regular, fontSize: 11, lineHeight: 19, textAlign: "right", writingDirection: "rtl" },
  historyCard: { backgroundColor: colors.surface, borderRadius: radii.lg, paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  historyRow: { width: "100%", borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  historyTop: { minHeight: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  historyAmount: { width: 125, color: colors.text, fontFamily: fonts.semibold, fontSize: 12, writingDirection: "rtl" },
  historyTitle: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  historyBottom: { minHeight: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  historyBadge: { width: 78, minHeight: 24, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#F0FAF5" },
  paidBadge: { backgroundColor: "#F0FAF5" },
  overdueHistoryBadge: { backgroundColor: "#FEF0F0" },
  historyBadgeText: { color: colors.primary, fontFamily: fonts.medium, fontSize: 11, writingDirection: "rtl" },
  overdueHistoryText: { color: "#B62B2B" },
  historySubtitle: { flex: 1, color: "#6B7280", fontFamily: fonts.regular, fontSize: 11, textAlign: "right", writingDirection: "rtl" },
  noPaymentCard: { backgroundColor: "#FFFAF0", borderRadius: radii.lg, paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  noPaymentTitle: { width: "100%", color: "#CC6C00", fontFamily: fonts.semibold, fontSize: 13, lineHeight: 24, textAlign: "right", writingDirection: "rtl" },
});
