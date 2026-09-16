import Link from "next/link";
import styles from "./page.module.css";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/190e63b0-059c-404a-894b-9ac010280a8b.png",
  avatar: "https://www.figma.com/api/mcp/asset/66a5e325-bd22-46dc-8914-2b2880db17c4.png",
  check: "https://www.figma.com/api/mcp/asset/96b32eb3-efcf-40b3-8fbc-69bc671fd625.svg",
  home: "https://www.figma.com/api/mcp/asset/2e845d82-224a-46a6-a9dd-1c0d7f8ffb5c.svg",
  contracts: "https://www.figma.com/api/mcp/asset/dafe8688-bb52-4be4-9a9f-bf2984dff1a6.svg",
  payments: "https://www.figma.com/api/mcp/asset/6c42f3c8-e451-4d6a-a690-313424b2399b.svg",
  account: "https://www.figma.com/api/mcp/asset/6ee7f649-90d0-4d42-9561-17ceb0a9d085.svg",
} as const;

const rows = [
  ["مبلغ", "۲٬۵۰۰٬۰۰۰ تومان", true],
  ["بابت", "حق عضویت چارخونه", false],
  ["تاریخ", "۱۵ آبان ۱۴۰۵", false],
  ["ساعت", "۱۴:۳۵", false],
  ["شماره پیگیری", "۱۲۳۴۵۶۷۸۹", false],
  ["سقف تأمین مالی", "تا ۵۰۰٬۰۰۰٬۰۰۰ تومان", false],
  ["وضعیت پرداخت", "فعال", false],
] as const;

export default function MembershipPaymentSuccessStatePage() {
  return (
    <main className={styles.page} data-node-id="912:278" data-name="Web App / Membership Payment / Success">
      <section className={styles.mainContent} data-node-id="912:279">
        <header className={styles.headerBlock} data-node-id="912:280">
          <Link href="/user/receive-pay" className={styles.backLink} data-node-id="912:281">بازگشت به دریافت و پرداخت <span>›</span></Link>
          <div className={styles.headerRight} data-node-id="912:285">
            <div className={styles.breadcrumb}><span>دریافت و پرداخت</span><span>/</span><strong>نتیجه پرداخت</strong></div>
            <h1 data-node-id="912:290">نتیجه پرداخت</h1>
            <p data-node-id="912:291">وضعیت تراکنش شما در سامانه چارخونه</p>
          </div>
        </header>

        <div className={styles.resultWrapper} data-node-id="912:292">
          <section className={styles.resultCard} data-node-id="912:293">
            <div className={styles.receiptBrand} data-node-id="912:294"><strong data-node-id="912:295">چارخونه</strong><div className={styles.divider} /></div>
            <div className={styles.statusSection} data-node-id="912:297">
              <span className={styles.checkCircle} data-node-id="912:298"><img src={assets.check} alt="" width={24} height={24} /></span>
              <h2 data-node-id="912:302">حق عضویت با موفقیت پرداخت شد</h2>
              <strong className={styles.amount} data-node-id="912:303">۲٬۵۰۰٬۰۰۰ تومان</strong>
              <span className={styles.successBadge} data-node-id="912:305">موفق</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.details} data-node-id="912:308">
              {rows.map(([label, value, strong], index) => (
                <div key={label} className={`${styles.detailRow} ${index === rows.length - 1 ? styles.lastRow : ""}`}>
                  {strong ? <strong>{value}</strong> : <span>{value}</span>}
                  <small>{label}</small>
                </div>
              ))}
            </div>
            <div className={styles.membershipContext} data-node-id="912:343">
              <Link href="/user/receive-pay" className={styles.membershipLink} data-node-id="912:344">مشاهده وضعیت پرداخت</Link>
              <div><span className={styles.tenantBadge}>مستأجر</span><strong data-node-id="912:348">دفعات استفاده: ۱ بار</strong></div>
            </div>
          </section>

          <div className={styles.actions} data-node-id="912:349">
            <Link href="/user/contracts/123456789012" className={styles.secondaryAction} data-node-id="912:350">بازگشت به قرارداد</Link>
            <Link href="/user/contracts/register/plans/contribution" className={styles.primaryAction} data-node-id="912:352">ادامه و پرداخت آورده</Link>
          </div>
        </div>
      </section>

      <aside className={styles.sidebar} data-node-id="912:354">
        <div className={styles.sidebarTop}><div className={styles.logoWrap}><img src={assets.logo} alt="چارخونه" width={127} height={55} /></div><nav className={styles.nav}><Link href="/user/home" className={styles.navItem}><span className={styles.navSpacer} /><span>خانه</span><img src={assets.home} alt="" width={20} height={20} /></Link><Link href="/user/contracts" className={styles.navItem}><span className={styles.alertBadge}>۱</span><span>قراردادها</span><img src={assets.contracts} alt="" width={20} height={20} /></Link><Link href="/user/receive-pay" className={`${styles.navItem} ${styles.navActive}`}><span className={styles.navSpacer} /><span>دریافت و پرداخت</span><img src={assets.payments} alt="" width={20} height={20} /></Link><Link href="/user/account" className={styles.navItem}><span className={styles.navSpacer} /><span>حساب من</span><img src={assets.account} alt="" width={20} height={20} /></Link></nav></div>
        <div className={styles.profile}><img className={styles.avatar} src={assets.avatar} alt="" width={40} height={40} /><div className={styles.profileText}><strong>علی رضایی</strong><span>۰۹۱۲•••••۶۷</span></div></div>
      </aside>
    </main>
  );
}
