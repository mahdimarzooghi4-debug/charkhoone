import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { BrandLogo } from "@/components/BrandLogo";
import { colors, fonts, radii } from "@/theme";

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export default function ReceiptScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.receiptHeader}>
            <View style={styles.logoWrap}><BrandLogo variant="hero" /></View>
            <Text style={styles.receiptTitle}>رسید پرداخت</Text>
            <View style={styles.statusBadge}><Text style={styles.statusText}>پرداخت موفق</Text></View>
          </View>

          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>مبلغ پرداخت‌شده</Text>
            <Text style={styles.amount}>۱۸٬۵۰۰٬۰۰۰ تومان</Text>
            <Text style={styles.amountDescription}>پرداخت ماهانه تأمین مالی</Text>
          </View>

          <View style={styles.divider} />
          <View style={styles.details}>
            <ReceiptRow label="تاریخ پرداخت" value="۱۵ آبان ۱۴۰۵" />
            <ReceiptRow label="زمان پرداخت" value="۱۴:۳۵" />
            <ReceiptRow label="شماره قسط" value="۳ از ۱۲" />
            <ReceiptRow label="شماره پیگیری" value="۱۲۳۴۵۶۷۸۹" />
          </View>

          <View style={styles.divider} />
          <View style={styles.contractSection}>
            <Text style={styles.contractTitle}>قرارداد مرتبط</Text>
            <ReceiptRow label="کد رهگیری قرارداد" value="۱۲۳۴۵۶۷۸۹۰۱۲" />
            <ReceiptRow label="ملک" value="تهران، سعادت‌آباد" />
          </View>

          <View style={styles.divider} />
          <View style={styles.footer}>
            <Text style={styles.footerText}>این رسید توسط چارخونه صادر شده است.</Text>
            <Text style={styles.footerId}>شناسه رسید: ۱۴۰۵۰۸۱۵-۱۲۳۴۵</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  content: { flexGrow: 1, backgroundColor: colors.primary, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 24, gap: 16, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 8 }, elevation: 1 },
  receiptHeader: { width: "100%", backgroundColor: colors.primary, gap: 8, alignItems: "center" },
  logoWrap: { width: "100%" },
  receiptTitle: { width: "100%", color: colors.page, fontFamily: fonts.semibold, fontSize: 15, textAlign: "center", writingDirection: "rtl" },
  statusBadge: { minHeight: 31, borderRadius: radii.sm, backgroundColor: colors.successSoft, paddingHorizontal: 12, paddingVertical: 6, alignItems: "center", justifyContent: "center" },
  statusText: { color: colors.primary, fontFamily: fonts.regular, fontSize: 12, textAlign: "center", writingDirection: "rtl" },
  amountSection: { width: "100%", gap: 6, alignItems: "center" },
  amountLabel: { width: "100%", color: colors.muted, fontFamily: fonts.regular, fontSize: 13, textAlign: "center", writingDirection: "rtl" },
  amount: { width: "100%", color: colors.primary, fontFamily: fonts.bold, fontSize: 28, textAlign: "center", writingDirection: "rtl" },
  amountDescription: { width: "100%", color: colors.accent, fontFamily: fonts.medium, fontSize: 12, textAlign: "center", writingDirection: "rtl" },
  divider: { width: "100%", height: 1, backgroundColor: colors.border },
  details: { width: "100%", gap: 2 },
  row: { width: "100%", minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  value: { color: colors.text, fontFamily: fonts.medium, fontSize: 14, writingDirection: "rtl" },
  label: { color: colors.muted, fontFamily: fonts.regular, fontSize: 14, textAlign: "right", writingDirection: "rtl" },
  contractSection: { width: "100%", gap: 4 },
  contractTitle: { width: "100%", color: colors.text, fontFamily: fonts.bold, fontSize: 14, textAlign: "right", writingDirection: "rtl" },
  footer: { width: "100%", gap: 4, alignItems: "center" },
  footerText: { width: "100%", color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "center", writingDirection: "rtl" },
  footerId: { width: "100%", color: colors.muted, fontFamily: fonts.regular, fontSize: 10, textAlign: "center", writingDirection: "rtl" },
});
