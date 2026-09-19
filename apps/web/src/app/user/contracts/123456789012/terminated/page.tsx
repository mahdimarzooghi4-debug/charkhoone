import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelExit } from "@/components/user/UserPanelExit";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/3f652f51-6396-4f25-9f52-a9f715386fae.png",
  avatar: "https://www.figma.com/api/mcp/asset/87b51de4-d009-4cc6-8bcb-b26c3f5b4044.png",
  home: "https://www.figma.com/api/mcp/asset/0fc13224-8a0f-48d7-8b95-d4841a985414.svg",
  contracts: "https://www.figma.com/api/mcp/asset/4a3c32b5-5943-4b08-848c-b621481a2683.svg",
  payments: "https://www.figma.com/api/mcp/asset/b19ba27a-4f75-4217-966d-6e5ccc188d54.svg",
  account: "https://www.figma.com/api/mcp/asset/86e5a306-f43f-4929-b612-1231a242a24a.svg",
} as const;

const process = [
  ["۱", "ثبت ۳ قسط معوق", "تکمیل شده", "done"],
  ["۲", "فسخ خودکار قرارداد", "تکمیل شده", "terminated"],
  ["۳", "محاسبه مبالغ و آورده", "تکمیل شده", "done"],
  ["۴", "تسویه نهایی مالی", "در حال انجام", "active"],
] as const;

const settlement = [
  ["تعداد اقساط معوق", "۳ قسط", "danger"],
  ["مبلغ کل معوق", "۵۵٬۵۰۰٬۰۰۰ تومان", "danger"],
  ["آورده ثبت‌شدۀ اولیه مستأجر", "۵۰٬۰۰۰٬۰۰۰ تومان", "default"],
  ["مبلغ کسرشدۀ نهایی از آورده", "۴۸٬۰۰۰٬۰۰۰ تومان", "default"],
] as const;

const contract = [
  ["ملک", "سعادت‌آباد", "default"],
  ["تاریخ شروع", "۱۵ مهر ۱۴۰۵", "default"],
  ["وضعیت جاری در سامانه", "فسخ شده", "terminated"],
  ["کد رهگیری معتبر", "۱۲۳۴۵۶۷۸۹۰۱۲", "default"],
] as const;

type Tone = "default" | "danger" | "terminated";

function Rows({ rows }: { rows: readonly (readonly [string, string, Tone])[] }) {
  return <div className={styles.rows}>{rows.map(([label, value, tone]) => <div key={label} className={styles.row}><strong className={tone === "danger" ? styles.danger : tone === "terminated" ? styles.terminatedText : ""}>{value}</strong><span>{label}</span></div>)}</div>;
}

export default function TerminatedTenantContractPage() {
  return (
    <main className={styles.page} data-node-id="171:379" data-name="Web App / Contract Terminated / Tenant">
      <section className={styles.mainContent} data-node-id="171:380">
        <header className={styles.pageHeader} data-node-id="171:381"><div className={styles.breadcrumb} data-node-id="171:382"><span>قراردادها</span><span>/</span><strong>وضعیت قرارداد</strong></div><div className={styles.titleBlock} data-node-id="171:386"><div className={styles.badges}><span className={styles.terminatedBadge}>فسخ شده</span><span className={styles.tenantBadge}>مستأجر</span></div><div className={styles.titleCopy}><h1 data-node-id="171:393">قرارداد فسخ شده است</h1><p data-node-id="171:394">به‌دلیل سه قسط معوق، قرارداد مطابق فرایند تعیین‌شده فسخ شده است.</p></div></div></header>

        <div className={styles.alertSpacer} data-node-id="171:395" />

        <div className={styles.columns} data-node-id="171:396">
          <aside className={styles.secondaryColumn} data-node-id="171:397"><section className={styles.card} data-node-id="171:398"><h2 data-node-id="171:399">وضعیت فرایند فسخ و تسویه</h2><div className={styles.divider} /><div className={styles.processList} data-node-id="171:401">{process.map(([number, title, status, state]) => <div className={styles.processItem} key={number}><span className={`${styles.statusBadge} ${state === "active" ? styles.statusActive : state === "terminated" ? styles.statusTerminated : styles.statusDone}`}>{status}</span><strong>{title}</strong><span className={`${styles.processDot} ${state === "active" ? styles.dotActive : state === "terminated" ? styles.dotTerminated : styles.dotDone}`}>{number}</span></div>)}</div></section></aside>

          <div className={styles.primaryColumn} data-node-id="171:434">
            <section className={styles.card} data-node-id="171:435"><div className={styles.cardHeader} data-node-id="171:436"><span className={styles.progressBadge}>در حال تکمیل</span><h2 data-node-id="171:439">خلاصه وضعیت تسویه مالی</h2></div><div className={styles.divider} /><Rows rows={settlement} /><div className={styles.divider} /><p className={styles.infoBox} data-node-id="171:456">مبالغ فوق بر اساس جریمه‌های دیرکرد و تعهدات قرارداد پیش از تاریخ فسخ محاسبه شده‌اند.</p></section>

            <section className={styles.card} data-node-id="171:457"><h2 data-node-id="171:458">خلاصه مشخصات قرارداد منقضی</h2><div className={styles.divider} /><Rows rows={contract} /></section>

            <div className={styles.actions} data-node-id="171:473"><Link href="/user/receive-pay" className={styles.secondaryAction} data-node-id="171:477">مشاهده دریافت و پرداخت</Link></div>
          </div>
        </div>
      </section>

      <aside className={styles.sidebar} data-node-id="142:2068"><div className={styles.sidebarTop}><div className={styles.logoWrap}><img src={assets.logo} alt="چارخونه" width={127} height={55} /></div><nav className={styles.nav}><Link href="/user/home" className={styles.navItem}><span className={styles.navSpacer} /><span>خانه</span><img src={assets.home} alt="" width={20} height={20} /></Link><Link href="/user/contracts" className={`${styles.navItem} ${styles.navActive}`}><span className={styles.alertBadge}>۱</span><span>قراردادها</span><img src={assets.contracts} alt="" width={20} height={20} /></Link><Link href="/user/receive-pay" className={styles.navItem}><span className={styles.navSpacer} /><span>دریافت و پرداخت</span><img src={assets.payments} alt="" width={20} height={20} /></Link><Link href="/user/account" className={styles.navItem}><span className={styles.navSpacer} /><span>حساب من</span><img src={assets.account} alt="" width={20} height={20} /></Link></nav></div><UserPanelExit /></aside>
    </main>
  );
}
