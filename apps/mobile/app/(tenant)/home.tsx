import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { BrandLogo } from "@/components/BrandLogo";
import { FigmaSvg } from "@/components/FigmaSvg";
import { figmaAssets } from "@/figmaAssets";
import { useMobileAuth } from "@/auth/MobileAuthProvider";
import {
  formatRial,
  getMobileBootstrap,
  type MobileBootstrapResponse,
} from "@/api/mobileApi";
import { colors, fonts, radii } from "@/theme";

function SummaryCard({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>{title}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryNote}>{note}</Text>
    </View>
  );
}

function Shortcut({ icon, label, onPress }: { icon: string; label: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.shortcut} onPress={onPress}>
      <View style={styles.shortcutIconWrap}><FigmaSvg uri={icon} width={20} height={20} /></View>
      <Text style={styles.shortcutLabel}>{label}</Text>
    </Pressable>
  );
}

function BottomItem({ icon, label, active, onPress }: { icon: string; label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable style={styles.bottomItem} onPress={onPress}>
      <FigmaSvg uri={icon} width={24} height={24} tintColor={active ? colors.accent : undefined} />
      <Text style={[styles.bottomLabel, active && styles.bottomLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function formatDue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function TenantHomeScreen() {
  const router = useRouter();
  const { status, apiRequest } = useMobileAuth();
  const [bootstrap, setBootstrap] = useState<MobileBootstrapResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated" || status === "config-error") {
      router.replace("/(auth)/login");
      return;
    }
    if (status !== "authenticated") return;

    let active = true;
    getMobileBootstrap(apiRequest)
      .then((value) => {
        if (!active) return;
        setBootstrap(value);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : "mobile_bootstrap_failed");
      });

    return () => {
      active = false;
    };
  }, [apiRequest, router, status]);

  const tenantContract = bootstrap?.contracts.find((contract) => contract.role === "Tenant") ?? null;
  const nextPayment = bootstrap?.payments.find((payment) =>
    payment.status !== "Succeeded" && payment.status !== "Reversed",
  ) ?? null;

  const applicationValue = bootstrap?.latestCreditApplication?.status ?? "درخواستی ثبت نشده";
  const contractValue = tenantContract?.status ?? "قرارداد مستأجری ثبت نشده";
  const paymentValue = nextPayment ? formatRial(nextPayment.amountRial) : "پرداخت باز وجود ندارد";
  const paymentNote = nextPayment
    ? `ماه ${nextPayment.contractMonthNumber.toLocaleString("fa-IR")} • سررسید ${formatDue(nextPayment.dueAtUtc)} • ${nextPayment.status}`
    : "فقط داده persist‌شده API نمایش داده می‌شود";

  const openApplicationStatus = () => {
    const application = bootstrap?.latestCreditApplication;
    if (!application) return;

    if (application.status === "PlanSelectionPending") {
      router.push("/(tenant)/financing-plans");
      return;
    }

    if (application.status === "ApprovedFunded") {
      router.push("/(tenant)/financing-approved");
      return;
    }

    if (application.status === "Rejected") {
      router.push("/(tenant)/financing-not-approved");
      return;
    }

    router.push("/(tenant)/financing-under-review");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topLogo}><BrandLogo /></View>
      <View style={styles.header}>
        <View style={styles.notification}><FigmaSvg uri={figmaAssets.bell} width={20} height={20} /></View>
        <View style={styles.greeting}>
          <Text style={styles.greetingTitle}>سلام</Text>
          <Text style={styles.greetingNote}>اطلاعات این صفحه از حساب احراز هویت‌شده خوانده می‌شود.</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loadError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>دریافت اطلاعات حساب ناموفق بود</Text>
            <Text style={styles.errorText}>{loadError}</Text>
          </View>
        ) : null}

        <View style={styles.summaryGrid}>
          <View style={styles.summaryRow}>
            <SummaryCard
              title="آخرین درخواست"
              value={applicationValue}
              note={bootstrap?.latestCreditApplication ? "وضعیت persisted درخواست اعتباری" : "هنوز درخواست واقعی وجود ندارد"}
            />
            <SummaryCard
              title="وضعیت قرارداد"
              value={contractValue}
              note={tenantContract ? `شناسه: ${tenantContract.contractId}` : "قرارداد نمونه نمایش داده نمی‌شود"}
            />
          </View>
          <View style={styles.summaryRow}>
            <SummaryCard
              title="پرداخت بعدی"
              value={paymentValue}
              note={paymentNote}
            />
            <SummaryCard
              title="منبع داده"
              value={bootstrap ? "API واقعی" : "در حال دریافت"}
              note="Bearer OIDC • PostgreSQL"
            />
          </View>
        </View>

        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>عملیات حساب</Text>
          <Text style={styles.actionText}>
            قراردادها و پرداخت‌ها فقط از backend خوانده می‌شوند. اپ موبایل نتیجه بانک، پرداخت یا وضعیت مالی را خودش تولید نمی‌کند.
          </Text>
          <View style={styles.actionButtons}>
            <Pressable style={styles.outlineButton} onPress={() => router.push("/(shared)/contracts")}>
              <Text style={styles.outlineButtonText}>قراردادها</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={() => router.push("/(tenant)/payments")}>
              <Text style={styles.primaryButtonText}>پرداخت‌ها</Text>
            </Pressable>
          </View>
          {bootstrap?.latestCreditApplication ? (
            <Pressable style={styles.applicationButton} onPress={openApplicationStatus}>
              <Text style={styles.applicationButtonText}>جزئیات authoritative درخواست</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.quickTitle}>دسترسی سریع</Text>
        <View style={styles.quickRow}>
          {bootstrap?.latestCreditApplication ? (
            <Shortcut icon={figmaAssets.calculator} label="وضعیت درخواست" onPress={openApplicationStatus} />
          ) : null}
          <Shortcut icon={figmaAssets.wallet} label="دریافت و پرداخت" onPress={() => router.push("/(tenant)/payments")} />
          <Shortcut icon={figmaAssets.file} label="قراردادها" onPress={() => router.push("/(shared)/contracts")} />
          <Shortcut icon={figmaAssets.home} label="خانه" />
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            این نسخه هیچ مبلغ یا وضعیت نمونه‌ای را به‌عنوان داده واقعی نمایش نمی‌دهد.
          </Text>
          <FigmaSvg uri={figmaAssets.info} width={16} height={16} />
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <BottomItem icon={figmaAssets.user} label="حساب من" onPress={() => router.push("/(shared)/profile")} />
        <BottomItem icon={figmaAssets.fileText} label="قراردادها" onPress={() => router.push("/(shared)/contracts")} />
        <BottomItem icon={figmaAssets.creditCard} label="دریافت و پرداخت" onPress={() => router.push("/(tenant)/payments")} />
        <BottomItem icon={figmaAssets.homeActive} label="خانه" active />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  topLogo: { height: 60, alignItems: "flex-end" },
  header: { minHeight: 56, paddingHorizontal: 20, paddingVertical: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  notification: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  greeting: { flex: 1, alignItems: "flex-end", gap: 2 },
  greetingTitle: { color: colors.page, fontFamily: fonts.semibold, fontSize: 16, writingDirection: "rtl" },
  greetingNote: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, writingDirection: "rtl", textAlign: "right" },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, gap: 20 },
  errorCard: { backgroundColor: "#FEE2E2", borderRadius: radii.md, padding: 14, gap: 6 },
  errorTitle: { color: "#991B1B", fontFamily: fonts.semibold, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  errorText: { color: "#991B1B", fontFamily: fonts.regular, fontSize: 11, textAlign: "right" },
  summaryGrid: { gap: 12 },
  summaryRow: { flexDirection: "row", gap: 12 },
  summaryCard: { flex: 1, minHeight: 120, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: 14, gap: 8, alignItems: "flex-end" },
  summaryTitle: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12, textAlign: "right", writingDirection: "rtl" },
  summaryValue: { width: "100%", color: colors.primary, fontFamily: fonts.semibold, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  summaryNote: { width: "100%", color: colors.muted, fontFamily: fonts.regular, fontSize: 10, lineHeight: 16, textAlign: "right", writingDirection: "rtl" },
  actionCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 20, gap: 12 },
  actionTitle: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 16, textAlign: "right", writingDirection: "rtl" },
  actionText: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 22, textAlign: "right", writingDirection: "rtl" },
  actionButtons: { flexDirection: "row", gap: 12, marginTop: 4 },
  applicationButton: { minHeight: 44, borderRadius: radii.md, borderWidth: 1, borderColor: colors.accent, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  applicationButtonText: { color: colors.accent, fontFamily: fonts.medium, fontSize: 12, writingDirection: "rtl" },
  outlineButton: { flex: 1, height: 48, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.primary, alignItems: "center", justifyContent: "center" },
  primaryButton: { flex: 1, height: 48, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  outlineButtonText: { color: colors.primary, fontFamily: fonts.medium, fontSize: 14, writingDirection: "rtl" },
  primaryButtonText: { color: colors.surface, fontFamily: fonts.medium, fontSize: 14, writingDirection: "rtl" },
  quickTitle: { color: colors.page, fontFamily: fonts.semibold, fontSize: 16, textAlign: "right", writingDirection: "rtl" },
  quickRow: { flexDirection: "row", gap: 8 },
  shortcut: { flex: 1, minHeight: 89, backgroundColor: colors.surface, borderRadius: radii.md, paddingVertical: 12, paddingHorizontal: 4, alignItems: "center", justifyContent: "center", gap: 8 },
  shortcutIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.page, alignItems: "center", justifyContent: "center" },
  shortcutLabel: { color: colors.text, fontFamily: fonts.medium, fontSize: 11, textAlign: "center", writingDirection: "rtl" },
  notice: { backgroundColor: colors.successSoft, borderRadius: radii.sm, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  noticeText: { flex: 1, color: colors.primary, fontFamily: fonts.regular, fontSize: 11, lineHeight: 17, textAlign: "right", writingDirection: "rtl" },
  bottomNav: { height: 80, backgroundColor: colors.page, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 8, flexDirection: "row" },
  bottomItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  bottomLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "center", writingDirection: "rtl" },
  bottomLabelActive: { color: colors.accent, fontFamily: fonts.medium },
});
