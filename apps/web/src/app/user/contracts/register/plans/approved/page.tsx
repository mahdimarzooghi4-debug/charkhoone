import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

const contractRows = [
  ["ملک", "سعادت‌آباد"],
  ["تاریخ شروع", "۱۵ مهر ۱۴۰۵"],
  ["تاریخ پایان", "۱۵ مهر ۱۴۰۶"],
  ["کد رهگیری", "۱۲۳۴۵۶۷۸۹۰۱۲"],
] as const;

const staffFinanceRows = [
  ["رهن کامل معادل", "۱٬۱۶۶٬۶۶۶٬۶۶۷ تومان", false],
  ["مبلغ تأمین مالی (نمونه)", "۳۵۰٬۰۰۰٬۰۰۰ تومان", true],
  ["آورده نقدی مستأجر", "۸۱۶٬۶۶۶٬۶۶۷ تومان", false],
] as const;

const generalFinanceRows = [
  ["رهن کامل معادل", "۱٬۱۶۶٬۶۶۶٬۶۶۷ تومان", false],
  ["مبلغ تأمین مالی (نمونه)", "۳۵۰٬۰۰۰٬۰۰۰ تومان", true],
  ["آورده نقدی مستأجر", "۸۱۶٬۶۶۶٬۶۶۷ تومان", false],
] as const;

const staffPlanRows = [
  ["طرح", "طرح ویژه کارکنان", false],
  ["بانک", "بانک نمونه", false],
  ["مبلغ تأمین مالی", "۳۵۰٬۰۰۰٬۰۰۰ تومان", false],
  ["پرداختی ماهانه مستأجر (فقط سود وام)", "۶٬۷۰۸٬۳۳۳ تومان", true],
  ["نحوه تسویه اصل وام", "طبق قرارداد بانک", false],
  ["وضعیت طرح", "تأیید نمونه", true],
] as const;

const generalPlanRows = [
  ["طرح", "طرح عمومی", false],
  ["بانک", "بانک نمونه", false],
  ["مبلغ تأمین مالی", "۳۵۰٬۰۰۰٬۰۰۰ تومان", false],
  ["پرداختی ماهانه مستأجر (فقط سود وام)", "۶٬۷۰۸٬۳۳۳ تومان", true],
  ["نحوه تسویه اصل وام", "طبق قرارداد بانک", false],
  ["وضعیت طرح", "تأیید نمونه", true],
] as const;

function Rows({ rows }: { rows: readonly (readonly [string, string, boolean?])[] }) {
  return <div className={styles.rows}>{rows.map(([label, value, emphasized], index) => <div className={`${styles.row} ${index === rows.length - 1 ? styles.lastRow : ""}`} key={label}><strong className={emphasized ? styles.emphasized : ""}>{value}</strong><span>{label}</span></div>)}</div>;
}

type ProcessStep = {
  title: string;
  note: string;
  done?: boolean;
  active?: boolean;
  number?: string;
};

const process: readonly ProcessStep[] = [
  { title: "ثبت درخواست (نمونه)", note: "مرحلهٔ نمایشی", done: true },
  { title: "بررسی بانک (نمونه)", note: "مرحلهٔ نمایشی", done: true },
  { title: "اعلام نتیجه (نمونه)", note: "تأیید نمونه", done: true },
  { title: "خرید عضویت چارخونه", note: "مرحلهٔ بعد", active: true, number: "۴" },
  { title: "تأیید نهایی طرفین", note: "در انتظار", number: "۵" },
  { title: "فعال شدن قرارداد", note: "در انتظار", number: "۶" },
];

export default async function FinancingApprovedPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const plan = (await searchParams).plan === "general" ? "general" : "staff";
  const financeRows = plan === "general" ? generalFinanceRows : staffFinanceRows;
  const planRows = plan === "general" ? generalPlanRows : staffPlanRows;
  return (
    <main className={styles.page} data-node-id="912:106" data-name="Web App / Financing Approved / Membership Required">
      <section className={styles.mainContent} data-node-id="912:107">
        <header className={styles.pageHeader} data-node-id="912:108">
          <p data-node-id="912:109">قراردادها / وضعیت تأمین مالی</p>
          <div className={styles.titleRow}><span className={styles.approvedBadge}>نتیجهٔ نمونه</span><h1 data-node-id="912:113">اعلام نتیجهٔ نمونهٔ بررسی بانک</h1></div>
          <p data-node-id="912:114">در این پیش‌نمایش، درخواست تأیید شده است؛ نتیجهٔ واقعی از بانک دریافت نشده است.</p>
        </header>

        <div className={styles.columns} data-node-id="912:115">
          <aside className={styles.secondaryColumn} data-node-id="912:116">
            <section className={styles.card} data-node-id="912:117">
              <h2 data-node-id="912:118">وضعیت فرایند</h2>
              <div className={styles.verticalTimeline}>
                {process.map((step, index) => (
                  <div className={styles.processItem} key={step.title}>
                    <div className={`${styles.processCopy} ${step.active ? styles.activeCopy : ""} ${!step.done && !step.active ? styles.waitingCopy : ""}`}><strong>{step.title}</strong><span>{step.note}</span></div>
                    <div className={styles.processTrack}>
                      <span className={`${styles.processDot} ${step.done ? styles.doneDot : ""} ${step.active ? styles.activeDot : ""} ${!step.done && !step.active ? styles.waitingDot : ""}`}>{step.done ? <img src="/brand/financing-review-check.svg" alt="" width={14} height={14} /> : step.number}</span>
                      {index < process.length - 1 ? <span className={`${styles.processLine} ${index < 3 ? styles.doneLine : ""}`} /> : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.card} data-node-id="912:161"><h2>قرارداد مرتبط</h2><Rows rows={contractRows} /></section>
            <Link href="/user/contracts/123456789012" className={styles.contractLink} data-node-id="912:179">مشاهده قرارداد</Link>
          </aside>

          <div className={styles.detailColumn} data-node-id="912:180">
            <section className={styles.heroCard} data-node-id="912:181">
              <span className={styles.heroIcon}><img src="/brand/financing-review-check.svg" alt="" width={14} height={14} /></span>
              <div><h2 data-node-id="912:187">نتیجهٔ نمایشی: طرح تأمین مالی تأیید شد</h2><p data-node-id="912:188">برای ادامهٔ نمونه، طرح عضویت چارخونه را انتخاب کنید؛ پرداخت واقعی انجام نمی‌شود.</p></div>
            </section>

            <section className={`${styles.card} ${styles.primaryCard}`} data-node-id="912:189">
              <div className={styles.primaryCopy}><span>عضویت چارخونه (نمونه)</span><strong data-node-id="912:192">مرحلهٔ بعد: خرید عضویت</strong><p data-node-id="912:193">ابتدا طرح عضویت را انتخاب کنید و سپس مراحل نمایشی پرداخت آورده را ببینید.</p></div>
              <Link href={`/user/contracts/register/plans/membership?plan=${plan}`} className={styles.primaryAction} data-node-id="912:195">انتخاب و خرید عضویت (نمونه)</Link>
            </section>

            <section className={styles.card} data-node-id="912:197"><h2>جزئیات مالی</h2><Rows rows={financeRows} /><div className={styles.formula}>رهن کامل معادل = تأمین مالی بانک + آورده مستأجر</div></section>

            <section className={styles.card} data-node-id="912:212">
              <h2>جزئیات طرح تأییدشده</h2>
              <Rows rows={planRows} />
              <div className={styles.rentNotice}><div><strong>۲۰٬۰۰۰٬۰۰۰ تومان در ماه</strong><span>اجاره ماهانه قرارداد</span></div><p>تذکر: اجاره ماهانه قرارداد اطلاعاتی است و ارتباطی به پرداختی ماهانه مستأجر (فقط سود وام) ندارد.</p></div>
            </section>
          </div>
        </div>
      </section>

      <UserPanelSidebar nodeId="912:244" />
    </main>
  );
}
