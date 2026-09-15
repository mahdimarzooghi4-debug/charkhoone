import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { OwnerBadge, OwnerBottomNav } from "@/components/OwnerUi";
import { colors, fonts, radii } from "@/theme";

function SummaryCard({ label, value, unit, footer, footerAccent }: { label: string; value: string; unit: string; footer: string; footerAccent?: boolean }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryUnit}>{unit}</Text>
      <Text style={[styles.summaryFooter, footerAccent && styles.summaryFooterAccent]}>{footer}</Text>
    </View>
  );
}

function ReceiptRow({ amount, date, property, status, future = false }: { amount: string; date: string; property: string; status: string; future?: boolean }) {
  return (
    <View style={styles.receiptRow}>
      <View style={styles.receiptTop}>
        <View style={styles.badges}><OwnerBadge tone={future ? "neutral" : "warning"}>{status}</OwnerBadge><OwnerBadge>دریافت</OwnerBadge></View>
        <Text style={styles.receiptAmount}>{amount}</Text>
      </View>
      <View style={styles.receiptMeta}><Text style={styles.metaText}>{date}</Text><Text style={styles.metaText}>{property}</Text></View>
    </View>
  );
}

export default function OwnerReceivePayScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><Text style={styles.headerTitle}>دریافت و پرداخت</Text></View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryRow}>
          <SummaryCard label="در انتظار تسویه" value="۱۹٬۹۰۰٬۰۰۰" unit="تومان" footer="۱ دریافتی" footerAccent />
          <SummaryCard label="تسویه‌شده این ماه" value="۴۰٬۰۰۰٬۰۰۰" unit="تومان" footer="۲ تسویه" />
          <SummaryCard label="دریافتی بعدی" value="۱۵ آبان ۱۴۰۵" unit="۱۹٬۹۰۰٬۰۰۰ تومان" footer="‌" />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroHeader}><View style={styles.badges}><OwnerBadge tone="warning">در انتظار تسویه</OwnerBadge><OwnerBadge>دریافت</OwnerBadge></View><Text style={styles.heroTitle}>دریافتی بعدی شما</Text></View>
          <Text style={styles.heroAmount}>۱۹٬۹۰۰٬۰۰۰ تومان</Text>
          <Text style={styles.heroLine}>کارمزد خدمات چارخونه (۰٫۵٪): −۱۰۰٬۰۰۰ تومان</Text>
          <Text style={styles.heroLineBold}>مبلغ خالص قابل تسویه: ۱۹٬۹۰۰٬۰۰۰ تومان</Text>
          <Text style={styles.heroMuted}>تاریخ تسویه: ۱۵ آبان ۱۴۰۵</Text>
          <Text style={styles.heroMuted}>مستأجر: علی رضایی</Text>
          <Text style={styles.heroMuted}>ملک: سعادت‌آباد</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>دریافتی‌های پیش رو</Text>
          <ReceiptRow amount="۱۹٬۹۰۰٬۰۰۰ تومان" date="۱۵ آبان ۱۴۰۵" property="سعادت‌آباد" status="در انتظار تسویه" />
          <ReceiptRow amount="۱۴٬۹۲۵٬۰۰۰ تومان" date="۱ آذر ۱۴۰۵" property="پونک" status="آینده" future />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>سوابق تسویه</Text>
          <View style={styles.historyCard}>
            <View style={styles.receiptTop}><View style={styles.badges}><OwnerBadge>تسویه شده</OwnerBadge><OwnerBadge>دریافت</OwnerBadge></View><Text style={styles.receiptAmount}>۱۹٬۹۰۰٬۰۰۰ تومان</Text></View>
            <Text style={styles.metaText}>قرارداد سعادت‌آباد</Text>
            <Text style={styles.metaText}>۱۵ مهر ۱۴۰۵ · شماره پیگیری: ۱۲۳۴۵۶۷۸۹</Text>
          </View>
        </View>
      </ScrollView>
      <OwnerBottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  header: { height: 56, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border, paddingHorizontal: 16, alignItems: "flex-end", justifyContent: "center" },
  headerTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 18, textAlign: "right", writingDirection: "rtl" },
  scroll: { paddingTop: 20, paddingBottom: 20, gap: 20 },
  summaryRow: { paddingHorizontal: 16, flexDirection: "row", gap: 8 },
  summaryCard: { flex: 1, minHeight: 116, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: 12, gap: 6, alignItems: "flex-end" },
  summaryLabel: { width: "100%", color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "right", writingDirection: "rtl" },
  summaryValue: { width: "100%", color: colors.text, fontFamily: fonts.semibold, fontSize: 15, textAlign: "right", writingDirection: "rtl" },
  summaryUnit: { width: "100%", color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "right", writingDirection: "rtl" },
  summaryFooter: { width: "100%", color: colors.primary, fontFamily: fonts.medium, fontSize: 11, textAlign: "right", writingDirection: "rtl" },
  summaryFooterAccent: { color: colors.accent },
  heroCard: { marginHorizontal: 16, backgroundColor: colors.infoSoft, borderWidth: 1, borderColor: "rgba(13,59,54,0.1)", borderRadius: radii.lg, padding: 16, gap: 8 },
  heroHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badges: { flexDirection: "row", gap: 8, alignItems: "center" },
  heroTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15, writingDirection: "rtl" },
  heroAmount: { color: colors.primary, fontFamily: fonts.bold, fontSize: 22, textAlign: "right", writingDirection: "rtl", marginTop: 8 },
  heroLine: { color: colors.text, fontFamily: fonts.regular, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  heroLineBold: { color: colors.text, fontFamily: fonts.bold, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  heroMuted: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  section: { paddingHorizontal: 16, gap: 12 },
  sectionTitle: { color: colors.page, fontFamily: fonts.semibold, fontSize: 15, textAlign: "right", writingDirection: "rtl" },
  receiptRow: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: 16, gap: 8 },
  receiptTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  receiptAmount: { color: colors.text, fontFamily: fonts.medium, fontSize: 14, writingDirection: "rtl" },
  receiptMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  metaText: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, textAlign: "right", writingDirection: "rtl" },
  historyCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: 16, gap: 8 },
});
