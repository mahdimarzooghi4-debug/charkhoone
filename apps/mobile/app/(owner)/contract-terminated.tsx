import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppHeader } from "@/components/AppHeader";
import { OwnerBottomNav, OwnerCard, OwnerRow, OwnerRows } from "@/components/OwnerUi";
import { colors, fonts } from "@/theme";

export default function OwnerContractTerminatedScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="وضعیت قرارداد" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.badgeRow}>
            <View style={styles.dangerBadge}><Text style={styles.dangerBadgeText}>فسخ شده</Text></View>
            <View style={styles.ownerBadge}><Text style={styles.ownerBadgeText}>مالک</Text></View>
          </View>
          <Text style={styles.heroTitle}>قرارداد فسخ شده است</Text>
          <Text style={styles.heroDescription}>این قرارداد به‌دلیل ۳ قسط معوق مستأجر در چارخونه فسخ شده است.</Text>
        </View>

        <View style={styles.notification}><Text style={styles.notificationText}>تسویه مالی مرتبط با این قرارداد از طریق چارخونه انجام می‌شود و نیازی به دریافت مستقیم وجه از مستأجر نیست.</Text></View>

        <View style={styles.content}>
          <OwnerCard title="اطلاعات قرارداد" style={styles.card}>
            <OwnerRows>
              <OwnerRow label="ملک" value="قرارداد سعادت‌آباد" labelStyle={styles.rowLabel} valueStyle={styles.rowValue} />
              <OwnerRow label="وضعیت قرارداد" value="فسخ شده" labelStyle={styles.rowLabel} valueStyle={styles.dangerValue} />
              <OwnerRow label="تعداد اقساط معوق" value="۳ قسط" labelStyle={styles.rowLabel} valueStyle={styles.rowValue} />
              <OwnerRow label="اجاره ماهانه قرارداد" value="۲۰٬۰۰۰٬۰۰۰ تومان" labelStyle={styles.rowLabel} valueStyle={styles.rowValue} />
            </OwnerRows>
          </OwnerCard>

          <OwnerCard title="وضعیت تسویه نهایی" style={styles.card}>
            <View style={styles.statusRow}>
              <View style={styles.readyBadge}><Text style={styles.readyBadgeText}>آماده تسویه</Text></View>
              <Text style={styles.rowLabel}>وضعیت</Text>
            </View>
            <OwnerRows>
              <OwnerRow label="بدهی معوق مستأجر" value="۵۵٬۵۰۰٬۰۰۰ تومان" labelStyle={styles.rowLabel} valueStyle={styles.rowValue} />
              <OwnerRow label="مبلغ کسرشده از آورده مستأجر" value="۵۵٬۵۰۰٬۰۰۰ تومان" labelStyle={styles.rowLabel} valueStyle={styles.rowValue} />
              <OwnerRow label="مبلغ قابل تسویه به مالک" value="۳۹۴٬۵۰۰٬۰۰۰ تومان" labelStyle={styles.rowLabel} valueStyle={styles.rowValue} />
            </OwnerRows>
          </OwnerCard>

          <OwnerCard title="روش دریافت" style={styles.card}>
            <OwnerRows><OwnerRow label="روش تسویه" value="دریافت ماهانه" labelStyle={styles.rowLabel} valueStyle={styles.rowValue} /></OwnerRows>
          </OwnerCard>
        </View>

        <View style={styles.actions}>
          <Pressable accessibilityRole="button" style={styles.primaryAction} onPress={() => router.push("/(owner)/receive-pay")}>
            <Text style={styles.primaryActionText}>مشاهده جزئیات تسویه</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.historyAction} onPress={() => router.push("/(owner)/receive-pay")}>
            <Text style={styles.historyActionText}>مشاهده سوابق دریافت و پرداخت</Text>
          </Pressable>
        </View>
      </ScrollView>
      <OwnerBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { paddingBottom: 0 },
  hero: { backgroundColor: "#FAF0ED", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, gap: 12, alignItems: "flex-end" },
  badgeRow: { width: "100%", height: 43, flexDirection: "row", gap: 8, alignItems: "flex-start", justifyContent: "flex-end" },
  dangerBadge: { height: 31, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "#F2D9D9", justifyContent: "center" },
  dangerBadgeText: { color: "#B23333", fontFamily: fonts.medium, fontSize: 13, writingDirection: "rtl" },
  ownerBadge: { height: 31, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "#E5F0F7", justifyContent: "center" },
  ownerBadgeText: { color: "#33598C", fontFamily: fonts.medium, fontSize: 13, writingDirection: "rtl" },
  heroTitle: { width: "100%", color: colors.primary, fontFamily: fonts.bold, fontSize: 20, textAlign: "right", writingDirection: "rtl" },
  heroDescription: { width: "100%", color: colors.primary, fontFamily: fonts.regular, fontSize: 14, lineHeight: 24, textAlign: "right", writingDirection: "rtl" },
  notification: { marginHorizontal: 16, marginTop: 12, backgroundColor: "#EDF5FA", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  notificationText: { color: "#334D73", fontFamily: fonts.regular, fontSize: 13, lineHeight: 24, textAlign: "right", writingDirection: "rtl" },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20, gap: 16 },
  card: { padding: 17 },
  rowLabel: { color: "#666666", fontFamily: fonts.regular, fontSize: 13 },
  rowValue: { color: "#212121", fontFamily: fonts.regular, fontSize: 13 },
  dangerValue: { color: "#B23333", fontFamily: fonts.regular, fontSize: 13 },
  statusRow: { minHeight: 30, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  readyBadge: { height: 30, borderRadius: 6, backgroundColor: "#F5F0DE", paddingHorizontal: 10, paddingVertical: 4, justifyContent: "center" },
  readyBadgeText: { color: "#8C7326", fontFamily: fonts.regular, fontSize: 13, writingDirection: "rtl" },
  actions: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16 },
  primaryAction: { height: 100, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  primaryActionText: { color: colors.surface, fontFamily: fonts.regular, fontSize: 14, textAlign: "center", writingDirection: "rtl" },
  historyAction: { height: 100, alignItems: "center", justifyContent: "center" },
  historyActionText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 14, textAlign: "center", writingDirection: "rtl" },
});
