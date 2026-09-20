import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

const contractRows = [
  ["ملک", "سعادت‌آباد"],
  ["تاریخ شروع", "۱۵ مهر ۱۴۰۵"],
  ["تاریخ پایان", "۱۵ مهر ۱۴۰۶"],
  ["کد رهگیری", "۱۲۳۴۵۶۷۸۹۰۱۲"],
] as const;

const financeRows = [
  ["مبلغ رهن قرارداد", "۵۰۰٬۰۰۰٬۰۰۰ تومان", "default"],
  ["مبلغ تأمین‌شده توسط بانک", "۴۵۰٬۰۰۰٬۰۰۰ تومان", "primary"],
  ["آورده شما", "۵۰٬۰۰۰٬۰۰۰ تومان", "accent"],
] as const;

const planRows = [
  ["طرح", "طرح ویژه کارکنان", "default"],
  ["بانک", "بانک نمونه", "default"],
  ["مبلغ تأمین مالی", "۴۵۰٬۰۰۰٬۰۰۰ تومان", "default"],
  ["پرداخت ماهانه تأمین مالی", "۱۸٬۵۰۰٬۰۰۰ تومان", "primary"],
  ["مدت بازپرداخت", "۱۲ ماه", "default"],
  ["وضعیت طرح", "تأیید بانک", "primary"],
] as const;

type Tone = "default" | "primary" | "accent";

function Rows({ rows }: { rows: readonly (readonly [string, string, Tone?])[] }) {
  return (
    <div className={styles.rows}>
      {rows.map(([label, value, tone = "default"], index) => (
        <div key={label} className={`${styles.row} ${index === rows.length - 1 ? styles.lastRow : ""}`}>
          <strong className={tone === "primary" ? styles.primaryValue : tone === "accent" ? styles.accentValue : ""}>{value}</strong>
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
  { title: "درخواست ثبت شد", note: "تکمیل شده", done: true },
  { title: "تأیید بانک", note: "تکمیل شده", done: true },
  { title: "پرداخت آورده", note: "نیاز به اقدام", active: true, number: "۳" },
  { title: "تأیید نهایی طرفین", note: "در انتظار", number: "۴" },
  { title: "فعال شدن قرارداد", note: "در انتظار", number: "۵" },
];

export default function ContributionPage() {
  return (
    <main className={styles.page} data-node-id="150:1317" data-name="Web App / Financing Approved / Contribution Required">
      <section className={styles.mainContent} data-node-id="150:1318">
        <header className={styles.pageHeader} data-node-id="150:1319">
          <p data-node-id="150:1320">قراردادها / وضعیت تأمین مالی</p>
          <div className={styles.titleRow} data-node-id="150:1321"><h1 data-node-id="150:1324">پرداخت آورده</h1><span className={styles.approvedBadge}>تأیید شده</span></div>
          <p data-node-id="150:1325">عضویت چارخونه فعال است. برای ادامه، آورده موردنیاز را پرداخت کنید.</p>
        </header>

        <div className={styles.columns} data-node-id="150:1326">
          <aside className={styles.secondaryColumn} data-node-id="150:1327">
            <section className={styles.card} data-node-id="150:1328">
              <h2 data-node-id="150:1329">وضعیت فرایند</h2>
              <div className={styles.verticalTimeline} data-node-id="150:1330">
                {process.map((step, index) => (
                  <div className={styles.processItem} key={step.title}>
                    <div className={`${styles.processCopy} ${step.active ? styles.activeCopy : ""} ${!step.done && !step.active ? styles.waitingCopy : ""}`}><strong>{step.title}</strong><span>{step.note}</span></div>
                    <div className={styles.processTrack}>
                      <span className={`${styles.processDot} ${step.done ? styles.doneDot : ""} ${step.active ? styles.activeDot : ""} ${!step.done && !step.active ? styles.waitingDot : ""}`}>{step.done ? <img src="/brand/financing-review-check.svg" alt="" width={14} height={14} /> : step.number}</span>
                      {index < process.length - 1 ? <span className={`${styles.processLine} ${index < 2 ? styles.doneLine : ""}`} /> : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.card} data-node-id="150:1370"><h2 data-node-id="150:1371">قرارداد مرتبط</h2><Rows rows={contractRows} /></section>
            <Link href="/user/contracts/123456789012" className={styles.contractLink} data-node-id="150:1388">مشاهده قرارداد</Link>
          </aside>

          <div className={styles.detailColumn} data-node-id="150:1389">
            <section className={styles.heroCard} data-node-id="150:1390">
              <span className={styles.heroIcon}><img src="/brand/financing-review-check.svg" alt="" width={14} height={14} /></span>
              <div><h2 data-node-id="150:1395">عضویت چارخونه فعال است</h2><p data-node-id="150:1396">برای تکمیل این مرحله، پرداخت آورده شما الزامی است.</p></div>
            </section>

            <section className={`${styles.card} ${styles.primaryCard}`} data-node-id="150:1397">
              <div className={styles.primaryCopy}><span data-node-id="150:1399">آورده موردنیاز شما</span><strong data-node-id="150:1400">۵۰٬۰۰۰٬۰۰۰ تومان</strong><p data-node-id="150:1401">پس از پرداخت آورده، فرایند تأیید نهایی قرارداد ادامه پیدا می‌کند.</p></div>
              <Link href="/user/contracts/register/plans/final-confirmation" className={styles.primaryAction} data-node-id="150:1403">پرداخت آورده</Link>
            </section>

            <section className={styles.card} data-node-id="150:1405"><h2 data-node-id="150:1406">جزئیات مالی</h2><Rows rows={financeRows} /><div className={styles.formula} data-node-id="150:1418">رهن قرارداد = تأمین مالی + آورده شما</div></section>

            <section className={styles.card} data-node-id="150:1420">
              <h2 data-node-id="150:1421">جزئیات طرح تأییدشده</h2>
              <Rows rows={planRows} />
              <div className={styles.rentNotice} data-node-id="150:1447"><div><strong data-node-id="150:1449">۲۰٬۰۰۰٬۰۰۰ تومان در ماه</strong><span data-node-id="150:1450">اجاره ماهانه قرارداد</span></div><p data-node-id="150:1451">تذکر: اجاره ماهانه قرارداد اطلاعاتی است و ارتباطی به پرداخت ماهانه تأمین مالی ندارد.</p></div>
            </section>
          </div>
        </div>
      </section>

      <UserPanelSidebar nodeId="142:1703" />
    </main>
  );
}
