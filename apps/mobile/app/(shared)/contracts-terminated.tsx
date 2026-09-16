import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { FigmaSvg } from "@/components/FigmaSvg";
import { figmaAssets } from "@/figmaAssets";
import { colors, fonts, radii } from "@/theme";

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return <View style={styles.row}><Text style={[styles.rowValue, accent && styles.accent]}>{value}</Text><Text style={styles.rowLabel}>{label}</Text></View>;
}

function NavItem({ icon, label, active, onPress }: { icon: string; label: string; active?: boolean; onPress?: () => void }) {
  return <Pressable onPress={onPress} style={styles.navItem}><FigmaSvg uri={icon} width={24} height={24} /><Text style={[styles.navLabel, active && styles.navActive]}>{label}</Text></Pressable>;
}

export default function ContractsTerminatedScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><View style={styles.titleGroup}><Text style={styles.title}>قراردادهای من</Text><Text style={styles.subtitle}>قراردادهای ثبت‌شده شما در چارخونه</Text></View><Pressable style={styles.addButton} onPress={() => router.push("/(shared)/contract-tracking")}><Text style={styles.addText}>+  ثبت قرارداد جدید</Text></Pressable></View>

        <View style={styles.card}>
          <View style={styles.badgeRow}><View style={styles.tenantBadge}><Text style={styles.tenantBadgeText}>مستأجر</Text></View><View style={styles.terminatedBadge}><Text style={styles.terminatedText}>فسخ شده</Text></View></View>
          <Text style={styles.city}>تهران، سعادت‌آباد</Text>
          <View style={styles.rows}><Row label="کد رهگیری" value="۱۲۳۴۵۶۷۸۹۰۱۲" /><Row label="مدت قرارداد" value="۱۵ مهر ۱۴۰۵ تا ۱۵ مهر ۱۴۰۶" /><Row label="اجاره ماهانه" value="۲۰٬۰۰۰٬۰۰۰ تومان" /></View>
          <View style={styles.stateBlock}><Row label="وضعیت قرارداد" value="فسخ شده" /><Row label="پرداخت جدید متوقف است" value="۳ قسط معوق" accent /></View>
          <Pressable style={styles.viewButton} onPress={() => router.push("/(tenant)/contract-detail-terminated")}><Text style={styles.viewText}>مشاهده قرارداد</Text></Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.badgeRow}><View style={styles.ownerBadge}><Text style={styles.ownerBadgeText}>مالک</Text></View><View style={styles.activeBadge}><Text style={styles.activeText}>فعال</Text></View></View>
          <Text style={styles.city}>تهران، پونک</Text>
          <View style={styles.rows}><Row label="کد رهگیری" value="۹۸۷۶۵۴۳۲۱۰۱۲" /><Row label="مدت قرارداد" value="۱ آبان ۱۴۰۵ تا ۱ آبان ۱۴۰۶" /><Row label="وضعیت قرارداد" value="فعال" /></View>
          <View style={styles.viewButton}><Text style={styles.viewText}>مشاهده قرارداد</Text></View>
        </View>

        <View style={styles.card}>
          <View style={styles.badgeRow}><View style={styles.tenantBadge}><Text style={styles.tenantBadgeText}>مستأجر</Text></View><View style={styles.reviewBadge}><Text style={styles.reviewText}>در حال بررسی</Text></View></View>
          <Text style={styles.city}>تهران، زعفرانیه</Text>
          <View style={styles.reviewNotice}><Text style={styles.reviewNoticeText}>درخواست تأمین مالی در حال بررسی است</Text></View>
          <Pressable style={styles.viewButton} onPress={() => router.push("/(tenant)/financing-under-review")}><Text style={styles.viewText}>مشاهده وضعیت</Text></Pressable>
        </View>
      </ScrollView>
      <View style={styles.bottomNav}><NavItem icon={figmaAssets.contractsUser} label="حساب من" onPress={() => router.push("/(shared)/profile")} /><NavItem icon={figmaAssets.contractsFileText} label="قراردادها" active /><NavItem icon={figmaAssets.contractsCreditCard} label="دریافت و پرداخت" onPress={() => router.push("/(tenant)/payments-terminated")} /><NavItem icon={figmaAssets.contractsHome} label="خانه" onPress={() => router.push("/(tenant)/home-terminated")} /></View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary }, scroll: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 28, gap: 16 }, header: { gap: 12, paddingTop: 12 }, titleGroup: { gap: 4, alignItems: "flex-end" }, title: { color: colors.page, fontFamily: fonts.bold, fontSize: 24, writingDirection: "rtl" }, subtitle: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, writingDirection: "rtl" },
  addButton: { height: 45, borderRadius: radii.md, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }, addText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 14, writingDirection: "rtl" }, card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 18, gap: 12 }, badgeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tenantBadge: { backgroundColor: colors.successSoft, borderRadius: radii.sm, paddingHorizontal: 12, paddingVertical: 6 }, tenantBadgeText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 12, writingDirection: "rtl" }, ownerBadge: { backgroundColor: "#E0F2FE", borderRadius: radii.sm, paddingHorizontal: 12, paddingVertical: 6 }, ownerBadgeText: { color: "#0369A1", fontFamily: fonts.semibold, fontSize: 12, writingDirection: "rtl" }, terminatedBadge: { backgroundColor: "#FEE2E2", borderRadius: radii.sm, paddingHorizontal: 12, paddingVertical: 6 }, terminatedText: { color: "#B91C1C", fontFamily: fonts.medium, fontSize: 12, writingDirection: "rtl" }, activeBadge: { backgroundColor: colors.successSoft, borderRadius: radii.sm, paddingHorizontal: 12, paddingVertical: 6 }, activeText: { color: colors.primary, fontFamily: fonts.medium, fontSize: 12, writingDirection: "rtl" }, reviewBadge: { backgroundColor: "#FFF3E0", borderRadius: radii.sm, paddingHorizontal: 12, paddingVertical: 6 }, reviewText: { color: colors.accent, fontFamily: fonts.medium, fontSize: 12, writingDirection: "rtl" },
  city: { color: colors.text, fontFamily: fonts.semibold, fontSize: 16, textAlign: "right", writingDirection: "rtl" }, rows: { gap: 8 }, row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, rowValue: { color: colors.primary, fontFamily: fonts.medium, fontSize: 13, writingDirection: "rtl" }, rowLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, textAlign: "right", writingDirection: "rtl" }, accent: { color: colors.accent, fontFamily: fonts.bold, fontSize: 14 }, stateBlock: { paddingVertical: 4, gap: 6 },
  reviewNotice: { backgroundColor: "#FEF3C7", borderRadius: radii.sm, padding: 12 }, reviewNoticeText: { color: "#B45309", fontFamily: fonts.medium, fontSize: 12, textAlign: "right", writingDirection: "rtl" }, viewButton: { minHeight: 28, alignItems: "center", justifyContent: "center" }, viewText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 13, writingDirection: "rtl" },
  bottomNav: { height: 80, backgroundColor: colors.page, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 8, flexDirection: "row" }, navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 }, navLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "center", writingDirection: "rtl" }, navActive: { color: colors.accent },
});
