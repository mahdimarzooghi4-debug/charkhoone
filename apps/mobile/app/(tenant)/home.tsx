import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { BrandLogo } from "@/components/BrandLogo";
import { figmaAssets } from "@/figmaAssets";
import { colors, fonts, radii } from "@/theme";

function SummaryCard({ title, value, note, valueSize = 14 }: { title: string; value: string; note: string; valueSize?: number }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>{title}</Text>
      <Text style={[styles.summaryValue, { fontSize: valueSize }]}>{value}</Text>
      <Text style={styles.summaryNote}>{note}</Text>
    </View>
  );
}

function Shortcut({ icon, label, onPress }: { icon: string; label: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.shortcut} onPress={onPress}>
      <View style={styles.shortcutIconWrap}><Image source={{ uri: icon }} style={styles.shortcutIcon} /></View>
      <Text style={styles.shortcutLabel}>{label}</Text>
    </Pressable>
  );
}

function BottomItem({ icon, label, active }: { icon: string; label: string; active?: boolean }) {
  return (
    <View style={styles.bottomItem}>
      <Image source={{ uri: icon }} style={styles.bottomIcon} />
      <Text style={[styles.bottomLabel, active && styles.bottomLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TenantHomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topLogo}><BrandLogo /></View>
      <View style={styles.header}>
        <View style={styles.notification}><Image source={{ uri: figmaAssets.bell }} style={styles.notificationIcon} /></View>
        <View style={styles.greeting}>
          <Text style={styles.greetingTitle}>سلام، علی رضایی</Text>
          <Text style={styles.greetingNote}>به چارخونه خوش آمدید.</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryRow}>
            <SummaryCard title="میزان قابل تأمین" value="هنوز محاسبه نشده" note="از ماشین حساب استفاده کنید" />
            <SummaryCard title="اعتبار شما" value="در حال ارزیابی" note="براساس سابقه شما" valueSize={16} />
          </View>
          <View style={styles.summaryRow}>
            <SummaryCard title="وضعیت قرارداد" value="ثبت نشده" note="هنوز قرارداد خودنویس ثبت نشده است" />
            <SummaryCard title="پرداخت بعدی" value="در حال حاضر پرداختی ندارید" note="پس از فعال‌شدن قرارداد نمایش داده می‌شود" valueSize={12} />
          </View>
        </View>

        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>اقدام بعدی شما</Text>
          <Text style={styles.actionText}>برای شروع، شرایط تأمین مالی را محاسبه کنید یا در صورت داشتن قرارداد خودنویس، کد رهگیری آن را ثبت کنید.</Text>
          <View style={styles.actionButtons}>
            <Pressable style={styles.outlineButton} onPress={() => router.push("/(shared)/contract-tracking")}><Text style={styles.outlineButtonText}>ثبت کد رهگیری</Text></Pressable>
            <Pressable style={styles.primaryButton} onPress={() => router.push("/(tenant)/calculator")}><Text style={styles.primaryButtonText}>محاسبه شرایط</Text></Pressable>
          </View>
        </View>

        <Text style={styles.quickTitle}>دسترسی سریع</Text>
        <View style={styles.quickRow}>
          <Shortcut icon={figmaAssets.calculator} label="ماشین‌حساب" onPress={() => router.push("/(tenant)/calculator")} />
          <Shortcut icon={figmaAssets.wallet} label="دریافت و پرداخت" />
          <Shortcut icon={figmaAssets.file} label="قراردادها" />
          <Shortcut icon={figmaAssets.home} label="املاک من" />
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>درخواست شما پس از تکمیل مراحل برای بررسی به بانک ارسال می‌شود.</Text>
          <Image source={{ uri: figmaAssets.info }} style={styles.infoIcon} />
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <BottomItem icon={figmaAssets.user} label="حساب من" />
        <BottomItem icon={figmaAssets.fileText} label="قراردادها" />
        <BottomItem icon={figmaAssets.creditCard} label="دریافت و پرداخت" />
        <BottomItem icon={figmaAssets.homeActive} label="خانه" active />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  topLogo: { height: 60, alignItems: "flex-end" },
  header: { height: 56, paddingHorizontal: 20, paddingVertical: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  notification: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  notificationIcon: { width: 20, height: 20 },
  greeting: { alignItems: "flex-end", gap: 2 },
  greetingTitle: { color: colors.page, fontFamily: fonts.semibold, fontSize: 16, writingDirection: "rtl" },
  greetingNote: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, writingDirection: "rtl" },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, gap: 20 },
  summaryGrid: { gap: 12 },
  summaryRow: { flexDirection: "row", gap: 12 },
  summaryCard: { flex: 1, minHeight: 109, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: 16, gap: 8, alignItems: "flex-end" },
  summaryTitle: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12, textAlign: "right", writingDirection: "rtl" },
  summaryValue: { width: "100%", color: colors.primary, fontFamily: fonts.regular, textAlign: "right", writingDirection: "rtl" },
  summaryNote: { width: "100%", color: colors.muted, fontFamily: fonts.regular, fontSize: 11, lineHeight: 17, textAlign: "right", writingDirection: "rtl" },
  actionCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 20, gap: 12 },
  actionTitle: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 16, textAlign: "right", writingDirection: "rtl" },
  actionText: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 22, textAlign: "right", writingDirection: "rtl" },
  actionButtons: { flexDirection: "row", gap: 12, marginTop: 4 },
  outlineButton: { flex: 1, height: 48, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.primary, alignItems: "center", justifyContent: "center" },
  primaryButton: { flex: 1, height: 48, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  outlineButtonText: { color: colors.primary, fontFamily: fonts.medium, fontSize: 14, writingDirection: "rtl" },
  primaryButtonText: { color: colors.surface, fontFamily: fonts.medium, fontSize: 14, writingDirection: "rtl" },
  quickTitle: { color: colors.page, fontFamily: fonts.semibold, fontSize: 16, textAlign: "right", writingDirection: "rtl" },
  quickRow: { flexDirection: "row", gap: 8 },
  shortcut: { flex: 1, minHeight: 89, backgroundColor: colors.surface, borderRadius: radii.md, paddingVertical: 12, paddingHorizontal: 4, alignItems: "center", justifyContent: "center", gap: 8 },
  shortcutIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.page, alignItems: "center", justifyContent: "center" },
  shortcutIcon: { width: 20, height: 20 },
  shortcutLabel: { color: colors.text, fontFamily: fonts.medium, fontSize: 11, textAlign: "center", writingDirection: "rtl" },
  notice: { backgroundColor: colors.successSoft, borderRadius: radii.sm, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  noticeText: { flex: 1, color: colors.primary, fontFamily: fonts.regular, fontSize: 11, lineHeight: 17, textAlign: "right", writingDirection: "rtl" },
  infoIcon: { width: 16, height: 16 },
  bottomNav: { height: 80, backgroundColor: colors.page, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 8, flexDirection: "row" },
  bottomItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  bottomIcon: { width: 24, height: 24 },
  bottomLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "center", writingDirection: "rtl" },
  bottomLabelActive: { color: colors.accent, fontFamily: fonts.medium },
});
