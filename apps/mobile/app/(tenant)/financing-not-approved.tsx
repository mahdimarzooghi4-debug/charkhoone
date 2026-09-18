import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { useMobileBootstrap } from "@/api/useMobileBootstrap";
import { formatRial } from "@/api/mobileApi";
import { colors, fonts, radii } from "@/theme";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text selectable style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export default function FinancingNotApprovedScreen() {
  const router = useRouter();
  const { status, data, error, loading } = useMobileBootstrap();
  const application = data?.latestCreditApplication ?? null;
  const plan = application?.selectedPlan ?? null;
  const approval = application?.bankApproval ?? null;
  const rejected = application?.status === "Rejected";

  if (status === "unauthenticated" || status === "config-error") {
    router.replace("/(auth)/login");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="وضعیت درخواست" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? <Text style={styles.stateText}>در حال دریافت نتیجه persisted...</Text> : null}

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>دریافت نتیجه ناموفق بود</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!loading && !error && !rejected ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>نتیجه رد authoritative موجود نیست</Text>
            <Text style={styles.body}>
              این صفحه فقط وقتی ردشدن را نمایش می‌دهد که application واقعی status برابر Rejected داشته باشد.
            </Text>
            {application ? <Row label="وضعیت فعلی" value={application.status} /> : null}
          </View>
        ) : null}

        {rejected && application ? (
          <>
            <View style={styles.hero}>
              <View style={styles.badge}><Text style={styles.badgeText}>Rejected</Text></View>
              <Text style={styles.heroTitle}>درخواست در backend رد شده است</Text>
              <Text style={styles.heroText}>
                علت یا منبع فقط در صورتی نمایش داده می‌شود که evidence persisted برای همین application وجود داشته باشد.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>درخواست</Text>
              <Row label="Application ID" value={application.creditApplicationId} />
              {plan ? (
                <>
                  <Row label="طرح انتخاب‌شده" value={plan.title} />
                  <Row label="Bank ID" value={plan.bankId} />
                  <Row label="نسخه" value={plan.version} />
                </>
              ) : null}
            </View>

            {approval ? (
              <View style={styles.reasonCard}>
                <Text style={styles.reasonTitle}>Bank approval evidence</Text>
                <Row label="وضعیت" value={approval.status} />
                <Row label="Provider" value={approval.provider} />
                <Row label="حداکثر واجد شرایط" value={formatRial(approval.maximumEligibleLoanRial)} />
                {approval.approvedLoanRial ? (
                  <Row label="مبلغ تأییدشده" value={formatRial(approval.approvedLoanRial)} />
                ) : null}
                {approval.reasonCode ? (
                  <Row label="Reason code persisted" value={approval.reasonCode} />
                ) : (
                  <Text style={styles.body}>Reason code persisted برای این evidence وجود ندارد.</Text>
                )}
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Bank approval evidence وجود ندارد</Text>
                <Text style={styles.body}>
                  Rejected می‌تواند پیش از bank approval هم رخ دهد. اپ علت بانکی را در نبود evidence حدس نمی‌زند.
                </Text>
              </View>
            )}

            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                Reason code یک کد persisted است و اپ آن را به توضیح انسانی یا توصیه‌ی ساختگی تبدیل نمی‌کند.
              </Text>
            </View>
          </>
        ) : null}

        <AppButton onPress={() => router.replace("/(tenant)/home")}>بازگشت به خانه</AppButton>
        <AppButton variant="outline" onPress={() => router.replace("/(shared)/contracts")}>مشاهده قراردادها</AppButton>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 36, gap: 14 },
  stateText: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, textAlign: "right", writingDirection: "rtl" },
  errorCard: { backgroundColor: "#FEE2E2", borderRadius: radii.md, padding: 14, gap: 6 },
  errorTitle: { color: "#991B1B", fontFamily: fonts.semibold, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  errorText: { color: "#991B1B", fontFamily: fonts.regular, fontSize: 11, textAlign: "right" },
  hero: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: 18, gap: 10, alignItems: "flex-end" },
  badge: { backgroundColor: "#FEE2E2", borderRadius: radii.sm, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { color: "#991B1B", fontFamily: fonts.semibold, fontSize: 11 },
  heroTitle: { width: "100%", color: colors.text, fontFamily: fonts.bold, fontSize: 18, textAlign: "right", writingDirection: "rtl" },
  heroText: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 16, gap: 11 },
  reasonCard: { backgroundColor: "#FFF7F7", borderWidth: 1, borderColor: "#FECACA", borderRadius: radii.lg, padding: 16, gap: 11 },
  cardTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14, textAlign: "right", writingDirection: "rtl" },
  reasonTitle: { color: "#991B1B", fontFamily: fonts.semibold, fontSize: 14, textAlign: "right", writingDirection: "rtl" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  label: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "right", writingDirection: "rtl" },
  value: { flex: 1, color: colors.text, fontFamily: fonts.medium, fontSize: 11, textAlign: "left" },
  body: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
  notice: { backgroundColor: colors.successSoft, borderRadius: radii.md, padding: 13 },
  noticeText: { color: colors.primary, fontFamily: fonts.regular, fontSize: 11, lineHeight: 18, textAlign: "right", writingDirection: "rtl" },
});
