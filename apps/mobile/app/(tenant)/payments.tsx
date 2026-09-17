import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { FigmaSvg } from "@/components/FigmaSvg";
import { figmaAssets } from "@/figmaAssets";
import { colors, fonts, radii } from "@/theme";

function PaymentItem({ date, amount, status, pending }: { date: string; amount: string; status: string; pending?: boolean }) {
  return (
    <View style={styles.paymentItem}>
      <View style={[styles.itemStatus, pending ? styles.itemPendingStatus : styles.futureStatus]}>
        <Text style={[styles.itemStatusText, pending && styles.itemPendingStatusText]}>{status}</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemDate}>{date}</Text>
        <Text style={styles.itemAmount}>{amount}</Text>
      </View>
    </View>
  );
}

function NavItem({ icon, label, active, onPress }: { icon: string; label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.navItem}>
      <FigmaSvg uri={icon} width={24} height={24} />
      <Text style={[styles.navLabel, active && styles.navActive]}>{label}</Text>
    </Pressable>
  );
}

export default function PaymentsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="دریافت و پرداخت" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.nextCard}>
          <View style={styles.nextHeader}>
            <View style={styles.cardPendingStatus}><Text style={styles.cardPendingStatusText}>در انتظار پرداخت</Text></View>
            <Text style={styles.nextTitle}>پرداخت بعدی</Text>
          </View>
          <Text style={styles.nextAmount}>۱۸٬۵۰۰٬۰۰۰ تومان</Text>
          <Text style={styles.muted}>پرداخت ماهانه تأمین مالی</Text>
          <Text style={styles.muted}>سررسید: ۱۵ آبان ۱۴۰۵</Text>
          <AppButton variant="primary" onPress={() => router.push("/(tenant)/installment-payment-success")}>پرداخت</AppButton>
        </View>

        <View style={styles.rentRow}>
          <Text style={styles.rentValue}>۲۰٬۰۰۰٬۰۰۰ تومان</Text>
          <Text style={styles.muted}>اجاره ماهانه قرارداد</Text>
        </View>
        <Text style={styles.sectionTitle}>وضعیت پرداخت‌های قرارداد</Text>
        <View style={styles.progressCard}>
          <View style={styles.progressText}>
            <Text style={styles.progressCount}>۲ از ۱۲</Text>
            <Text style={styles.muted}>۲ پرداخت از ۱۲ پرداخت انجام شده</Text>
          </View>
          <View style={styles.progressTrack}><View style={styles.progressFill} /></View>
        </View>

        <Text style={styles.sectionTitle}>پرداخت‌های پیش رو</Text>
        <View style={styles.list}>
          <PaymentItem date="۱۵ آبان ۱۴۰۵" amount="۱۸٬۵۰۰٬۰۰۰ تومان" status="در انتظار پرداخت" pending />
          <View style={styles.divider} />
          <PaymentItem date="۱۵ آذر ۱۴۰۵" amount="۱۸٬۵۰۰٬۰۰۰ تومان" status="آینده" />
          <View style={styles.divider} />
          <PaymentItem date="۱۵ دی ۱۴۰۵" amount="۱۸٬۵۰۰٬۰۰۰ تومان" status="آینده" />
        </View>

        <Text style={[styles.sectionTitle, styles.historyTitle]}>سوابق پرداخت</Text>
        <View style={styles.list}>
          <View style={styles.paymentItem}>
            <View style={styles.paidStatus}><Text style={styles.paidStatusText}>پرداخت شده</Text></View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemDate}>۱۵ مهر ۱۴۰۵</Text>
              <Text style={styles.itemAmount}>۱۸٬۵۰۰٬۰۰۰ تومان</Text>
              <Text style={styles.tracking}>شماره پیگیری: ۱۲۳۴۵۶۷۸۹</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <NavItem icon={figmaAssets.paymentsUser} label="حساب من" onPress={() => router.push("/(shared)/profile")} />
        <NavItem icon={figmaAssets.paymentsFileText} label="قراردادها" onPress={() => router.push("/(shared)/contracts")} />
        <NavItem icon={figmaAssets.paymentsCreditCard} label="دریافت و پرداخت" active />
        <NavItem icon={figmaAssets.paymentsHome} label="خانه" onPress={() => router.push("/(tenant)/home")} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 12 },
  nextCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  nextHeader: { minHeight: 100, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  nextTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 16, writingDirection: "rtl" },
  nextAmount: { color: colors.primary, fontFamily: fonts.bold, fontSize: 28, textAlign: "right", writingDirection: "rtl" },
  muted: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  cardPendingStatus: { backgroundColor: "#FFF3E0", borderRadius: radii.sm, paddingHorizontal: 12, paddingVertical: 6 },
  cardPendingStatusText: { color: colors.accent, fontFamily: fonts.medium, fontSize: 12, writingDirection: "rtl" },
  rentRow: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  rentValue: { color: colors.text, fontFamily: fonts.medium, fontSize: 14 },
  sectionTitle: { color: colors.page, fontFamily: fonts.semibold, fontSize: 15, textAlign: "right", writingDirection: "rtl", marginTop: 4 },
  historyTitle: { color: colors.text },
  progressCard: { backgroundColor: colors.surface, borderRadius: radii.md, paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  progressText: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressCount: { color: colors.primary, fontFamily: fonts.medium, fontSize: 13 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.page, overflow: "hidden" },
  progressFill: { width: "17%", height: 6, borderRadius: 3, backgroundColor: colors.primary, alignSelf: "flex-end" },
  list: { backgroundColor: colors.surface, borderRadius: radii.md, overflow: "hidden" },
  paymentItem: { minHeight: 69, paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  itemStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  itemPendingStatus: { backgroundColor: "#FFF3E0" },
  futureStatus: { backgroundColor: colors.page },
  itemStatusText: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, writingDirection: "rtl" },
  itemPendingStatusText: { color: colors.accent },
  itemInfo: { flex: 1, alignItems: "flex-end", gap: 2 },
  itemDate: { color: colors.text, fontFamily: fonts.medium, fontSize: 13, writingDirection: "rtl" },
  itemAmount: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, writingDirection: "rtl" },
  divider: { height: 1, backgroundColor: colors.border },
  paidStatus: { backgroundColor: colors.successSoft, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  paidStatusText: { color: colors.primary, fontFamily: fonts.regular, fontSize: 11, writingDirection: "rtl" },
  tracking: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, writingDirection: "rtl" },
  bottomNav: {
    height: 58,
    backgroundColor: colors.page,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  navLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "center", writingDirection: "rtl" },
  navActive: { color: colors.accent },
});
