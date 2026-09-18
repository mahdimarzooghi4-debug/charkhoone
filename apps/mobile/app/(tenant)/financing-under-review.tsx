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

function formatUpdated(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function FinancingUnderReviewScreen() {
  const router = useRouter();
  const { status, data, error, loading } = useMobileBootstrap();
  const application = data?.latestCreditApplication ?? null;

  if (status === "unauthenticated" || status === "config-error") {
    router.replace("/(auth)/login");
  }

  const allocation = application?.fundingAllocation ?? null;
  const approval = application?.bankApproval ?? null;
  const plan = application?.selectedPlan ?? null;

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="وضعیت درخواست" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? <Text style={styles.stateText}>در حال دریافت وضعیت persisted درخواست...</Text> : null}

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>دریافت وضعیت درخواست ناموفق بود</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!loading && !error && !application ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>درخواست اعتباری ثبت‌شده‌ای وجود ندارد</Text>
            <Text style={styles.body}>
              این صفحه هیچ وضعیت نمونه‌ای تولید نمی‌کند. برای نمایش وضعیت باید application واقعی در backend موجود باشد.
            </Text>
          </View>
        ) : null}

        {application ? (
          <>
            <View style={styles.hero}>
              <Text style={styles.heroLabel}>وضعیت authoritative</Text>
              <Text selectable style={styles.heroStatus}>{application.status}</Text>
              <Text style={styles.heroNote}>آخرین به‌روزرسانی: {formatUpdated(application.updatedAtUtc)}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>درخواست</Text>
              <Row label="Application ID" value={application.creditApplicationId} />
              {plan ? (
                <>
                  <Row label="طرح انتخاب‌شده" value={plan.title} />
                  <Row label="شناسه بانک" value={plan.bankId} />
                  <Row label="نسخه طرح" value={plan.version} />
                  <Row label="مدت" value={`${plan.termMonths.toLocaleString("fa-IR")} ماه`} />
                </>
              ) : (
                <Text style={styles.body}>برای این application هنوز plan persisted قابل نمایش نیست.</Text>
              )}
            </View>

            {approval ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Bank approval evidence</Text>
                <Row label="وضعیت" value={approval.status} />
                <Row label="Provider" value={approval.provider} />
                <Row label="حداکثر واجد شرایط" value={formatRial(approval.maximumEligibleLoanRial)} />
                {approval.approvedLoanRial ? (
                  <Row label="مبلغ تأییدشده بانک" value={formatRial(approval.approvedLoanRial)} />
                ) : null}
                {approval.reasonCode ? <Row label="Reason code" value={approval.reasonCode} /> : null}
              </View>
            ) : null}

            {allocation ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Funding allocation persisted</Text>
                <Row label="Full deposit equivalent" value={formatRial(allocation.fullDepositEquivalentRial)} />
                <Row label="Bank approved" value={formatRial(allocation.bankApprovedLoanRial)} />
                <Row label="Tenant contribution" value={formatRial(allocation.tenantContributionRial)} />
                <Row label="Contract ID" value={allocation.contractId} />
              </View>
            ) : null}

            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                اپ فقط state و evidence ذخیره‌شده را نمایش می‌دهد و هیچ نتیجه بانک، مبلغ یا مرحله بعدی را حدس نمی‌زند.
              </Text>
            </View>
          </>
        ) : null}

        <AppButton onPress={() => router.replace("/(tenant)/home")}>بازگشت به خانه</AppButton>
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
  hero: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: 18, gap: 8, alignItems: "flex-end" },
  heroLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, writingDirection: "rtl" },
  heroStatus: { width: "100%", color: colors.primary, fontFamily: fonts.bold, fontSize: 20, textAlign: "right" },
  heroNote: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "right", writingDirection: "rtl" },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 16, gap: 11 },
  cardTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14, textAlign: "right", writingDirection: "rtl" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  label: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "right", writingDirection: "rtl" },
  value: { flex: 1, color: colors.text, fontFamily: fonts.medium, fontSize: 11, textAlign: "left" },
  body: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
  notice: { backgroundColor: colors.successSoft, borderRadius: radii.md, padding: 13 },
  noticeText: { color: colors.primary, fontFamily: fonts.regular, fontSize: 11, lineHeight: 18, textAlign: "right", writingDirection: "rtl" },
});
