import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { useMobileAuth } from "@/auth/MobileAuthProvider";
import {
  getMobileFinancingPlans,
  selectMobileFinancingPlan,
  type MobileFinancingPlan,
} from "@/api/mobileApi";
import { colors, fonts, radii } from "@/theme";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text selectable style={styles.detailValue}>{value}</Text>
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function PlanConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    applicationId?: string | string[];
    planId?: string | string[];
    version?: string | string[];
  }>();
  const { status, apiRequest } = useMobileAuth();
  const [plan, setPlan] = useState<MobileFinancingPlan | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applicationId = useMemo(() => first(params.applicationId)?.trim() ?? "", [params.applicationId]);
  const planId = useMemo(() => first(params.planId)?.trim() ?? "", [params.planId]);
  const version = useMemo(() => first(params.version)?.trim() ?? "", [params.version]);

  useEffect(() => {
    if (status === "unauthenticated" || status === "config-error") {
      router.replace("/(auth)/login");
      return;
    }

    if (status !== "authenticated") return;

    if (!applicationId || !planId || !version) {
      setPlan(null);
      setError("mobile_financing_plan_route_invalid");
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    getMobileFinancingPlans(apiRequest, applicationId)
      .then((response) => {
        if (!active) return;
        const authoritative = response.items.find(
          (item) => item.planId === planId && item.version === version,
        );
        if (!authoritative) {
          setPlan(null);
          setError("mobile_financing_plan_not_available");
          return;
        }

        setPlan(authoritative);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setPlan(null);
        setError(
          reason instanceof Error
            ? reason.message
            : "mobile_financing_plan_confirmation_failed",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [apiRequest, applicationId, planId, router, status, version]);

  const submit = async () => {
    if (!plan || !applicationId || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const result = await selectMobileFinancingPlan(apiRequest, applicationId, plan);
      if (
        result.planId !== plan.planId ||
        result.planVersion !== plan.version ||
        (result.outcome !== "Selected" && result.outcome !== "AlreadySelected")
      ) {
        throw new Error("mobile_financing_plan_selection_response_invalid");
      }

      router.replace("/(tenant)/home");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "mobile_financing_plan_selection_failed",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="تأیید نسخه طرح" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.title}>نسخه authoritative را بررسی کنید</Text>
          <Text style={styles.description}>
            اطلاعات این صفحه دوباره از backend خوانده می‌شود؛ پارامترهای route به‌تنهایی برای نمایش یا انتخاب طرح قابل اعتماد نیستند.
          </Text>
        </View>

        {loading ? <Text style={styles.stateText}>در حال تأیید طرح با backend...</Text> : null}

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>طرح قابل تأیید نیست</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {plan ? (
          <>
            <View style={styles.card}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Published • Public • 12 months</Text>
              </View>
              <Text style={styles.planTitle}>{plan.title}</Text>
              <DetailRow label="شناسه بانک" value={plan.bankId} />
              <DetailRow label="Plan ID" value={plan.planId} />
              <DetailRow label="نسخه دقیق" value={plan.version} />
              <DetailRow label="مدت" value={`${plan.termMonths.toLocaleString("fa-IR")} ماه`} />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>شرایط ثبت‌شده طرح</Text>
              <Text style={styles.termsText}>{plan.interestTerms}</Text>
              <Text style={styles.note}>
                این endpoint مبلغ وام، آورده، قسط یا نرخ عددی جداگانه‌ای برنمی‌گرداند؛ اپ نیز چنین مقادیری را حدس یا محاسبه نمی‌کند.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>اثر انتخاب</Text>
              <Text style={styles.bodyText}>
                با تأیید، mutation موجود انتخاب طرح اجرا می‌شود. backend مالکیت application، Published/Public بودن همین نسخه و وضعیت PlanSelectionPending را دوباره بررسی می‌کند و audit/outbox authoritative ثبت می‌شود.
              </Text>
            </View>

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: confirmed }}
              onPress={() => setConfirmed((value) => !value)}
              style={styles.confirmRow}
            >
              <Text style={styles.confirmText}>
                شناسه بانک، عنوان، نسخه و شرایط ثبت‌شده این طرح را بررسی کرده‌ام.
              </Text>
              <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
                {confirmed ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
            </Pressable>

            <AppButton
              disabled={!confirmed || submitting}
              onPress={submit}
            >
              {submitting ? "در حال ثبت انتخاب..." : "ثبت انتخاب این نسخه"}
            </AppButton>
          </>
        ) : null}

        <AppButton variant="outline" onPress={() => router.replace("/(tenant)/financing-plans")}>
          بازگشت به فهرست طرح‌ها
        </AppButton>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 16 },
  intro: { gap: 8 },
  title: { color: colors.page, fontFamily: fonts.semibold, fontSize: 20, lineHeight: 28, textAlign: "right", writingDirection: "rtl" },
  description: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
  stateText: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, textAlign: "right", writingDirection: "rtl" },
  errorCard: { backgroundColor: "#FEE2E2", borderRadius: radii.md, padding: 14, gap: 6 },
  errorTitle: { color: "#991B1B", fontFamily: fonts.semibold, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  errorText: { color: "#991B1B", fontFamily: fonts.regular, fontSize: 11, lineHeight: 18, textAlign: "right" },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 16, gap: 12 },
  badge: { alignSelf: "flex-end", backgroundColor: colors.successSoft, borderRadius: radii.sm, paddingHorizontal: 9, paddingVertical: 4 },
  badgeText: { color: colors.primary, fontFamily: fonts.medium, fontSize: 10 },
  planTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 17, textAlign: "right", writingDirection: "rtl" },
  cardTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14, textAlign: "right", writingDirection: "rtl" },
  detailRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  detailLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "right", writingDirection: "rtl" },
  detailValue: { flex: 1, color: colors.text, fontFamily: fonts.medium, fontSize: 11, textAlign: "left" },
  termsText: { color: colors.text, fontFamily: fonts.regular, fontSize: 13, lineHeight: 21, textAlign: "right", writingDirection: "rtl" },
  note: { color: colors.muted, fontFamily: fonts.regular, fontSize: 10, lineHeight: 17, textAlign: "right", writingDirection: "rtl" },
  bodyText: { color: colors.text, fontFamily: fonts.regular, fontSize: 12, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
  confirmRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", paddingVertical: 8 },
  confirmText: { flex: 1, color: colors.page, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.muted, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkmark: { color: colors.surface, fontSize: 14, fontWeight: "700" },
});
