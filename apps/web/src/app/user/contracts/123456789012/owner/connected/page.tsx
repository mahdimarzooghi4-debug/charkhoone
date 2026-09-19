import Link from "next/link";
import styles from "../flow.module.css";
import { UserPanelExit } from "@/components/user/UserPanelExit";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/6e9cc480-58ea-4d4c-bd5f-e77e7e312f70.png",
  avatar: "https://www.figma.com/api/mcp/asset/5e03f6a1-ab23-4396-a35b-0cf5b348912b.png",
  info: "https://www.figma.com/api/mcp/asset/9989b23d-e371-42df-86af-3ba9a86e660f.svg",
  alert: "https://www.figma.com/api/mcp/asset/067c8dc9-20fc-4306-90be-cc8b99f9a52e.svg",
  home: "https://www.figma.com/api/mcp/asset/1f2bcdd5-bad4-4bbc-ac91-a2b42f2af678.svg",
  contracts: "https://www.figma.com/api/mcp/asset/26c54e65-5436-4993-b61e-9fc1dfbd2ce3.svg",
  payments: "https://www.figma.com/api/mcp/asset/b4398658-0002-4317-8433-e12457b2def1.svg",
  account: "https://www.figma.com/api/mcp/asset/f908a23c-0a6a-461f-8bc1-d463e0916724.svg",
} as const;

const process = [
  ["اتصال قرارداد", "تکمیل شده", "done"],
  ["فرایند تأمین مالی مستأجر", "در حال انجام", "active"],
  ["انتخاب روش دریافت مالک", "در انتظار", "waiting"],
  ["تأیید نهایی مالک", "در انتظار", "waiting"],
  ["فعال شدن قرارداد", "در انتظار", "waiting"],
] as const;

export default function OwnerContractConnectedPage() {
  return (
    <main className={styles.page} data-node-id="170:278" data-name="Web App / Owner Contract Connected">
      <section className={styles.mainContent} data-node-id="170:279">
        <header className={styles.pageHeader} data-node-id="170:280">
          <div className={styles.breadcrumb} data-node-id="170:281"><span>قراردادها</span><span>/</span><span>وضعیت قرارداد</span></div>
          <div className={styles.titleBlock} data-node-id="170:285">
            <div className={styles.badges}><span className={styles.badgeWarning}>در حال تکمیل فرایند</span><span className={styles.badgeOwnerDark}>مالک</span></div>
            <div className={styles.titleCopy}><h1 data-node-id="170:293">قرارداد به حساب شما متصل شد</h1><p data-node-id="170:294">اطلاعات این قرارداد با نقش مالک به حساب شما متصل شده است.</p></div>
          </div>
        </header>

        <section className={styles.hero} data-node-id="170:295">
          <div className={styles.heroTop}><span className={styles.heroBadge}>در انتظار مستأجر</span><h2 data-node-id="170:299">در انتظار تکمیل فرایند مستأجر</h2></div>
          <div className={styles.divider} />
          <p data-node-id="170:301">فرایند تأمین مالی مستأجر هنوز تکمیل نشده است. در حال حاضر اقدامی از طرف شما لازم نیست.</p>
        </section>

        <div className={styles.columns} data-node-id="170:302">
          <aside className={styles.sideColumn} data-node-id="170:303">
            <section className={styles.card} data-node-id="170:304">
              <h2 data-node-id="170:305">اطلاعات ملک</h2><div className={styles.divider} />
              <div className={styles.propertyInfo}><div><span>آدرس ملک</span><strong>تهران، سعادت‌آباد، خیابان نمونه، پلاک ۲۴، واحد ۳</strong></div><div><span>کدپستی</span><strong>۱۹۹۸۷۶۵۴۳۲</strong></div></div>
            </section>
            <section className={styles.card} data-node-id="170:314">
              <h2 data-node-id="170:315">وضعیت فرایند</h2><div className={styles.divider} />
              <div className={styles.timeline} data-node-id="170:317">
                {process.map(([title, subtitle, state], index) => <div key={title} className={styles.timelineRow}><span className={`${styles.stepDot} ${state === "done" ? styles.stepDone : state === "active" ? styles.stepActive : ""}`}>{index + 1}</span><div className={styles.timelineCopy}><strong className={state === "active" ? styles.activeText : ""}>{title}</strong><small>{subtitle}</small></div></div>)}
              </div>
            </section>
          </aside>

          <div className={styles.mainColumn} data-node-id="170:348">
            <section className={styles.card} data-node-id="170:349"><h2 data-node-id="170:350">خلاصه قرارداد</h2><div className={styles.divider} /><div className={styles.summaryGrid}><div><strong>۵۰۰٬۰۰۰٬۰۰۰ تومان</strong><span>مبلغ رهن</span></div><div><strong>۲۰٬۰۰۰٬۰۰۰ تومان</strong><span>اجاره ماهانه قرارداد</span></div><div><strong>۱۵ مهر ۱۴۰۵</strong><span>تاریخ شروع</span></div><div><strong>۱۵ مهر ۱۴۰۶</strong><span>تاریخ پایان</span></div><div><strong>۱۲۳۴۵۶۷۸۹۰۱۲</strong><span>کد رهگیری</span></div></div></section>
            <section className={styles.card} data-node-id="170:368"><div className={styles.cardHeader}><span className={styles.badgeWarning}>در حال تکمیل فرایند تأمین مالی</span><h2 data-node-id="170:373">مستأجر</h2></div><div className={styles.divider} /><div className={styles.inlineDetails}><span>کد ملی: ۰۰۱•••••۷۸۹</span><strong>علی رضایی</strong></div></section>
            <section className={styles.infoCard} data-node-id="170:378"><div className={styles.infoHeader}><h3 data-node-id="170:380">مرحله بعد</h3><img src={assets.info} alt="" width={20} height={20} /></div><p data-node-id="170:382">پس از تکمیل فرایند تأمین مالی و تأییدهای لازم از سمت مستأجر، برای انتخاب روش دریافت و تأیید نهایی قرارداد به شما اطلاع داده می‌شود.</p></section>
          </div>
        </div>

        <footer className={styles.bottomBar} data-node-id="170:383"><Link href="/user/contracts" className={styles.outlineButton} data-node-id="170:384">بازگشت به قراردادها</Link><div className={styles.bottomNote}><span>در حال حاضر اقدامی از طرف شما لازم نیست.</span><img src={assets.alert} alt="" width={16} height={16} /></div></footer>
      </section>

      <aside className={styles.sidebar} data-node-id="142:1633"><div className={styles.sidebarTop}><div className={styles.logoWrap}><img src={assets.logo} alt="چارخونه" width={127} height={55} /></div><nav className={styles.nav}><Link href="/user/home" className={styles.navItem}><span className={styles.navSpacer} /><span>خانه</span><img src={assets.home} alt="" width={20} height={20} /></Link><Link href="/user/contracts" className={`${styles.navItem} ${styles.navActive}`}><span className={styles.alertBadge}>۱</span><span>قراردادها</span><img src={assets.contracts} alt="" width={20} height={20} /></Link><Link href="/user/receive-pay" className={styles.navItem}><span className={styles.navSpacer} /><span>دریافت و پرداخت</span><img src={assets.payments} alt="" width={20} height={20} /></Link><Link href="/user/account" className={styles.navItem}><span className={styles.navSpacer} /><span>حساب من</span><img src={assets.account} alt="" width={20} height={20} /></Link></nav></div><UserPanelExit /></aside>
    </main>
  );
}
