import { useEffect } from "react";
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

export default function FinancingApprovedScreen() {
  const router = useRouter();
  const { status, data, error, loading } = useMobileBootstrap();
  const application = data?.latestCreditApplication ?? null;
  const allocation = application?.fundingAllocation ?? null;
  const plan = application?.selectedPlan ?? null;
  const approval = application?.bankApproval ?? null;
  const authoritativeApproved =
    application?.status === "ApprovedFunded" && allocation !== null;

  useEffect(() => {
    if (status === "unauthenticated" || status === "config-error") {
      router.replace("/(auth)/login");
    }
  }, [router, status]);

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

        {!loading && !error && !authoritativeApproved ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>تأیید مالی authoritative موجود نیست</Text>
            <Text style={styles.body}>
              این صفحه فقط وقتی نتیجه را تأییدشده نشان می‌دهد که status برابر ApprovedFunded باشد و funding allocation واقعی برای همان application در PostgreSQL وجود داشته باشد.
            </Text>
            {application ? <Row label="وضعیت فعلی" value={application.status} /> : null}
          </View>
        ) : null}

        {authoritativeApproved && application && allocation ? (
          <>
            <View style={styles.hero}>
              <View style={styles.badge}><Text style={styles.badgeText}>ApprovedFunded</Text></View>
              <Text style={styles.heroTitle}>تأمین مالی ثبت‌شده و تأییدشده است</Text>
              <Text style={styles.heroText}>
                این نتیجه از status و funding allocation persisted خوانده شده و توسط اپ تولید نشده است.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>طرح و بانک</Text>
              {plan ? (
                <>
                  <Row label="عنوان طرح" value={plan.title} />
                  <Row label="Bank ID" value={plan.bankId} />
                  <Row label="نسخه" value={plan.version} />
                  <Row label="مدت" value={`${plan.termMonths.toLocaleString("fa-IR")} ماه`} />
                </>
              ) : (
                <Text style={styles.body}>نسخه plan persisted برای این application قابل resolve نیست.</Text>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Funding allocation</Text>
              <Row label="Full deposit equivalent" value={formatRial(allocation.fullDepositEquivalentRial)} />
              <Row label="حداکثر واجد شرایط" value={formatRial(allocation.maximumEligibleLoanRial)} />
              <Row label="مبلغ تأییدشده بانک" value={formatRial(allocation.bankApprovedLoanRial)} />
              <Row label="آورده مستأجر" value={formatRial(allocation.tenantContributionRial)} />
              <Row label="Contract ID" value={allocation.contractId} />
            </View>

            {approval ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Bank approval evidence</Text>
                <Row label="وضعیت" value={approval.status} />
                <Row label="Provider" value={approval.provider} />
                {approval.reasonCode ? <Row label="Reason code" value={approval.reasonCode} /> : null}
              </View>
            ) : null}

            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                این نسخه هیچ entitlement عضویت، مبلغ عضویت یا مرحله پرداخت عضویت را جعل نمی‌کند. تا زمانی که backend مدل authoritative برای membership ارائه نکند، از این صفحه به membership ساختگی هدایت نمی‌شوید.
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
  badge: { backgroundColor: colors.successSoft, borderRadius: radii.sm, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 11 },
  heroTitle: { width: "100%", color: colors.text, fontFamily: fonts.bold, fontSize: 18, textAlign: "right", writingDirection: "rtl" },
  heroText: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 16, gap: 11 },
  cardTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14, textAlign: "right", writingDirection: "rtl" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  label: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "right", writingDirection: "rtl" },
  value: { flex: 1, color: colors.text, fontFamily: fonts.medium, fontSize: 11, textAlign: "left" },
  body: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
  notice: { backgroundColor: colors.successSoft, borderRadius: radii.md, padding: 13 },
  noticeText: { color: colors.primary, fontFamily: fonts.regular, fontSize: 11, lineHeight: 18, textAlign: "right", writingDirection: "rtl" },
});
