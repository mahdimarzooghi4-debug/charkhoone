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
  },
} as const;

function DetailRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailValue, strong && styles.detailStrong]}>{value}</Text>
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
  );
}

export function PaymentResultScreen({ kind, status }: PaymentResultScreenProps) {
  const router = useRouter();
  const data = content[kind];
  const success = status === "success";
  const failed = status === "failed";
  const pending = status === "pending";
  const membershipActive = success && kind === "membership";
  const compactMembershipTitle = kind === "membership" && !pending;

  const title = success ? data.successTitle : failed ? data.failedTitle : data.pendingTitle;
  const statusLabel = success ? (kind === "membership" ? "فعال" : "موفق") : failed ? "ناموفق" : "در حال بررسی";
  const tone = success ? styles.success : failed ? styles.failed : styles.pending;
  const toneBg = membershipActive ? styles.membershipActiveBg : success ? styles.successBg : failed ? styles.failedBg : styles.pendingBg;
  const statusWidth = failed ? styles.failedStatusWidth : pending ? styles.pendingStatusWidth : kind === "membership" ? undefined : styles.successStatusWidth;
  const noteBg = success ? styles.successNoteBg : failed ? styles.failedNoteBg : styles.pendingNoteBg;
  const noteTitle = success ? data.successNoteTitle : failed ? data.failedNoteTitle : "از پرداخت تکراری خودداری کنید";
  const note = success ? data.successNote : failed ? data.failedNote : "نتیجه نهایی تراکنش هنوز دریافت نشده است. تا مشخص‌شدن وضعیت، دوباره پرداخت نکنید.";

  const primary = success
    ? data.successPrimary
    : failed
      ? kind === "membership"
        ? "تلاش مجدد برای پرداخت"
        : "تلاش مجدد"
      : kind === "membership"
        ? "بررسی مجدد وضعیت"
        : "پیگیری وضعیت پرداخت";
  const secondary = success
    ? kind === "installment"
      ? "مشاهده رسید"
      : kind === "membership"
        ? "بازگشت به قرارداد"
        : "مشاهده قرارداد"
    : failed
      ? data.failedSecondary
      : data.pendingSecondary;

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
      <View style={styles.appBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="بازگشت" onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.appTitle}>نتیجه پرداخت</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={[styles.heroTitleWrap, compactMembershipTitle && styles.heroTitleWrapCompact]}>
            <Text style={[styles.heroTitle, compactMembershipTitle && styles.heroTitleCompact]}>{title}</Text>
          </View>
          <Text style={[styles.amount, tone]}>{data.amount}</Text>
          <View style={[styles.statusBadge, toneBg, statusWidth, membershipActive && styles.membershipActiveBadge]}>
            <Text style={[styles.statusText, tone, membershipActive && styles.membershipActiveText]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.details}>
          <Text style={styles.cardTitle}>جزئیات تراکنش</Text>
          <DetailRow label="مبلغ" value={data.amount} strong />
          <DetailRow label="بابت" value={data.subject} />
          {kind === "installment" ? <DetailRow label="شماره پرداخت" value="قسط ۳ از ۱۲" /> : null}
          <DetailRow label="تاریخ" value="۱۵ آبان ۱۴۰۵" />
          {kind !== "installment" ? <DetailRow label="ساعت" value="۱۴:۳۵" /> : null}
          <DetailRow label="شماره پیگیری" value="۱۲۳۴۵۶۷۸۹" />
          {success && kind === "membership" ? <DetailRow label="سقف تأمین مالی" value="تا ۵۰۰٬۰۰۰٬۰۰۰ تومان" /> : null}
          {success && kind === "contribution" ? <DetailRow label="قرارداد" value="قرارداد سعادت‌آباد" /> : null}
          {success && kind === "installment" ? <DetailRow label="قرارداد" value="قرارداد سعادت‌آباد" /> : null}
          {pending && kind === "membership" ? <DetailRow label="وضعیت عضویت" value="در انتظار تأیید پرداخت" /> : null}
        </View>

        <View style={[styles.noteCard, noteBg]}>
          <Text style={[styles.noteTitle, tone]}>{noteTitle}</Text>
          <Text style={styles.note}>{note}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable hitSlop={8} onPress={goPrimary} style={styles.primary}>
            <Text style={styles.primaryText}>{primary}</Text>
          </Pressable>
          <Pressable hitSlop={8} onPress={goSecondary} style={styles.secondary}>
            <Text style={styles.secondaryText}>{secondary}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.page },
  appBar: { height: 56, backgroundColor: colors.surface, paddingHorizontal: 16, flexDirection: "row", alignItems: "center" },
  backButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  back: { color: colors.primary, fontFamily: fonts.bold, fontSize: 24, lineHeight: 32 },
  appTitle: { position: "absolute", left: 30, right: 60, color: colors.text, fontFamily: fonts.semibold, fontSize: 18, textAlign: "right", writingDirection: "rtl" },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 12 },
  heroCard: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: 16, gap: 8, alignItems: "center" },
  heroTitleWrap: { width: "100%", minHeight: 44, alignItems: "center", justifyContent: "center" },
  heroTitleWrapCompact: { minHeight: 30 },
  heroTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 17, lineHeight: 22, textAlign: "center", writingDirection: "rtl" },
  heroTitleCompact: { fontSize: 18, lineHeight: 30 },
  amount: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 34, textAlign: "center", writingDirection: "rtl" },
  statusBadge: { minHeight: 24, borderRadius: 14, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  membershipActiveBadge: { minHeight: 30, borderRadius: radii.sm },
  membershipActiveText: { lineHeight: 18 },
  successStatusWidth: { minWidth: 64 },
  failedStatusWidth: { minWidth: 72 },
  pendingStatusWidth: { minWidth: 96 },
  statusText: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 24, textAlign: "center", writingDirection: "rtl" },
  success: { color: colors.primary },
  membershipActiveBg: { backgroundColor: colors.successSoft },
  successBg: { backgroundColor: "#F0FAF5" },
  failed: { color: "#B62B2B" },
  failedBg: { backgroundColor: "#FEF0F0" },
  pending: { color: "#CC6C00" },
  pendingBg: { backgroundColor: "#FFF6E8" },
  successNoteBg: { backgroundColor: "#F0FAF5" },
  failedNoteBg: { backgroundColor: "#FEF7F3" },
  pendingNoteBg: { backgroundColor: "#FFFAF0" },
  details: { backgroundColor: colors.surface, borderRadius: radii.lg, paddingHorizontal: 16, paddingVertical: 14, gap: 6 },
  cardTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15, lineHeight: 24, textAlign: "right", writingDirection: "rtl" },
  detailRow: { minHeight: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  detailValue: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 13, lineHeight: 24 },
  detailStrong: { fontFamily: fonts.semibold },
  detailLabel: { width: 150, color: "#6B7280", fontFamily: fonts.medium, fontSize: 13, lineHeight: 24, textAlign: "right", writingDirection: "rtl" },
  noteCard: { borderRadius: radii.lg, paddingHorizontal: 16, paddingVertical: 12, gap: 6 },
  noteTitle: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 24, textAlign: "right", writingDirection: "rtl" },
  note: { color: "#6B7280", fontFamily: fonts.regular, fontSize: 12, lineHeight: 20, textAlign: "right", writingDirection: "rtl" },
  actions: { gap: 8 },
  primary: { height: 24, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  primaryText: { color: colors.surface, fontFamily: fonts.semibold, fontSize: 14, lineHeight: 24, writingDirection: "rtl" },
  secondary: { height: 24, borderRadius: radii.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 14, lineHeight: 24, writingDirection: "rtl" },
});