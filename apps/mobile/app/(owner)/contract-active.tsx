import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMobileBootstrap } from "@/api/useMobileBootstrap";
import { formatRial } from "@/api/mobileApi";
import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { colors, fonts, radii } from "@/theme";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text selectable style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export default function OwnerContractsScreen() {
  const router = useRouter();
  const { contractId } = useLocalSearchParams<{ contractId?: string }>();
  const { status, data, error, loading } = useMobileBootstrap();

  useEffect(() => {
    if (status === "unauthenticated" || status === "config-error") {
      router.replace("/(auth)/login");
    }
  }, [router, status]);

  if (status !== "authenticated") return null;

  // A direct link supplies only an identifier, never authority or an outcome.
  // The matching persisted contract must still have the Owner role for this OIDC user.
  const ownedContracts = data?.contracts.filter((contract) => contract.role === "Owner") ?? [];
  const visibleContracts = contractId
    ? ownedContracts.filter((contract) => contract.contractId === contractId)
    : ownedContracts;

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="قراردادهای مالک" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.notice}>
          <Text style={styles.body}>
            وضعیت قرارداد و شرایط اجاره فقط از قراردادهای متعلق به حساب احراز هویت‌شده و snapshot ثبت‌شده خوانده می‌شوند.
            این صفحه نتیجهٔ تسویه، مبلغ دریافتی یا تأیید مالک را استنباط نمی‌کند.
          </Text>
        </View>

        {loading ? <Text style={styles.state}>در حال دریافت قراردادهای مالک...</Text> : null}
        {error ? <Text style={styles.error}>دریافت قراردادها ناموفق بود: {error}</Text> : null}
        {!loading && !error && data && visibleContracts.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.heading}>قرارداد مالک برای این حساب یافت نشد</Text>
            <Text style={styles.body}>هیچ قرارداد یا شرایط نمونه‌ای نمایش داده نمی‌شود.</Text>
          </View>
        ) : null}

        {!loading && !error ? visibleContracts.map((contract) => {
          const terms = contract.terms;
          return (
            <View key={contract.contractId} style={styles.card}>
              <Text style={styles.heading}>قرارداد مالک</Text>
              <Row label="شناسه قرارداد" value={contract.contractId} />
              <Row label="وضعیت persisted" value={contract.status} />
              {terms ? (
                terms.calendar === "Persian" ? (
                  <>
                    <Row label="تاریخ شروع فارسی" value={
                      `${terms.persianStartYear.toLocaleString("fa-IR", { useGrouping: false })}/${terms.persianStartMonth.toLocaleString("fa-IR", { minimumIntegerDigits: 2, useGrouping: false })}/${terms.persianStartDay.toLocaleString("fa-IR", { minimumIntegerDigits: 2, useGrouping: false })}`
                    } />
                    <Row label="مدت قرارداد" value={`${terms.termMonths.toLocaleString("fa-IR")} ماه`} />
                    <Row label="رهن نقدی" value={formatRial(terms.cashDepositRial)} />
                    <Row label="اجاره ماهانه" value={contract.monthlyRentRial === null ? "ثبت نشده" : formatRial(contract.monthlyRentRial)} />
                    <Row label="معادل کامل رهن" value={formatRial(terms.fullDepositEquivalentRial)} />
                  </>
                ) : (
                  <Text style={styles.body}>تقویم snapshot با قرارداد فارسی سازگار نیست؛ اطلاعات تاریخ/مبلغ اینجا نمایش داده نمی‌شود.</Text>
                )
              ) : (
                <Text style={styles.body}>شرایط معتبر اجاره برای این قرارداد هنوز ثبت نشده است.</Text>
              )}
            </View>
          );
        }) : null}

        <AppButton onPress={() => router.replace("/(shared)/contracts")}>بازگشت به قراردادهای من</AppButton>
        <AppButton variant="outline" onPress={() => router.replace("/(shared)/profile")}>حساب من</AppButton>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  content: { padding: 16, paddingBottom: 32, gap: 12 },
  notice: { backgroundColor: colors.successSoft, borderRadius: radii.md, padding: 14 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 16, gap: 12 },
  heading: { color: colors.primary, fontFamily: fonts.bold, fontSize: 15, textAlign: "right", writingDirection: "rtl" },
  body: { color: colors.text, fontFamily: fonts.regular, fontSize: 12, lineHeight: 22, textAlign: "right", writingDirection: "rtl" },
  state: { color: colors.muted, fontFamily: fonts.medium, fontSize: 12, textAlign: "right", writingDirection: "rtl" },
  error: { color: "#FCA5A5", fontFamily: fonts.medium, fontSize: 12, textAlign: "right", writingDirection: "rtl" },
  row: { minHeight: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  label: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "right", writingDirection: "rtl" },
  value: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 12, textAlign: "left" },
});
