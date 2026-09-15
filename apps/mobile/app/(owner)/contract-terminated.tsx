import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { OwnerBadge, OwnerBottomNav, OwnerCard, OwnerRow } from "@/components/OwnerUi";
import { colors, fonts, radii } from "@/theme";

export default function OwnerContractTerminatedScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="وضعیت قرارداد" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.badges}><OwnerBadge tone="danger">فسخ شده</OwnerBadge><OwnerBadge tone="owner">مالک</OwnerBadge></View>
          <Text style={styles.heroTitle}>قرارداد فسخ شده است</Text>
          <Text style={styles.heroDescription}>این قرارداد به‌دلیل ۳ قسط معوق مستأجر در چارخونه فسخ شده است.</Text>
        </View>

        <View style={styles.notification}><Text style={styles.notificationText}>تسویه مالی مرتبط با این قرارداد از طریق چارخونه انجام می‌شود و نیازی به دریافت مستقیم وجه از مستأجر نیست.</Text></View>

        <View style={styles.content}>
          <OwnerCard title="اطلاعات قرارداد">
            <OwnerRow label="ملک" value="قرارداد سعادت‌آباد" />
            <OwnerRow label="وضعیت قرارداد" value="فسخ شده" valueStyle={styles.dangerText} />
            <OwnerRow label="تعداد اقساط معوق" value="۳ قسط" />
            <OwnerRow label="اجاره ماهانه قرارداد" value="۲۰٬۰۰۰٬۰۰۰ تومان" />
          </OwnerCard>

          <OwnerCard title="وضعیت تسویه نهایی">
            <View style={styles.statusRow}><OwnerBadge tone="warning">آماده تسویه</OwnerBadge><Text style={styles.rowLabel}>وضعیت</Text></View>
            <OwnerRow label="بدهی معوق مستأجر" value="۵۵٬۵۰۰٬۰۰۰ تومان" />
            <OwnerRow label="مبلغ کسرشده از آورده مستأجر" value="۵۵٬۵۰۰٬۰۰۰ تومان" />
            <OwnerRow label="مبلغ قابل تسویه به مالک" value="۳۹۴٬۵۰۰٬۰۰۰ تومان" />
          </OwnerCard>

          <OwnerCard title="روش دریافت"><OwnerRow label="روش تسویه" value="دریافت ماهانه" /></OwnerCard>

          <View style={styles.actions}>
            <AppButton variant="primary" onPress={() => router.push("/(owner)/receive-pay")}>مشاهده جزئیات تسویه</AppButton>
            <AppButton variant="primary" onPress={() => router.push("/(owner)/receive-pay")}>مشاهده سوابق دریافت و پرداخت</AppButton>
          </View>
        </View>
      </ScrollView>
      <OwnerBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { paddingBottom: 20 },
  hero: { backgroundColor: "#FAF0ED", paddingHorizontal: 20, paddingVertical: 20, gap: 12, alignItems: "flex-end" },
  badges: { flexDirection: "row", gap: 8, alignSelf: "flex-end" },
  heroTitle: { width: "100%", color: colors.primary, fontFamily: fonts.bold, fontSize: 20, textAlign: "right", writingDirection: "rtl" },
  heroDescription: { width: "100%", color: colors.primary, fontFamily: fonts.regular, fontSize: 14, lineHeight: 24, textAlign: "right", writingDirection: "rtl" },
  notification: { marginHorizontal: 16, marginTop: 12, backgroundColor: "#EDF5FA", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  notificationText: { color: "#334D73", fontFamily: fonts.regular, fontSize: 13, lineHeight: 24, textAlign: "right", writingDirection: "rtl" },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  dangerText: { color: "#B23333" },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowLabel: { color: "#666", fontFamily: fonts.regular, fontSize: 13, writingDirection: "rtl" },
  actions: { gap: 8, paddingBottom: 4 },
});
