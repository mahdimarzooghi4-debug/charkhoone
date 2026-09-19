import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelExit } from "@/components/user/UserPanelExit";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/9b0e40f4-b9cc-4975-8cd1-bc694081d011.png",
  avatar: "https://www.figma.com/api/mcp/asset/9b4a4e93-e1bd-4e2b-8523-5a58b872f092.png",
  clock: "https://www.figma.com/api/mcp/asset/bfb7a89b-8057-449d-94b3-7f3cb25a86fa.svg",
  pending: "https://www.figma.com/api/mcp/asset/d48cb5de-a240-4e8d-9e0e-0a60142ebeda.svg",
  active: "https://www.figma.com/api/mcp/asset/c7209e4a-779a-4624-8eb0-ba1a561e8cdf.svg",
  check: "https://www.figma.com/api/mcp/asset/f88d20ba-0cc7-4267-9614-1a72f54bd647.svg",
  home: "https://www.figma.com/api/mcp/asset/fc416273-6582-4a9d-8712-961f908be59c.svg",
  contracts: "https://www.figma.com/api/mcp/asset/fe4abd1a-75eb-4a6d-8f2d-e58d86045a2a.svg",
  payments: "https://www.figma.com/api/mcp/asset/c1cc47e1-509e-47ab-b451-933ef5d5cc3f.svg",
  account: "https://www.figma.com/api/mcp/asset/4736650a-3982-436a-9b62-fced6bc20ef4.svg",
} as const;

const requestRows = [
  ["طرح انتخاب‌شده", "طرح ویژه کارکنان", false],
  ["بانک", "بانک نمونه", false],
  ["مبلغ درخواست", "۴۵۰٬۰۰۰٬۰۰۰ تومان", true],
  ["آورده موردنیاز", "۵۰٬۰۰۰٬۰۰۰ تومان", false],
  ["پرداخت ماهانه تأمین مالی", "۱۸٬۵۰۰٬۰۰۰ تومان", true],
  ["تاریخ ثبت درخواست", "۱۰ آبان ۱۴۰۵", false],
] as const;

const contractRows = [
  ["موقعیت ملک", "سعادت‌آباد"],
  ["مبلغ رهن قرارداد", "۵۰۰٬۰۰۰٬۰۰۰ تومان"],
  ["اجاره ماهانه قرارداد", "۲۰٬۰۰۰٬۰۰۰ تومان"],
  ["کد رهگیری", "۱۲۳۴۵۶۷۸۹۰۱۲"],
] as const;

function DataCard({ title, rows }: { title: string; rows: readonly (readonly [string, string, boolean?])[] }) {
  return (
    <section className={styles.card}>
      <h2>{title}</h2>
      <div className={styles.dataRows}>
        {rows.map(([label, value, emphasized], index) => (
          <div key={label} className={`${styles.dataRow} ${index === rows.length - 1 ? styles.lastRow : ""}`}>
            <strong className={emphasized ? styles.emphasized : ""}>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function FinancingUnderReviewPage() {
  return (
    <main className={styles.page} data-node-id="150:1198" data-name="Web App / Financing Under Review">
      <section className={styles.mainContent} data-node-id="150:1199">
        <header className={styles.pageHeader} data-node-id="150:1200">
          <p data-node-id="150:1201">قراردادها / وضعیت درخواست</p>
          <div className={styles.titleRow} data-node-id="150:1202"><h1 data-node-id="150:1203">درخواست تأمین مالی در حال بررسی است</h1><span className={styles.statusBadge}>در حال بررسی</span></div>
          <p data-node-id="150:1207">درخواست شما برای بررسی به بانک ارسال شده است.</p>
        </header>

        <div className={styles.centeredColumn} data-node-id="150:1208">
          <div className={styles.contentStack} data-node-id="150:1209">
            <section className={styles.heroStatus} data-node-id="150:1210">
              <div className={styles.heroCopy}><h2 data-node-id="150:1215">در حال بررسی توسط بانک</h2><p data-node-id="150:1216">پس از تکمیل بررسی، نتیجه از طریق چارخونه به شما اعلام می‌شود.</p></div>
              <span className={styles.clockWrap}><img src={assets.clock} alt="" width={24} height={24} /></span>
            </section>

            <section className={styles.card} data-node-id="150:1217">
              <h2 data-node-id="150:1218">وضعیت فرایند</h2>
              <div className={styles.timeline} data-node-id="150:1219">
                <div className={styles.timelineStep}>
                  <img className={styles.timelineIcon} src={assets.pending} alt="" width={28} height={28} />
                  <strong className={styles.muted}>اعلام نتیجه</strong><span className={styles.mutedSmall}>در انتظار</span>
                </div>
                <div className={`${styles.connector} ${styles.connectorMuted}`} />
                <div className={styles.timelineStep}>
                  <img className={styles.timelineIcon} src={assets.active} alt="" width={28} height={28} />
                  <strong>بررسی بانک</strong><span>در حال انجام</span>
                </div>
                <div className={styles.connector} />
                <div className={styles.timelineStep}>
                  <span className={styles.completedIcon}><img src={assets.check} alt="" width={14} height={14} /></span>
                  <strong>درخواست ثبت شد</strong><span className={styles.success}>تکمیل شده</span>
                </div>
              </div>
            </section>

            <DataCard title="خلاصه درخواست" rows={requestRows} />
            <DataCard title="مشخصات قرارداد مرتبط" rows={contractRows} />

            <div className={styles.actions} data-node-id="150:1277">
              <Link href="/user/contracts/123456789012" className={styles.primaryAction} data-node-id="150:1278">مشاهده قرارداد</Link>
              <Link href="/user/contracts" className={styles.secondaryAction} data-node-id="150:1281">بازگشت به قراردادها</Link>
            </div>
          </div>
        </div>
      </section>

      <aside className={styles.sidebar} data-node-id="142:1738">
        <div className={styles.sidebarTop}>
          <div className={styles.logoWrap}><img src={assets.logo} alt="چارخونه" width={127} height={55} /></div>
          <nav className={styles.nav} aria-label="ناوبری حساب کاربری">
            <Link href="/user/home" className={styles.navItem}><span className={styles.navSpacer} /><span>خانه</span><img src={assets.home} alt="" width={20} height={20} /></Link>
            <Link href="/user/contracts" className={`${styles.navItem} ${styles.navActive}`}><span className={styles.alertBadge}>۱</span><span>قراردادها</span><img src={assets.contracts} alt="" width={20} height={20} /></Link>
            <Link href="/user/receive-pay" className={styles.navItem}><span className={styles.navSpacer} /><span>دریافت و پرداخت</span><img src={assets.payments} alt="" width={20} height={20} /></Link>
            <Link href="/user/account" className={styles.navItem}><span className={styles.navSpacer} /><span>حساب من</span><img src={assets.account} alt="" width={20} height={20} /></Link>
          </nav>
        </div>
        <UserPanelExit />
      </aside>
    </main>
  );
}
