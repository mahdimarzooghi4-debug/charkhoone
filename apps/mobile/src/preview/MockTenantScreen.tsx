import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { colors, fonts, radii } from "@/theme";
import { FigmaSvg } from "@/components/FigmaSvg";
import Svg, { Path } from "react-native-svg";
import { financingGaugeProgress } from "../../../web/src/lib/sharedFinanceCalculator";
import { MOCK_CASH_DEPOSIT_MAX, MOCK_MONTHLY_RENT_MAX } from "./mockTenantData";
import { BrandLogo } from "@/components/BrandLogo";
import { figmaAssets } from "@/figmaAssets";
import { mockDisclaimer, parseMockAmount, type MockFinancingPlan, type MockMembership } from "./mockTenantData";
import { useMockPreview, type MockContractRole } from "./MockPreviewProvider";

type Props = { screen: string };
function Button({ label, to, tone = "primary" }: { label: string; to: string; tone?: "primary" | "outline" | "danger" | "brand" | "light" }) {
  const router = useRouter();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => router.push(`/preview/${to}`)} style={StyleSheet.flatten([styles.button, styles[tone]])}><Text style={[styles.buttonText, tone === "brand" && styles.buttonTextWhite]}>{label}</Text></Pressable>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <View style={styles.row}><Text style={styles.value}>{value}</Text><Text style={styles.label}>{label}</Text></View>;
}

function Choice<T extends string>({ label, value, selected, onPress }: { label: string; value: T; selected: boolean; onPress: (value: T) => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => onPress(value)} style={[styles.choice, selected && styles.choiceSelected]}><View style={[styles.radio, selected && styles.radioSelected]} /> <Text style={styles.choiceText}>{label}</Text></Pressable>;
}

function ResultMetricCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.resultMetric}>
      <Text style={styles.resultMetricLabel}>{label}</Text>
      <Text style={[styles.resultMetricValue, accent && styles.resultMetricAccent]}>{value}</Text>
    </View>
  );
}

function FinancingPlanCard({
  type, selected, title, badge, financing, contribution, interest, onSelect,
}: {
  type: MockFinancingPlan;
  selected: boolean;
  title: string;
  badge: string;
  financing: string;
  contribution: string;
  interest: string;
  onSelect: (plan: MockFinancingPlan) => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`طرح ${title}، تأمین مالی ${financing}`}
      onPress={() => onSelect(type)}
      style={[styles.planCard, selected && styles.planCardSelected]}
    >
      <View style={styles.planTop}>
        <View pointerEvents="none"><FigmaSvg uri={selected ? figmaAssets.financingSelected : figmaAssets.financingUnselected} width={16} height={16} /></View>
        <View style={[styles.planBadge, selected && styles.planBadgeSelected]}><Text style={styles.planBadgeText}>{badge}</Text></View>
        <Text style={styles.planTitle}>{title}</Text>
      </View>
      <Text style={styles.planSample}>نمونهٔ C3 • استعلام بانک انجام نشده</Text>
      <View style={styles.planData}><Text style={styles.planDataValue}>{financing}</Text><Text style={styles.planDataLabel}>مبلغ قابل تأمین (۳۰٪)</Text></View>
      <View style={styles.planDivider} />
      <View style={styles.planData}><Text style={styles.planDataValue}>{contribution}</Text><Text style={styles.planDataLabel}>آورده موردنیاز</Text></View>
      <View style={styles.planDivider} />
      <View style={styles.planData}><Text style={styles.planDataValue}>{interest}</Text><Text style={styles.planDataLabel}>پرداخت ماهانه (فقط سود)</Text></View>
    </Pressable>
  );
}

function StatusHero({ title, description, badge, icon }: { title: string; description: string; badge?: string; icon?: string }) {
  return (
    <View style={styles.statusHero}>
      <View style={styles.statusCircle}>
        <View pointerEvents="none"><FigmaSvg uri={icon ?? figmaAssets.reviewCheck} width={24} height={24} /></View>
      </View>
      {badge && <View style={styles.statusBadge}><Text style={styles.statusBadgeText}>{badge}</Text></View>}
      <Text style={styles.statusTitle}>{title}</Text>
      <Text style={styles.statusDescription}>{description}</Text>
    </View>
  );
}

function ProgressStepper({ labels, done, current }: { labels: readonly string[]; done: number; current: number }) {
  return (
    <View style={styles.progressCard}>
      <View style={styles.progressRow}>
        {labels.map((label, index) => (
          <View key={label} style={styles.progressItem}>
            <View pointerEvents="none">
              <FigmaSvg uri={index < done ? figmaAssets.reviewStepDone : index === current ? figmaAssets.reviewStepCurrent : figmaAssets.reviewStepIdle} width={24} height={24} />
            </View>
            <Text style={[styles.progressLabel, index <= current && styles.progressLabelActive]}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function MembershipOption({
  label, ceiling, fee, selected, onSelect, recommended = false,
}: {
  label: MockMembership;
  ceiling: string;
  fee: string;
  selected: boolean;
  onSelect: (label: MockMembership) => void;
  recommended?: boolean;
}) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`عضویت ${label}، حق عضویت نمایشی ${fee}`} onPress={() => onSelect(label)}
      style={[styles.membershipCard, selected && styles.membershipCardSelected]}
    >
      <View style={styles.membershipHeader}>
        <View style={[styles.radio, selected && styles.radioSelected]} />
        <View style={styles.membershipHeadingRight}>
          {recommended && <View style={styles.membershipBadge}><Text style={styles.membershipBadgeText}>مناسب برای این قرارداد</Text></View>}
          <Text style={styles.membershipTitle}>طرح {label}</Text>
        </View>
      </View>
      <Row label="سقف تأمین مالی" value={ceiling} />
      <Row label="حق عضویت MOCK" value={fee} />
    </Pressable>
  );
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
    ["خانه", "home", figmaAssets.profileHome],
  ] as const;
  return <View style={styles.bottomNav}>{items.map(([label, to, icon]) => {
    const selected = active === to;
    return <Pressable key={to} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} onPress={() => router.push(`/preview/${to}`)} style={styles.bottomItem}><View pointerEvents="none"><FigmaSvg uri={selected && to === "home" ? figmaAssets.homeActive : icon} width={24} height={24} tintColor={selected ? colors.accent : undefined} /></View><Text style={[styles.bottomLabel, selected && styles.bottomLabelActive]}>{label}</Text></Pressable>;
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
  const { hasLoan, financingPlan, membership, contractRole, setContractRole, setFinancingPlan, setMembership, cashDeposit, monthlyRent, financialModel: mockFinancialModel } = useMockPreview();
  const gaugeProgress = financingGaugeProgress(Math.round((cashDeposit + Math.round(monthlyRent / 0.03)) * 0.30), MOCK_CASH_DEPOSIT_MAX, MOCK_MONTHLY_RENT_MAX);
  const [trackingCode, setTrackingCode] = useState("۱۲۳۴۵۶۷۸۹۰۱۲");
  const [trackingError, setTrackingError] = useState(false);
  const router = useRouter();
  const { loan } = useLocalSearchParams<{ loan?: string }>();
  const showLoanPreview = hasLoan || loan === "sample";
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
  let actions: ReactNode = null;
  switch (screen) {
    case "calculator": body = <><ScreenTitle title="ماشین‌حساب مستأجر" /><View style={styles.card}><Text style={styles.cardTitle}>مدل نمونه C۳</Text><Text style={styles.body}>ضریب تبدیل اجاره به رهن: {mockFinancialModel.conversionRate}</Text>{financeRows.slice(0, 3).map(([label, value]) => <Row key={label} label={label} value={value} />)}<Text style={styles.note}>دریافتی مالک از اجاره قرارداد مستقل از سود بانکی مستأجر است؛ بازده صندوق در این برآورد محاسبه نمی‌شود.</Text></View><Button label="مشاهدهٔ نتیجهٔ نمونه" to="calculator-result" /></>; break;
    case "calculator-result": {
      body = <>
        <ScreenTitle title="نتیجه محاسبه" back="calculator" />
        <View style={styles.resultGaugeSection}>
          <View style={styles.resultGauge}>
            <View pointerEvents="none"><Svg width={240} height={120} viewBox="0 0 240 120"><Path d="M 220 110 A 100 100 0 0 0 20 110" fill="none" stroke={colors.border} strokeWidth={17} /><Path d="M 220 110 A 100 100 0 0 0 20 110" fill="none" stroke={colors.primary} strokeWidth={17} strokeDasharray={`${gaugeProgress * Math.PI * 100} ${Math.PI * 100}`} /></Svg></View>
            <View style={styles.resultGaugeText}>
              <Text style={styles.resultGaugeCaption}>محدوده قابل تأمین</Text>
              <Text style={styles.resultGaugeAmount}>تا {mockFinancialModel.financing}</Text>
            </View>
          </View>
        </View>
        <View style={styles.resultGrid}>
          <View style={styles.resultGridRow}>
            <ResultMetricCard label="مبلغ قابل تأمین (C3)" value={mockFinancialModel.financing} />
            <ResultMetricCard label="معادل ودیعه کامل" value={mockFinancialModel.fullDeposit} />
          </View>
          <View style={styles.resultGridRow}>
            <ResultMetricCard label="اجاره ماهانه قرارداد" value={mockFinancialModel.monthlyRent} />
            <ResultMetricCard label="آورده موردنیاز شما" value={mockFinancialModel.contribution} />
          </View>
          <ResultMetricCard label="پرداخت ماهانه تأمین مالی (فقط سود)" value={mockFinancialModel.monthlyInterest} accent />
          <View style={styles.card}>
            <Text style={styles.cardTitle}>مقایسه پرداختی ماهانه مستأجر با اجاره</Text>
            <Row label="اجاره ماهانه قرارداد" value={mockFinancialModel.monthlyRent} />
            <Row label="پرداختی ماهانه مستأجر (فقط سود)" value={mockFinancialModel.monthlyInterest} />
            <Text style={styles.note}>{mockFinancialModel.rentDifference === null
              ? "نرخ سود سالانه اسمی اعلامی بانک را وارد کنید تا امکان مقایسه فراهم شود."
              : mockFinancialModel.belowRent
                ? `در این برآورد، پرداختی ماهانه مستأجر ${mockFinancialModel.rentDifference} کمتر از اجاره است.`
                : "با این ورودی‌ها، پرداختی ماهانه مستأجر از اجاره کمتر نیست؛ شرایط را با بانک بررسی کنید."}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>دریافتی ماهانه مالک بر پایه رهن کامل معادل</Text>
            <Row label="ناخالص ماهانه (۳٪ رهن کامل معادل)" value={mockFinancialModel.ownerGrossReceipt} />
            <Row label="کارمزد خدمات نمونه (۰٫۵٪)" value={mockFinancialModel.ownerServiceFeeExample} />
            <Row label="خالص دریافتی ماهانه نمونه" value={mockFinancialModel.ownerNetReceiptExample} />
            <Text style={styles.note}>کارمزد تنها مثال پیش‌نمایش است و باید در قرارداد تأیید شود. دریافتی مالک مستقل از سود بانکی مستأجر است؛ بازده صندوق محاسبه نمی‌شود.</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>جزئیات محاسبه وام و تبدیل اجاره به رهن</Text>
            <Row label="رهن نقدی قرارداد" value={mockFinancialModel.cashDeposit} />
            <Row label="اجاره ماهانه قرارداد" value={mockFinancialModel.monthlyRent} />
            <Row label="معادل رهن اجاره ماهانه (نسبت ۳٪)" value={mockFinancialModel.rentEquivalentDeposit} />
            <Row label="رهن کامل معادل قرارداد" value={mockFinancialModel.fullDeposit} />
            <Row label="حداقل تأمین مالی (۳۰٪)" value={mockFinancialModel.minimumFinancing} />
            <Row label="حداکثر تأمین مالی (۵۵٪)" value={mockFinancialModel.maximumFinancing} />
            <Row label="تأمین مالی براساس رتبه نمونه C3" value={mockFinancialModel.financing} />
            <Row label="آورده مستأجر از رهن کامل معادل" value={mockFinancialModel.contribution} />
            <Text style={styles.note}>رهن کامل معادل = رهن نقدی + (اجاره ماهانه ÷ ۰٫۰۳). سپس درصد رتبه اعتباری روی کل رهن معادل اعمال می‌شود.</Text>
          </View>
          <View style={styles.resultBenefit}>
            <Text style={styles.resultBenefitTitle}>خلاصه شرایط مالی شما</Text>
            <Row label="نرخ اسمی سالانه نمونه" value={mockFinancialModel.annualRate} />
            <Row label="مبلغ رهن نقدی" value={mockFinancialModel.cashDeposit} />
            <Row label="ضریب تبدیل اجاره به رهن" value={mockFinancialModel.conversionRate} />
            <View style={styles.resultBenefitNotice}>
              <Text style={styles.resultBenefitNoticeText}>مقایسه صرفه‌جویی فیگما صرفاً یک مثال طراحی است و مبنای قراردادی ندارد؛ تا روشن شدن شرایط بانک، عدد ساختگی مزیت نمایش داده نمی‌شود.</Text>
            </View>
          </View>
          <Text style={styles.resultFinePrint}>C3 و نرخ پیش‌فرض ۲۳٪ فقط نمونه‌اند؛ رتبه واقعی و نرخ قطعی از سامانه بیرونی و بانک دریافت می‌شوند. پرداخت ماهانه فقط سود است؛ بازپرداخت اصل تابع قرارداد نهایی بانک است. هیچ درخواست یا پرداختی ثبت نمی‌شود.</Text>
        </View>
      </>;
      actions = <View style={styles.resultActions}>
        <Button label="ثبت کد رهگیری قرارداد" to="contract-tracking" tone="brand" />
        <Button label="محاسبه مجدد" to="calculator" tone="outline" />
      </View>;
      break;
    }
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
      <View style={styles.roleSectionCard}>
        <Text style={styles.cardTitle}>نقش خود را در این قرارداد انتخاب کنید</Text>
        <Text style={styles.note}>در فیگما مشخصات طرفین از خودنویس دریافت می‌شود؛ در این پیش‌نمایش نام‌ها و کدهای ملی پوشیده صرفاً نمونه هستند و هیچ استعلامی انجام نشده است.</Text>
        <View style={styles.roleCards}>
          <ContractRoleCard role="Owner" name="محمد رضایی" maskedNationalId="۰۰۲•••••۴۵۶" selected={contractRole === "Owner"} onPress={setContractRole} />
          <ContractRoleCard role="Tenant" name="علی رضایی" maskedNationalId="۰۰۱•••••۷۸۹" selected={contractRole === "Tenant"} onPress={setContractRole} />
        </View>
      </View>
      <View style={styles.roleSectionCard}>
        <Text style={styles.cardTitle}>مشخصات کلی قرارداد</Text>
        <Row label="کد رهگیری نمونه" value="۱۲۳۴۵۶۷۸۹۰۱۲" />
        <Row label="تاریخ شروع نمونه" value="۱۵ مهر ۱۴۰۵" />
        <Row label="تاریخ پایان نمونه" value="۱۵ مهر ۱۴۰۶" />
        <Row label="مبلغ رهن" value={mockFinancialModel.cashDeposit} />
        <Row label="اجاره ماهانه" value={mockFinancialModel.monthlyRent} />
      </View>
      <View style={styles.roleSectionCard}>
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
          : "در مرحله بعد، صفحه «قرارداد به حساب شما متصل شد» در مسیر مستقل مالک باز می‌شود؛ تعهد سود مستأجر درآمد مالک نیست."}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`تأیید نقش ${contractRole === "Tenant" ? "مستأجر" : "مالک"} و ادامه`}
        style={[styles.button, styles.roleContinue]}
        onPress={() => router.push(contractRole === "Tenant" ? "/preview/financing-plans" : "/preview/owner-connected")}
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
      <Button label="شروع مسیر کامل مالک" to="owner-connected" />
      <Button label="بازگشت به انتخاب نقش" to="contract-lookup" />
      <Button label="بازگشت به خانه پیش‌نمایش" to="home" tone="outline" />
    </>; break;
    case "financing-plans": {
      body = <>
        <ScreenTitle title="انتخاب طرح تأمین مالی" back="contract-lookup" />
        <View style={styles.planIntro}>
          <Text style={styles.planIntroHeading}>طرح‌های قابل استفاده برای شما</Text>
          <Text style={styles.planIntroText}>بر اساس مدل C3 این قرارداد، دو طرح نمونه زیر برای مرور طراحی قابل انتخاب‌اند؛ احراز شرایط بانکی انجام نشده است.</Text>
        </View>
        <FinancingPlanCard
          type="ویژهٔ نمونه" selected={financingPlan === "ویژهٔ نمونه"}
          badge="طرح ویژه" title="طرح ویژه کارکنان سازمان" onSelect={setFinancingPlan}
          financing={mockFinancialModel.financing} contribution={mockFinancialModel.contribution} interest={mockFinancialModel.monthlyInterest}
        />
        <View style={styles.planHighlight}><Text style={styles.planHighlightText}>ویژگی‌های اختصاصی طرح ویژه و تخفیف بانکی هنوز تأیید نشده‌اند؛ محاسبات فعلاً در هر دو طرح یکسان هستند.</Text></View>
        <Text style={styles.planOther}>سایر طرح‌های قابل استفاده</Text>
        <FinancingPlanCard
          type="عمومی" selected={financingPlan === "عمومی"}
          badge="طرح عمومی" title="طرح عمومی تأمین مسکن" onSelect={setFinancingPlan}
          financing={mockFinancialModel.financing} contribution={mockFinancialModel.contribution} interest={mockFinancialModel.monthlyInterest}
        />
        <Text style={styles.planFinePrint}>این ارقام پیش‌نمایش MOCK هستند. نرخ اسمی نمونه {mockFinancialModel.annualRate}، پرداخت فقط سود و اصل مطابق قرارداد احتمالی بانک است. طرح تأمین مالی مستقل از نوع عضویت می‌ماند.</Text>
      </>;
      actions = <View style={styles.planActions}><Button label="تأیید طرح و ادامه" to="plan-confirmation" tone="light" /></View>;
      break;
    }
    case "plan-confirmation": body = <>
      <ScreenTitle title="تأیید درخواست" back="financing-plans" />
<Text style={styles.planIntroHeading}>جزئیات درخواست خود را بررسی کنید</Text>
<Text style={styles.figmaIntro}>پیش از ارسال نمونه، اطلاعات قرارداد و شرایط طرح انتخاب‌شده را بررسی کنید.</Text>
<View style={styles.card}><Text style={styles.cardTitle}>طرح انتخاب‌شده</Text><View style={styles.membershipBadge}><Text style={styles.membershipBadgeText}>نمونهٔ C3</Text></View><Row label="طرح" value={financingPlan} /><Text style={styles.note}>بانک یا تخفیف ویژه‌ای برای این نمونه تعیین نشده؛ تأیید بانکی رخ نداده است.</Text></View>
<View style={styles.card}><Text style={styles.cardTitle}>خلاصه مالی طرح</Text><Row label="مبلغ قابل تأمین (۳۰٪)" value={mockFinancialModel.financing} /><Row label="آورده موردنیاز" value={mockFinancialModel.contribution} /><Row label="نرخ اسمی سالانه نمونه" value={mockFinancialModel.annualRate} /><Row label="پرداخت ماهانه تأمین مالی (فقط سود)" value={mockFinancialModel.monthlyInterest} /><Row label="اجاره ماهانه قرارداد (مستقل)" value={mockFinancialModel.monthlyRent} /></View>
<View style={styles.card}><Text style={styles.cardTitle}>قرارداد مرتبط</Text><Row label="کد رهگیری نمونه" value="۱۲۳۴۵۶۷۸۹۰۱۲" /><Row label="تاریخ شروع" value="۱۵ مهر ۱۴۰۵" /><Row label="تاریخ پایان" value="۱۵ مهر ۱۴۰۶" /><Text style={styles.note}>تهران، سعادت‌آباد، خیابان نمونه، پلاک ۲۴ (MOCK)</Text></View>
<View style={styles.statusTextCard}><Text style={styles.cardTitle}>پس از ارسال درخواست</Text><Text style={styles.body}>بررسی اطلاعات و اعتبار ← تصمیم بانک ← اعلام نتیجه در چارخونه. فقط شبیه‌سازی مراحل است.</Text></View>
<Button label="ارسال درخواست نمونه برای بررسی" to="review" tone="light" />
    </>; break;
    case "review": body = <>
      <ScreenTitle title="وضعیت درخواست" back="plan-confirmation" />
<StatusHero title="درخواست شما ثبت شد" description="درخواست صرفاً در پیش‌نمایش ثبت شده و برای هیچ بانکی ارسال نشده است." badge="در حال بررسی • MOCK" />
<View style={styles.card}><Text style={styles.cardTitle}>خلاصه درخواست</Text><Row label="مبلغ درخواستی" value={mockFinancialModel.financing} /><Row label="طرح انتخاب‌شده" value={financingPlan} /><Row label="وضعیت" value="بررسی نمونه" /></View>
<ProgressStepper labels={["ثبت درخواست", "بررسی اطلاعات", "بررسی بانک", "اعلام نتیجه"]} done={1} current={1} />
<View style={styles.statusTextCard}><Text style={styles.cardTitle}>در حال بررسی اطلاعات</Text><Text style={styles.body}>اطلاعات قرارداد و شرایط طرح در سناریوی نمایشی بررسی می‌شوند؛ اعتبارسنجی واقعی انجام نشده است.</Text><Text style={styles.note}>در نسخه عملیاتی، نتیجه از طریق چارخونه اعلام خواهد شد.</Text></View>
<View style={styles.card}><Text style={styles.cardTitle}>قرارداد مرتبط</Text><Row label="کد رهگیری نمونه" value="۱۲۳۴۵۶۷۸۹۰۱۲" /><Row label="ملک" value="تهران، سعادت‌آباد" /></View>
<Button label="بازگشت به خانه" to="home" tone="light" />
<View style={styles.card}><Text style={styles.cardTitle}>نمایش نتایج برای بررسی طراحی</Text><Button label="سناریوی تأیید نمایشی" to="approved" tone="outline" /><Button label="سناریوی رد نمایشی" to="rejected" tone="outline" /></View>
    </>; break;
    case "approved": body = <>
      <ScreenTitle title="وضعیت درخواست" back="review" />
<StatusHero title="درخواست تأمین مالی در نمونه تأیید شد" description="این تأیید فقط سناریوی نمایشی است؛ هیچ تصمیمی از بانک دریافت نشده است." badge="تأیید نمونه" icon={figmaAssets.approvedCheck} />
<View style={styles.accentOutlineCard}><Text style={styles.cardTitle}>مرحله بعد: عضویت چارخونه</Text><Text style={styles.accentedAmount}>نیازمند اقدام</Text><Text style={styles.body}>در ادامه پیش‌نمایش، یک طرح عضویت انتخاب می‌کنید. هیچ وجهی دریافت نمی‌شود.</Text></View>
<View style={styles.card}><Text style={styles.cardTitle}>شرایط تأییدشده در MOCK</Text><Row label="مبلغ تأمین مالی نمونه" value={mockFinancialModel.financing} /><Row label="آورده موردنیاز" value={mockFinancialModel.contribution} /><Row label="پرداخت ماهانه (فقط سود)" value={mockFinancialModel.monthlyInterest} /><Row label="نرخ اسمی نمونه" value={mockFinancialModel.annualRate} /></View>
<ProgressStepper labels={["ثبت درخواست","بررسی اطلاعات","تأیید بانک","پرداخت آورده","تأیید نهایی"]} done={3} current={3} />
<View style={styles.statusTextCard}><Text style={styles.body}>ابتدا عضویت نمونه را تکمیل کنید و سپس به مرحله آورده بروید؛ پرداخت و تأیید واقعی انجام نمی‌شود.</Text></View>
<View style={styles.card}><Text style={styles.cardTitle}>قرارداد مرتبط</Text><Row label="کد رهگیری نمونه" value="۱۲۳۴۵۶۷۸۹۰۱۲" /><Row label="ملک" value="تهران، سعادت‌آباد" /></View>
<Button label="ادامه به عضویت چارخونه" to="membership" tone="light" />
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
<View style={styles.card}><Text style={styles.body}>برای ادامه درخواست نمونه، طرح عضویت انتخاب کنید. این مرحله هیچ پرداخت یا فعال‌سازی واقعی ایجاد نمی‌کند.</Text></View>
<Text style={styles.figmaHeading}>طرح‌های عضویت در دسترس</Text>
<Text style={styles.figmaIntro}>حق عضویت براساس سقف تأمین مالی و تعداد استفاده، در این پیش‌نمایش فقط نمونه است.</Text>
<MembershipOption label="۱ بار استفاده" ceiling="تا ۵۰۰٬۰۰۰٬۰۰۰ تومان" fee="۲٬۵۰۰٬۰۰۰ تومان" recommended selected={membership === "۱ بار استفاده"} onSelect={setMembership} />
<MembershipOption label="۲ بار استفاده" ceiling="تا ۷۵۰٬۰۰۰٬۰۰۰ تومان" fee="۴٬۰۰۰٬۰۰۰ تومان" selected={membership === "۲ بار استفاده"} onSelect={setMembership} />
<MembershipOption label="۳ بار استفاده" ceiling="تا ۱٬۰۰۰٬۰۰۰٬۰۰۰ تومان" fee="۵٬۵۰۰٬۰۰۰ تومان" selected={membership === "۳ بار استفاده"} onSelect={setMembership} />
<Text style={styles.planFinePrint}>انتخاب عضویت «{membership}» مستقل از طرح تأمین مالی «{financingPlan}» است. پس از عضویت نمونه، پرداخت آورده شبیه‌سازی می‌شود.</Text>
<Button label="پرداخت حق عضویت (فقط نمونه)" to="membership-success" tone="light" />
<View style={styles.card}><Text style={styles.cardTitle}>وضعیت‌های نمایشی پرداخت</Text><Button label="در انتظار پرداخت نمونه" to="membership-pending" tone="outline" /><Button label="خطای نمونه" to="membership-failed" tone="outline" /></View>
    </>; break;
    case "membership-success": case "membership-pending": case "membership-failed": {
      const kind = screen.split("-")[1]; const title = kind === "success" ? "عضویت نمونه ثبت شد" : kind === "pending" ? "عضویت نمونه در انتظار است" : "خطای عضویت نمونه";
      body = <><ScreenTitle title={title} back="membership" /><View style={kind === "failed" ? styles.errorCard : styles.card}><Row label="نوع عضویت انتخاب‌شده" value={membership} /><Text style={styles.note}>{mockDisclaimer}</Text></View>{kind === "success" ? <Button label="ادامه به آورده" to="contribution" /> : <Button label="بازگشت به عضویت" to="membership" tone="outline" />}</>;
      break;
    }
    case "contribution": body = <>
      <ScreenTitle title="وضعیت درخواست" back="membership-success" />
<StatusHero title="پرداخت آورده" description={`عضویت نمونه ${membership} انتخاب شده است؛ برای ادامه، آورده قرارداد را در سناریوی MOCK بررسی کنید.`} badge="در انتظار پرداخت نمونه" icon={figmaAssets.contributionCheck} />
<View style={styles.accentOutlineCard}><Text style={styles.cardTitle}>آورده شما</Text><Text style={styles.accentedAmount}>{mockFinancialModel.contribution}</Text><Row label="وضعیت" value="در انتظار پرداخت نمایشی" /><Text style={styles.note}>بدون درگاه پرداخت، تراکنش یا سررسید واقعی.</Text></View>
<View style={styles.card}><Text style={styles.cardTitle}>شرایط تأمین مالی C3</Text><Row label="تأمین مالی" value={mockFinancialModel.financing} /><Row label="آورده موردنیاز" value={mockFinancialModel.contribution} /><Row label="پرداخت ماهانه فقط سود" value={mockFinancialModel.monthlyInterest} /><Row label="نرخ اسمی" value={mockFinancialModel.annualRate} /></View>
<ProgressStepper labels={["ثبت درخواست","بررسی اطلاعات","عضویت","پرداخت آورده","تأیید نهایی"]} done={3} current={3} />
<View style={styles.statusTextCard}><Text style={styles.body}>پس از پرداخت آورده در مسیر عملیاتی، تأیید نهایی طرفین قرارداد لازم خواهد بود.</Text></View>
<Button label="نمایش نتیجه پرداخت نمونه آورده" to="contribution-success" tone="light" />
<View style={styles.card}><Text style={styles.cardTitle}>حالات نمایشی</Text><Button label="وضعیت انتظار" to="contribution-pending" tone="outline" /><Button label="خطای نمونه" to="contribution-failed" tone="outline" /></View>
    </>; break;
    case "contribution-success": case "contribution-pending": case "contribution-failed": { const contributionSucceeded = screen === "contribution-success"; body = <><ScreenTitle title="نتیجهٔ نمونهٔ آورده" back="contribution" /><View style={screen.endsWith("failed") ? styles.errorCard : styles.card}><Row label="آوردهٔ نمونه" value={mockFinancialModel.contribution} /><Text style={styles.note}>{mockDisclaimer}</Text></View>{contributionSucceeded ? <Button label="تأیید نهایی نمونه" to="final-confirmation" /> : <Button label="بازگشت به آورده" to="contribution" tone="outline" />}</>; break; }
    case "final-confirmation": body = <>
      <ScreenTitle title="وضعیت درخواست" back="contribution-success" />
<StatusHero title="آورده در سناریوی نمونه پرداخت شد" description="برای ادامه فرایند در محصول عملیاتی، تأیید نهایی طرفین قرارداد لازم است." badge="آورده پرداخت شد • MOCK" icon={figmaAssets.finalCheck} />
<View style={styles.card}><Text style={styles.cardTitle}>جزئیات پرداخت نمایشی</Text><Row label="مبلغ" value={mockFinancialModel.contribution} /><Row label="وضعیت" value="شبیه‌سازی موفق" /><Text style={styles.note}>هیچ تراکنش، رسید یا شماره پیگیری واقعی وجود ندارد.</Text></View>
<View style={styles.card}><Text style={styles.cardTitle}>تأیید نهایی طرفین</Text><View style={styles.softCard}><Row label="مستأجر نمونه" value="تأیید نمایشی" /></View><View style={styles.softCard}><Row label="مالک نمونه" value="در انتظار تأیید نمایشی" /></View><Row label="طرح تأمین مالی" value={financingPlan} /></View>
<ProgressStepper labels={["ثبت درخواست","بررسی اطلاعات","تأیید بانک","پرداخت آورده","تأیید طرفین","فعال‌سازی"]} done={4} current={4} />
<View style={styles.statusTextCard}><Text style={styles.cardTitle}>در انتظار تأیید مالک</Text><Text style={styles.body}>با تأیید نهایی طرفین، فرایند مالی در مسیر عملیاتی ادامه خواهد یافت؛ هنوز هیچ قرارداد واقعی فعال نشده است.</Text></View>
<Button label="مشاهده قرارداد فعال در سناریوی نمونه" to="contract-active" tone="light" />
<Button label="بازگشت به خانه" to="home" tone="outline" />
    </>; break;
    case "profile": body = <>
      <Text style={styles.dashboardTitle}>حساب من</Text>
<View style={styles.profileTop}><View style={styles.avatar}><Text style={styles.avatarText}>ع ر</Text></View><Text style={styles.profileName}>کاربر پیش‌نمایش</Text><Text style={styles.profileCaption}>حساب آزمایشی چارخونه • اطلاعات واقعی بارگذاری نشده</Text></View>
<View style={styles.card}><Text style={styles.profileSectionTitle}>اطلاعات حساب</Text><Row label="نام و نام خانوادگی" value="کاربر نمونه" /><Row label="کد ملی" value="••••••••••" /><Text style={styles.note}>مشخصات صرفاً نمونه‌اند؛ اطلاعات هویتی استعلام نشده است.</Text></View>
<View style={styles.card}><Text style={styles.profileSectionTitle}>عضویت چارخونه</Text><Row label="وضعیت" value="انتخاب نمایشی" /><Row label="طرح نمونه" value={membership} /><Row label="مبلغ تأمین مالی C3" value={mockFinancialModel.financing} /><Button label="مشاهده عضویت" to="membership" tone="outline" /></View>
<View style={styles.card}><Row label="شماره موبایل" value="وارد نشده" /><Row label="شماره شبا" value="ثبت نشده" /><Text style={styles.note}>شماره واقعی و اطلاعات بانکی در پیش‌نمایش جمع‌آوری نمی‌شود.</Text></View>
<View style={styles.card}><Text style={styles.profileSectionTitle}>اعلان‌ها</Text><Text style={styles.body}>اعلان‌های مهم قرارداد و پرداخت در نسخه عملیاتی نمایش داده می‌شوند.</Text><Text style={styles.note}>این نسخه اعلان واقعی ارسال نمی‌کند.</Text></View>
<View style={styles.card}><Text style={styles.profileSectionTitle}>قوانین و شرایط استفاده</Text><Text style={styles.body}>حریم خصوصی</Text><Text style={styles.note}>گزینه‌های قانونی در این پیش‌نمایش صفحه عملیاتی ندارند.</Text></View>
<Text style={styles.profileFooter}>خروج از حساب در نسخه نمایشی غیرفعال است</Text>
    </>; break;
    case "contracts": body = <>
      <Text style={styles.dashboardTitle}>قراردادهای من</Text>
<Text style={styles.figmaIntro}>قراردادهای ثبت‌شده شما در چارخونه (همگی دادهٔ نمونه)</Text>
<Button label="ثبت قرارداد جدید" to="contract-tracking" tone="light" />
<View style={styles.contractOverviewCard}>
  <View style={styles.contractHeader}><View style={styles.contractBadge}><Text style={styles.contractBadgeText}>نمونه فعال</Text></View><Text style={styles.contractHeaderText}>مستأجر</Text></View>
  <Text style={styles.contractAddress}>تهران، سعادت‌آباد</Text>
  <Row label="کد رهگیری نمونه" value="۱۲۳۴۵۶۷۸۹۰۱۲" />
  <Row label="مدت قرارداد نمونه" value="۱۵ مهر ۱۴۰۵ تا ۱۵ مهر ۱۴۰۶" />
  <Row label="اجاره ماهانه" value={mockFinancialModel.monthlyRent} />
  <Row label="پرداخت تأمین مالی (فقط سود)" value={mockFinancialModel.monthlyInterest} />
  <Button label="مشاهده قرارداد مستأجر نمونه" to="contract-detail" tone="outline" />
</View>
<View style={styles.contractOverviewCard}>
  <View style={styles.contractHeader}><View style={styles.contractBadge}><Text style={styles.contractBadgeText}>نمونه مالک</Text></View><Text style={styles.contractHeaderText}>مالک</Text></View>
  <Text style={styles.contractAddress}>تهران، پونک</Text>
  <Text style={styles.note}>سناریوی مستقل مالک: اجاره و دریافتی مالک با سود بانکی مستأجر یکسان نیستند.</Text>
  <Pressable accessibilityRole="button" accessibilityLabel="مشاهده قرارداد نمونه مالک" style={[styles.button, styles.outline]} onPress={() => { setContractRole("Owner"); router.push("/preview/owner-connected"); }}><Text style={styles.buttonText}>مشاهده قرارداد نمونه مالک</Text></Pressable>
</View>
<View style={styles.contractOverviewCard}>
  <View style={styles.contractHeader}><View style={styles.contractBadgePending}><Text style={styles.contractBadgePendingText}>در حال بررسی MOCK</Text></View><Text style={styles.contractHeaderText}>درخواست تأمین مالی</Text></View>
  <Text style={styles.contractAddress}>تهران، زعفرانیه</Text>
  <View style={styles.planHighlight}><Text style={styles.planHighlightText}>درخواست صرفاً برای نمایش وضعیت در این سناریو وجود دارد.</Text></View>
  <Button label="مشاهده وضعیت نمونه" to="review" tone="outline" />
</View>
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
  <View style={styles.contractHeader}><View style={styles.contractBadgePending}><Text style={styles.contractBadgePendingText}>در انتظار پرداخت • MOCK</Text></View><Text style={styles.cardTitle}>پرداخت بعدی</Text></View>
  <Text style={styles.accentedAmount}>{mockFinancialModel.monthlyInterest}</Text>
  <Text style={styles.note}>پرداخت ماهانه تأمین مالی؛ فقط سود با نرخ اسمی نمونه {mockFinancialModel.annualRate}</Text>
  <Text style={styles.note}>سررسید واقعی تعیین نشده؛ اصل وام تابع قرارداد بانک است.</Text>
  <Button label="نمایش وضعیت پرداخت نمونه" to="payment-pending" tone="light" />
</View>
<View style={styles.card}><Row label="اجاره ماهانه قرارداد (مستقل)" value={mockFinancialModel.monthlyRent} /></View>
<View style={styles.card}>
  <Text style={styles.cardTitle}>وضعیت پرداخت‌های قرارداد</Text>
  <Text style={styles.body}>۰ پرداخت واقعی ثبت شده</Text>
  <View style={styles.paymentTrack}><View style={styles.paymentTrackFill} /></View>
  <Text style={styles.note}>در فیگما نمودار نمونه ۲ از ۱۲ وجود دارد؛ این نسخه بدون قرارداد واقعی، آن را به‌عنوان بدهی یا سابقه واقعی نمایش نمی‌دهد.</Text>
</View>
<Text style={styles.figmaHeading}>پرداخت‌های پیش رو (فقط نمونه)</Text>
<View style={styles.card}><Row label="۱۵ آبان ۱۴۰۵" value="موعد نمایشی" /><Row label="۱۵ آذر ۱۴۰۵" value="موعد نمایشی" /><Row label="۱۵ دی ۱۴۰۵" value="موعد نمایشی" /><Text style={styles.note}>زمان‌بندی واقعی فقط با قرارداد نهایی مشخص می‌شود.</Text></View>
<Text style={styles.figmaHeading}>سوابق پرداخت</Text>
<View style={styles.card}><Text style={styles.body}>هنوز پرداختی ثبت نشده است.</Text><Button label="قالب رسید نمونه" to="receipt" tone="outline" /></View>
<View style={styles.card}><Text style={styles.cardTitle}>آزمایش وضعیت‌های نمایشی</Text><Button label="خطای پرداخت" to="payment-failed" tone="outline" /><Button label="فسخ نمونه" to="payment-terminated" tone="outline" /></View>
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
        {showLoanPreview ? <>
          <View style={styles.homeSummaryRow}>
            <PreviewSummaryCard label="میزان قابل تأمین" value={mockFinancialModel.financing} caption="سناریوی نمونه C3 • نه تأیید بانک" />
            <PreviewSummaryCard label="اعتبار شما" value="رتبه C3 (نمونه)" caption="استعلام اعتبار واقعی انجام نشده" />
          </View>
          <View style={styles.homeSummaryRow}>
            <PreviewSummaryCard label="وضعیت قرارداد" value="قرارداد نمونه" caption="هیچ قرارداد خودنویسی ثبت نشده" />
            <PreviewSummaryCard label="پرداخت ماهانه" value={mockFinancialModel.monthlyInterest} caption="فقط سود نمونه • نه بدهی واقعی" />
          </View>
        </> : <>
          <View style={styles.homeSummaryRow}>
            <PreviewSummaryCard label="میزان قابل تأمین" value="هنوز محاسبه نشده" caption="از ماشین حساب استفاده کنید" />
            <PreviewSummaryCard label="اعتبار شما" value="در حال ارزیابی" caption="بر اساس سابقه شما" />
          </View>
          <View style={styles.homeSummaryRow}>
            <PreviewSummaryCard label="وضعیت قرارداد" value="ثبت نشده" caption="هنوز قرارداد خودنویس ثبت نشده است" />
            <PreviewSummaryCard label="پرداخت بعدی" value="در حال حاضر پرداختی ندارید" caption="پس از فعال شدن قرارداد نمایش داده می‌شود" />
          </View>
        </>}
      </View>
      <View style={styles.homeAction}>
        <Text style={styles.homeActionTitle}>اقدام بعدی شما</Text>
        <Text style={styles.homeActionCopy}>{showLoanPreview ? "شرایط نمونه تأمین مالی را بررسی کنید یا به سناریوی نمایشی قرارداد بروید. هیچ درخواستی برای بانک ارسال نمی‌شود." : "برای شروع، شرایط تأمین مالی را محاسبه کنید یا در صورت داشتن قرارداد خودنویس، کد رهگیری آن را ثبت کنید."}</Text>
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
      <View style={styles.homeNotice}><FigmaSvg uri={figmaAssets.info} width={16} height={16} /><Text style={styles.homeNoticeText}>درخواست شما پس از تکمیل مراحل برای بررسی به بانک ارسال می‌شود.</Text></View>
    </>;
  }
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>{body}<View style={styles.disclaimer}><Text style={styles.disclaimerText}>{mockDisclaimer}</Text></View></ScrollView>{actions}{!actions && screen !== "contract-lookup" && screen !== "owner-contract" && <BottomNav active={active} />}</SafeAreaView>;
}

const text = { textAlign: "right" as const, writingDirection: "rtl" as const };
const styles = StyleSheet.create({
  roleSectionCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 20, gap: 12 },
  roleCards: { flexDirection: "row", gap: 12 },
  roleCard: { flex: 1, minWidth: 0, minHeight: 114, padding: 16, gap: 8, borderRadius: 12, borderColor: colors.border, borderWidth: 1, alignItems: "flex-end", backgroundColor: colors.surface },
  roleCardSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleTitleRow: { width: "100%", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 8 },
  roleTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14, ...text },
  roleName: { color: colors.text, fontFamily: fonts.semibold, fontSize: 14, ...text },
  roleId: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, ...text },
  roleTextSelected: { color: colors.surface },
  roleNotice: { padding: 12, backgroundColor: colors.successSoft, borderRadius: 8, alignItems: "flex-end" },
  roleNoticeText: { color: colors.primary, fontFamily: fonts.regular, fontSize: 11, lineHeight: 18, ...text },
  roleContinue: { backgroundColor: colors.page, minHeight: 48 },
  dashboardTitle: { color: colors.page, fontFamily: fonts.bold, fontSize: 24, ...text },
  profileTop: { alignItems: "center", gap: 9, paddingTop: 8, paddingBottom: 12 },
  avatar: { width: 72, height: 72, backgroundColor: colors.border, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 24 },
  profileName: { color: colors.page, fontFamily: fonts.semibold, fontSize: 18, ...text },
  profileCaption: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, textAlign: "center", writingDirection: "rtl" },
  profileSectionTitle: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 13, ...text },
  profileFooter: { textAlign: "center", color: "#FF8383", fontFamily: fonts.semibold, fontSize: 13 },
  contractOverviewCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, gap: 12 },
  contractHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  contractHeaderText: { color: colors.text, fontFamily: fonts.semibold, fontSize: 13, ...text },
  contractBadge: { backgroundColor: colors.successSoft, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  contractBadgeText: { color: colors.primary, fontFamily: fonts.medium, fontSize: 11 },
  contractBadgePending: { backgroundColor: "#FFF3E0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  contractBadgePendingText: { color: colors.accent, fontFamily: fonts.medium, fontSize: 11 },
  contractAddress: { color: colors.text, fontFamily: fonts.semibold, fontSize: 16, ...text },
  paymentTrack: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: "hidden" },
  paymentTrackFill: { height: 8, width: "0%", backgroundColor: colors.primary },
  statusHero: { paddingHorizontal: 12, paddingTop: 16, paddingBottom: 12, alignItems: "center", gap: 10 },
  statusCircle: { width: 56, height: 56, backgroundColor: colors.accent, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.page, borderRadius: 8 },
  statusBadgeText: { color: colors.primary, fontFamily: fonts.regular, fontSize: 12, textAlign: "center" },
  statusTitle: { color: colors.page, fontFamily: fonts.bold, fontSize: 20, textAlign: "center", writingDirection: "rtl" },
  statusDescription: { color: colors.page, fontFamily: fonts.regular, fontSize: 13, lineHeight: 22, textAlign: "center", writingDirection: "rtl" },
  progressCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
  progressRow: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 3 },
  progressItem: { flex: 1, minWidth: 0, alignItems: "center", gap: 8 },
  progressCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  progressDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  progressCurrent: { borderWidth: 2, borderColor: colors.accent },
  progressNumber: { color: colors.muted, fontFamily: fonts.semibold, fontSize: 11 },
  progressNumberDone: { color: colors.surface },
  progressLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 10, lineHeight: 15, textAlign: "center", writingDirection: "rtl" },
  progressLabelActive: { color: colors.primary },
  membershipCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, gap: 12, backgroundColor: colors.surface },
  membershipCardSelected: { borderWidth: 2, borderColor: colors.accent, backgroundColor: colors.accentSoft },
  membershipHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  membershipHeadingRight: { flex: 1, alignItems: "flex-end", gap: 5 },
  membershipTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15, ...text },
  membershipBadge: { borderColor: colors.accent, borderWidth: 1, backgroundColor: colors.accentSoft, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  membershipBadgeText: { color: colors.accent, fontFamily: fonts.medium, fontSize: 10, ...text },
  accentOutlineCard: { borderRadius: 16, backgroundColor: "#FFFBF2", borderWidth: 1.5, borderColor: colors.accent, padding: 16, gap: 12 },
  accentedAmount: { fontFamily: fonts.bold, fontSize: 26, color: colors.primary, ...text },
  statusTextCard: { borderRadius: 16, backgroundColor: colors.infoSoft, borderWidth: 1, borderColor: colors.primary, padding: 16, gap: 9 },
  resultGaugeSection: { alignItems: "center", paddingTop: 12, paddingBottom: 20 },
  resultGauge: { width: 280, height: 160, justifyContent: "flex-end", alignItems: "center" },
  resultGaugeText: { position: "absolute", top: 75, alignItems: "center", gap: 4 },
  resultGaugeCaption: { color: colors.page, fontFamily: fonts.medium, fontSize: 13, textAlign: "center" },
  resultGaugeAmount: { color: colors.page, fontFamily: fonts.bold, fontSize: 20, textAlign: "center", writingDirection: "rtl" },
  resultGrid: { gap: 12 },
  resultGridRow: { flexDirection: "row", gap: 12 },
  resultMetric: { flex: 1, minWidth: 0, padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, alignItems: "flex-end", gap: 4 },
  resultMetricLabel: { width: "100%", color: colors.muted, fontFamily: fonts.regular, fontSize: 12, ...text },
  resultMetricValue: { width: "100%", color: colors.text, fontFamily: fonts.semibold, fontSize: 14, ...text },
  resultMetricAccent: { color: colors.primary, fontFamily: fonts.bold, fontSize: 16 },
  resultBenefit: { borderRadius: 16, padding: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 12 },
  resultBenefitTitle: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 16, ...text },
  resultBenefitNotice: { borderRadius: 8, backgroundColor: colors.accentSoft, padding: 12 },
  resultBenefitNoticeText: { color: colors.primary, fontFamily: fonts.regular, fontSize: 11, lineHeight: 18, ...text },
  resultFinePrint: { color: colors.page, fontFamily: fonts.regular, fontSize: 11, lineHeight: 19, ...text },
  resultActions: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, gap: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  planIntro: { gap: 8, paddingTop: 12, paddingBottom: 4 },
  planIntroHeading: { color: colors.page, fontFamily: fonts.semibold, fontSize: 20, lineHeight: 28, ...text },
  planIntroText: { color: colors.muted, fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, ...text },
  planCard: { padding: 16, borderRadius: 16, gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  planCardSelected: { backgroundColor: colors.infoSoft, borderWidth: 2, borderColor: colors.primary },
  planTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  planBadge: { backgroundColor: colors.page, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
  planBadgeSelected: { backgroundColor: colors.successSoft },
  planBadgeText: { color: colors.primary, fontFamily: fonts.medium, fontSize: 11, ...text },
  planTitle: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 14, ...text },
  planSample: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, ...text },
  planData: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  planDataLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12, ...text },
  planDataValue: { flexShrink: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 13, textAlign: "left" },
  planDivider: { backgroundColor: colors.border, height: 1 },
  planHighlight: { borderRadius: 8, padding: 12, backgroundColor: colors.accentSoft },
  planHighlightText: { color: colors.primary, fontFamily: fonts.regular, fontSize: 11, lineHeight: 18, ...text },
  planOther: { color: colors.page, fontFamily: fonts.medium, fontSize: 14, ...text },
  planFinePrint: { color: colors.page, fontFamily: fonts.regular, fontSize: 11, lineHeight: 19, ...text },
  planActions: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 30 },
  brand: { backgroundColor: colors.primary },
  light: { backgroundColor: colors.page },
  buttonTextWhite: { color: colors.surface },
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
  safe: { flex: 1, backgroundColor: colors.primary }, scroll: { padding: 16, gap: 14, paddingBottom: 24 }, titleRow: { minHeight: 56, marginHorizontal: -16, paddingHorizontal: 16, flexDirection: "row", backgroundColor: colors.surface, gap: 12, alignItems: "center" }, titleGroup: { flex: 1, alignItems: "flex-end" }, mock: { color: colors.accent, fontFamily: fonts.bold, fontSize: 10, paddingHorizontal: 16, paddingTop: 8, ...text }, title: { color: colors.text, fontFamily: fonts.semibold, fontSize: 18, ...text }, card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: 16, gap: 12 }, successCard: { backgroundColor: colors.successSoft, borderRadius: radii.lg, padding: 16, gap: 12 }, errorCard: { backgroundColor: "#FEE2E2", borderRadius: radii.lg, padding: 16, gap: 12 }, hero: { backgroundColor: "#174D46", borderRadius: radii.xl, padding: 20, gap: 8 }, heroTitle: { color: colors.surface, fontFamily: fonts.bold, fontSize: 20, ...text }, heroText: { color: "#D1E7E2", fontFamily: fonts.regular, fontSize: 13, lineHeight: 22, ...text }, cardTitle: { color: colors.primary, fontFamily: fonts.bold, fontSize: 16, ...text }, body: { color: colors.text, fontFamily: fonts.regular, fontSize: 13, lineHeight: 22, ...text }, note: { color: "#56616C", fontFamily: fonts.regular, fontSize: 11, lineHeight: 19, ...text }, row: { flexDirection: "row", justifyContent: "space-between", gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8 }, label: { color: "#56616C", flex: 1, fontFamily: fonts.regular, fontSize: 12, ...text }, value: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 12, textAlign: "left" }, button: { minHeight: 46, borderRadius: radii.md, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" }, linkButton: { display: "flex", textAlign: "center", textAlignVertical: "center", fontFamily: fonts.semibold, fontSize: 13, lineHeight: 46, color: colors.primary, textDecorationLine: "none" }, primary: { backgroundColor: colors.accent }, outline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary }, danger: { backgroundColor: "#FEE2E2", borderWidth: 1, borderColor: "#B91C1C" }, buttonText: { fontFamily: fonts.semibold, fontSize: 13, ...text }, buttonTextLight: { color: colors.primary }, buttonTextDark: { color: colors.primary }, choice: { minHeight: 48, padding: 12, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md }, choiceSelected: { borderColor: colors.accent, backgroundColor: colors.accentSoft }, choiceText: { color: colors.text, flex: 1, fontFamily: fonts.medium, fontSize: 12, ...text }, radio: { width: 18, height: 18, borderWidth: 2, borderRadius: 9, borderColor: colors.muted }, radioSelected: { borderColor: colors.accent, backgroundColor: colors.accent }, disclaimer: { padding: 12, backgroundColor: "#FFF7ED", borderRadius: radii.md }, disclaimerText: { color: "#9A4F00", fontFamily: fonts.medium, fontSize: 11, lineHeight: 18, ...text }, bottomNav: { height: 80, flexDirection: "row", paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.page, borderTopWidth: 1, borderColor: colors.border }, bottomItem: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", gap: 4 }, bottomLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, textAlign: "center", writingDirection: "rtl" }, bottomLabelActive: { color: colors.accent, fontFamily: fonts.medium },
});
