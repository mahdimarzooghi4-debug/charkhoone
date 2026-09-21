import { useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { BrandLogo } from "@/components/BrandLogo";
import { FigmaSvg } from "@/components/FigmaSvg";
import { OwnerBadge, OwnerCard, OwnerRow } from "@/components/OwnerUi";
import { ownerAssets } from "@/ownerAssets";
import { colors, fonts } from "@/theme";
import { formatMockNumber } from "./mockTenantData";
import { useMockPreview, type MockOwnerSettlement } from "./MockPreviewProvider";

// Purely local design-review screens; NEVER reuse the authenticated owner routes
// while they are gated pending authoritative backend/contract/payment integration.
type OwnerMockScreen = "connected" | "settlement-preference" | "final-confirmation" |
  "active" | "receive-pay" | "terminated" | "account";

const property = "تهران، سعادت‌آباد، خیابان نمونه، پلاک ۲۴، واحد ۳";
const disclaimer = "پیش‌نمایش MOCK مالک؛ هیچ قرارداد، استعلام خودنویس، تأمین مالی بانک، صندوق، تسویه یا تراکنش واقعی ایجاد نمی‌شود.";
const toman = (value: number) => `${formatMockNumber(value)} تومان`;

function OwnerHeader({ title, back = "contract-lookup" }: { title: string; back?: string }) {
  const router = useRouter();
  return <View style={styles.header}>
    <View style={styles.brand}><BrandLogo /></View>
    <View style={styles.appBar}>
      <Pressable accessibilityRole="button" accessibilityLabel="بازگشت" onPress={() => router.push(`/preview/${back}`)} style={styles.back}>
        <View pointerEvents="none"><FigmaSvg uri={ownerAssets.navHome} width={20} height={20} /></View>
      </Pressable>
      <Text style={styles.appBarTitle}>{title}</Text>
    </View>
  </View>;
}

function OwnerAction({ label, to, outline = false, disabled = false }: {
  label: string; to: string; outline?: boolean; disabled?: boolean;
}) {
  const router = useRouter();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }}
    disabled={disabled} onPress={() => router.push(`/preview/${to}`)}
    style={[styles.action, outline && styles.outline, disabled && styles.disabled]}>
    <Text style={[styles.actionLabel, outline && styles.outlineLabel]}>{label}</Text>
  </Pressable>;
}

function OwnerHero({ badge, title, body, warn = false }: {
  badge: string; title: string; body: string; warn?: boolean;
}) {
  return <View style={styles.hero}>
    <View style={styles.heroCircle}>
      <View pointerEvents="none"><FigmaSvg uri={ownerAssets.contractCheck} width={24} height={24} /></View>
    </View>
    <OwnerBadge tone={warn ? "warning" : "success"} size="hero">{badge}</OwnerBadge>
    <Text style={styles.heroTitle}>{title}</Text>
    <Text style={styles.heroDescription}>{body}</Text>
  </View>;
}

function ContractRows({ deposit, rent }: { deposit: string; rent: string }) {
  return <>
    <OwnerRow label="مبلغ رهن" value={deposit} />
    <OwnerRow label="اجاره ماهانه" value={rent} />
    <OwnerRow label="تاریخ شروع قرارداد" value="۱۵ مهر ۱۴۰۵" />
    <OwnerRow label="تاریخ پایان قرارداد" value="۱۵ مهر ۱۴۰۶" />
    <OwnerRow label="کد رهگیری (MOCK)" value="۱۲۳۴۵۶۷۸۹۰۱۲" />
  </>;
}

function PropertyCard() {
  return <OwnerCard title="ملک قرارداد">
    <Text style={styles.body}>{property}</Text>
    <OwnerRow label="کدپستی نمونه" value="۱۹۹۸۷۶۵۴۳۲" />
  </OwnerCard>;
}

function OwnerNotice({ children }: { children: string }) {
  return <View style={styles.notice}><Text style={styles.noticeText}>{children}</Text></View>;
}

function OwnerFooterNav({ active }: { active: "home" | "payments" }) {
  const router = useRouter();
  const links = [
    ["حساب من", "owner-account", ownerAssets.navUser],
    ["قراردادها", "owner-connected", ownerAssets.navFileText],
    ["دریافت و پرداخت", "owner-receive-pay", ownerAssets.navCreditCardActive],
    ["خانه", "owner-active", ownerAssets.navHome],
  ] as const;
  return <View style={styles.nav}>{links.map(([label, route, icon]) => {
    const selected = (active === "home" && route === "owner-active") || (active === "payments" && route === "owner-receive-pay");
    return <Pressable key={route} accessibilityRole="button" accessibilityLabel={label}
      accessibilityState={{ selected }} onPress={() => router.push(`/preview/${route}`)} style={styles.navItem}>
      <View pointerEvents="none"><FigmaSvg uri={icon} width={24} height={24} /></View>
      <Text style={[styles.navLabel, selected && styles.navSelected]}>{label}</Text>
    </Pressable>;
  })}</View>;
}

function SettlementOption({ method, selected, title, children, onSelect }: {
  method: MockOwnerSettlement; selected: boolean; title: string; children: React.ReactNode;
  onSelect: (v: MockOwnerSettlement) => void;
}) {
  return <Pressable accessibilityRole="radio" accessibilityLabel={title} accessibilityState={{ selected }}
    onPress={() => onSelect(method)} style={[styles.settlementOption, selected && styles.settlementSelected]}>
    <View style={styles.optionHead}>
      <View pointerEvents="none"><FigmaSvg uri={selected ? ownerAssets.settlementRadioSelected : ownerAssets.settlementRadioEmpty} width={16} height={16} /></View>
      <View pointerEvents="none"><FigmaSvg uri={method === "monthly" ? ownerAssets.settlementWallet : ownerAssets.settlementChartPie} width={24} height={24} /></View>
      <Text style={styles.optionTitle}>{title}</Text>
    </View>
    {children}
  </Pressable>;
}

export function MockOwnerScreen({ screen }: { screen: OwnerMockScreen }) {
  const { financialModel, monthlyRent, ownerSettlement, setOwnerSettlement } = useMockPreview();
  const [consent, setConsent] = useState(false);
  const fee = Math.round(monthlyRent * 0.005); // only Figma's illustrative service fee, NOT bank interest.
  const net = monthlyRent - fee;
  const ownerMethod = ownerSettlement === "monthly" ? "دریافت ماهانه" : "تجمیع دریافتی در صندوق";
  let body: React.ReactNode;
  let activeNav: "home" | "payments" | undefined;

  switch (screen) {
    case "connected":
      body = <>
        <OwnerHeader title="قرارداد مالک" />
        <OwnerHero badge="متصل شد • MOCK" title="قرارداد به حساب شما متصل شد"
          body="اطلاعات این قرارداد به‌صورت نمونه با نقش مالک نمایش داده شده‌اند." />
        <OwnerCard title="وضعیت قرارداد">
          <OwnerRow label="وضعیت" value="در انتظار تکمیل فرایند تأمین مالی" />
          <Text style={styles.hint}>فرایند تأمین مالی در این پیش‌نمایش صرفاً شبیه‌سازی می‌شود.</Text>
        </OwnerCard>
        <OwnerCard title="مستأجر"><OwnerRow label="نام" value="علی رضایی (نمونه)" /><OwnerRow label="کد ملی" value="۰۰۱•••••۷۸۹" /></OwnerCard>
        <OwnerCard title="خلاصه قرارداد"><ContractRows deposit={financialModel.cashDeposit} rent={financialModel.monthlyRent} /></OwnerCard>
        <PropertyCard />
        <OwnerCard title="مرحله بعد">
          <Text style={styles.body}>در فرایند واقعی، پس از تکمیل بررسی مستأجر برای تأیید نهایی قرارداد به مالک اطلاع داده می‌شود.</Text>
          <OwnerNotice>در این نسخه، برای بازبینی طراحی می‌توانید مراحل بعدی MOCK را دستی مرور کنید.</OwnerNotice>
        </OwnerCard>
        <OwnerAction label="انتخاب روش دریافت (پیش‌نمایش)" to="owner-settlement-preference" />
        <OwnerAction label="بازگشت به انتخاب نقش" to="contract-lookup" outline />
      </>;
      break;
    case "settlement-preference":
      body = <>
        <OwnerHeader title="روش دریافت" back="owner-connected" />
        <Text style={styles.sectionHeading}>روش دریافت خود را انتخاب کنید</Text>
        <Text style={styles.topText}>مشخص کنید دریافتی‌های این قرارداد چگونه برای شما تسویه شوند.</Text>
        <OwnerCard title="قرارداد مرتبط">
          <OwnerRow label="ملک" value="تهران، سعادت‌آباد" />
          <OwnerRow label="اجاره ماهانه قرارداد" value={financialModel.monthlyRent} />
          <OwnerRow label="مدت قرارداد" value="۱۵ مهر ۱۴۰۵ تا ۱۵ مهر ۱۴۰۶" />
        </OwnerCard>
        <SettlementOption method="monthly" title="دریافت ماهانه" selected={ownerSettlement === "monthly"} onSelect={setOwnerSettlement}>
          <Text style={styles.body}>خالص دریافتی ماهانه بر پایه اجاره قرارداد و کارمزد نمونه محاسبه می‌شود.</Text>
          <View style={styles.soft}>
            <OwnerRow label="مبلغ ناخالص دریافتی" value={financialModel.monthlyRent} />
            <OwnerRow label="کارمزد خدمات نمونه (۰٫۵٪)" value={`−${toman(fee)}`} />
            <OwnerRow label="خالص قابل تسویه نمونه" value={toman(net)} />
          </View>
          <Text style={styles.hint}>دسترسی منظم به دریافتی ماهانه • تسویه طبق شرایط قرارداد</Text>
        </SettlementOption>
        <SettlementOption method="fund" title="تجمیع دریافتی در صندوق" selected={ownerSettlement === "fund"} onSelect={setOwnerSettlement}>
          <Text style={styles.body}>انتخاب نمایشی؛ هیچ پولی وارد صندوق نمی‌شود و بازده یا مبلغ پایان دوره محاسبه نمی‌گردد.</Text>
          <View style={styles.soft}>
            <OwnerRow label="دریافتی ماهانه قرارداد" value={financialModel.monthlyRent} />
            <OwnerRow label="بازده و ارزش پایان دوره" value="منوط به شرایط واقعی صندوق" />
          </View>
          <Text style={styles.hint}>شرایط سرمایه‌گذاری واقعی هنوز تعریف و تأیید نشده‌اند.</Text>
        </SettlementOption>
        <OwnerNotice>کارمزد ۰٫۵٪ صرفاً مثال فیگماست؛ سود وام ماهانه مستأجر، درآمد مالک یا بازده صندوق نیست.</OwnerNotice>
        <OwnerAction label="انتخاب و ادامه" to="owner-final-confirmation" />
      </>;
      break;
    case "final-confirmation":
      body = <>
        <OwnerHeader title="تأیید نهایی قرارداد" back="owner-settlement-preference" />
        <OwnerHero badge="نیاز به تأیید شما • MOCK" title="قرارداد آماده تأیید نهایی است"
          body="در سناریوی نمایشی، پس از بررسی و تکمیل آورده مستأجر، تأیید مالک لازم می‌شود." />
        <OwnerCard title="مستأجر"><OwnerRow label="نام" value="علی رضایی" /><OwnerRow label="وضعیت آورده" value="پرداخت نمایشی" /></OwnerCard>
        <OwnerCard title="شرایط قرارداد"><ContractRows deposit={financialModel.cashDeposit} rent={financialModel.monthlyRent} /></OwnerCard>
        <OwnerCard title="تأمین مالی قرارداد">
          <OwnerRow label="مبلغ تأمین‌شده نمونه (C3 / ۳۰٪)" value={financialModel.financing} />
          <OwnerRow label="وضعیت بانک" value="تأیید نشده؛ MOCK" />
          <Text style={styles.hint}>تأمین مالی، مستقل از اجاره/دریافتی مالک است؛ مبلغ ۴۵۰ میلیونِ قدیمی فیگما مبنای این نسخه نیست.</Text>
        </OwnerCard>
        <OwnerCard title="روش دریافت انتخاب‌شده">
          <OwnerRow label="روش انتخابی" value={ownerMethod} />
          {ownerSettlement === "monthly"
            ? <><OwnerRow label="ناخالص ماهانه" value={financialModel.monthlyRent} /><OwnerRow label="کارمزد نمونه" value={`−${toman(fee)}`} /><OwnerRow label="خالص نمونه" value={toman(net)} /></>
            : <Text style={styles.hint}>سود، ارزش پایان دوره و زمان برداشت صندوق هنوز مشخص نیست.</Text>}
          <OwnerAction label="تغییر روش دریافت" to="owner-settlement-preference" outline />
        </OwnerCard>
        <PropertyCard />
        <OwnerCard title="طرفین قرارداد">
          <OwnerRow label="مالک" value="محمد رضایی • ۰۰۲•••••۴۵۶" />
          <OwnerRow label="مستأجر" value="علی رضایی • ۰۰۱•••••۷۸۹" />
        </OwnerCard>
        <OwnerCard title="پس از تأیید شما">
          <Text style={styles.body}>۱. تکمیل تأیید نهایی طرفین؛ ۲. ادامه مسیر مالی قرارداد؛ ۳. فعال‌سازی در چارخونه، فقط در نسخه عملیاتی.</Text>
        </OwnerCard>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: consent }} accessibilityLabel="شرایط نمونه را خواندم"
          onPress={() => setConsent(!consent)} style={styles.checkRow}>
          <View style={[styles.checkbox, consent && styles.checkboxChecked]}><Text style={styles.checkText}>{consent ? "✓" : ""}</Text></View>
          <Text style={styles.checkLabel}>شرایط قرارداد و نمایشی‌بودن تأیید را مطالعه کردم.</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="تأیید نمایشی مالک و ادامه" accessibilityState={{ disabled: !consent }} disabled={!consent}
          onPress={() => { /* go next through explicit route */ }} style={styles.confirmOuter}>
          <OwnerConfirmationButton active={consent} />
        </Pressable>
        <OwnerAction label="بازگشت به قرارداد" to="owner-connected" outline />
      </>;
      break;
    case "active":
      activeNav = "home";
      body = <>
        <OwnerHeader title="جزئیات قرارداد" back="owner-connected" />
        <OwnerHero badge="فعال در سناریو • MOCK" title="مالک • سعادت‌آباد"
          body="قرارداد نمونهٔ متصل‌شده برای مرور نمایش فعال؛ در واقعیت تأیید بانکی یا فعال‌سازی نشده است." />
        <OwnerCard title="دریافتی بعدی">
          <OwnerBadge tone="warning">در انتظار تسویه نمونه</OwnerBadge>
          {ownerSettlement === "monthly"
            ? <><Text style={styles.heroAmount}>{toman(net)}</Text><OwnerRow label="مبلغ ناخالص" value={financialModel.monthlyRent} /><OwnerRow label="کارمزد خدمات نمونه" value={`−${toman(fee)}`} /><OwnerRow label="خالص قابل تسویه" value={toman(net)} /></>
            : <Text style={styles.body}>دریافتی‌ها طبق انتخاب نمایشی شما تجمیع می‌شوند؛ بازده صندوق و مبلغ قابل برداشت مشخص نیست.</Text>}
          <OwnerRow label="زمان نمونه" value="۱۵ آبان ۱۴۰۵" />
          <OwnerAction label="مشاهده دریافت و پرداخت" to="owner-receive-pay" />
        </OwnerCard>
        <OwnerCard title="مستأجر"><OwnerRow label="نام" value="علی رضایی (نمونه)" /><OwnerRow label="کد ملی" value="۰۰۱•••••۷۸۹" /></OwnerCard>
        <OwnerCard title="شرایط قرارداد"><ContractRows deposit={financialModel.cashDeposit} rent={financialModel.monthlyRent} /></OwnerCard>
        <OwnerCard title="وضعیت تأمین مالی"><OwnerRow label="مبلغ تأمین مالی C3 مستأجر" value={financialModel.financing} /><OwnerRow label="وضعیت" value="نمونه؛ بانک تأیید نکرده" /></OwnerCard>
        <OwnerCard title="روش تسویه"><OwnerRow label="روش" value={ownerMethod} /><Text style={styles.hint}>اجاره مالک را با سود بانکی مستأجر یکی نکنید.</Text></OwnerCard>
        <PropertyCard />
        <OwnerAction label="مشاهده دریافتی‌ها" to="owner-receive-pay" />
        <OwnerAction label="مشاهده سناریوی فسخ (MOCK)" to="owner-terminated" outline />
      </>;
      break;
    case "receive-pay":
      activeNav = "payments";
      body = <>
        <OwnerHeader title="دریافت و پرداخت" back="owner-active" />
        <View style={styles.summaryRow}>
          <View style={styles.summaryTile}><Text style={styles.summaryCaption}>دریافتی بعدی نمونه</Text><Text style={styles.summaryAmount}>{ownerSettlement === "monthly" ? toman(net) : "تجمیعی"}</Text></View>
          <View style={styles.summaryTile}><Text style={styles.summaryCaption}>تسویه واقعی این ماه</Text><Text style={styles.summaryAmount}>۰ مورد ثبت‌شده</Text></View>
        </View>
        <OwnerCard title="دریافتی بعدی شما">
          <OwnerBadge tone="warning">در انتظار تسویه • MOCK</OwnerBadge>
          <OwnerRow label="تاریخ نمونه" value="۱۵ آبان ۱۴۰۵" />
          <OwnerRow label="ملک" value="سعادت‌آباد" />
          <OwnerRow label="مستأجر" value="علی رضایی" />
          {ownerSettlement === "monthly"
            ? <><OwnerRow label="ناخالص قرارداد" value={financialModel.monthlyRent} /><OwnerRow label="کارمزد ۰٫۵٪ نمونه" value={`−${toman(fee)}`} /><OwnerRow label="خالص قابل تسویه نمونه" value={toman(net)} /></>
            : <Text style={styles.body}>روش انتخابی: تجمیع نمونه. بازده صندوق و زمان برداشت هنوز تعیین نشده‌اند.</Text>}
        </OwnerCard>
        <Text style={styles.sectionHeading}>دریافتی‌های پیش رو</Text>
        <OwnerCard><OwnerRow label="قرارداد سعادت‌آباد" value="۱۵ آبان ۱۴۰۵" /><Text style={styles.hint}>نمایش برنامه فرضی، نه بدهی یا واریز واقعی</Text></OwnerCard>
        <Text style={styles.sectionHeading}>سوابق تسویه</Text>
        <OwnerCard><Text style={styles.body}>هنوز تسویه واقعی ثبت نشده است.</Text></OwnerCard>
        <OwnerAction label="مشاهده قرارداد مالک" to="owner-active" outline />
        <OwnerAction label="سناریوی فسخ مالک" to="owner-terminated" outline />
      </>;
      break;
    case "terminated":
      activeNav = "home";
      body = <>
        <OwnerHeader title="وضعیت قرارداد" back="owner-active" />
        <OwnerHero warn badge="فسخ شده • MOCK" title="قرارداد فسخ شده است"
          body="این یک سناریوی نمایشی برای مرور طراحی فسخ است، نه اعلام فسخ یا بدهی واقعی." />
        <OwnerNotice>نمونه فیگما سه قسط معوق و تسویه نهایی دارد؛ هیچ شمارش بدهی یا مبلغ قابل کسر واقعی در MOCK محاسبه نشده است.</OwnerNotice>
        <OwnerCard title="اطلاعات قرارداد"><OwnerRow label="ملک" value="قرارداد سعادت‌آباد" /><OwnerRow label="وضعیت" value="فسخ نمایشی" /><OwnerRow label="اجاره ماهانه قرارداد" value={financialModel.monthlyRent} /></OwnerCard>
        <OwnerCard title="وضعیت تسویه نهایی">
          <OwnerBadge tone="warning">محاسبه نشده</OwnerBadge>
          <OwnerRow label="بدهی معوق مستأجر" value="در این MOCK محاسبه نمی‌شود" />
          <OwnerRow label="کسر از آورده" value="در این MOCK محاسبه نمی‌شود" />
          <OwnerRow label="مبلغ قابل تسویه به مالک" value="نیازمند قرارداد و داده معتبر" />
          <Text style={styles.hint}>مبالغ قدیمی فسخ فیگما به قرارداد مالی این نمونه تعمیم داده نمی‌شوند.</Text>
        </OwnerCard>
        <OwnerCard title="روش دریافت"><OwnerRow label="روش انتخاب‌شده" value={ownerMethod} /></OwnerCard>
        <OwnerAction label="بازگشت به قرارداد" to="owner-active" />
        <OwnerAction label="مشاهده دریافت و پرداخت" to="owner-receive-pay" outline />
      </>;
      break;
    case "account":
      activeNav = "home";
      body = <>
        <OwnerHeader title="حساب مالک" back="owner-active" />
        <OwnerCard title="پروفایل نمایشی"><OwnerRow label="نقش" value="مالک" /><OwnerRow label="نام" value="محمد رضایی (MOCK)" /><OwnerRow label="کد ملی" value="۰۰۲•••••۴۵۶" /></OwnerCard>
        <OwnerNotice>فیگمای Owner Mobile صفحهٔ حساب مجزای مالک ندارد؛ این یک مسیر بازگشت ساده است و اطلاعات هویتی واقعی استفاده نمی‌شود.</OwnerNotice>
        <OwnerAction label="قرارداد مالک" to="owner-active" />
        <OwnerAction label="انتخاب نقش" to="contract-lookup" outline />
      </>;
      break;
  }

  return <SafeAreaView style={styles.safe}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      {body}
      <OwnerNotice>{disclaimer}</OwnerNotice>
    </ScrollView>
    {activeNav && <OwnerFooterNav active={activeNav} />}
  </SafeAreaView>;
}

function OwnerConfirmationButton({ active }: { active: boolean }) {
  const router = useRouter();
  return <Pressable accessibilityRole="button" accessibilityLabel="تأیید نمایشی و نمایش قرارداد فعال"
    disabled={!active} accessibilityState={{ disabled: !active }} onPress={() => router.push("/preview/owner-active")}
    style={[styles.action, !active && styles.disabled]}>
    <Text style={styles.actionLabel}>تأیید نمایشی و مشاهده قرارداد</Text>
  </Pressable>;
}

const rtl = { textAlign: "right", writingDirection: "rtl" } as const;
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { padding: 16, paddingBottom: 32, gap: 16 },
  header: { marginHorizontal: -16, marginTop: -16, marginBottom: 0, backgroundColor: colors.primary },
  brand: { height: 60, alignItems: "flex-end", paddingHorizontal: 16 },
  appBar: { height: 56, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 12 },
  back: { width: 32, height: 42, justifyContent: "center", alignItems: "center" },
  appBarTitle: { flex: 1, color: colors.text, fontFamily: fonts.semibold, fontSize: 18, ...rtl },
  hero: { alignItems: "center", gap: 12, paddingTop: 12, paddingBottom: 12, paddingHorizontal: 6 },
  heroCircle: { height: 56, width: 56, borderRadius: 28, backgroundColor: colors.accent, justifyContent: "center", alignItems: "center" },
  heroTitle: { color: colors.page, fontFamily: fonts.bold, fontSize: 20, textAlign: "center", writingDirection: "rtl" },
  heroDescription: { color: colors.page, fontFamily: fonts.regular, fontSize: 13, lineHeight: 22, textAlign: "center", writingDirection: "rtl" },
  sectionHeading: { color: colors.page, fontFamily: fonts.semibold, fontSize: 20, ...rtl },
  topText: { color: colors.page, fontFamily: fonts.regular, fontSize: 13, lineHeight: 22, ...rtl },
  body: { color: colors.text, fontFamily: fonts.regular, fontSize: 13, lineHeight: 22, ...rtl },
  hint: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, lineHeight: 19, ...rtl },
  notice: { backgroundColor: colors.successSoft, padding: 14, borderRadius: 10, alignItems: "flex-end" },
  noticeText: { color: colors.primary, fontFamily: fonts.regular, fontSize: 11, lineHeight: 20, ...rtl },
  soft: { padding: 12, gap: 12, backgroundColor: colors.infoSoft, borderRadius: 8 },
  action: { minHeight: 48, backgroundColor: colors.page, alignItems: "center", justifyContent: "center", borderRadius: 10, padding: 8 },
  actionLabel: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 13, textAlign: "center" },
  outline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary },
  outlineLabel: { color: colors.primary },
  disabled: { opacity: 0.42 },
  settlementOption: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 },
  settlementSelected: { borderColor: colors.accent, borderWidth: 2, backgroundColor: "#FFFBF2" },
  optionHead: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "flex-end" },
  optionTitle: { color: colors.primary, fontFamily: fonts.bold, fontSize: 16, ...rtl },
  checkRow: { flexDirection: "row-reverse", alignItems: "center", gap: 12, minHeight: 50, padding: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkText: { color: colors.surface, fontSize: 16 },
  checkLabel: { color: colors.page, fontFamily: fonts.regular, fontSize: 12, flex: 1, ...rtl },
  confirmOuter: { marginVertical: 0 },
  heroAmount: { color: colors.primary, fontFamily: fonts.bold, fontSize: 26, ...rtl },
  summaryRow: { flexDirection: "row", gap: 8 },
  summaryTile: { backgroundColor: colors.surface, borderRadius: 12, flex: 1, minWidth: 0, padding: 12, gap: 8 },
  summaryCaption: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11, ...rtl },
  summaryAmount: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 13, ...rtl },
  nav: { minHeight: 68, backgroundColor: colors.page, flexDirection: "row", padding: 8, gap: 2 },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2 },
  navLabel: { color: colors.muted, fontFamily: fonts.regular, fontSize: 10, textAlign: "center" },
  navSelected: { color: colors.accent, fontFamily: fonts.semibold },
});
