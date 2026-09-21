import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { colors, fonts, radii } from "@/theme";
import { FigmaSvg } from "@/components/FigmaSvg";
import { BrandLogo } from "@/components/BrandLogo";
import { figmaAssets } from "@/figmaAssets";
import { mockDisclaimer, parseMockAmount, type MockFinancingPlan, type MockMembership } from "./mockTenantData";
import { useMockPreview, type MockContractRole } from "./MockPreviewProvider";

type Props = { screen: string };
function Button({ label, to, tone = "primary" }: { label: string; to: string; tone?: "primary" | "outline" | "danger" }) {
  const router = useRouter();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => router.push(`/preview/${to}`)} style={StyleSheet.flatten([styles.button, styles[tone]])}><Text style={styles.buttonText}>{label}</Text></Pressable>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <View style={styles.row}><Text style={styles.value}>{value}</Text><Text style={styles.label}>{label}</Text></View>;
}

function Choice<T extends string>({ label, value, selected, onPress }: { label: string; value: T; selected: boolean; onPress: (value: T) => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => onPress(value)} style={[styles.choice, selected && styles.choiceSelected]}><View style={[styles.radio, selected && styles.radioSelected]} /> <Text style={styles.choiceText}>{label}</Text></Pressable>;
}

function ContractRoleCard({
  role, selected, onPress, name, maskedNationalId,
}: {
  role: MockContractRole;
  selected: boolean;
  onPress: (role: MockContractRole) => void;
  name: string;
  maskedNationalId: string;
}) {
  const title = role === "Tenant" ? "مستأجر" : "مالک";
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`انتخاب نقش ${title}، ${name}، داده نمایشی`}
      accessibilityState={{ selected }}
      onPress={() => onPress(role)}
      style={[styles.roleCard, selected && styles.roleCardSelected]}
    >
      <View style={styles.roleTitleRow}>
        <Text style={[styles.roleTitle, selected && styles.roleTextSelected]}>{title}</Text>
        <View pointerEvents="none">
          <FigmaSvg uri={selected ? figmaAssets.roleSelected : figmaAssets.roleUnselected} width={16} height={16} />
        </View>
      </View>
      <Text style={[styles.roleName, selected && styles.roleTextSelected]}>{name}</Text>
      <Text style={[styles.roleId, selected && styles.roleTextSelected]}>کد ملی: {maskedNationalId}</Text>
    </Pressable>
  );
}

function BottomNav({ active }: { active: "home" | "payments" | "contracts" | "profile" }) {
  const router = useRouter();
  const items = [
    ["حساب من", "profile", figmaAssets.user],
    ["قراردادها", "contracts", figmaAssets.fileText],
    ["دریافت و پرداخت", "payments", figmaAssets.creditCard],
    ["خانه", "home", figmaAssets.home],
  ] as const;
  return <View style={styles.bottomNav}>{items.map(([label, to, icon]) => {
    const selected = active === to;
    return <Pressable key={to} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} onPress={() => router.push(`/preview/${to}`)} style={styles.bottomItem}><View pointerEvents="none"><FigmaSvg uri={selected && to === "home" ? figmaAssets.homeActive : icon} width={24} height={24} /></View><Text style={[styles.bottomLabel, selected && styles.bottomLabelActive]}>{label}</Text></Pressable>;
  })}</View>;
}

function PreviewSummaryCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  return <View style={styles.homeSummaryCard}><Text style={styles.homeSummaryLabel}>{label}</Text><Text style={styles.homeSummaryValue}>{value}</Text><Text style={styles.homeSummaryCaption}>{caption}</Text></View>;
}

function PreviewShortcut({ label, to, icon }: { label: string; to: string; icon: string }) {
  const router = useRouter();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => router.push(`/preview/${to}`)} style={styles.homeShortcut}><View pointerEvents="none" style={styles.homeShortcutIcon}><FigmaSvg uri={icon} width={20} height={20} /></View><Text style={styles.homeShortcutLabel}>{label}</Text></Pressable>;
}

function ScreenTitle({ title, back = "home" }: { title: string; back?: string }) {
  const router = useRouter();
  return <><View style={styles.previewBrand}><BrandLogo /></View><View style={styles.titleRow}><Pressable accessibilityRole="button" accessibilityLabel="بازگشت" onPress={() => router.push(`/preview/${back}`)} style={styles.titleBack}><View pointerEvents="none"><FigmaSvg uri={figmaAssets.back} width={24} height={40} /></View></Pressable><View style={styles.titleGroup}><Text style={styles.title}>{title}</Text></View></View><Text style={styles.mock}>MOCK • پیش‌نمایش مستقل</Text></>;
}

export function MockTenantScreen({ screen }: Props) {
  const { financingPlan, membership, contractRole, setContractRole, setFinancingPlan, setMembership, financialModel: mockFinancialModel } = useMockPreview();
  const [trackingCode, setTrackingCode] = useState("۱۲۳۴۵۶۷۸۹۰۱۲");
  const [trackingError, setTrackingError] = useState(false);
  const router = useRouter();
  const financeRows = [
  ["ودیعهٔ نقدی", mockFinancialModel.cashDeposit],
  ["اجارهٔ ماهانه", mockFinancialModel.monthlyRent],
  ["معادل ودیعهٔ کامل", mockFinancialModel.fullDeposit],
  ["تأمین مالی ۳۰٪", mockFinancialModel.financing],
  ["آوردهٔ مستأجر", mockFinancialModel.contribution],
] as const;

  const active = screen === "payments" || screen.startsWith("payment-") || screen === "receipt" ? "payments" : screen.startsWith("contract") || screen === "owner-contract" || screen === "contracts" || screen === "final-confirmation" ? "contracts" : screen === "profile" ? "profile" : "home";
  const planChoice = (label: MockFinancingPlan) => <Choice label={`طرح تأمین مالی ${label} — ${mockFinancialModel.financing}`} value={label} selected={financingPlan === label} onPress={setFinancingPlan} />;
  const membershipChoice = (label: MockMembership) => <Choice label={`عضویت ${label} (فقط نمونه)`} value={label} selected={membership === label} onPress={setMembership} />;

  let body: ReactNode;
  switch (screen) {
    case "calculator": body = <><ScreenTitle title="ماشین‌حساب مستأجر" /><View style={styles.card}><Text style={styles.cardTitle}>مدل نمونه C3</Text><Text style={styles.body}>ضریب تبدیل اجاره به رهن: {mockFinancialModel.conversionRate}</Text>{financeRows.slice(0, 3).map(([label, value]) => <Row key={label} label={label} value={value} />)}<Text style={styles.note}>این محاسبه صندوق ۳٪ یا دریافتی مالک ۳٫۵٪ را نمایش نمی‌دهد.</Text></View><Button label="مشاهدهٔ نتیجهٔ نمونه" to="calculator-result" /></>; break;
    case "calculator-result": body = <>
      <ScreenTitle title="نتیجه محاسبه" back="calculator" />
      <Text style={styles.figmaHeading}>محدوده قابل تأمین</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>برآورد C3 — تأمین مالی نمونه</Text>
        <Row label="مبلغ قابل تأمین (۳۰٪)" value={mockFinancialModel.financing} />
        <Row label="آورده موردنیاز شما" value={mockFinancialModel.contribution} />
        <Row label="معادل ودیعه کامل" value={mockFinancialModel.fullDeposit} />
        <Row label="اجاره ماهانه قرارداد" value={mockFinancialModel.monthlyRent} />
        <Row label="پرداخت ماهانه تأمین مالی (فقط سود)" value={mockFinancialModel.monthlyInterest} />
        <Row label="نرخ اسمی سالانه نمونه" value={mockFinancialModel.annualRate} />
        <Text style={styles.note}>طبق مدل تأییدشده C3؛ این رقم صرفاً برآورد است و تأیید یا تخصیص بانک نیست. بازپرداخت اصل، مطابق قرارداد بانک خواهد بود.</Text>
      </View>
      <View style={styles.softCard}>
        <Text style={styles.cardTitle}>مرحله بعد: قرارداد خودنویس</Text>
        <Text style={styles.body}>برای ورود به مسیر نمونه انتخاب طرح، کد رهگیری نمونه قرارداد را وارد کنید. هیچ استعلام واقعی انجام نمی‌شود.</Text>
      </View>
      <Button label="ثبت کد رهگیری قرارداد" to="contract-tracking" />
      <Button label="محاسبه مجدد" to="calculator" tone="outline" />
    </>; break;
    case "contract-tracking": body = <>
      <ScreenTitle title="ثبت قرارداد" back="calculator-result" />
      <Text style={styles.figmaHeading}>کد رهگیری قرارداد را وارد کنید</Text>
      <Text style={styles.figmaIntro}>کد رهگیری ثبت‌شده در سامانه خودنویس در این پیش‌نمایش فقط به‌صورت نمونه استفاده می‌شود؛ استعلام واقعی انجام نمی‌شود.</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>کد رهگیری خودنویس (نمونه)</Text>
        <TextInput accessibilityLabel="کد رهگیری نمونه" keyboardType="number-pad" value={trackingCode} onChangeText={value => { setTrackingCode(value); setTrackingError(false); }} style={styles.trackInput} />
        <Text style={styles.note}>کد نمایشی ۱۲ رقمی از پیش وارد شده است. ورود کد شما باعث ارسال به هیچ سامانه‌ای نمی‌شود.</Text>
        {trackingError && <Text style={styles.errorText}>برای ادامه، از کد نمونهٔ ۱۲ رقمی نمایش‌داده‌شده استفاده کنید؛ استعلام واقعی فعال نیست.</Text>}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>پس از استعلام چه اتفاقی می‌افتد؟ (صرفاً توضیح فرایند آینده)</Text>
        <Text style={styles.body}>۱. دریافت اطلاعات قرارداد از خودنویس؛ ۲. تطبیق هویت طرفین؛ ۳. انتخاب نقش در قرارداد. این مراحل هنوز در MOCK به سرویس واقعی متصل نیستند.</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="نمایش نتیجه نمایشی قرارداد" style={StyleSheet.flatten([styles.button, styles.primary])} onPress={() => {
        if (parseMockAmount(trackingCode) !== 123456789012) setTrackingError(true);
        else router.push("/preview/contract-lookup");
      }}><Text style={styles.buttonText}>نمایش نتیجه نمونه استعلام قرارداد</Text></Pressable>
      <Button label="بازگشت به نتیجه محاسبه" to="calculator-result" tone="outline" />
    </>; break;
    case "contract-lookup": body = <>
      <View style={styles.homeLogo}><BrandLogo /></View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>نقش خود را در این قرارداد انتخاب کنید</Text>
        <Text style={styles.note}>در فیگما مشخصات طرفین از خودنویس دریافت می‌شود؛ در این پیش‌نمایش نام‌ها و کدهای ملی پوشیده صرفاً نمونه هستند و هیچ استعلامی انجام نشده است.</Text>
        <View style={styles.roleCards}>
          <ContractRoleCard role="Owner" name="محمد رضایی" maskedNationalId="۰۰۲•••••۴۵۶" selected={contractRole === "Owner"} onPress={setContractRole} />
          <ContractRoleCard role="Tenant" name="علی رضایی" maskedNationalId="۰۰۱•••••۷۸۹" selected={contractRole === "Tenant"} onPress={setContractRole} />
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>مشخصات کلی قرارداد</Text>
        <Row label="کد رهگیری نمونه" value="۱۲۳۴۵۶۷۸۹۰۱۲" />
        <Row label="تاریخ شروع نمونه" value="۱۵ مهر ۱۴۰۵" />
        <Row label="تاریخ پایان نمونه" value="۱۵ مهر ۱۴۰۶" />
        <Row label="مبلغ رهن" value={mockFinancialModel.cashDeposit} />
        <Row label="اجاره ماهانه" value={mockFinancialModel.monthlyRent} />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ملک قرارداد</Text>
        <Text style={styles.note}>آدرس ملک نمونه، نه نتیجه استعلام واقعی</Text>
        <Text style={styles.body}>تهران، سعادت‌آباد، خیابان نمونه، پلاک ۲۴، واحد ۳</Text>
        <Row label="کدپستی نمونه" value="۱۹۹۸۷۶۵۴۳۲" />
        <Row label="پلاک" value="۲۴" />
        <Row label="واحد" value="۳" />
      </View>
      <View style={styles.roleNotice}>
        <Text style={styles.roleNoticeText}>{contractRole === "Tenant"
          ? "در مرحله بعد، طرح‌های تأمین مالی سناریوی مستأجر نمایش داده می‌شوند."
          : "در مرحله بعد، خلاصه قرارداد نمونه مالک نمایش داده می‌شود؛ طرح و تعهد سود مستأجر به مالک نسبت داده نمی‌شود."}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`تأیید نقش ${contractRole === "Tenant" ? "مستأجر" : "مالک"} و ادامه`}
        style={[styles.button, styles.roleContinue]}
        onPress={() => router.push(contractRole === "Tenant" ? "/preview/financing-plans" : "/preview/owner-contract")}
      >
        <Text style={styles.buttonText}>تأیید نقش {contractRole === "Tenant" ? "مستأجر" : "مالک"} و ادامه</Text>
      </Pressable>
      <Button label="اصلاح کد رهگیری" to="contract-tracking" tone="outline" />
    </>; break;
    case "owner-contract": body = <>
      <ScreenTitle title="قرارداد مالک • پیش‌نمایش" back="contract-lookup" />
      <View style={styles.card}>
        <Text style={styles.cardTitle}>خلاصه قرارداد نمونه مالک</Text>
        <Text style={styles.body}>نقش انتخاب‌شده: مالک نمونه (محمد رضایی)</Text>
        <Row label="رهن قرارداد" value={mockFinancialModel.cashDeposit} />
        <Row label="اجاره ماهانه قرارداد" value={mockFinancialModel.monthlyRent} />
        <Text style={styles.note}>این فقط نمای مالک برای مرور انتخاب نقش است. اجاره قرارداد مالک با سود وام مستأجر یکی نیست؛ هیچ دریافتی، سرمایه‌گذاری، تسویه یا پرداخت بانکی در این صفحه انجام نمی‌شود.</Text>
      </View>
      <View style={styles.roleNotice}><Text style={styles.roleNoticeText}>برای مشاهده طرح‌های تأمین مالی مستأجر، به انتخاب نقش برگردید و «مستأجر» را انتخاب کنید. مسیر عملیاتی مالک در این پیش‌نمایش متصل نشده است.</Text></View>
      <Button label="بازگشت به انتخاب نقش" to="contract-lookup" />
      <Button label="بازگشت به خانه پیش‌نمایش" to="home" tone="outline" />
    </>; break;
    case "financing-plans": body = <>
      <ScreenTitle title="انتخاب طرح تأمین مالی" back="contract-lookup" />
      <Text style={styles.figmaHeading}>طرح‌های قابل استفاده برای شما</Text>
      <Text style={styles.figmaIntro}>دو انتخاب صرفاً نمایشی برای بررسی تجربه کاربری؛ واجد شرایط بودن نزد بانک استعلام نشده است.</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>طرح ویژه کارکنان سازمان (نمونه)</Text>
        <Row label="تأمین مالی سناریوی C3" value={mockFinancialModel.financing} />
        <Row label="آورده موردنیاز" value={mockFinancialModel.contribution} />
        <Row label="نرخ اسمی سالانه نمونه" value={mockFinancialModel.annualRate} />
        <Row label="پرداخت ماهانه فقط سود" value={mockFinancialModel.monthlyInterest} />
        {planChoice("ویژهٔ نمونه")}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>طرح عمومی تأمین مسکن (نمونه)</Text>
        <Row label="تأمین مالی سناریوی C3" value={mockFinancialModel.financing} />
        <Row label="آورده موردنیاز" value={mockFinancialModel.contribution} />
        <Row label="پرداخت ماهانه فقط سود" value={mockFinancialModel.monthlyInterest} />
        {planChoice("عمومی")}
      </View>
      <Text style={styles.figmaIntro}>نوع طرح تأمین مالی مستقل از نوع عضویت است. نرخ‌های قدیمی فیگما و تخفیف ادعایی در این نمونه اعمال نمی‌شوند.</Text>
      <Button label="تأیید طرح و ادامه" to="plan-confirmation" />
    </>; break;
    case "plan-confirmation": body = <>
      <ScreenTitle title="تأیید درخواست" back="financing-plans" />
      <Text style={styles.figmaHeading}>جزئیات درخواست خود را بررسی کنید</Text>
      <Text style={styles.figmaIntro}>پیش از ارسال نمونه، شرایط طرح انتخاب‌شده را بررسی کنید.</Text>
      <View style={styles.card}><Text style={styles.cardTitle}>طرح انتخاب‌شده</Text><Row label="طرح" value={financingPlan} /><Text style={styles.note}>بانک و نرخ اختصاصی طرح هنوز در پیش‌نمایش تعریف عملیاتی ندارند.</Text></View>
      <View style={styles.card}><Text style={styles.cardTitle}>خلاصه مالی طرح</Text>{financeRows.map(([label,value]) => <Row key={label} label={label} value={value} />)}<Row label="نرخ اسمی نمونه" value={mockFinancialModel.annualRate} /><Row label="پرداخت ماهانه فقط سود" value={mockFinancialModel.monthlyInterest} /></View>
      <View style={styles.card}><Text style={styles.cardTitle}>پس از ارسال درخواست</Text><Text style={styles.body}>بررسی قرارداد ← بررسی اعتبار ← تصمیم بانک ← اعلام نتیجه در چارخونه. در این نسخه همه مراحل MOCK هستند.</Text></View>
      <Button label="ارسال نمونه برای بررسی" to="review" />
    </>; break;
    case "review": body = <>
      <ScreenTitle title="وضعیت درخواست" back="plan-confirmation" />
      <View style={styles.card}><Text style={styles.cardTitle}>درخواست نمونه ثبت شد</Text><Text style={styles.body}>درخواست تأمین مالی فقط در پیش‌نمایش در حال بررسی است؛ هیچ اطلاعاتی به بانک ارسال نشده.</Text><Row label="وضعیت" value="در حال بررسی • MOCK" /></View>
      <View style={styles.card}><Text style={styles.cardTitle}>خلاصه درخواست</Text><Row label="طرح انتخاب‌شده" value={financingPlan} /><Row label="مبلغ درخواست" value={mockFinancialModel.financing} /><Row label="آورده موردنیاز" value={mockFinancialModel.contribution} /></View>
      <Button label="نمایش تأیید نمونه" to="approved" />
      <Button label="نمایش رد نمونه" to="rejected" tone="danger" />
      <Button label="بازگشت به خانه" to="home" tone="outline" />
    </>; break;
    case "approved": body = <>
      <ScreenTitle title="وضعیت درخواست" back="review" />
      <View style={styles.successCard}><Text style={styles.cardTitle}>درخواست تأمین مالی شما در نمونه تأیید شد</Text><Text style={styles.body}>این تأیید نمایشی است، نه تأیید بانک. برای ادامه، عضویت نمونه چارخونه را انتخاب کنید.</Text></View>
      <View style={styles.card}><Text style={styles.cardTitle}>مرحله بعد: عضویت چارخونه</Text><Row label="وضعیت" value="نیازمند اقدام نمونه" /><Row label="مبلغ تأمین مالی نمونه" value={mockFinancialModel.financing} /><Row label="آورده موردنیاز" value={mockFinancialModel.contribution} /><Row label="پرداخت ماهانه فقط سود" value={mockFinancialModel.monthlyInterest} /></View>
      <Button label="ادامه به عضویت چارخونه" to="membership" />
    </>; break;
    case "rejected": body = <>
      <ScreenTitle title="وضعیت درخواست" back="review" />
      <View style={styles.errorCard}><Text style={styles.cardTitle}>درخواست تأمین مالی در سناریوی نمونه تأیید نشد</Text><Text style={styles.body}>این وضعیت فقط برای مرور مسیر رد است؛ تصمیمی از بانک دریافت نشده.</Text></View>
      <View style={styles.card}><Text style={styles.cardTitle}>خلاصه درخواست</Text><Row label="طرح انتخاب‌شده" value={financingPlan} /><Row label="مبلغ نمونه" value={mockFinancialModel.financing} /><Text style={styles.note}>دلیل واقعی بانک و سایر طرح‌های قابل استفاده در این نسخه وجود ندارند.</Text></View>
      <Button label="بازگشت به طرح‌های تأمین مالی" to="financing-plans" />
      <Button label="بازگشت به قراردادها" to="contracts" tone="outline" />
    </>; break;
    case "membership": body = <>
      <ScreenTitle title="عضویت چارخونه" back="approved" />
      <Text style={styles.figmaHeading}>طرح‌های عضویت در دسترس</Text>
      <Text style={styles.figmaIntro}>حق عضویت، سقف تأمین مالی و تعداد استفاده در این صفحه فقط برای سناریوی نمایشی هستند.</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>طرح ۱ بار استفاده</Text>
        <Row label="سقف تأمین مالی عضویت" value="تا ۵۰۰٬۰۰۰٬۰۰۰ تومان" />
        <Row label="حق عضویت نمونه" value="۲٬۵۰۰٬۰۰۰ تومان" />
        {membershipChoice("۱ بار استفاده")}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>طرح ۲ بار استفاده</Text>
        <Row label="سقف تأمین مالی عضویت" value="تا ۷۵۰٬۰۰۰٬۰۰۰ تومان" />
        <Row label="حق عضویت نمونه" value="۴٬۰۰۰٬۰۰۰ تومان" />
        {membershipChoice("۲ بار استفاده")}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>طرح ۳ بار استفاده</Text>
        <Row label="سقف تأمین مالی عضویت" value="تا ۱٬۰۰۰٬۰۰۰٬۰۰۰ تومان" />
        <Row label="حق عضویت نمونه" value="۵٬۵۰۰٬۰۰۰ تومان" />
        {membershipChoice("۳ بار استفاده")}
      </View>
      <Text style={styles.figmaIntro}>نوع عضویت مستقل از طرح تأمین مالی «{financingPlan}» باقی می‌ماند. هیچ مبلغی دریافت نمی‌شود.</Text>
      <Button label="نمایش نتیجه موفق عضویت نمونه" to="membership-success" />
      <Button label="وضعیت انتظار نمونه" to="membership-pending" tone="outline" />
      <Button label="خطای نمونه" to="membership-failed" tone="danger" />
    </>; break;
    case "membership-success": case "membership-pending": case "membership-failed": {
      const kind = screen.split("-")[1]; const title = kind === "success" ? "عضویت نمونه ثبت شد" : kind === "pending" ? "عضویت نمونه در انتظار است" : "خطای عضویت نمونه";
      body = <><ScreenTitle title={title} back="membership" /><View style={kind === "failed" ? styles.errorCard : styles.card}><Row label="نوع عضویت انتخاب‌شده" value={membership} /><Text style={styles.note}>{mockDisclaimer}</Text></View>{kind === "success" ? <Button label="ادامه به آورده" to="contribution" /> : <Button label="بازگشت به عضویت" to="membership" tone="outline" />}</>;
      break;
    }
    case "contribution": body = <>
      <ScreenTitle title="وضعیت درخواست" back="membership-success" />
      <View style={styles.card}><Text style={styles.cardTitle}>پرداخت آورده</Text><Text style={styles.body}>عضویت نمونه {membership} انتخاب شده است. برای ادامه، آورده موردنیاز قرارداد را در مسیر MOCK بررسی کنید.</Text><Row label="آورده شما" value={mockFinancialModel.contribution} /><Row label="وضعیت" value="در انتظار پرداخت • نمایشی" /></View>
      <View style={styles.card}><Text style={styles.cardTitle}>شرایط نمونه تأمین مالی</Text><Row label="مبلغ تأمین مالی" value={mockFinancialModel.financing} /><Row label="پرداخت ماهانه فقط سود" value={mockFinancialModel.monthlyInterest} /><Row label="نرخ اسمی سالانه" value={mockFinancialModel.annualRate} /></View>
      <Button label="نمایش موفقیت پرداخت نمونه آورده" to="contribution-success" />
      <Button label="وضعیت انتظار نمونه" to="contribution-pending" tone="outline" />
      <Button label="خطای نمونه" to="contribution-failed" tone="danger" />
    </>; break;
    case "contribution-success": case "contribution-pending": case "contribution-failed": { const contributionSucceeded = screen === "contribution-success"; body = <><ScreenTitle title="نتیجهٔ نمونهٔ آورده" back="contribution" /><View style={screen.endsWith("failed") ? styles.errorCard : styles.card}><Row label="آوردهٔ نمونه" value={mockFinancialModel.contribution} /><Text style={styles.note}>{mockDisclaimer}</Text></View>{contributionSucceeded ? <Button label="تأیید نهایی نمونه" to="final-confirmation" /> : <Button label="بازگشت به آورده" to="contribution" tone="outline" />}</>; break; }
    case "final-confirmation": body = <>
      <ScreenTitle title="وضعیت درخواست" back="contribution-success" />
      <View style={styles.card}><Text style={styles.cardTitle}>آورده نمونه پرداخت شد</Text><Text style={styles.body}>در ادامه مسیر نمونه، تأیید نهایی طرفین قرارداد لازم است؛ تأیید، واریز یا قراردادی در واقعیت ایجاد نشده است.</Text><Row label="مبلغ آورده نمونه" value={mockFinancialModel.contribution} /></View>
      <View style={styles.card}><Text style={styles.cardTitle}>تأیید نهایی طرفین</Text><Row label="مستأجر" value="تأیید نمایشی" /><Row label="مالک" value="در انتظار تأیید نمایشی" /><Row label="طرح تأمین مالی" value={financingPlan} /><Row label="عضویت" value={membership} /></View>
      <Button label="نمایش قرارداد فعال نمونه" to="contract-active" />
      <Button label="بازگشت به خانه" to="home" tone="outline" />
    </>; break;
    case "profile": body = <>
      <ScreenTitle title="حساب من" />
      <View style={styles.card}><Text style={styles.cardTitle}>کاربر پیش‌نمایش مستأجر</Text><Text style={styles.body}>اطلاعات این حساب، هویت یا شماره موبایل واقعی نیست.</Text></View>
      <View style={styles.card}><Text style={styles.cardTitle}>اطلاعات حساب نمونه</Text><Row label="نقش" value="مستأجر • MOCK" /><Row label="وضعیت عضویت نمایشی" value={membership} /><Row label="طرح تأمین مالی نمایشی" value={financingPlan} /></View>
      <View style={styles.card}><Text style={styles.cardTitle}>عضویت چارخونه</Text><Row label="سقف تأمین مالی سناریوی C3" value={mockFinancialModel.financing} /><Text style={styles.note}>هیچ عضویت، شماره شبا یا اطلاعات هویتی واقعی بارگذاری نشده است.</Text></View>
      <Button label="مشاهده عضویت نمونه" to="membership" />
      <Button label="بازگشت به خانه" to="home" tone="outline" />
    </>; break;
    case "contracts": body = <>
      <ScreenTitle title="قراردادهای من" />
      <Text style={styles.figmaHeading}>قراردادهای ثبت‌شده شما در چارخونه (MOCK)</Text>
      <View style={styles.card}><Text style={styles.cardTitle}>قرارداد نمونه مستأجر</Text><Row label="وضعیت" value="نمونه نمایشی • ثبت نشده" /><Row label="مبلغ رهن" value={mockFinancialModel.cashDeposit} /><Row label="اجاره ماهانه" value={mockFinancialModel.monthlyRent} /><Row label="تأمین مالی سناریوی C3" value={mockFinancialModel.financing} /><Button label="مشاهده قرارداد نمونه" to="contract-detail" /></View>
      <View style={styles.card}><Text style={styles.cardTitle}>ثبت قرارداد جدید</Text><Text style={styles.body}>برای پیمودن نمونه مسیر خودنویس، از کد رهگیری نمایشی استفاده کنید.</Text><Button label="ثبت کد رهگیری نمونه" to="contract-tracking" tone="outline" /></View>
    </>; break;
    case "contract-active": body = <>
      <ScreenTitle title="قرارداد فعال نمونه" back="contracts" />
      <View style={styles.successCard}><Text style={styles.cardTitle}>قرارداد مستأجر • MOCK</Text><Row label="وضعیت" value="فعال در سناریوی نمایشی" /><Row label="ودیعه نقدی" value={mockFinancialModel.cashDeposit} /><Row label="اجاره ماهانه" value={mockFinancialModel.monthlyRent} /><Row label="مبلغ تأمین مالی" value={mockFinancialModel.financing} /><Text style={styles.note}>قرارداد واقعی یا وام تخصیص‌یافته در این صفحه ادعا نمی‌شود.</Text></View>
      <Button label="جزئیات قرارداد نمونه" to="contract-detail" />
      <Button label="دریافت و پرداخت" to="payments" tone="outline" />
    </>; break;
    case "contract-detail": body = <>
      <ScreenTitle title="جزئیات قرارداد" back="contracts" />
      <View style={styles.card}><Text style={styles.cardTitle}>ملک و طرفین قرارداد نمایشی</Text><Text style={styles.body}>قرارداد نمونه مستأجر — برای مرور قالب فیگما؛ به خودنویس متصل نیست.</Text><Row label="نقش" value="مستأجر • نمونه" /><Row label="کد رهگیری" value="۱۲۳۴۵۶۷۸۹۰۱۲ (MOCK)" /></View>
      <View style={styles.card}><Text style={styles.cardTitle}>شرایط مالی قرارداد</Text>{financeRows.map(([label,value]) => <Row key={label} label={label} value={value} />)}</View>
      <View style={styles.card}><Text style={styles.cardTitle}>تعهد ماهانه مستأجر</Text><Row label="اجاره ماهانه قرارداد" value={mockFinancialModel.monthlyRent} /><Row label="پرداخت ماهانه تأمین مالی (فقط سود)" value={mockFinancialModel.monthlyInterest} /><Text style={styles.note}>این دو جریان مستقل‌اند؛ اصل وام تابع قرارداد نهایی بانک است.</Text></View>
      <Button label="مشاهده دریافت و پرداخت" to="payments" />
      <Button label="مشاهده طرح تأمین مالی" to="financing-plans" tone="outline" />
    </>; break;
    case "payments": body = <>
      <ScreenTitle title="دریافت و پرداخت" />
      <View style={styles.card}>
        <Text style={styles.cardTitle}>پرداخت بعدی • MOCK</Text>
        <Row label="پرداخت ماهانه تأمین مالی (فقط سود)" value={mockFinancialModel.monthlyInterest} />
        <Row label="اجاره ماهانه قرارداد؛ مستقل" value={mockFinancialModel.monthlyRent} />
        <Text style={styles.note}>هیچ سررسید، وصول، وضعیت بدهی یا پرداخت واقعی ثبت نشده است.</Text>
        <Button label="نمایش وضعیت انتظار پرداخت نمونه" to="payment-pending" />
      </View>
      <View style={styles.card}><Text style={styles.cardTitle}>وضعیت پرداخت‌های قرارداد</Text><Text style={styles.body}>در مسیر MOCK، سابقه پرداخت واقعی وجود ندارد. برای مشاهده قالب رسید می‌توانی رسید نمایشی را باز کنی.</Text><Button label="مشاهده رسید نمونه" to="receipt" tone="outline" /></View>
      <View style={styles.card}><Text style={styles.cardTitle}>حالت‌های نمایشی پرداخت</Text><Button label="خطای پرداخت نمونه" to="payment-failed" tone="danger" /><Button label="فسخ نمونه" to="payment-terminated" tone="outline" /></View>
    </>; break;
    case "receipt": body = <>
      <ScreenTitle title="رسید پرداخت" back="payments" />
      <View style={styles.card}><Text style={styles.cardTitle}>رسید صرفاً نمایشی</Text><Row label="مبلغ نمونه (فقط سود)" value={mockFinancialModel.monthlyInterest} /><Row label="وضعیت" value="پرداخت ثبت نشده" /><Text style={styles.note}>{mockDisclaimer}</Text></View>
      <Button label="بازگشت به دریافت و پرداخت" to="payments" />
    </>; break;
    case "payment-pending": case "payment-failed": case "payment-terminated": { const failed = screen === "payment-failed"; const terminated = screen === "payment-terminated"; body = <><ScreenTitle title={terminated ? "فسخ نمونه" : failed ? "خطای پرداخت نمونه" : "پرداخت نمونه در انتظار"} back="payments" /><View style={failed || terminated ? styles.errorCard : styles.card}><Text style={styles.body}>{terminated ? "سه ماه عدم پرداخت در این صفحه فقط یک حالت نمایشی است؛ بدهی واقعی یا تسویه‌ای محاسبه نمی‌شود." : mockDisclaimer}</Text></View><Button label="بازگشت به پرداخت‌ها" to="payments" /></>; break; }
    default: body = <>
      <View style={styles.homeLogo}><BrandLogo /></View>
      <View style={styles.homeHeader}>
        <View style={styles.homeBell}><FigmaSvg uri={figmaAssets.bell} width={20} height={20} /></View>
        <View style={styles.homeGreeting}><Text style={styles.homeGreetingTitle}>سلام، کاربر پیش‌نمایش</Text><Text style={styles.homeGreetingCaption}>به چارخونه خوش آمدید • MOCK</Text></View>
      </View>
      <View style={styles.homeGrid}>
        <View style={styles.homeSummaryRow}>
          <PreviewSummaryCard label="میزان قابل تأمین" value={mockFinancialModel.financing} caption="سناریوی نمونه C3 • نه تأیید بانک" />
          <PreviewSummaryCard label="اعتبار شما" value="رتبه C3 (نمونه)" caption="استعلام اعتبار واقعی انجام نشده" />
        </View>
        <View style={styles.homeSummaryRow}>
          <PreviewSummaryCard label="وضعیت قرارداد" value="قرارداد نمونه" caption="هیچ قرارداد خودنویسی ثبت نشده" />
          <PreviewSummaryCard label="پرداخت ماهانه" value={mockFinancialModel.monthlyInterest} caption="فقط سود نمونه • نه بدهی واقعی" />
        </View>
      </View>
      <View style={styles.homeAction}>
        <Text style={styles.homeActionTitle}>اقدام بعدی شما</Text>
        <Text style={styles.homeActionCopy}>شرایط نمونه تأمین مالی را بررسی کنید یا به سناریوی نمایشی قرارداد بروید. هیچ درخواستی برای بانک ارسال نمی‌شود.</Text>
        <View style={styles.homeActionButtons}>
          <View style={styles.homeHalfButton}><Button label="ثبت کد رهگیری" to="contract-tracking" tone="outline" /></View>
          <View style={styles.homeHalfButton}><Link href="/preview/calculator" style={StyleSheet.flatten([styles.button, styles.primary, styles.linkButton])}>محاسبه شرایط</Link></View>
        </View>
      </View>
      <Text style={styles.homeSectionTitle}>دسترسی سریع</Text>
      <View style={styles.homeQuickRow}>
        <PreviewShortcut label="ماشین‌حساب" to="calculator" icon={figmaAssets.calculator} />
        <PreviewShortcut label="دریافت و پرداخت" to="payments" icon={figmaAssets.wallet} />
        <PreviewShortcut label="قراردادها" to="contracts" icon={figmaAssets.file} />
        <PreviewShortcut label="املاک من" to="contracts" icon={figmaAssets.home} />
      </View>
      <View style={styles.homeNotice}><FigmaSvg uri={figmaAssets.info} width={16} height={16} /><Text style={styles.homeNoticeText}>پیش‌نمایش مستقل MOCK: ارقام مثال C3 هستند، نه وضعیت حساب یا پرداخت واقعی شما.</Text></View>
    </>;
  }
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>{body}<View style={styles.disclaimer}><Text style={styles.disclaimerText}>{mockDisclaimer}</Text></View></ScrollView>{screen !== "contract-lookup" && screen !== "owner-contract" && <BottomNav active={active} />}</SafeAreaView>;
}

const text = { textAlign: "right" as const, writingDirection: "rtl" as const };
const styles = StyleSheet.create({
  roleCards: { flexDirection: "row", gap: 12 },
  roleCard: { flex: 1, minWidth: 0, minHeight: 114, padding: 12, gap: 8, borderRadius: 12, borderColor: colors.border, borderWidth: 1, alignItems: "flex-end", backgroundColor: colors.surface },
  roleCardSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleTitleRow: { width: "100%", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 8 },
  roleTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14, ...text },
  roleName: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14, ...text },
  roleId: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, ...text },
  roleTextSelected: { color: colors.surface },
  roleNotice: { padding: 12, backgroundColor: colors.successSoft, borderRadius: 8, alignItems: "flex-end" },
  roleNoticeText: { color: colors.primary, fontFamily: fonts.regular, fontSize: 11, lineHeight: 18, ...text },
  roleContinue: { backgroundColor: colors.page, minHeight: 48 },
  homeLogo: { height: 60, alignItems: "flex-end" },
  homeHeader: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
  homeBell: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  homeGreeting: { flex: 1, alignItems: "flex-end", gap: 2 },
  homeGreetingTitle: { color: colors.page, fontFamily: fonts.semibold, fontSize: 16, ...text },
  homeGreetingCaption: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, ...text },
  homeGrid: { gap: 12 },
  homeSummaryRow: { flexDirection: "row", gap: 12 },
  homeSummaryCard: { flex: 1, minWidth: 0, minHeight: 110, padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "flex-end", gap: 5 },
  homeSummaryLabel: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12, ...text },
  homeSummaryValue: { width: "100%", color: colors.primary, fontFamily: fonts.medium, fontSize: 12, ...text },
  homeSummaryCaption: { width: "100%", color: colors.muted, fontFamily: fonts.regular, fontSize: 10, lineHeight: 17, ...text },
  homeAction: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, gap: 12 },
  homeActionTitle: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 16, ...text },
  homeActionCopy: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 22, ...text },
  homeActionButtons: { flexDirection: "row", gap: 12 },
  homeHalfButton: { flex: 1, minWidth: 0 },
  homeSectionTitle: { color: colors.page, fontFamily: fonts.semibold, fontSize: 16, ...text },
  homeQuickRow: { flexDirection: "row", gap: 8 },
  homeShortcut: { flex: 1, minWidth: 0, minHeight: 92, paddingVertical: 12, paddingHorizontal: 3, borderRadius: 12, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center", gap: 8 },
  homeShortcutIcon: { width: 40, height: 40, backgroundColor: colors.page, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  homeShortcutLabel: { color: colors.text, fontFamily: fonts.medium, fontSize: 10, textAlign: "center", writingDirection: "rtl" },
  homeNotice: { padding: 12, gap: 8, borderRadius: 8, backgroundColor: colors.successSoft, flexDirection: "row-reverse", alignItems: "flex-start", justifyContent: "flex-end" },
  homeNoticeText: { flex: 1, minWidth: 0, color: colors.primary, fontFamily: fonts.regular, fontSize: 11, lineHeight: 18, textAlign: "right", writingDirection: "rtl" },
  previewBrand: { height: 60, alignItems: "flex-end", paddingHorizontal: 16 },
  titleBack: { height: 44, width: 40, justifyContent: "center", alignItems: "center", transform: [{ rotate: "180deg" }] },
  trackInput: { minHeight: 48, borderRadius: 10, borderWidth: 1, borderColor: colors.border, color: colors.primary, paddingHorizontal: 12, textAlign: "right", fontFamily: fonts.medium, fontSize: 18 },
  softCard: { backgroundColor: colors.page, borderRadius: 12, padding: 14, gap: 8 },
  figmaHeading: { color: colors.page, fontFamily: fonts.bold, fontSize: 18, ...text },
  figmaIntro: { color: colors.page, fontFamily: fonts.regular, fontSize: 12, lineHeight: 21, ...text },
  errorText: { color: "#B91C1C", fontFamily: fonts.medium, fontSize: 12, ...text },
  safe: { flex: 1, backgroundColor: colors.primary }, scroll: { padding: 16, gap: 14, paddingBottom: 24 }, titleRow: { minHeight: 56, paddingHorizontal: 16, flexDirection: "row", backgroundColor: colors.surface, gap: 12, alignItems: "center" }, titleGroup: { flex: 1, alignItems: "flex-end" }, mock: { color: colors.accent, fontFamily: fonts.bold, fontSize: 10, paddingHorizontal: 16, paddingTop: 8, ...text }, title: { color: colors.text, fontFamily: fonts.semibold, fontSize: 18, ...text }, card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: 16, gap: 12 }, successCard: { backgroundColor: colors.successSoft, borderRadius: radii.lg, padding: 16, gap: 12 }, errorCard: { backgroundColor: "#FEE2E2", borderRadius: radii.lg, padding: 16, gap: 12 }, hero: { backgroundColor: "#174D46", borderRadius: radii.xl, padding: 20, gap: 8 }, heroTitle: { color: colors.surface, fontFamily: fonts.bold, fontSize: 20, ...text }, heroText: { color: "#D1E7E2", fontFamily: fonts.regular, fontSize: 13, lineHeight: 22, ...text }, cardTitle: { color: colors.primary, fontFamily: fonts.bold, fontSize: 16, ...text }, body: { color: colors.text, fontFamily: fonts.regular, fontSize: 13, lineHeight: 22, ...text }, note: { color: "#56616C", fontFamily: fonts.regular, fontSize: 11, lineHeight: 19, ...text }, row: { flexDirection: "row", justifyContent: "space-between", gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8 }, label: { color: "#56616C", flex: 1, fontFamily: fonts.regular, fontSize: 12, ...text }, value: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 12, textAlign: "left" }, button: { minHeight: 46, borderRadius: radii.md, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" }, linkButton: { display: "flex", textAlign: "center", textAlignVertical: "center", fontFamily: fonts.semibold, fontSize: 13, lineHeight: 46, color: colors.primary, textDecorationLine: "none" }, primary: { backgroundColor: colors.accent }, outline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary }, danger: { backgroundColor: "#FEE2E2", borderWidth: 1, borderColor: "#B91C1C" }, buttonText: { fontFamily: fonts.semibold, fontSize: 13, ...text }, buttonTextLight: { color: colors.primary }, buttonTextDark: { color: colors.primary }, choice: { minHeight: 48, padding: 12, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md }, choiceSelected: { borderColor: colors.accent, backgroundColor: colors.accentSoft }, choiceText: { color: colors.text, flex: 1, fontFamily: fonts.medium, fontSize: 12, ...text }, radio: { width: 18, height: 18, borderWidth: 2, borderRadius: 9, borderColor: colors.muted }, radioSelected: { borderColor: colors.accent, backgroundColor: colors.accent }, disclaimer: { padding: 12, backgroundColor: "#FFF7ED", borderRadius: radii.md }, disclaimerText: { color: "#9A4F00", fontFamily: fonts.medium, fontSize: 11, lineHeight: 18, ...text }, bottomNav: { height: 80, flexDirection: "row", paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.page, borderTopWidth: 1, borderColor: colors.border }, bottomItem: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", gap: 4 }, bottomLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "center", writingDirection: "rtl" }, bottomLabelActive: { color: colors.accent, fontFamily: fonts.medium },
});
