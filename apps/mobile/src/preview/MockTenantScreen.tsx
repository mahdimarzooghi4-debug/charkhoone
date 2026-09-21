import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import type { ReactNode } from "react";
import { colors, fonts, radii } from "@/theme";
import { FigmaSvg } from "@/components/FigmaSvg";
import { figmaAssets } from "@/figmaAssets";
import { mockDisclaimer, mockFinancialModel, type MockFinancingPlan, type MockMembership } from "./mockTenantData";
import { useMockPreview } from "./MockPreviewProvider";

type Props = { screen: string };
const financeRows = [
  ["ودیعهٔ نقدی", mockFinancialModel.cashDeposit],
  ["اجارهٔ ماهانه", mockFinancialModel.monthlyRent],
  ["معادل ودیعهٔ کامل", mockFinancialModel.fullDeposit],
  ["تأمین مالی ۳۰٪", mockFinancialModel.financing],
  ["آوردهٔ مستأجر", mockFinancialModel.contribution],
] as const;

function Button({ label, to, tone = "primary" }: { label: string; to: string; tone?: "primary" | "outline" | "danger" }) {
  return <Link href={`/preview/${to}`} asChild><Pressable accessibilityRole="link" style={[styles.button, styles[tone]]}><Text style={[styles.buttonText, tone === "primary" ? styles.buttonTextLight : styles.buttonTextDark]}>{label}</Text></Pressable></Link>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <View style={styles.row}><Text style={styles.value}>{value}</Text><Text style={styles.label}>{label}</Text></View>;
}

function Choice<T extends string>({ label, value, selected, onPress }: { label: string; value: T; selected: boolean; onPress: (value: T) => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => onPress(value)} style={[styles.choice, selected && styles.choiceSelected]}><View style={[styles.radio, selected && styles.radioSelected]} /> <Text style={styles.choiceText}>{label}</Text></Pressable>;
}

function BottomNav({ active }: { active: "home" | "payments" | "contracts" | "profile" }) {
  const items = [
    ["حساب من", "profile", figmaAssets.user],
    ["قراردادها", "contract-active", figmaAssets.fileText],
    ["دریافت و پرداخت", "payments", figmaAssets.creditCard],
    ["خانه", "home", figmaAssets.home],
  ] as const;
  return <View style={styles.bottomNav}>{items.map(([label, to, icon]) => {
    const selected = active === (to === "contract-active" ? "contracts" : to);
    return <Link key={to} href={`/preview/${to}`} asChild><Pressable accessibilityRole="link" accessibilityState={{ selected }} style={styles.bottomItem}><FigmaSvg uri={selected && to === "home" ? figmaAssets.homeActive : icon} width={24} height={24} /><Text style={[styles.bottomLabel, selected && styles.bottomLabelActive]}>{label}</Text></Pressable></Link>;
  })}</View>;
}

function ScreenTitle({ title, back = "home" }: { title: string; back?: string }) {
  return <View style={styles.titleRow}><Button label="‹" to={back} tone="outline" /><View style={styles.titleGroup}><Text style={styles.mock}>MOCK • پیش‌نمایش مستقل</Text><Text style={styles.title}>{title}</Text></View></View>;
}

export function MockTenantScreen({ screen }: Props) {
  const { financingPlan, membership, setFinancingPlan, setMembership } = useMockPreview();
  const active = screen === "payments" || screen.startsWith("payment-") || screen === "receipt" ? "payments" : screen.startsWith("contract") || screen === "final-confirmation" ? "contracts" : screen === "profile" ? "profile" : "home";
  const planChoice = (label: MockFinancingPlan) => <Choice label={`طرح تأمین مالی ${label} — ${mockFinancialModel.financing}`} value={label} selected={financingPlan === label} onPress={setFinancingPlan} />;
  const membershipChoice = (label: MockMembership) => <Choice label={`عضویت ${label} (فقط نمونه)`} value={label} selected={membership === label} onPress={setMembership} />;

  let body: ReactNode;
  switch (screen) {
    case "calculator": body = <><ScreenTitle title="ماشین‌حساب مستأجر" /><View style={styles.card}><Text style={styles.cardTitle}>مدل ثابت C3</Text><Text style={styles.body}>ضریب تبدیل اجاره به رهن: {mockFinancialModel.conversionRate}</Text>{financeRows.slice(0, 3).map(([label, value]) => <Row key={label} label={label} value={value} />)}<Text style={styles.note}>این محاسبه صندوق ۳٪ یا دریافتی مالک ۳٫۵٪ را نمایش نمی‌دهد.</Text></View><Button label="مشاهدهٔ نتیجهٔ نمونه" to="calculator-result" /></>; break;
    case "calculator-result": body = <><ScreenTitle title="نتیجهٔ ماشین‌حساب" back="calculator" /><View style={styles.card}>{financeRows.map(([label, value]) => <Row key={label} label={label} value={value} />)}<Row label="نرخ اسمی سالانهٔ نمونهٔ بانک" value={mockFinancialModel.annualRate} /><Row label="پرداخت ماهانهٔ مستأجر (فقط سود)" value={mockFinancialModel.monthlyInterest} /><Text style={styles.note}>بازپرداخت اصل وام مطابق قرارداد نهایی بانک خواهد بود.</Text></View><Button label="انتخاب طرح تأمین مالی" to="financing-plans" /></>; break;
    case "financing-plans": body = <><ScreenTitle title="طرح‌های تأمین مالی" back="calculator-result" /><View style={styles.card}><Text style={styles.cardTitle}>انتخاب طرح MOCK</Text>{planChoice("عمومی")}{planChoice("ویژهٔ نمونه")}<Text style={styles.note}>انتخاب طرح صرفاً در این پیش‌نمایش حفظ می‌شود و به نوع عضویت وابسته نیست.</Text></View><Button label="تأیید طرح و ادامه" to="plan-confirmation" /></>; break;
    case "plan-confirmation": body = <><ScreenTitle title="تأیید طرح تأمین مالی" back="financing-plans" /><View style={styles.card}><Row label="طرح انتخاب‌شده" value={financingPlan} /><Row label="تأمین مالی نمونه" value={mockFinancialModel.financing} /><Row label="آوردهٔ نمونه" value={mockFinancialModel.contribution} /><Text style={styles.note}>{mockDisclaimer}</Text></View><Button label="ارسال نمونه برای بررسی" to="review" /></>; break;
    case "review": body = <><ScreenTitle title="بررسی درخواست" back="plan-confirmation" /><View style={styles.card}><Text style={styles.cardTitle}>در انتظار بررسی نمونه</Text><Text style={styles.body}>طرح {financingPlan} در سناریوی MOCK در حال بررسی نمایش داده می‌شود.</Text></View><Button label="نمایش تأیید نمونه" to="approved" /><Button label="نمایش رد نمونه" to="rejected" tone="danger" /></>; break;
    case "approved": body = <><ScreenTitle title="تأیید نمونهٔ درخواست" back="review" /><View style={styles.successCard}><Text style={styles.cardTitle}>تأیید نمونه</Text><Row label="تأمین مالی تأییدشدهٔ نمونه" value={mockFinancialModel.financing} /><Text style={styles.note}>این تأیید از بانک نیست و هیچ تخصیص مالی ایجاد نشده است.</Text></View><Button label="ادامه به عضویت نمونه" to="membership" /></>; break;
    case "rejected": body = <><ScreenTitle title="رد نمونهٔ درخواست" back="review" /><View style={styles.errorCard}><Text style={styles.cardTitle}>رد صرفاً نمایشی</Text><Text style={styles.body}>برای آزمایش مسیر رد. علت یا تصمیم واقعی بانک نمایش داده نمی‌شود.</Text></View><Button label="بازگشت به طرح‌ها" to="financing-plans" tone="outline" /></>; break;
    case "membership": body = <><ScreenTitle title="عضویت" back="approved" /><View style={styles.card}><Text style={styles.cardTitle}>انتخاب نوع عضویت MOCK</Text>{membershipChoice("پایه")}{membershipChoice("همراه")}<Text style={styles.note}>نوع عضویت مستقل از طرح تأمین مالی «{financingPlan}» است.</Text></View><Button label="نتیجهٔ موفق نمونه" to="membership-success" /><Button label="وضعیت انتظار نمونه" to="membership-pending" tone="outline" /><Button label="خطای نمونه" to="membership-failed" tone="danger" /></>; break;
    case "membership-success": case "membership-pending": case "membership-failed": {
      const kind = screen.split("-")[1]; const title = kind === "success" ? "عضویت نمونه ثبت شد" : kind === "pending" ? "عضویت نمونه در انتظار است" : "خطای عضویت نمونه";
      body = <><ScreenTitle title={title} back="membership" /><View style={kind === "failed" ? styles.errorCard : styles.card}><Row label="نوع عضویت انتخاب‌شده" value={membership} /><Text style={styles.note}>{mockDisclaimer}</Text></View>{kind === "success" ? <Button label="ادامه به آورده" to="contribution" /> : <Button label="بازگشت به عضویت" to="membership" tone="outline" />}</>;
      break;
    }
    case "contribution": body = <><ScreenTitle title="آوردهٔ مستأجر" back="membership" /><View style={styles.card}><Row label="آوردهٔ مستأجر در مدل نمونه" value={mockFinancialModel.contribution} /><Text style={styles.note}>این مبلغ از تأمین مالی تأییدشدهٔ نمونه کسر شده، نه صرفاً از سقف نظری. هیچ پرداختی ایجاد نمی‌شود.</Text></View><Button label="موفقیت نمونه" to="contribution-success" /><Button label="انتظار نمونه" to="contribution-pending" tone="outline" /><Button label="خطای نمونه" to="contribution-failed" tone="danger" /></>; break;
    case "contribution-success": case "contribution-pending": case "contribution-failed": { const contributionSucceeded = screen === "contribution-success"; body = <><ScreenTitle title="نتیجهٔ نمونهٔ آورده" back="contribution" /><View style={screen.endsWith("failed") ? styles.errorCard : styles.card}><Row label="آوردهٔ نمونه" value={mockFinancialModel.contribution} /><Text style={styles.note}>{mockDisclaimer}</Text></View>{contributionSucceeded ? <Button label="تأیید نهایی نمونه" to="final-confirmation" /> : <Button label="بازگشت به آورده" to="contribution" tone="outline" />}</>; break; }
    case "final-confirmation": body = <><ScreenTitle title="تأیید نهایی" back="contribution" /><View style={styles.card}><Text style={styles.body}>تأیید نهایی در این مسیر فقط برای نمایش ناوبری است و قرارداد واقعی نمی‌سازد.</Text><Row label="طرح MOCK" value={financingPlan} /><Row label="عضویت MOCK" value={membership} /></View><Button label="نمایش قرارداد فعال نمونه" to="contract-active" /></>; break;
    case "profile": body = <><ScreenTitle title="حساب من" /><View style={styles.card}><Text style={styles.cardTitle}>حساب MOCK مستأجر</Text><Text style={styles.body}>اطلاعات هویتی یا حساب واقعی در پیش‌نمایش خوانده نمی‌شود.</Text><Text style={styles.note}>{mockDisclaimer}</Text></View><Button label="بازگشت به خانه" to="home" /></>; break;
    case "contract-active": body = <><ScreenTitle title="قرارداد فعال نمونه" /><View style={styles.successCard}><Text style={styles.cardTitle}>قرارداد MOCK</Text><Row label="وضعیت" value="فعال — صرفاً نمایشی" /><Row label="ودیعهٔ نقدی" value={mockFinancialModel.cashDeposit} /><Row label="اجارهٔ ماهانه" value={mockFinancialModel.monthlyRent} /></View><Button label="جزئیات قرارداد نمونه" to="contract-detail" /><Button label="دریافت‌وپرداخت" to="payments" tone="outline" /></>; break;
    case "contract-detail": body = <><ScreenTitle title="جزئیات قرارداد نمونه" back="contract-active" /><View style={styles.card}>{financeRows.slice(0, 3).map(([label, value]) => <Row key={label} label={label} value={value} />)}<Text style={styles.note}>هیچ کد رهگیری، ملک یا قرارداد ثبت‌شده‌ای در این صفحه ادعا نمی‌شود.</Text></View><Button label="بازگشت به قرارداد" to="contract-active" /></>; break;
    case "payments": body = <><ScreenTitle title="دریافت‌وپرداخت" /><View style={styles.card}><Row label="پرداخت ماهانهٔ نمونه (فقط سود)" value={mockFinancialModel.monthlyInterest} /><Text style={styles.note}>اصل وام در صندوق فریز است و برای پوشش تأخیر برداشت نمی‌شود.</Text></View><Button label="رسید نمونه" to="receipt" /><Button label="وضعیت انتظار نمونه" to="payment-pending" tone="outline" /><Button label="خطای نمونه" to="payment-failed" tone="danger" /><Button label="فسخ نمونه" to="payment-terminated" tone="danger" /></>; break;
    case "receipt": body = <><ScreenTitle title="رسید نمونه" back="payments" /><View style={styles.card}><Row label="مبلغ نمونه" value={mockFinancialModel.monthlyInterest} /><Row label="وضعیت" value="رسید نمایشی — پرداخت ثبت نشده" /><Text style={styles.note}>{mockDisclaimer}</Text></View><Button label="بازگشت به پرداخت‌ها" to="payments" /></>; break;
    case "payment-pending": case "payment-failed": case "payment-terminated": { const failed = screen === "payment-failed"; const terminated = screen === "payment-terminated"; body = <><ScreenTitle title={terminated ? "فسخ نمونه" : failed ? "خطای پرداخت نمونه" : "پرداخت نمونه در انتظار"} back="payments" /><View style={failed || terminated ? styles.errorCard : styles.card}><Text style={styles.body}>{terminated ? "سه ماه عدم پرداخت در این صفحه فقط یک حالت نمایشی است؛ بدهی واقعی یا تسویه‌ای محاسبه نمی‌شود." : mockDisclaimer}</Text></View><Button label="بازگشت به پرداخت‌ها" to="payments" /></>; break; }
    default: body = <><ScreenTitle title="خانهٔ مستأجر" /><View style={styles.hero}><Text style={styles.heroTitle}>پیش‌نمایش موبایل مستأجر</Text><Text style={styles.heroText}>مسیر مستقل MOCK برای مرور تجربهٔ کامل؛ دادهٔ واقعی API/OIDC در اینجا خوانده یا تغییر داده نمی‌شود.</Text></View><View style={styles.card}><Row label="معادل ودیعهٔ کامل" value={mockFinancialModel.fullDeposit} /><Row label="پرداخت ماهانه (فقط سود)" value={mockFinancialModel.monthlyInterest} /></View><Button label="ماشین‌حساب و نتیجه" to="calculator" /><Button label="شروع انتخاب طرح" to="financing-plans" tone="outline" /></>;
  }
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>{body}<View style={styles.disclaimer}><Text style={styles.disclaimerText}>{mockDisclaimer}</Text></View></ScrollView><BottomNav active={active} /></SafeAreaView>;
}

const text = { textAlign: "right" as const, writingDirection: "rtl" as const };
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary }, scroll: { padding: 16, gap: 14, paddingBottom: 24 }, titleRow: { flexDirection: "row", gap: 12, alignItems: "center" }, titleGroup: { flex: 1, alignItems: "flex-end" }, mock: { color: colors.accent, fontFamily: fonts.bold, fontSize: 11, ...text }, title: { color: colors.surface, fontFamily: fonts.bold, fontSize: 22, ...text }, card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: 16, gap: 12 }, successCard: { backgroundColor: colors.successSoft, borderRadius: radii.lg, padding: 16, gap: 12 }, errorCard: { backgroundColor: "#FEE2E2", borderRadius: radii.lg, padding: 16, gap: 12 }, hero: { backgroundColor: "#174D46", borderRadius: radii.xl, padding: 20, gap: 8 }, heroTitle: { color: colors.surface, fontFamily: fonts.bold, fontSize: 20, ...text }, heroText: { color: "#D1E7E2", fontFamily: fonts.regular, fontSize: 13, lineHeight: 22, ...text }, cardTitle: { color: colors.primary, fontFamily: fonts.bold, fontSize: 16, ...text }, body: { color: colors.text, fontFamily: fonts.regular, fontSize: 13, lineHeight: 22, ...text }, note: { color: "#56616C", fontFamily: fonts.regular, fontSize: 11, lineHeight: 19, ...text }, row: { flexDirection: "row", justifyContent: "space-between", gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8 }, label: { color: "#56616C", flex: 1, fontFamily: fonts.regular, fontSize: 12, ...text }, value: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 12, textAlign: "left" }, button: { minHeight: 46, borderRadius: radii.md, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" }, primary: { backgroundColor: colors.accent }, outline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary }, danger: { backgroundColor: "#FEE2E2", borderWidth: 1, borderColor: "#B91C1C" }, buttonText: { fontFamily: fonts.semibold, fontSize: 13, ...text }, buttonTextLight: { color: colors.primary }, buttonTextDark: { color: colors.primary }, choice: { minHeight: 48, padding: 12, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md }, choiceSelected: { borderColor: colors.accent, backgroundColor: colors.accentSoft }, choiceText: { color: colors.text, flex: 1, fontFamily: fonts.medium, fontSize: 12, ...text }, radio: { width: 18, height: 18, borderWidth: 2, borderRadius: 9, borderColor: colors.muted }, radioSelected: { borderColor: colors.accent, backgroundColor: colors.accent }, disclaimer: { padding: 12, backgroundColor: "#FFF7ED", borderRadius: radii.md }, disclaimerText: { color: "#9A4F00", fontFamily: fonts.medium, fontSize: 11, lineHeight: 18, ...text }, bottomNav: { height: 80, flexDirection: "row", paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.page, borderTopWidth: 1, borderColor: colors.border }, bottomItem: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", gap: 4 }, bottomLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "center", writingDirection: "rtl" }, bottomLabelActive: { color: colors.accent, fontFamily: fonts.medium },
});
