import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppHeader } from "@/components/AppHeader";
import { useMobileAuth } from "@/auth/MobileAuthProvider";
import { useMobileBootstrap } from "@/api/useMobileBootstrap";
import {
  getMobileFinancingPlans,
  type MobileFinancingPlan,
  type MobileFinancingPlansResponse,
} from "@/api/mobileApi";
import { colors, fonts, radii } from "@/theme";

function PlanCard({
  plan,
  onPress,
}: {
  plan: MobileFinancingPlan;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.planCard, pressed && styles.pressed]}
    >
      <View style={styles.planHeader}>
        <View style={styles.publicBadge}>
          <Text style={styles.publicBadgeText}>طرح عمومی منتشرشده</Text>
        </View>
        <Text style={styles.planTitle}>{plan.title}</Text>
      </View>

      <View style={styles.row}>
        <Text selectable style={styles.value}>{plan.bankId}</Text>
        <Text style={styles.label}>شناسه بانک</Text>
      </View>
      <View style={styles.row}>
        <Text selectable style={styles.value}>{plan.version}</Text>
        <Text style={styles.label}>نسخه دقیق طرح</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.value}>{plan.termMonths.toLocaleString("fa-IR")} ماه</Text>
        <Text style={styles.label}>مدت</Text>
      </View>

      <View style={styles.termsBox}>
        <Text style={styles.termsLabel}>شرایط ثبت‌شده طرح</Text>
        <Text style={styles.termsText}>{plan.interestTerms}</Text>
      </View>

      <Text style={styles.selectText}>بررسی و انتخاب این نسخه</Text>
    </Pressable>
  );
}

export default function FinancingPlansScreen() {
  const router = useRouter();
  const { apiRequest } = useMobileAuth();
  const { status, data: bootstrap, error: bootstrapError, loading: bootstrapLoading } =
    useMobileBootstrap();
  const [plans, setPlans] = useState<MobileFinancingPlansResponse | null>(null);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [plansLoading, setPlansLoading] = useState(false);

  const application = bootstrap?.latestCreditApplication ?? null;

  useEffect(() => {
    if (status === "unauthenticated" || status === "config-error") {
      router.replace("/(auth)/login");
      return;
    }

    if (
      status !== "authenticated" ||
      !application ||
      application.status !== "PlanSelectionPending"
    ) {
      setPlans(null);
      return;
    }

    let active = true;
    setPlansLoading(true);
    getMobileFinancingPlans(apiRequest, application.creditApplicationId)
      .then((value) => {
        if (!active) return;
        setPlans(value);
        setPlansError(null);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setPlans(null);
        setPlansError(
          reason instanceof Error ? reason.message : "mobile_financing_plans_failed",
        );
      })
      .finally(() => {
        if (active) setPlansLoading(false);
      });

    return () => {
      active = false;
    };
  }, [apiRequest, application, router, status]);

  const openConfirmation = (plan: MobileFinancingPlan) => {
    if (!application) return;
    router.push({
      pathname: "/(tenant)/plan-confirmation",
      params: {
        applicationId: application.creditApplicationId,
        planId: plan.planId,
        version: plan.version,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="انتخاب طرح تأمین مالی" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>فقط طرح‌های authoritative</Text>
          <Text style={styles.noticeText}>
            این فهرست فقط نسخه‌های Published، Public و ۱۲ماهه‌ای را نشان می‌دهد که backend برای application فعلی قابل انتخاب می‌داند. اپ هیچ بانک، نرخ یا مبلغی را خودش تولید نمی‌کند.
          </Text>
        </View>

        {bootstrapLoading ? (
          <Text style={styles.stateText}>در حال دریافت وضعیت درخواست...</Text>
        ) : null}
        {bootstrapError ? (
          <Text style={styles.errorText}>دریافت وضعیت درخواست ناموفق بود: {bootstrapError}</Text>
        ) : null}

        {!bootstrapLoading && !bootstrapError && !application ? (
          <View style={styles.card}>
            <Text style={styles.title}>درخواست اعتباری فعال وجود ندارد</Text>
            <Text style={styles.description}>
              برای نمایش طرح‌ها باید application واقعی در backend وجود داشته باشد.
            </Text>
          </View>
        ) : null}

        {application && application.status !== "PlanSelectionPending" ? (
          <View style={styles.card}>
            <Text style={styles.title}>انتخاب طرح در این وضعیت مجاز نیست</Text>
            <Text style={styles.description}>
              وضعیت فعلی درخواست: {application.status}. backend فقط در وضعیت PlanSelectionPending فهرست قابل انتخاب را ارائه می‌کند.
            </Text>
          </View>
        ) : null}

        {plansLoading ? <Text style={styles.stateText}>در حال دریافت طرح‌ها...</Text> : null}
        {plansError ? (
          <Text style={styles.errorText}>دریافت طرح‌ها ناموفق بود: {plansError}</Text>
        ) : null}

        {!plansLoading && !plansError && plans?.items.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.title}>طرح عمومی منتشرشده‌ای در دسترس نیست</Text>
            <Text style={styles.description}>
              Draft، Suspended، Retired و طرح‌های سازمانی عمداً در این فهرست نمایش داده نمی‌شوند.
            </Text>
          </View>
        ) : null}

        {plans?.items.map((plan) => (
          <PlanCard
            key={`${plan.planId}:${plan.version}`}
            plan={plan}
            onPress={() => openConfirmation(plan)}
          />
        ))}

        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>بازگشت</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 36, gap: 14 },
  notice: { backgroundColor: colors.successSoft, borderRadius: radii.md, padding: 14, gap: 6 },
  noticeTitle: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 14, textAlign: "right", writingDirection: "rtl" },
  noticeText: { color: colors.primary, fontFamily: fonts.regular, fontSize: 11, lineHeight: 19, textAlign: "right", writingDirection: "rtl" },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: 18, gap: 8 },
  title: { color: colors.text, fontFamily: fonts.semibold, fontSize: 16, lineHeight: 25, textAlign: "right", writingDirection: "rtl" },
  description: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
  planCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 16, gap: 12 },
  planHeader: { gap: 8, alignItems: "flex-end" },
  publicBadge: { backgroundColor: colors.successSoft, borderRadius: radii.sm, paddingHorizontal: 9, paddingVertical: 4 },
  publicBadgeText: { color: colors.primary, fontFamily: fonts.medium, fontSize: 10, writingDirection: "rtl" },
  planTitle: { width: "100%", color: colors.text, fontFamily: fonts.semibold, fontSize: 16, textAlign: "right", writingDirection: "rtl" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  label: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "right", writingDirection: "rtl" },
  value: { flex: 1, color: colors.text, fontFamily: fonts.medium, fontSize: 12, textAlign: "left" },
  termsBox: { backgroundColor: colors.page, borderRadius: radii.sm, padding: 12, gap: 6 },
  termsLabel: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 11, textAlign: "right", writingDirection: "rtl" },
  termsText: { color: colors.text, fontFamily: fonts.regular, fontSize: 12, lineHeight: 19, textAlign: "right", writingDirection: "rtl" },
  selectText: { color: colors.accent, fontFamily: fonts.semibold, fontSize: 13, textAlign: "center", writingDirection: "rtl" },
  stateText: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 19, textAlign: "right", writingDirection: "rtl" },
  errorText: { color: "#FCA5A5", fontFamily: fonts.medium, fontSize: 12, lineHeight: 19, textAlign: "right", writingDirection: "rtl" },
  backButton: { minHeight: 48, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.page, alignItems: "center", justifyContent: "center", marginTop: 8 },
  backButtonText: { color: colors.page, fontFamily: fonts.medium, fontSize: 14, writingDirection: "rtl" },
  pressed: { opacity: 0.88 },
});
