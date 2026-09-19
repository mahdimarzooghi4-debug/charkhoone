import { useEffect } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { formatRial } from "@/api/mobileApi";
import { useMobileBootstrap } from "@/api/useMobileBootstrap";
import { colors, fonts, radii } from "@/theme";

export default function ContractsOverviewScreen() {
  const router = useRouter();
  const { status, data, error, loading } = useMobileBootstrap();

  useEffect(() => {
    if (status === "unauthenticated" || status === "config-error") {
      router.replace("/(auth)/login");
    }
  }, [router, status]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerArea}>
          <Text style={styles.title}>قراردادهای من</Text>
          <Text style={styles.subtitle}>
            فقط قراردادهایی که backend برای subject احراز هویت‌شده قابل دسترسی می‌داند.
          </Text>
        </View>

        {loading ? <Text style={styles.stateText}>در حال دریافت قراردادها...</Text> : null}
        {error ? <Text style={styles.errorText}>دریافت قراردادها ناموفق بود: {error}</Text> : null}

        {!loading && !error && data?.contracts.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>قراردادی ثبت نشده است</Text>
            <Text style={styles.stateText}>هیچ قرارداد نمونه یا ساختگی نمایش داده نمی‌شود.</Text>
          </View>
        ) : null}

        {data?.contracts.map((contract) => (
          <View key={contract.contractId} style={styles.card}>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{contract.role === "Tenant" ? "مستأجر" : "مالک"}</Text>
              </View>
              <Text style={styles.status}>{contract.status}</Text>
            </View>

            <View style={styles.row}>
              <Text selectable style={styles.id}>{contract.contractId}</Text>
              <Text style={styles.label}>شناسه قرارداد</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.value}>
                {contract.monthlyRentRial ? formatRial(contract.monthlyRentRial) : "ثبت نشده"}
              </Text>
              <Text style={styles.label}>اجاره ماهانه persisted</Text>
            </View>

            {contract.role === "Owner" ? (
              <Pressable
                accessibilityRole="button"
                style={styles.ownerLink}
                onPress={() => router.push({
                  pathname: "/(owner)/contract-active",
                  params: { contractId: contract.contractId },
                })}
              >
                <Text style={styles.ownerLinkText}>مشاهده شرایط معتبر قرارداد مالک</Text>
              </Pressable>
            ) : null}
            <Text style={styles.note}>
              اطلاعات ملک، شهر یا کد رهگیری تا زمانی که read-model واقعی آن‌ها به mobile API اضافه نشود در این صفحه ساخته نمی‌شود.
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { paddingHorizontal: 16, paddingTop: 48, paddingBottom: 32, gap: 14 },
  headerArea: { gap: 6, alignItems: "flex-end", marginBottom: 8 },
  title: { color: colors.page, fontFamily: fonts.bold, fontSize: 22, textAlign: "right", writingDirection: "rtl" },
  subtitle: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
  stateText: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 19, textAlign: "right", writingDirection: "rtl" },
  errorText: { color: "#FCA5A5", fontFamily: fonts.medium, fontSize: 12, lineHeight: 19, textAlign: "right", writingDirection: "rtl" },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 16, gap: 12 },
  cardTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15, textAlign: "right", writingDirection: "rtl" },
  badgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge: { backgroundColor: colors.successSoft, borderRadius: radii.sm, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 11, writingDirection: "rtl" },
  status: { color: colors.text, fontFamily: fonts.semibold, fontSize: 13 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  label: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "right", writingDirection: "rtl" },
  value: { flex: 1, color: colors.primary, fontFamily: fonts.medium, fontSize: 12, textAlign: "left" },
  id: { flex: 1, color: colors.muted, fontFamily: fonts.regular, fontSize: 9, textAlign: "left" },
  ownerLink: { backgroundColor: colors.successSoft, padding: 12, borderRadius: radii.md, alignItems: "center" },
  ownerLinkText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 12, writingDirection: "rtl" },
  note: { color: colors.muted, fontFamily: fonts.regular, fontSize: 10, lineHeight: 17, textAlign: "right", writingDirection: "rtl" },
});
