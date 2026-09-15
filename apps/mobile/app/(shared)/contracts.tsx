import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { FigmaSvg } from "@/components/FigmaSvg";
import { figmaAssets } from "@/figmaAssets";
import { colors, fonts, radii } from "@/theme";

type ContractCardProps = {
  role: "مستأجر" | "مالک";
  status: "فعال" | "در حال بررسی";
  city: string;
  tracking?: string;
  period?: string;
  rent?: string;
  nextPayment?: string;
  financingPayment?: string;
  onPress?: () => void;
};

function ContractCard({ role, status, city, tracking, period, rent, nextPayment, financingPayment, onPress }: ContractCardProps) {
  const owner = role === "مالک";
  const reviewing = status === "در حال بررسی";
  return (
    <View style={styles.contractCard}>
      <View style={styles.badgeRow}>
        <View style={[styles.roleBadge, owner && styles.ownerBadge]}><Text style={[styles.roleBadgeText, owner && styles.ownerBadgeText]}>{role}</Text></View>
        <View style={[styles.statusBadge, reviewing && styles.reviewBadge]}><Text style={[styles.statusText, reviewing && styles.reviewText]}>{status}</Text></View>
      </View>
      <Text style={styles.city}>{city}</Text>
      {reviewing ? (
        <View style={styles.reviewNotice}><Text style={styles.reviewNoticeText}>درخواست تأمین مالی در حال بررسی است</Text></View>
      ) : (
        <View style={styles.rows}>
          {tracking ? <InfoRow label="کد رهگیری" value={tracking} /> : null}
          {period ? <InfoRow label="مدت قرارداد" value={period} /> : null}
          {rent ? <InfoRow label={owner ? "وضعیت قرارداد" : "اجاره ماهانه"} value={rent} /> : null}
        </View>
      )}
      {!owner && !reviewing && nextPayment && financingPayment ? (
        <View style={styles.nextBlock}>
          <InfoRow label="پرداخت بعدی" value={nextPayment} small />
          <InfoRow label="تأمین‌شده توسط چارخونه" value={financingPayment} accent small />
        </View>
      ) : null}
      <Pressable onPress={onPress} style={styles.viewButton}><Text style={styles.viewButtonText}>{reviewing ? "مشاهده وضعیت" : "مشاهده قرارداد"}</Text></Pressable>
    </View>
  );
}

function InfoRow({ label, value, accent, small }: { label: string; value: string; accent?: boolean; small?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoValue, small && styles.infoValueSmall, accent && styles.infoValueAccent]}>{value}</Text>
      <Text style={[styles.infoLabel, small && styles.infoLabelSmall]}>{label}</Text>
    </View>
  );
}

function NavItem({ icon, label, active, onPress }: { icon: string; label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.navItem}>
      <FigmaSvg uri={icon} width={24} height={24} />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
    </Pressable>
  );
}

export default function ContractsOverviewScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerArea}>
          <View style={styles.titleGroup}><Text style={styles.title}>قراردادهای من</Text><Text style={styles.subtitle}>قراردادهای ثبت‌شده شما در چارخونه</Text></View>
          <Pressable style={styles.addButton} onPress={() => router.push("/(shared)/contract-tracking")}><Text style={styles.addText}>+  ثبت قرارداد جدید</Text></Pressable>
        </View>
        <ContractCard role="مستأجر" status="فعال" city="تهران، سعادت‌آباد" tracking="۱۲۳۴۵۶۷۸۹۰۱۲" period="۱۵ مهر ۱۴۰۵ تا ۱۵ مهر ۱۴۰۶" rent="۲۰٬۰۰۰٬۰۰۰ تومان" nextPayment="۱۵ آبان ۱۴۰۵" financingPayment="۱۸٬۵۰۰٬۰۰۰ تومان" onPress={() => router.push("/(tenant)/contract-detail")} />
        <ContractCard role="مالک" status="فعال" city="تهران، پونک" tracking="۹۸۷۶۵۴۳۲۱۰۱۲" period="۱ آبان ۱۴۰۵ تا ۱ آبان ۱۴۰۶" rent="فعال" />
        <ContractCard role="مستأجر" status="در حال بررسی" city="تهران، زعفرانیه" onPress={() => router.push("/(tenant)/financing-under-review")} />
      </ScrollView>
      <View style={styles.bottomNav}>
        <NavItem icon={figmaAssets.contractsUser} label="حساب من" onPress={() => router.push("/(shared)/profile")} />
        <NavItem icon={figmaAssets.contractsFileText} label="قراردادها" active />
        <NavItem icon={figmaAssets.contractsCreditCard} label="دریافت و پرداخت" onPress={() => router.push("/(tenant)/payments")} />
        <NavItem icon={figmaAssets.contractsHome} label="خانه" onPress={() => router.push("/(tenant)/home")} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 28, gap: 16 },
  headerArea: { gap: 12, paddingTop: 12 },
  titleGroup: { gap: 4, alignItems: "flex-end" },
  title: { color: colors.page, fontFamily: fonts.bold, fontSize: 24, writingDirection: "rtl" },
  subtitle: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, writingDirection: "rtl" },
  addButton: { height: 45, borderRadius: radii.md, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  addText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 14, writingDirection: "rtl" },
  contractCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 18, gap: 12 },
  badgeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  roleBadge: { backgroundColor: colors.successSoft, borderRadius: radii.sm, paddingHorizontal: 12, paddingVertical: 6 },
  roleBadgeText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 12, writingDirection: "rtl" },
  ownerBadge: { backgroundColor: "#E0F2FE" },
  ownerBadgeText: { color: "#0369A1" },
  statusBadge: { backgroundColor: colors.successSoft, borderRadius: radii.sm, paddingHorizontal: 12, paddingVertical: 6 },
  statusText: { color: colors.primary, fontFamily: fonts.medium, fontSize: 12, writingDirection: "rtl" },
  reviewBadge: { backgroundColor: "#FFF3E0" },
  reviewText: { color: colors.accent },
  city: { color: colors.text, fontFamily: fonts.semibold, fontSize: 16, textAlign: "right", writingDirection: "rtl" },
  rows: { gap: 8 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  infoValue: { color: colors.primary, fontFamily: fonts.medium, fontSize: 13 },
  infoLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, writingDirection: "rtl" },
  infoValueSmall: { fontSize: 11 },
  infoLabelSmall: { fontSize: 12, color: colors.text, fontFamily: fonts.semibold },
  infoValueAccent: { color: colors.accent, fontFamily: fonts.bold, fontSize: 14 },
  nextBlock: { gap: 6, paddingVertical: 4 },
  reviewNotice: { backgroundColor: "#FEF3C7", borderRadius: radii.sm, padding: 12 },
  reviewNoticeText: { color: "#B45309", fontFamily: fonts.medium, fontSize: 12, textAlign: "right", writingDirection: "rtl" },
  viewButton: { minHeight: 28, alignItems: "center", justifyContent: "center" },
  viewButtonText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 13, writingDirection: "rtl" },
  bottomNav: { height: 80, backgroundColor: colors.page, borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 8, flexDirection: "row" },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  navLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "center", writingDirection: "rtl" },
  navLabelActive: { color: colors.accent },
});
