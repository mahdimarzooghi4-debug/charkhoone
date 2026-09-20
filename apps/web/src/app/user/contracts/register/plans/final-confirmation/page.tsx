import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";
import { FinalConfirmationConsent } from "./FinalConfirmationConsent";

// Normalize digits in sample data, including ASCII and Arabic-Indic fixtures.
const toPersianDigits = (value: string) =>
  value.replace(/[0-9٠-٩]/g, (digit) =>
    "۰۱۲۳۴۵۶۷۸۹"[digit.charCodeAt(0) >= 0x0660 ? digit.charCodeAt(0) - 0x0660 : Number(digit)],
  );

// Keep numeral groups left-to-right without changing Persian labels or date word order.
function renderPersianValue(value: string) {
  return toPersianDigits(value)
    .split(/([۰-۹][۰-۹٬،٫.,\/:-]*)/g)
    .map((part, index) =>
      /^[۰-۹]/.test(part) ? <bdi key={index} dir="ltr" className={styles.persianNumber}>{part}</bdi> : part,
    );
}

const previewNextSteps = [
  "درخواست تأیید نهایی برای مالک ارسال می‌شود.",
  "پس از تکمیل تأیید نهایی، مبلغ تأمین مالی وارد مسیر مالی تعیین‌شده قرارداد می‌شود.",
  "قرارداد در چارخونه فعال می‌شود.",
] as const;

const finalTerms = [
  ["رهن نقدی قرارداد", "۵۰۰٬۰۰۰٬۰۰۰ تومان", "default"],
  ["اجاره ماهانه قرارداد", "۲۰٬۰۰۰٬۰۰۰ تومان در ماه", "default"],
  ["رهن کامل معادل", "۱٬۱۶۶٬۶۶۶٬۶۶۷ تومان", "default"],
  ["تاریخ شروع", "۱۵ مهر ۱۴۰۵", "default"],
  ["تاریخ پایان", "۱۵ مهر ۱۴۰۶", "default"],
  ["مدت قرارداد", "۱۲ ماه", "default"],
] as const;

const financingRows = [
  ["سناریوی تأمین مالی", "رتبه C3 (نمونه)", "default"],
  ["بانک", "بانک نمونه؛ استعلام و تأیید واقعی انجام نشده", "default"],
  ["مبلغ تأمین‌شده", "۳۵۰٬۰۰۰٬۰۰۰ تومان", "primary"],
  ["آورده پرداخت‌شدۀ شما", "۸۱۶٬۶۶۶٬۶۶۷ تومان", "accent"],
  ["پرداختی ماهانه مستأجر (فقط سود وام)", "۶٬۷۰۸٬۳۳۳ تومان", "primary"],
  ["نرخ اسمی سالانه بانک (نمونه)", "۲۳٪", "default"],
  ["نحوه تسویه اصل وام", "طبق قرارداد بانک", "default"],
] as const;

type Tone = "default" | "primary" | "accent";

function Rows({ rows }: { rows: readonly (readonly [string, string, Tone?])[] }) {
  return (
    <div className={styles.rows}>
      {rows.map(([label, value, tone = "default"], index) => (
        <div key={label} className={`${styles.row} ${index === rows.length - 1 ? styles.lastRow : ""}`}>
          <strong className={tone === "primary" ? styles.primaryValue : tone === "accent" ? styles.accentValue : ""}>{renderPersianValue(value)}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

type ProcessStep = {
  title: string;
  note: string;
  done?: boolean;
  active?: boolean;
  number?: string;
};

const process: readonly ProcessStep[] = [
  { title: "تأیید بانک", note: "تکمیل شده", done: true },
  { title: "پرداخت آورده", note: "تکمیل شده", done: true },
  { title: "تأیید نهایی شما", note: "نیاز به اقدام", active: true, number: "۳" },
  { title: "تأیید نهایی مالک", note: "در انتظار", number: "۴" },
  { title: "فعال شدن قرارداد", note: "در انتظار", number: "۵" },
] as const;

export default function FinalConfirmationPage() {
  return (
    <main className={styles.page} data-node-id="150:1489" data-name="Web App / Contribution Paid / Final Confirmation">
      <section className={styles.mainContent} data-node-id="150:1490">
        <header className={styles.pageHeader} data-node-id="150:1491">
          <p data-node-id="150:1492">قراردادها / تأیید نهایی</p>
          <div className={styles.titleRow} data-node-id="150:1493"><h1 data-node-id="150:1494">تأیید نهایی قرارداد</h1><span className={styles.paidBadge} data-node-id="150:1495">آورده پرداخت شده (نمونه)</span></div>
          <p data-node-id="150:1497">در پیش‌نمایش طراحی، پرداخت آورده تکمیل شده است؛ پیش از ادامه، شرایط قرارداد را بررسی و تأیید کنید.</p>
        </header>

        <div className={styles.columns} data-node-id="150:1498">
          <div className={styles.mainColumn} data-node-id="150:1499">
            <section className={styles.successCard} data-node-id="150:1500">
              <div className={styles.successTop} data-node-id="150:1501"><span className={styles.successIcon}><img src="/brand/financing-review-check.svg" alt="" width={14} height={14} /></span><div><h2 data-node-id="150:1506">پرداخت آورده در نمونه تکمیل شد</h2><p data-node-id="150:1507">این صفحه نمونهٔ طراحی است؛ پرداخت واقعی ثبت نشده و مرحلهٔ تأیید نهایی نیز نمایشی است.</p></div></div>
              <div className={styles.successDivider} />
              <div className={styles.successAmount} data-node-id="150:1509"><div><strong data-node-id="150:1511">{renderPersianValue("۸۱۶٬۶۶۶٬۶۶۷")}</strong><span data-node-id="150:1512">تومان</span></div><p data-node-id="150:1513">شناسهٔ نمونه: {renderPersianValue("۱۲۳۴۵۶۷۸۹")}</p></div>
            </section>

            <section className={styles.card} data-node-id="150:1514"><h2 data-node-id="150:1515">شرایط نهایی قرارداد</h2><Rows rows={finalTerms} /></section>

            <section className={styles.card} data-node-id="150:1535">
              <div className={styles.cardTitleRow} data-node-id="150:1536"><h2 data-node-id="150:1537">تأمین مالی قرارداد</h2><span className={styles.approvedBadge} data-node-id="150:1538">تأیید شده</span></div>
              <Rows rows={financingRows} />
            </section>

            <section className={styles.card} data-node-id="150:1568">
              <h2 data-node-id="150:1569">ملک و طرفین قرارداد</h2>
              <div className={styles.propertyBlock} data-node-id="150:1570"><span data-node-id="150:1571">مشخصات ملک</span><strong data-node-id="150:1572">{renderPersianValue("تهران، سعادت‌آباد، خیابان نمونه، پلاک ۲۴، واحد ۳")}</strong></div>
              <div className={styles.divider} />
              <div className={styles.parties} data-node-id="150:1574">
                <div className={styles.party}><span>مستأجر</span><div><strong data-node-id="150:1578">علی رضایی</strong><small className={styles.tenantBadge}>مستأجر</small></div><p data-node-id="150:1581"><span>کد ملی:</span><bdi className={styles.nationalId} dir="ltr">{toPersianDigits("۰۰۱•••••۷۸۹")}</bdi></p></div>
                <div className={styles.partyDivider} />
                <div className={styles.party}><span>مالک</span><div><strong data-node-id="150:1586">محمد رضایی</strong><small className={styles.ownerBadge}>مالک</small></div><p data-node-id="150:1589"><span>کد ملی:</span><bdi className={styles.nationalId} dir="ltr">{toPersianDigits("۰۰۲•••••۴۵۶")}</bdi></p></div>
              </div>
            </section>
          </div>

          <aside className={styles.secondaryColumn} data-node-id="150:1590">
            <section className={styles.card} data-node-id="150:1591">
              <h2 data-node-id="150:1592">وضعیت فرایند</h2>
              <div className={styles.verticalTimeline} data-node-id="150:1593">
                {process.map((step, index) => (
                  <div className={styles.processItem} key={step.title}>
                    <div className={styles.processTrack}>
                      <span className={`${styles.processDot} ${step.done ? styles.doneDot : ""} ${step.active ? styles.activeDot : ""} ${!step.done && !step.active ? styles.waitingDot : ""}`}>{step.done ? <img src="/brand/financing-review-check.svg" alt="" width={14} height={14} /> : renderPersianValue(step.number ?? "")}</span>
                      {index < process.length - 1 ? <span className={`${styles.processLine} ${index < 2 ? styles.doneLine : ""}`} /> : null}
                    </div>
                    <div className={`${styles.processCopy} ${step.active ? styles.activeCopy : ""} ${!step.done && !step.active ? styles.waitingCopy : ""}`}><strong>{step.title}</strong><span>{step.note}</span></div>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.nextSteps} data-node-id="150:1635">
              <h2 data-node-id="150:1636">پس از تأیید شما چه می‌شود؟</h2>
              <ol>
                {previewNextSteps.map((text, index) => (
                  <li key={text}>
                    <span className={styles.stepNumber} aria-hidden="true">
                      <bdi dir="ltr">{toPersianDigits(String(index + 1))}</bdi>
                      <span className={styles.stepPeriod}>.</span>
                    </span>
                    <span>{text}</span>
                  </li>
                ))}
              </ol>
            </section>

            <div className={styles.confirmationArea} data-node-id="150:1647">
              <FinalConfirmationConsent />
              <Link href="/user/contracts/123456789012" className={styles.secondaryAction} data-node-id="150:1655">مشاهده جزئیات قرارداد</Link>
            </div>
          </aside>
        </div>
      </section>

      <UserPanelSidebar nodeId="142:1668" />
    </main>
  );
}
