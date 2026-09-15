import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { FigmaSvg } from "@/components/FigmaSvg";
import { figmaAssets } from "@/figmaAssets";
import { colors, fonts, radii } from "@/theme";

function Row({ label, value, action }: { label: string; value?: string; action?: string }) {
  return (
    <View style={styles.row}>
      {action ? <Text style={styles.action}>{action}</Text> : <Text style={styles.value}>{value}</Text>}
      <View style={styles.rowInfo}><Text style={styles.rowLabel}>{label}</Text>{value && action ? <Text style={styles.rowSub}>{value}</Text> : null}</View>
    </View>
  );
}

function NavItem({ icon, label, active, onPress }: { icon: string; label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.navItem}>
      <FigmaSvg uri={icon} width={24} height={24} />
      <Text style={[styles.navLabel, active && styles.navActive]}>{label}</Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>حساب من</Text>
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}><Text style={styles.avatarText}>عر</Text></View>
            <View style={styles.cameraBadge}><FigmaSvg uri={figmaAssets.profileCamera} width={12} height={12} /></View>
          </View>
          <Text style={styles.name}>علی رضایی</Text>
          <Text style={styles.phone}>۰۹۱۲•••••۶۷</Text>
          <Text style={styles.changePhoto}>تغییر تصویر</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>اطلاعات حساب</Text>
          <View style={styles.simpleRow}><Text style={styles.valueMuted}>علی رضایی</Text><Text style={styles.rowLabel}>نام و نام خانوادگی</Text></View>
          <View style={styles.simpleRow}><Text style={styles.valueMuted}>۰۰۱•••••۷۸۹</Text><Text style={styles.rowLabel}>کد ملی</Text></View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>عضویت چارخونه</Text>
          <View style={styles.simpleRow}><View style={styles.activeMembership}><Text style={styles.activeMembershipText}>فعال</Text></View><Text style={styles.rowLabel}>وضعیت</Text></View>
          <View style={styles.simpleRow}><Text style={styles.valueMuted}>۵۰۰٬۰۰۰٬۰۰۰ تومان</Text><Text style={styles.rowLabel}>سقف تأمین مالی</Text></View>
          <View style={styles.simpleRow}><Text style={styles.valueMuted}>۲ بار</Text><Text style={styles.rowLabel}>دفعات باقی‌مانده</Text></View>
          <Text style={styles.membershipLink}>مشاهده عضویت</Text>
        </View>

        <View style={styles.card}>
          <Pressable onPress={() => router.push("/(shared)/change-mobile")}><Row label="شماره موبایل" value="۰۹۱۲•••••۶۷" action="تغییر شماره" /></Pressable>
          <Row label="شماره شبا" value="ثبت نشده" action="افزودن شبا" />
        </View>

        <View style={styles.card}>
          <View style={styles.notificationRow}>
            <FigmaSvg uri={figmaAssets.profileToggle} width={40} height={22} />
            <View style={styles.notificationText}><Text style={styles.rowLabel}>اعلان‌ها</Text><Text style={styles.notificationSub}>دریافت اعلان‌های مهم قرارداد و پرداخت</Text></View>
          </View>
        </View>

        <View style={styles.card}><View style={styles.legalRow}><Text style={styles.chevron}>‹</Text><Text style={styles.rowLabel}>قوانین و شرایط استفاده</Text></View><View style={styles.legalRow}><Text style={styles.chevron}>‹</Text><Text style={styles.rowLabel}>حریم خصوصی</Text></View></View>
        <Pressable style={styles.signOut}><Text style={styles.signOutText}>خروج از حساب</Text></Pressable>
      </ScrollView>
      <View style={styles.bottomNav}>
        <NavItem icon={figmaAssets.profileUser} label="حساب من" active />
        <NavItem icon={figmaAssets.profileFileText} label="قراردادها" onPress={() => router.push("/(shared)/contracts")} />
        <NavItem icon={figmaAssets.profileCreditCard} label="دریافت و پرداخت" onPress={() => router.push("/(tenant)/payments")} />
        <NavItem icon={figmaAssets.profileHome} label="خانه" onPress={() => router.push("/(tenant)/home")} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { paddingHorizontal: 16, paddingTop: 54, paddingBottom: 32, gap: 24 },
  screenTitle: { color: colors.page, fontFamily: fonts.bold, fontSize: 22, textAlign: "right", writingDirection: "rtl" },
  profileHeader: { alignItems: "center", gap: 4 },
  avatarWrap: { width: 76, height: 76, marginBottom: 8 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.border, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 24, writingDirection: "rtl" },
  cameraBadge: { position: "absolute", right: -2, bottom: -2, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.surface, alignItems: "center", justifyContent: "center" },
  name: { color: colors.page, fontFamily: fonts.bold, fontSize: 18, writingDirection: "rtl" },
  phone: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13 },
  changePhoto: { color: colors.page, fontFamily: fonts.medium, fontSize: 12, writingDirection: "rtl" },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 16, gap: 12 },
  cardEyebrow: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  simpleRow: { minHeight: 30, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  valueMuted: { color: colors.muted, fontFamily: fonts.regular, fontSize: 14 },
  rowLabel: { color: colors.text, fontFamily: fonts.medium, fontSize: 14, textAlign: "right", writingDirection: "rtl" },
  activeMembership: { backgroundColor: "#E0F5E5", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  activeMembershipText: { color: "#268C4D", fontFamily: fonts.regular, fontSize: 13, writingDirection: "rtl" },
  membershipLink: { color: "#336699", fontFamily: fonts.regular, fontSize: 13, writingDirection: "rtl" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 },
  action: { color: colors.primary, fontFamily: fonts.medium, fontSize: 13, writingDirection: "rtl" },
  value: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13 },
  rowInfo: { alignItems: "flex-start", gap: 2 },
  rowSub: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13 },
  notificationRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  notificationText: { flex: 1, maxWidth: 260, alignItems: "flex-end", gap: 4 },
  notificationSub: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, textAlign: "right", writingDirection: "rtl" },
  legalRow: { minHeight: 33, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chevron: { color: colors.muted, fontFamily: fonts.regular, fontSize: 16 },
  signOut: { alignItems: "center", paddingTop: 8 },
  signOutText: { color: "#FF383C", fontFamily: fonts.semibold, fontSize: 14, writingDirection: "rtl" },
  bottomNav: { height: 80, backgroundColor: colors.page, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 8, flexDirection: "row" },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  navLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "center", writingDirection: "rtl" },
  navActive: { color: colors.accent },
});
