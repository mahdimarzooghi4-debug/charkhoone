import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { colors, fonts, radii } from "@/theme";

type PaymentKind = "membership" | "contribution" | "installment";
type PaymentStatus = "success" | "failed" | "pending";

type PaymentResultScreenProps = {
  kind: PaymentKind;
  status: PaymentStatus;
};

const content = {
  membership: {
    amount: "۲٬۵۰۰٬۰۰۰ تومان",
    subject: "حق عضویت چارخونه",
    successTitle: "حق عضویت با موفقیت پرداخت شد",
    failedTitle: "پرداخت حق عضویت انجام نشد",
    pendingTitle: "وضعیت پرداخت حق عضویت در حال بررسی است",
    successNoteTitle: "عضویت شما فعال شد",
    successNote: "عضویت چارخونه فعال شد. حالا می‌توانید آورده موردنیاز قرارداد را پرداخت کنید.",
    failedNoteTitle: "عضویت فعال نشده",
    failedNote: "تراکنش تکمیل نشده و عضویت شما فعال نشده است. برای ادامه می‌توانید دوباره پرداخت کنید.",
    successPrimary: "ادامه و پرداخت آورده",
    failedSecondary: "بازگشت به انتخاب عضویت",
    pendingSecondary: "بازگشت به دریافت و پرداخت",
    extra: ["سقف تأمین مالی", "تا ۵۰۰٬۰۰۰٬۰۰۰ تومان"] as const,
  },
  contribution: {
    amount: "۱۸۰٬۰۰۰٬۰۰۰ تومان",
    subject: "آورده مستأجر",
    successTitle: "پرداخت آورده با موفقیت انجام شد",
    failedTitle: "پرداخت آورده انجام نشد",
    pendingTitle: "وضعیت پرداخت آورده در حال بررسی است",
    successNoteTitle: "آورده شما ثبت شد",
    successNote: "پرداخت آورده ثبت شد. برای ادامه فرایند، تأیید نهایی طرفین قرارداد انجام می‌شود.",
    failedNoteTitle: "آورده ثبت نشده است",
    failedNote: "تراکنش تکمیل نشد و آورده شما ثبت نشده است. برای ادامه می‌توانید دوباره پرداخت کنید.",
    successPrimary: "ادامه فرایند قرارداد",
    failedSecondary: "بازگشت به قرارداد",
    pendingSecondary: "مشاهده قرارداد",
    extra: ["قرارداد", "قرارداد سعادت‌آباد"] as const,
  },
  installment: {
    amount: "۱۸٬۵۰۰٬۰۰۰ تومان",
    subject: "پرداخت ماهانه تأمین مالی",
    successTitle: "پرداخت با موفقیت انجام شد",
    failedTitle: "پرداخت انجام نشد",
    pendingTitle: "وضعیت پرداخت در حال بررسی است",
    successNoteTitle: "پرداخت ماهانه تأمین مالی ثبت شد",
    successNote: "این پرداخت ثبت شد. پرداخت بعدی در صورت فعال‌بودن قرارداد از بخش دریافت و پرداخت نمایش داده می‌شود.",
    failedNoteTitle: "این قسط پرداخت‌شده محسوب نمی‌شود",
    failedNote: "تراکنش تکمیل نشد. در صورت نیاز می‌توانید دوباره پرداخت را انجام دهید.",
    successPrimary: "بازگشت به دریافت و پرداخت",
    failedSecondary: "بازگشت به دریافت و پرداخت",
    pendingSecondary: "بازگشت به دریافت و پرداخت",
    extra: ["شماره پرداخت", "قسط ۳ از ۱۲"] as const,
  },
} as const;

function DetailRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <View style={styles.detailRow}><Text style={[styles.detailValue, strong && styles.detailStrong]}>{value}</Text><Text style={styles.detailLabel}>{label}</Text></View>;
}

export function PaymentResultScreen({ kind, status }: PaymentResultScreenProps) {
  const router = useRouter();
  const data = content[kind];
  const success = status === "success";
  const failed = status === "failed";
  const title = success ? data.successTitle : failed ? data.failedTitle : data.pendingTitle;
  const statusLabel = success ? (kind === "membership" ? "فعال" : "موفق") : failed ? "ناموفق" : "در حال بررسی";
  const tone = success ? styles.success : failed ? styles.failed : styles.pending;
  const toneBg = success ? styles.successBg : failed ? styles.failedBg : styles.pendingBg;
  const noteTitle = success ? data.successNoteTitle : failed ? data.failedNoteTitle : "از پرداخت تکراری خودداری کنید";
  const note = success ? data.successNote : failed ? data.failedNote : "نتیجه نهایی تراکنش هنوز دریافت نشده است. تا مشخص‌شدن وضعیت، دوباره پرداخت نکنید.";

  const primary = success ? data.successPrimary : failed ? "تلاش مجدد" : kind === "membership" ? "بررسی مجدد وضعیت" : "پیگیری وضعیت پرداخت";
  const secondary = success ? (kind === "installment" ? "مشاهده رسید" : kind === "membership" ? "بازگشت به قرارداد" : "مشاهده قرارداد") : failed ? data.failedSecondary : data.pendingSecondary;

  const goPrimary = () => {
    if (success && kind === "membership") router.replace("/(tenant)/contribution-required");
    else if (success && kind === "contribution") router.replace("/(tenant)/final-confirmation");
    else if (success && kind === "installment") router.replace("/(tenant)/payments");
    else if (failed && kind === "membership") router.replace("/(tenant)/membership");
    else if (failed && kind === "contribution") router.replace("/(tenant)/contribution-required");
    else if (failed && kind === "installment") router.replace("/(tenant)/payments");
  };

  const goSecondary = () => {
    if (success && kind === "installment") router.push("/(tenant)/receipt");
    else if (kind === "membership") router.replace("/(tenant)/membership");
    else if (kind === "contribution") router.replace("/(tenant)/contract-detail");
    else router.replace("/(tenant)/payments");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.appBar}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><Text style={styles.appTitle}>نتیجه پرداخت</Text></View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}><Text style={styles.heroTitle}>{title}</Text><Text style={[styles.amount, tone]}>{data.amount}</Text><View style={[styles.statusBadge, toneBg]}><Text style={[styles.statusText, tone]}>{statusLabel}</Text></View></View>
        <View style={styles.details}><Text style={styles.cardTitle}>جزئیات تراکنش</Text><DetailRow label="مبلغ" value={data.amount} strong /><DetailRow label="بابت" value={data.subject} /><DetailRow label={data.extra[0]} value={data.extra[1]} /><DetailRow label="تاریخ" value="۱۵ آبان ۱۴۰۵" />{kind !== "installment" ? <DetailRow label="ساعت" value="۱۴:۳۵" /> : null}<DetailRow label="شماره پیگیری" value="۱۲۳۴۵۶۷۸۹" />{kind === "installment" && success ? <DetailRow label="قرارداد" value="قرارداد سعادت‌آباد" /> : null}{kind === "membership" && status === "pending" ? <DetailRow label="وضعیت عضویت" value="در انتظار تأیید پرداخت" /> : null}</View>
        <View style={[styles.noteCard, toneBg]}><Text style={[styles.noteTitle, tone]}>{noteTitle}</Text><Text style={styles.note}>{note}</Text></View>
        <View style={styles.actions}><Pressable onPress={goPrimary} style={styles.primary}><Text style={styles.primaryText}>{primary}</Text></Pressable><Pressable onPress={goSecondary} style={styles.secondary}><Text style={styles.secondaryText}>{secondary}</Text></Pressable></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  appBar: { height: 56, backgroundColor: colors.surface, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { color: colors.primary, fontFamily: fonts.bold, fontSize: 28 },
  appTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 18, writingDirection: "rtl" },
  content: { padding: 16, gap: 12 },
  heroCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: 16, gap: 8, alignItems: "center" },
  heroTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 17, lineHeight: 24, textAlign: "center", writingDirection: "rtl" },
  amount: { fontFamily: fonts.bold, fontSize: 26, writingDirection: "rtl" },
  statusBadge: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4 },
  statusText: { fontFamily: fonts.medium, fontSize: 12, writingDirection: "rtl" },
  success: { color: colors.primary },
  successBg: { backgroundColor: "#F0FAF5" },
  failed: { color: "#B62B2B" },
  failedBg: { backgroundColor: "#FEF0F0" },
  pending: { color: "#CC6C00" },
  pendingBg: { backgroundColor: "#FFF6E8" },
  details: { backgroundColor: colors.surface, borderRadius: radii.lg, paddingHorizontal: 16, paddingVertical: 14, gap: 6 },
  cardTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15, textAlign: "right", writingDirection: "rtl" },
  detailRow: { minHeight: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  detailValue: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 13 },
  detailStrong: { fontFamily: fonts.semibold },
  detailLabel: { color: "#6B7280", fontFamily: fonts.medium, fontSize: 13, textAlign: "right", writingDirection: "rtl" },
  noteCard: { borderRadius: radii.lg, paddingHorizontal: 16, paddingVertical: 12, gap: 6 },
  noteTitle: { fontFamily: fonts.semibold, fontSize: 14, textAlign: "right", writingDirection: "rtl" },
  note: { color: "#6B7280", fontFamily: fonts.regular, fontSize: 12, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
  actions: { gap: 8 },
  primary: { minHeight: 40, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  primaryText: { color: colors.surface, fontFamily: fonts.semibold, fontSize: 14, writingDirection: "rtl" },
  secondary: { minHeight: 40, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 14, writingDirection: "rtl" },
});
