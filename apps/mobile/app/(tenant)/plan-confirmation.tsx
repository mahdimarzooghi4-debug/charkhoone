import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { colors, fonts, radii } from "@/theme";

function SummaryRow({ label, value, emphasis, success }: { label: string; value: string; emphasis?: boolean; success?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryValue, emphasis && styles.emphasis, success && styles.success]}>{value}</Text>
      <Text style={[styles.summaryLabel, success && styles.success]}>{label}</Text>
    </View>
  );
}

function Step({ number, label, active }: { number: string; label: string; active?: boolean }) {
  return (
    <View style={styles.stepRow}>
      <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
      <View style={[styles.stepCircle, active && styles.stepCircleActive]}><Text style={[styles.stepNumber, active && styles.stepNumberActive]}>{number}</Text></View>
    </View>
  );
}

export default function PlanConfirmationScreen() {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="تایید درخواست" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.title}>جزئیات درخواست خود را بررسی کنید</Text>
          <Text style={styles.description}>پیش از ارسال درخواست، اطلاعات قرارداد و شرایط طرح انتخاب‌شده را بررسی کنید.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.badgeRow}>
            <View style={styles.selectedBadge}><Text style={styles.selectedBadgeText}>طرح انتخاب‌شده</Text></View>
            <View style={styles.specialBadge}><Text style={styles.specialBadgeText}>شرایط ویژه</Text></View>
          </View>
          <Text style={styles.planTitle}>طرح ویژه تأمین مسکن</Text>
          <Text style={styles.muted}>بانک ملت</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>خلاصه مالی طرح</Text>
          <SummaryRow label="مبلغ قابل تأمین" value="۴۵۰٬۰۰۰٬۰۰۰ تومان" emphasis />
          <SummaryRow label="آورده موردنیاز شما" value="۱۸۰٬۰۰۰٬۰۰۰ تومان" />
          <SummaryRow label="نرخ طرح" value="۴٪" />
          <SummaryRow label="پرداخت ماهانه تأمین مالی" value="۱۸٬۵۰۰٬۰۰۰ تومان" emphasis />
          <SummaryRow label="اجاره ماهانه قرارداد" value="۲۰٬۰۰۰٬۰۰۰ تومان" />
          <SummaryRow label="صرفه‌جویی تقریبی" value="۶۵٬۰۰۰٬۰۰۰ تومان" success />
          <Text style={styles.supporting}>براساس مقایسه با شرایط عمومی</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>قرارداد مرتبط</Text>
          <View style={styles.contractGrid}>
            <View style={styles.contractField}><Text style={styles.fieldLabel}>کد رهگیری</Text><Text style={styles.fieldValue}>۱۲۳۴۵۶۷۸۹۰۱۲</Text></View>
            <View style={styles.contractField}><Text style={styles.fieldLabel}>تاریخ شروع</Text><Text style={styles.fieldValue}>۱۵ مهر ۱۴۰۵</Text></View>
          </View>
          <View style={styles.contractField}><Text style={styles.fieldLabel}>تاریخ پایان</Text><Text style={styles.fieldValue}>۱۵ مهر ۱۴۰۶</Text></View>
          <View style={styles.contractField}><Text style={styles.fieldLabel}>آدرس ملک</Text><Text style={styles.fieldValue}>تهران، سعادت‌آباد، خیابان نمونه، پلاک ۲۴، واحد ۳</Text></View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>پس از ارسال درخواست</Text>
          <Step number="۱" label="بررسی اطلاعات و اعتبار" active />
          <View style={[styles.connector, styles.connectorActive]} />
          <Step number="۲" label="بررسی و تصمیم‌گیری بانک" />
          <View style={styles.connector} />
          <Step number="۳" label="اعلام نتیجه در چارخونه" />
        </View>

        <View style={styles.infoNotice}><Text style={styles.infoNoticeText}>مبالغ نمایش‌داده‌شده براساس شرایط فعلی محاسبه شده‌اند و شرایط نهایی پس از بررسی درخواست مشخص می‌شود.</Text><Text style={styles.infoIcon}>ⓘ</Text></View>

        <Pressable onPress={() => setConfirmed((value) => !value)} style={styles.confirmRow}>
          <Text style={styles.confirmText}>اطلاعات قرارداد و شرایط طرح را بررسی کرده‌ام و درخواست بررسی را تأیید می‌کنم.</Text>
          <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>{confirmed ? <Text style={styles.checkmark}>✓</Text> : null}</View>
        </Pressable>

        <AppButton disabled={!confirmed} onPress={() => router.replace("/(tenant)/financing-under-review")}>ارسال درخواست برای بررسی</AppButton>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 16 },
  intro: { gap: 8 },
  title: { color: colors.page, fontFamily: fonts.semibold, fontSize: 20, lineHeight: 28, textAlign: "right", writingDirection: "rtl" },
  description: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 16, gap: 12 },
  badgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  selectedBadge: { backgroundColor: colors.successSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.sm },
  selectedBadgeText: { color: colors.primary, fontFamily: fonts.medium, fontSize: 12, writingDirection: "rtl" },
  specialBadge: { backgroundColor: colors.accentSoft, borderWidth: 1, borderColor: colors.accent, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  specialBadgeText: { color: colors.accent, fontFamily: fonts.medium, fontSize: 11, writingDirection: "rtl" },
  planTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 16, textAlign: "right", writingDirection: "rtl" },
  muted: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  cardTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15, textAlign: "right", writingDirection: "rtl" },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  summaryValue: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14 },
  summaryLabel: { color: "#4B5563", fontFamily: fonts.regular, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  emphasis: { color: colors.primary },
  success: { color: "#10B981" },
  supporting: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "right", writingDirection: "rtl" },
  contractGrid: { flexDirection: "row", gap: 12 },
  contractField: { flex: 1, gap: 4, alignItems: "flex-end" },
  fieldLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, writingDirection: "rtl" },
  fieldValue: { color: colors.text, fontFamily: fonts.medium, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  stepRow: { flexDirection: "row", gap: 12, alignItems: "center", justifyContent: "flex-end" },
  stepLabel: { flex: 1, color: "#4B5563", fontFamily: fonts.medium, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  stepLabelActive: { color: colors.text },
  stepCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.border, alignItems: "center", justifyContent: "center" },
  stepCircleActive: { backgroundColor: colors.primary },
  stepNumber: { color: colors.muted, fontFamily: fonts.bold, fontSize: 12 },
  stepNumberActive: { color: colors.surface },
  connector: { width: 2, height: 16, backgroundColor: colors.border, alignSelf: "flex-end", marginRight: 11 },
  connectorActive: { backgroundColor: colors.primary },
  infoNotice: { backgroundColor: "#F2F7FA", borderWidth: 1, borderColor: "#D9E5ED", borderRadius: radii.md, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", gap: 8 },
  infoNoticeText: { flex: 1, color: "#597385", fontFamily: fonts.regular, fontSize: 12, lineHeight: 21, textAlign: "right", writingDirection: "rtl" },
  infoIcon: { color: "#668CA6", fontSize: 16 },
  confirmRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", paddingVertical: 8 },
  confirmText: { flex: 1, color: colors.page, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.muted, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkmark: { color: colors.surface, fontSize: 14, fontWeight: "700" },
});
