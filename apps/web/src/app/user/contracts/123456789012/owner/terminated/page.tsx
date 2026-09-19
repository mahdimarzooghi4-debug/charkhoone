import Link from "next/link";
import styles from "../flow.module.css";
import { UserPanelExit } from "@/components/user/UserPanelExit";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/2a939e67-3009-4f30-a49f-7d71dcab52b5.png",
  avatar: "https://www.figma.com/api/mcp/asset/d71dfa4b-2492-4f1a-b45e-229e5aca27c5.png",
  home: "https://www.figma.com/api/mcp/asset/8903e066-88d3-4ca9-9b94-498e1bf628a9.svg",
  contracts: "https://www.figma.com/api/mcp/asset/a2b4219b-b792-4570-9aee-40231734a083.svg",
  payments: "https://www.figma.com/api/mcp/asset/fad1f958-b1b2-4c4e-965f-3a18988f8829.svg",
  account: "https://www.figma.com/api/mcp/asset/899ab2aa-a513-49fb-af12-97040eb02c8e.svg",
} as const;

const settlementRows = [
  ["وضعیت قرارداد", "فسخ شده", "danger"],
  ["وضعیت تسویه مالی", "محاسبه تعهدات مستأجر", "normal"],
  ["کل مبالغ معوق مستأجر", "۵۵٬۵۰۰٬۰۰۰ تومان", "normal"],
  ["مبلغ ناخالص قابل تسویه", "۴۵٬۰۰۰٬۰۰۰ تومان", "green"],
  ["تاریخ برآوردی واریز تسویه", "پس از تکمیل نهایی محاسبات", "normal"],
] as const;

const contractRows = [
  ["ملک مورد اجاره", "سعادت‌آباد، خیابان سرو", "normal"],
  ["مستأجر حقیقی", "علی رضایی", "normal"],
  ["کد ملی مستأجر", "۰۰۱•••••۷۸۹", "normal"],
  ["تاریخ شروع قرارداد", "۱۵ مهر ۱۴۰۵", "normal"],
  ["وضعیت جاری در سامانه", "فسخ شده", "danger"],
  ["کد رهگیری معتبر", "۱۲۳۴۵۶۷۸۹۰۱۲", "normal"],
] as const;

export default function OwnerContractTerminatedPage() {
  return (
    <main className={styles.page} data-node-id="173:219" data-name="Web App / Contract Terminated / Owner">
      <section className={styles.mainContent} data-node-id="173:220">
        <header className={styles.pageHeader} data-node-id="173:221">
          <div className={styles.breadcrumb} data-node-id="173:222"><span>قراردادها</span><span>/</span><span>وضعیت قرارداد</span></div>
          <div className={styles.titleBlock} data-node-id="173:226"><div className={styles.badges}><span className={styles.badgeTerminated}>فسخ شده</span><span className={styles.badgeWarning}>مالک</span></div><div className={styles.titleCopy}><h1 data-node-id="173:233">قرارداد فسخ شده است</h1><p data-node-id="173:234">به‌دلیل سه قسط معوق مستأجر، قرارداد مطابق فرایند تعیین‌شده فسخ شده است.</p></div></div>
        </header>

        <section className={`${styles.hero} ${styles.dangerHero}`} data-node-id="173:235">
          <div className={styles.heroTop}><span className={styles.dangerBadge}>فسخ خودکار</span><span className={styles.alertIcon}>!</span></div>
          <h2 data-node-id="173:241">قرارداد به‌علت عدم پرداخت اقساط فسخ گردید</h2>
          <p data-node-id="173:242">به‌دلیل ثبت سه قسط معوق توسط مستأجر، قرارداد فسخ شده است. تسویه مبالغ مربوط به این قرارداد از محل آورده مستأجر و طبق فرایند مالی سیستم انجام می‌شود. جزئیات و مانده قابل پرداخت به‌زودی به حساب شما واریز خواهد شد.</p>
          <span className={styles.dangerPill} data-node-id="173:245">۳ قسط پرداخت‌نشده مستأجر</span>
        </section>

        <div className={styles.columns} data-node-id="173:246">
          <aside className={`${styles.sideColumn} ${styles.sideColumnNarrow}`} data-node-id="173:247">
            <section className={styles.card} data-node-id="173:248"><h2 data-node-id="173:249">وضعیت فرایند فسخ و تسویه</h2><div className={styles.divider} /><div className={styles.timeline}><div className={styles.timelineRow}><span className={`${styles.stepDot} ${styles.stepDone}`}>۱</span><div className={styles.timelineCopy}><strong>ثبت ۳ قسط معوق مستأجر</strong></div><span className={`${styles.timelineStatus} ${styles.done}`}>تکمیل شده</span></div><div className={styles.timelineRow}><span className={`${styles.stepDot} ${styles.stepDone}`}>۲</span><div className={styles.timelineCopy}><strong>فسخ خودکار قرارداد</strong></div><span className={`${styles.timelineStatus} ${styles.done}`}>تکمیل شده</span></div><div className={styles.timelineRow}><span className={`${styles.stepDot} ${styles.stepActive}`}>۳</span><div className={styles.timelineCopy}><strong>محاسبه تسویه از محل آورده</strong></div><span className={`${styles.timelineStatus} ${styles.active}`}>در حال انجام</span></div><div className={styles.timelineRow}><span className={styles.stepDot}>۴</span><div className={styles.timelineCopy}><strong>واریز وجه قابل پرداخت به مالک</strong></div><span className={styles.timelineStatus}>در انتظار</span></div></div></section>
          </aside>

          <div className={styles.mainColumn} data-node-id="173:280">
            <section className={styles.card} data-node-id="173:281"><div className={styles.cardHeader}><span className={styles.badgeWaiting}>در حال انجام</span><h2 data-node-id="173:285">خلاصه وضعیت تسویه مالی مالک</h2></div><div className={styles.divider} /><div className={styles.rowList}>{settlementRows.map(([label, value, tone]) => <div className={styles.row} key={label}><strong className={tone === "danger" ? styles.dangerText : tone === "green" ? styles.moneyGreen : ""}>{value}</strong><span>{label}</span></div>)}</div><div className={styles.divider} /><div className={styles.infoBoxMuted} data-node-id="173:304">فرایند تسویه مالی چارخونه به‌طور ایمن از محل سپرده و آورده اولیه قانونی مستأجر انجام می‌شود. کارمزد خدمات چارخونه (۰٫۵٪) از مبلغ ناخالص دریافتی کسر می‌گردد.</div></section>

            <section className={styles.card} data-node-id="173:306"><h2 data-node-id="173:307">خلاصه مشخصات قرارداد منقضی</h2><div className={styles.divider} /><div className={styles.rowList}>{contractRows.map(([label, value, tone]) => <div className={styles.row} key={label}><strong className={tone === "danger" ? styles.dangerText : ""}>{value}</strong><span>{label}</span></div>)}</div></section>

            <div className={styles.actions} data-node-id="173:328"><Link href="/user/receive-pay" className={styles.primaryAction} data-node-id="173:329">مشاهده جزئیات تسویه مالی</Link><span className={styles.secondaryAction} data-node-id="173:331">مشاهده اسناد قرارداد</span></div>
          </div>
        </div>
      </section>

      <aside className={styles.sidebar} data-node-id="142:2103"><div className={styles.sidebarTop}><div className={styles.logoWrap}><img src={assets.logo} alt="چارخونه" width={127} height={55} /></div><nav className={styles.nav}><Link href="/user/home" className={styles.navItem}><span className={styles.navSpacer} /><span>خانه</span><img src={assets.home} alt="" width={20} height={20} /></Link><Link href="/user/contracts" className={`${styles.navItem} ${styles.navActive}`}><span className={styles.alertBadge}>۱</span><span>قراردادها</span><img src={assets.contracts} alt="" width={20} height={20} /></Link><Link href="/user/receive-pay" className={styles.navItem}><span className={styles.navSpacer} /><span>دریافت و پرداخت</span><img src={assets.payments} alt="" width={20} height={20} /></Link><Link href="/user/account" className={styles.navItem}><span className={styles.navSpacer} /><span>حساب من</span><img src={assets.account} alt="" width={20} height={20} /></Link></nav></div><UserPanelExit /></aside>
    </main>
  );
}
