import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelExit } from "@/components/user/UserPanelExit";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/6c0f11d8-2c30-413c-aa93-7baa459997c4.png",
  avatar: "https://www.figma.com/api/mcp/asset/5343cc6b-94fc-4729-9566-d28a0ac8b1f5.png",
  info: "https://www.figma.com/api/mcp/asset/b77da5f5-be72-418e-89b8-e074ba0371f1.svg",
  alert: "https://www.figma.com/api/mcp/asset/ea8b25cb-8c66-40e2-bb29-0b86ee7e6335.svg",
  home: "https://www.figma.com/api/mcp/asset/dab1667e-cef3-48fd-9fca-4c66f2351509.svg",
  contracts: "https://www.figma.com/api/mcp/asset/d1fe5cdb-d683-4a90-9586-d17cb5823aa6.svg",
  payments: "https://www.figma.com/api/mcp/asset/72c66b90-36ba-4cba-97c6-1ec846e438ba.svg",
  account: "https://www.figma.com/api/mcp/asset/3eb032d9-2a9a-4013-ab01-1a21663e2e42.svg",
} as const;

const process = [
  ["۱", "بررسی بانک", "تکمیل شده", "done"],
  ["۲", "پرداخت آورده", "تکمیل شده", "done"],
  ["۳", "تأیید نهایی مستأجر", "تکمیل شده", "done"],
  ["۴", "تأیید نهایی مالک", "در انتظار تأیید", "active"],
  ["۵", "فعال شدن قرارداد", "در انتظار", "waiting"],
] as const;

const tenantSteps = ["تأیید بانک", "پرداخت آورده", "تأیید نهایی شما"] as const;
const summary = [
  ["ملک", "سعادت‌آباد"],
  ["مبلغ رهن", "۵۰۰٬۰۰۰٬۰۰۰ تومان"],
  ["اجاره ماهانه قرارداد", "۲۰٬۰۰۰٬۰۰۰ تومان"],
  ["مبلغ تأمین مالی", "۴۵۰٬۰۰۰٬۰۰۰ تومان"],
  ["آورده پرداخت‌‌شده", "۵۰٬۰۰۰٬۰۰۰ تومان"],
  ["تاریخ شروع", "۱۵ مهر ۱۴۰۵"],
  ["تاریخ پایان", "۱۵ مهر ۱۴۰۶"],
] as const;

export default function WaitingOwnerPage() {
  return (
    <main className={styles.page} data-node-id="171:211" data-name="Web App / Waiting for Owner Confirmation">
      <section className={styles.mainContent} data-node-id="171:212">
        <header className={styles.pageHeader} data-node-id="171:213">
          <div className={styles.breadcrumb} data-node-id="171:214"><span>قراردادها</span><span>/</span><span>وضعیت قرارداد</span></div>
          <div className={styles.titleBlock} data-node-id="171:218">
            <div className={styles.badges} data-node-id="171:219"><span className={styles.waitBadge}>در انتظار تأیید مالک</span><span className={styles.tenantBadge}>مستأجر</span></div>
            <div className={styles.titleCopy} data-node-id="171:225"><h1 data-node-id="171:226">در انتظار تأیید نهایی مالک</h1><p data-node-id="171:227">فرایند شما تکمیل شده و قرارداد برای تأیید نهایی مالک ارسال شده است.</p></div>
          </div>
        </header>

        <section className={styles.statusHero} data-node-id="171:228">
          <div className={styles.heroHeader} data-node-id="171:229"><span className={styles.doneBadge}>اقدام انجام شده</span><h2 data-node-id="171:232">اقدام‌های شما تکمیل شده است</h2></div>
          <div className={styles.blueDivider} />
          <p data-node-id="171:234">پس از تأیید نهایی مالک، مراحل مالی قرارداد تکمیل و قرارداد در چارخونه فعال می‌شود.</p>
        </section>

        <div className={styles.columns} data-node-id="171:235">
          <aside className={styles.secondaryColumn} data-node-id="171:236">
            <section className={styles.card} data-node-id="171:237">
              <h2 data-node-id="171:238">وضعیت فرایند</h2><div className={styles.divider} />
              <div className={styles.processList} data-node-id="171:240">
                {process.map(([number, title, note, state]) => <div className={styles.processItem} key={number}><div className={styles.processCopy}><strong className={state === "active" ? styles.orangeText : ""}>{title}</strong><span>{note}</span></div><span className={`${styles.processDot} ${state === "done" ? styles.doneDot : state === "active" ? styles.activeDot : styles.waitingDot}`}>{number}</span></div>)}
              </div>
            </section>

            <section className={styles.card} data-node-id="171:271">
              <div className={styles.cardHeader}><span className={styles.waitBadge}>در انتظار تأیید نهایی</span><h2 data-node-id="171:276">مالک</h2></div><div className={styles.divider} />
              <div className={styles.ownerCopy} data-node-id="171:278"><strong data-node-id="171:279">محمد رضایی</strong><span data-node-id="171:280">کد ملی: ۰۰۲•••••۴۵۶</span></div>
            </section>
          </aside>

          <div className={styles.primaryColumn} data-node-id="171:281">
            <section className={styles.card} data-node-id="171:282"><h2 data-node-id="171:283">وضعیت شما (مستأجر)</h2><div className={styles.divider} /><div className={styles.completedList}>{tenantSteps.map((step) => <div key={step}><span className={styles.completeBadge}>تکمیل شده</span><strong>{step}</strong></div>)}</div></section>

            <section className={styles.card} data-node-id="171:298"><h2 data-node-id="171:299">خلاصه قرارداد</h2><div className={styles.divider} /><div className={styles.summaryGrid} data-node-id="171:301">{summary.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section>

            <section className={styles.nextStep} data-node-id="171:323"><div className={styles.nextStepHeader} data-node-id="171:324"><h2 data-node-id="171:325">مرحله بعد</h2><img src={assets.info} alt="" width={20} height={20} /></div><p data-node-id="171:328">مالک باید اطلاعات قرارداد و روش دریافت خود را بررسی و تأیید کند.<br />پس از تکمیل تأیید مالک، قرارداد وارد مرحله فعال‌سازی می‌شود.</p></section>
          </div>
        </div>

        <footer className={styles.bottomActions} data-node-id="171:329">
          <div className={styles.actions} data-node-id="171:330"><Link href="/user/contracts" className={styles.outlineAction} data-node-id="171:331">بازگشت به قراردادها</Link><Link href="/user/contracts/123456789012" className={styles.primaryAction} data-node-id="171:336">مشاهده قرارداد</Link></div>
          <div className={styles.notice} data-node-id="171:339"><span data-node-id="171:340">در حال حاضر اقدامی از طرف شما لازم نیست.</span><img src={assets.alert} alt="" width={16} height={16} /></div>
        </footer>
      </section>

      <aside className={styles.sidebar} data-node-id="142:2031"><div className={styles.sidebarTop}><div className={styles.logoWrap}><img src={assets.logo} alt="چارخونه" width={127} height={55} /></div><nav className={styles.nav}><Link href="/user/home" className={styles.navItem}><span className={styles.navSpacer} /><span>خانه</span><img src={assets.home} alt="" width={20} height={20} /></Link><Link href="/user/contracts" className={`${styles.navItem} ${styles.navActive}`}><span className={styles.alertBadge}>۱</span><span>قراردادها</span><img src={assets.contracts} alt="" width={20} height={20} /></Link><Link href="/user/receive-pay" className={styles.navItem}><span className={styles.navSpacer} /><span>دریافت و پرداخت</span><img src={assets.payments} alt="" width={20} height={20} /></Link><Link href="/user/account" className={styles.navItem}><span className={styles.navSpacer} /><span>حساب من</span><img src={assets.account} alt="" width={20} height={20} /></Link></nav></div><UserPanelExit /></aside>
    </main>
  );
}
