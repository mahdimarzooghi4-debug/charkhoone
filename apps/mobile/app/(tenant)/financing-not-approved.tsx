import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { colors, fonts, radii } from "@/theme";

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

export default function FinancingNotApprovedScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="وضعیت درخواست" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.decisionCard}>
          <Text style={styles.decisionTitle}>درخواست تأمین مالی تأیید نشد</Text>
          <Text style={styles.decisionDescription}>نتیجه بررسی این درخواست از طرف بانک تأیید نشده است.</Text>
          <View style={styles.rejectedBadge}>
            <Text style={styles.rejectedBadgeText}>تأیید نشد</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>خلاصه درخواست</Text>
          <SummaryRow label="طرح انتخاب‌شده" value="طرح ویژه کارکنان" />
          <SummaryRow label="بانک صادرکننده" value="بانک نمونه" />
          <SummaryRow label="مبلغ درخواست" value="۴۵۰٬۰۰۰٬۰۰۰ تومان" />
          <SummaryRow label="وضعیت نهایی" value="تأیید نشد" />
          <SummaryRow label="قرارداد مرتبط" value="قرارداد سعادت‌آباد" />
        </View>

        <View style={styles.reasonCard}>
          <Text style={styles.reasonTitle}>دلیل اعلام‌شده توسط بانک</Text>
          <Text style={styles.bodyText}>اگر بانک دلیل مشخصی برای رد درخواست ارائه کند، همان متن بدون تغییر در این بخش نمایش داده می‌شود.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>طرح‌های دیگری برای شما قابل بررسی است</Text>
          <Text style={styles.bodyText}>در صورت وجود طرح واجد شرایط دیگر یا طرح عمومی، می‌توانید گزینه دیگری را بررسی کنید.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/(tenant)/financing-plans")}
            style={({ pressed }) => [styles.altAction, pressed && styles.pressed]}
          >
            <Text style={styles.altActionText}>مشاهده طرح‌های دیگر</Text>
          </Pressable>
        </View>

        <View style={styles.historyCard}>
          <Text style={styles.bodyText}>این درخواست و نتیجه بررسی آن در سوابق قرارداد شما باقی می‌ماند.</Text>
        </View>

        <View style={styles.actions}>
          <AppButton variant="primary" onPress={() => router.replace("/(tenant)/financing-plans")}>بازگشت به طرح‌های تأمین مالی</AppButton>
          <AppButton variant="outline" onPress={() => router.replace("/(shared)/contracts")}>بازگشت به قراردادها</AppButton>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 14 },
  decisionCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: 16, gap: 8, alignItems: "center" },
  decisionTitle: { width: "100%", color: colors.text, fontFamily: fonts.bold, fontSize: 18, lineHeight: 32, textAlign: "center", writingDirection: "rtl" },
  decisionDescription: { width: "100%", color: "#6B7280", fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, textAlign: "center", writingDirection: "rtl" },
  rejectedBadge: { minWidth: 88, minHeight: 24, borderRadius: 14, backgroundColor: "#FEF0F0", alignItems: "center", justifyContent: "center", paddingHorizontal: 9 },
  rejectedBadgeText: { color: "#B62B2B", fontFamily: fonts.medium, fontSize: 12, writingDirection: "rtl" },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, paddingHorizontal: 16, paddingVertical: 14, gap: 6 },
  cardTitle: { width: "100%", color: colors.text, fontFamily: fonts.semibold, fontSize: 15, lineHeight: 24, textAlign: "right", writingDirection: "rtl" },
  summaryRow: { minHeight: 30, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  summaryValue: { width: 170, color: colors.text, fontFamily: fonts.regular, fontSize: 13, lineHeight: 24, writingDirection: "rtl" },
  summaryLabel: { width: 146, color: "#6B7280", fontFamily: fonts.medium, fontSize: 13, lineHeight: 24, textAlign: "right", writingDirection: "rtl" },
  reasonCard: { backgroundColor: "#FFFAFA", borderRadius: radii.lg, paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  reasonTitle: { width: "100%", color: "#B62B2B", fontFamily: fonts.semibold, fontSize: 14, lineHeight: 24, textAlign: "right", writingDirection: "rtl" },
  bodyText: { width: "100%", color: "#6B7280", fontFamily: fonts.regular, fontSize: 12, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
  altAction: { width: "100%", minHeight: 24, borderRadius: 10, backgroundColor: "#FFFAF0", alignItems: "center", justifyContent: "center", paddingHorizontal: 13 },
  altActionText: { color: "#CC6C00", fontFamily: fonts.semibold, fontSize: 13, lineHeight: 24, textAlign: "center", writingDirection: "rtl" },
  historyCard: { backgroundColor: "#F0F5F4", borderRadius: radii.lg, paddingHorizontal: 16, paddingVertical: 12 },
  actions: { gap: 8 },
  pressed: { opacity: 0.88 },
});
