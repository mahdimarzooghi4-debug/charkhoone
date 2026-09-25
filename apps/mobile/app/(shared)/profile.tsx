import { useEffect } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useMobileBootstrap } from "@/api/useMobileBootstrap";
import { FigmaSvg } from "@/components/FigmaSvg";
import { figmaAssets } from "@/figmaAssets";
import { colors, fonts, radii } from "@/theme";

function NavItem({ icon, label, active, onPress }: { icon: string; label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.navItem}>
      <FigmaSvg uri={icon} width={24} height={24} tintColor={active ? colors.accent : undefined} />
      <Text style={[styles.navLabel, active && styles.navActive]}>{label}</Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
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
        <Text style={styles.screenTitle}>حساب من</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>حساب احراز هویت‌شده</Text>
          {loading ? <Text style={styles.value}>در حال دریافت...</Text> : null}
          {error ? <Text style={styles.error}>دریافت اطلاعات حساب ناموفق بود: {error}</Text> : null}
          {data ? (
            <>
              <Text selectable style={styles.id}>User ID: {data.userId}</Text>
              <View style={styles.row}>
                <Text style={styles.value}>{data.latestCreditApplication?.status ?? "ثبت نشده"}</Text>
                <Text style={styles.label}>آخرین درخواست</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.value}>{data.contracts.length.toLocaleString("fa-IR")}</Text>
                <Text style={styles.label}>قرارداد قابل دسترسی</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.value}>{data.payments.length.toLocaleString("fa-IR")}</Text>
                <Text style={styles.label}>PaymentInstruction قابل مشاهده</Text>
              </View>
            </>
          ) : null}
          <Text style={styles.note}>
            نام، شماره موبایل، کد ملی، سقف عضویت یا شماره شبا در bootstrap فعلی وجود ندارد؛ بنابراین این صفحه آن‌ها را حدس یا جعل نمی‌کند.
          </Text>
        </View>

        <Pressable style={styles.signOut} onPress={() => router.push("/(shared)/sign-out")}>
          <Text style={styles.signOutText}>خروج از حساب</Text>
        </Pressable>
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
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 16, gap: 12 },
  cardTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15, textAlign: "right", writingDirection: "rtl" },
  row: { minHeight: 30, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  label: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, textAlign: "right", writingDirection: "rtl" },
  value: { color: colors.text, fontFamily: fonts.medium, fontSize: 12 },
  id: { color: colors.muted, fontFamily: fonts.regular, fontSize: 9, textAlign: "left" },
  note: { color: colors.muted, fontFamily: fonts.regular, fontSize: 10, lineHeight: 17, textAlign: "right", writingDirection: "rtl" },
  error: { color: "#B91C1C", fontFamily: fonts.medium, fontSize: 11, lineHeight: 18, textAlign: "right", writingDirection: "rtl" },
  signOut: { alignItems: "center", paddingVertical: 14 },
  signOutText: { color: "#FF383C", fontFamily: fonts.semibold, fontSize: 14, writingDirection: "rtl" },
  bottomNav: { height: 80, backgroundColor: colors.page, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 8, flexDirection: "row" },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  navLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "center", writingDirection: "rtl" },
  navActive: { color: colors.accent },
});
