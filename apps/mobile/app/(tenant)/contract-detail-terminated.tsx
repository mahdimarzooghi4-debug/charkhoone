import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { FigmaSvg } from "@/components/FigmaSvg";
import { figmaAssets } from "@/figmaAssets";
import { colors, fonts, radii } from "@/theme";

function DataRow({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return <View style={styles.dataRow}><Text style={[styles.dataValue, danger && styles.danger]}>{value}</Text><Text style={styles.dataLabel}>{label}</Text></View>;
}

function NavItem({ icon, label, active, onPress }: { icon: string; label: string; active?: boolean; onPress?: () => void }) {
  return <Pressable onPress={onPress} style={styles.navItem}><FigmaSvg uri={icon} width={24} height={24} /><Text style={[styles.navLabel, active && styles.navActive]}>{label}</Text></Pressable>;
}

export default function ContractDetailTerminatedScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="وضعیت قرارداد" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.badgeRow}><View style={styles.terminatedBadge}><Text style={styles.terminatedBadgeText}>فسخ شده</Text></View><View style={styles.tenantBadge}><Text style={styles.tenantBadgeText}>مستأجر</Text></View></View>
          <Text style={styles.heroTitle}>قرارداد شما فسخ شده است</Text>
          <Text style={styles.heroText}>این قرارداد به‌دلیل ۳ قسط معوق فسخ شده است. وضعیت مالی آن از بخش دریافت و پرداخت قابل مشاهده است.</Text>
        </View>
        <View style={styles.infoNotice}><Text style={styles.infoNoticeText}>پرداخت جدیدی برای این قرارداد در دسترس نیست. تسویه مالی قرارداد از طریق چارخونه انجام می‌شود و مبالغ نهایی پس از محاسبه نمایش داده می‌شوند.</Text></View>
        <View style={styles.card}><Text style={styles.cardTitle}>اطلاعات قرارداد</Text><View style={styles.rows}><DataRow label="ملک" value="قرارداد سعادت‌آباد" /><DataRow label="وضعیت قرارداد" value="فسخ شده" danger /><DataRow label="تعداد اقساط معوق" value="۳ قسط" /><DataRow label="کد رهگیری" value="۱۲۳۴۵۶۷۸۹۰۱۲" /></View></View>
        <View style={styles.card}><Text style={styles.cardTitle}>وضعیت تسویه نهایی</Text><View style={styles.statusRow}><View style={styles.calculatingBadge}><Text style={styles.calculatingText}>در حال محاسبه</Text></View><Text style={styles.dataLabel}>وضعیت</Text></View><View style={styles.rows}><DataRow label="جمع بدهی معوق" value="در حال محاسبه" /><DataRow label="مبلغ کسرشده از آورده" value="در حال محاسبه" /><DataRow label="مانده نهایی آورده" value="در حال محاسبه" /></View></View>
        <View style={styles.card}><Text style={styles.cardTitle}>وضعیت تأمین مالی</Text><View style={styles.rows}><DataRow label="پرداخت‌های ماهانه" value="متوقف شده" /></View></View>
        <View style={styles.actions}><AppButton onPress={() => router.push("/(tenant)/payments-terminated")}>مشاهده وضعیت تسویه</AppButton><AppButton variant="outline" onPress={() => router.replace("/(shared)/contracts-terminated")}>بازگشت به قراردادها</AppButton><View style={styles.disabledAction}><Text style={styles.disabledActionText}>پرداخت جدیدی در دسترس نیست</Text></View></View>
      </ScrollView>
      <View style={styles.bottomNav}><NavItem icon={figmaAssets.contractsUser} label="حساب من" onPress={() => router.push("/(shared)/profile")} /><NavItem icon={figmaAssets.contractsFileText} label="قراردادها" onPress={() => router.push("/(shared)/contracts-terminated")} /><NavItem icon={figmaAssets.contractsCreditCard} label="دریافت و پرداخت" active onPress={() => router.push("/(tenant)/payments-terminated")} /><NavItem icon={figmaAssets.contractsHome} label="خانه" onPress={() => router.push("/(tenant)/home-terminated")} /></View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary }, scroll: { paddingBottom: 20 }, hero: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, gap: 12 }, badgeRow: { minHeight: 43, flexDirection: "row", gap: 8, justifyContent: "flex-end", alignItems: "flex-start" },
  terminatedBadge: { height: 31, borderRadius: 6, backgroundColor: "#F2D9D9", paddingHorizontal: 10, paddingVertical: 4, justifyContent: "center" }, terminatedBadgeText: { color: "#B23333", fontFamily: fonts.medium, fontSize: 13, writingDirection: "rtl" }, tenantBadge: { height: 31, borderRadius: 6, backgroundColor: "#E5F0F7", paddingHorizontal: 10, paddingVertical: 4, justifyContent: "center" }, tenantBadgeText: { color: "#33598C", fontFamily: fonts.medium, fontSize: 13, writingDirection: "rtl" },
  heroTitle: { width: "100%", color: colors.surface, fontFamily: fonts.bold, fontSize: 20, textAlign: "right", writingDirection: "rtl" }, heroText: { width: "100%", color: colors.surface, fontFamily: fonts.regular, fontSize: 14, lineHeight: 24, textAlign: "right", writingDirection: "rtl" },
  infoNotice: { marginHorizontal: 16, minHeight: 100, borderRadius: 10, backgroundColor: "#EDF5FA", paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 }, infoNoticeText: { color: "#334D73", fontFamily: fonts.regular, fontSize: 13, lineHeight: 24, textAlign: "right", writingDirection: "rtl" },
  card: { marginHorizontal: 16, marginTop: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 17, gap: 12 }, cardTitle: { width: "100%", color: colors.text, fontFamily: fonts.semibold, fontSize: 15, textAlign: "right", writingDirection: "rtl" }, rows: { gap: 10 },
  dataRow: { minHeight: 20, flexDirection: "row", alignItems: "flex-start" }, dataValue: { color: "#212121", fontFamily: fonts.regular, fontSize: 13, writingDirection: "rtl" }, danger: { color: "#B23333" }, dataLabel: { flex: 1, color: "#666666", fontFamily: fonts.regular, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  statusRow: { minHeight: 51, flexDirection: "row", alignItems: "center", paddingTop: 12 }, calculatingBadge: { minHeight: 30, borderRadius: 6, backgroundColor: "#FFF6DE", paddingHorizontal: 10, paddingVertical: 4, justifyContent: "center" }, calculatingText: { color: "#926012", fontFamily: fonts.regular, fontSize: 13, writingDirection: "rtl" },
  actions: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, gap: 12 }, disabledAction: { height: 52, borderRadius: 10, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", paddingVertical: 6 }, disabledActionText: { color: colors.page, fontFamily: fonts.regular, fontSize: 13, writingDirection: "rtl" },
  bottomNav: { height: 58, backgroundColor: colors.page, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 8, flexDirection: "row" }, navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 }, navLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "center", writingDirection: "rtl" }, navActive: { color: colors.accent },
});
