import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { BrandLogo } from "@/components/BrandLogo";
import { FigmaSvg } from "@/components/FigmaSvg";
import { figmaAssets } from "@/figmaAssets";
import { colors, fonts, radii } from "@/theme";

function NavItem({ icon, label, active, onPress }: { icon: string; label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.navItem}>
      <FigmaSvg uri={icon} width={24} height={24} />
      <Text style={[styles.navLabel, active && styles.navActive]}>{label}</Text>
    </Pressable>
  );
}

export default function TenantHomeTerminatedScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.logo}><BrandLogo /></View>
      <View style={styles.header}>
        <View style={styles.notification}><FigmaSvg uri={figmaAssets.bell} width={20} height={20} /></View>
        <View style={styles.greeting}><Text style={styles.greetingTitle}>سلام، علی رضایی</Text><Text style={styles.greetingNote}>به چارخونه خوش آمدید.</Text></View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.terminationCard}>
          <View style={styles.topRow}>
            <View style={styles.terminatedBadge}><Text style={styles.terminatedBadgeText}>فسخ شده</Text></View>
            <View style={styles.alertIcon}><Text style={styles.alertIconText}>!</Text></View>
          </View>
          <Text style={styles.terminationTitle}>قرارداد شما فسخ شده است</Text>
          <Text style={styles.terminationText}>این قرارداد در چارخونه فسخ شده است. وضعیت مالی و تسویه مرتبط با قرارداد از بخش دریافت و پرداخت قابل مشاهده است.</Text>
          <View style={styles.overdueBadge}><Text style={styles.overdueText}>۳ قسط معوق</Text></View>
          <Pressable style={styles.primaryAction} onPress={() => router.push("/(tenant)/contract-detail-terminated")}><Text style={styles.primaryActionText}>مشاهده وضعیت قرارداد</Text></Pressable>
          <Pressable style={styles.secondaryAction} onPress={() => router.push("/(tenant)/payments-terminated")}><Text style={styles.secondaryActionText}>دریافت و پرداخت</Text></Pressable>
        </View>
      </ScrollView>
      <View style={styles.bottomNav}>
        <NavItem icon={figmaAssets.user} label="حساب من" onPress={() => router.push("/(shared)/profile")} />
        <NavItem icon={figmaAssets.fileText} label="قراردادها" onPress={() => router.push("/(shared)/contracts-terminated")} />
        <NavItem icon={figmaAssets.creditCard} label="دریافت و پرداخت" onPress={() => router.push("/(tenant)/payments-terminated")} />
        <NavItem icon={figmaAssets.homeActive} label="خانه" active />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  logo: { height: 60, alignItems: "flex-end" },
  header: { height: 56, paddingHorizontal: 20, paddingVertical: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  notification: { width: 40, height: 40, borderRadius: radii.md, alignItems: "center", justifyContent: "center" },
  greeting: { alignItems: "flex-end", gap: 2 },
  greetingTitle: { color: colors.page, fontFamily: fonts.semibold, fontSize: 16, writingDirection: "rtl" },
  greetingNote: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, writingDirection: "rtl" },
  scroll: { flexGrow: 1, paddingTop: 20 },
  terminationCard: { width: "100%", backgroundColor: "#FAF2F2", borderRadius: radii.md, padding: 20, gap: 12 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  terminatedBadge: { backgroundColor: "#F5EDED", borderRadius: radii.sm, paddingHorizontal: 10, paddingVertical: 4 },
  terminatedBadgeText: { color: "#8C4D4D", fontFamily: fonts.medium, fontSize: 11, writingDirection: "rtl" },
  alertIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(92,59,59,0.08)", alignItems: "center", justifyContent: "center" },
  alertIconText: { color: "#5C3B3B", fontFamily: fonts.bold, fontSize: 16 },
  terminationTitle: { width: "100%", color: "#5C3B3B", fontFamily: fonts.semibold, fontSize: 14, textAlign: "right", writingDirection: "rtl" },
  terminationText: { width: "100%", color: "#4D4747", fontFamily: fonts.regular, fontSize: 12, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
  overdueBadge: { alignSelf: "flex-start", backgroundColor: "#F2F2F2", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  overdueText: { color: "#4D4747", fontFamily: fonts.medium, fontSize: 11, writingDirection: "rtl" },
  primaryAction: { width: "100%", minHeight: 40, borderRadius: 10, backgroundColor: "#5C3B3B", alignItems: "center", justifyContent: "center", paddingHorizontal: 20, paddingVertical: 10 },
  primaryActionText: { color: colors.surface, fontFamily: fonts.medium, fontSize: 13, writingDirection: "rtl" },
  secondaryAction: { width: "100%", minHeight: 100, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, paddingVertical: 8 },
  secondaryActionText: { color: "#40738C", fontFamily: fonts.medium, fontSize: 14, writingDirection: "rtl" },
  bottomNav: { height: 80, backgroundColor: colors.page, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 8, flexDirection: "row" },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  navLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "center", writingDirection: "rtl" },
  navActive: { color: colors.accent, fontFamily: fonts.medium },
});
