import { useEffect } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppHeader } from "@/components/AppHeader";
import { formatRial } from "@/api/mobileApi";
import { useMobileBootstrap } from "@/api/useMobileBootstrap";
import { colors, fonts, radii } from "@/theme";

function formatDue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function PaymentsScreen() {
  const router = useRouter();
  const { status, data, error, loading } = useMobileBootstrap();

  useEffect(() => {
    if (status === "unauthenticated" || status === "config-error") {
      router.replace("/(auth)/login");
    }
  }, [router, status]);

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="دریافت و پرداخت" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>داده واقعی پرداخت</Text>
          <Text style={styles.noteText}>
            این صفحه فقط PaymentInstructionهای persist‌شده متعلق به قراردادهای مستأجری حساب فعلی را نمایش می‌دهد. شروع پرداخت آنلاین هنوز endpoint عمومی جداگانه ندارد؛ بنابراین دکمه موفقیت ساختگی وجود ندارد.
          </Text>
        </View>

        {loading ? <Text style={styles.stateText}>در حال دریافت پرداخت‌ها...</Text> : null}
        {error ? <Text style={styles.errorText}>دریافت پرداخت‌ها ناموفق بود: {error}</Text> : null}

        {!loading && !error && data?.payments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>پرداختی ثبت نشده است</Text>
            <Text style={styles.stateText}>backend برای این حساب PaymentInstruction قابل نمایش برنگرداند.</Text>
          </View>
        ) : null}

        {data?.payments.map((payment) => (
          <View key={payment.paymentInstructionId} style={styles.paymentCard}>
            <View style={styles.row}>
              <Text style={styles.value}>{payment.status}</Text>
              <Text style={styles.label}>وضعیت</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.amount}>{formatRial(payment.amountRial)}</Text>
              <Text style={styles.label}>مبلغ</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.value}>{payment.kind}</Text>
              <Text style={styles.label}>نوع جزء</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.value}>ماه {payment.contractMonthNumber.toLocaleString("fa-IR")}</Text>
              <Text style={styles.label}>ماه قرارداد</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.value}>{formatDue(payment.dueAtUtc)}</Text>
              <Text style={styles.label}>سررسید</Text>
            </View>
            <Text selectable style={styles.id}>Payment: {payment.paymentInstructionId}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 12 },
  noteCard: { backgroundColor: colors.successSoft, borderRadius: radii.md, padding: 14, gap: 6 },
  noteTitle: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 14, textAlign: "right", writingDirection: "rtl" },
  noteText: { color: colors.primary, fontFamily: fonts.regular, fontSize: 11, lineHeight: 18, textAlign: "right", writingDirection: "rtl" },
  stateText: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 19, textAlign: "right", writingDirection: "rtl" },
  errorText: { color: "#FCA5A5", fontFamily: fonts.medium, fontSize: 12, lineHeight: 19, textAlign: "right", writingDirection: "rtl" },
  emptyCard: { backgroundColor: colors.surface, borderRadius: radii.md, padding: 18, gap: 8 },
  emptyTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15, textAlign: "right", writingDirection: "rtl" },
  paymentCard: { backgroundColor: colors.surface, borderRadius: radii.md, padding: 16, gap: 9 },
  row: { minHeight: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  label: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, textAlign: "right", writingDirection: "rtl" },
  value: { flex: 1, color: colors.text, fontFamily: fonts.medium, fontSize: 12, textAlign: "left" },
  amount: { flex: 1, color: colors.primary, fontFamily: fonts.bold, fontSize: 14, textAlign: "left" },
  id: { color: colors.muted, fontFamily: fonts.regular, fontSize: 9, textAlign: "left" },
});
