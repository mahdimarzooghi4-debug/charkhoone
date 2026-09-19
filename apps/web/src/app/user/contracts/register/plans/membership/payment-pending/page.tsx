import Link from "next/link";
import styles from "../payment-success/page.module.css";
import { UserPanelExit } from "@/components/user/UserPanelExit";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/b2b42c4b-40e1-4823-82da-95c0a28c5c45.png",
  avatar: "https://www.figma.com/api/mcp/asset/fd75957d-dbae-4acb-9daf-69434147d202.png",
  check: "https://www.figma.com/api/mcp/asset/0f857cea-8e41-4d75-b5cf-d5689175f8f2.svg",
  home: "https://www.figma.com/api/mcp/asset/d752fb46-ea33-4972-b738-c810ad70de74.svg",
  contracts: "https://www.figma.com/api/mcp/asset/0238f0d8-6f18-4c99-a8f2-a4c8b15688ff.svg",
  payments: "https://www.figma.com/api/mcp/asset/a6eb4bb9-f875-48db-a4f9-046aca615c38.svg",
  account: "https://www.figma.com/api/mcp/asset/3f3d2f1d-f508-46a1-a69f-211ef2f6a9d9.svg",
} as const;

const rows = [
  ["مبلغ", "۲٬۵۰۰٬۰۰۰ تومان", true],
  ["بابت", "حق عضویت چارخونه", false],
  ["تاریخ", "۱۵ آبان ۱۴۰۵", false],
  ["ساعت", "۱۴:۳۵", false],
  ["شماره پیگیری", "۱۲۳۴۵۶۷۸۹", false],
  ["وضعیت پرداخت", "در انتظار تأیید پرداخت", false],
] as const;

export default function MembershipPaymentPendingStatePage() {
  return (
    <main className={styles.page} data-node-id="912:486" data-name="Web App / Membership Payment / Pending">
      <section className={styles.mainContent} data-node-id="912:487">
        <header className={styles.headerBlock} data-node-id="912:488">
          <Link href="/user/contracts/123456789012" className={styles.backLink} data-node-id="912:489">بازگشت به قرارداد <span>›</span></Link>
          <div className={styles.headerRight} data-node-id="912:493">
            <div className={styles.breadcrumb} data-node-id="912:494"><span>دریافت و پرداخت</span><span>/</span><strong>نتیجه پرداخت</strong></div>
            <h1 data-node-id="912:498">نتیجه پرداخت</h1>
            <p data-node-id="912:499">وضعیت تراکنش شما در سامانه چارخونه</p>
          </div>
        </header>

        <div className={styles.resultWrapper} data-node-id="912:500">
          <section className={styles.resultCard} data-node-id="912:501">
            <div className={styles.receiptBrand} data-node-id="912:502"><strong data-node-id="912:503">چارخونه</strong><div className={styles.divider} /></div>
            <div className={styles.statusSection} data-node-id="912:505">
              <span className={`${styles.checkCircle} ${styles.pendingCircle}`} data-node-id="912:506"><img src={assets.check} alt="" width={24} height={24} /></span>
              <h2 data-node-id="912:510">وضعیت پرداخت حق عضویت در حال بررسی است</h2>
              <strong className={`${styles.amount} ${styles.pendingAmount}`} data-node-id="912:511">۲٬۵۰۰٬۰۰۰ تومان</strong>
              <span className={styles.pendingBadge} data-node-id="912:513">در حال بررسی</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.details} data-node-id="912:516">
              {rows.map(([label, value, strong], index) => (
                <div key={label} className={`${styles.detailRow} ${index === rows.length - 1 ? styles.lastRow : ""}`}>
                  {strong ? <strong>{value}</strong> : <span>{value}</span>}
                  <small>{label}</small>
                </div>
              ))}
            </div>
            <div className={styles.membershipContext} data-node-id="912:551">
              <Link href="/user/receive-pay" className={styles.membershipLink} data-node-id="912:552">مشاهده وضعیت پرداخت</Link>
              <div><span className={styles.tenantBadge} data-node-id="912:554">مستأجر</span><strong data-node-id="912:556">پرداخت در انتظار تأیید</strong></div>
            </div>
          </section>

          <div className={styles.actions} data-node-id="912:557">
            <Link href="/user/contracts/123456789012" className={styles.secondaryAction} data-node-id="912:558">بازگشت به قرارداد</Link>
            <Link href="/user/contracts/register/plans/membership/payment-pending" className={styles.primaryAction} data-node-id="912:560">بررسی مجدد وضعیت</Link>
          </div>
        </div>
      </section>

      <aside className={styles.sidebar} data-node-id="912:562">
        <div className={styles.sidebarTop}>
          <div className={styles.logoWrap}><img src={assets.logo} alt="چارخونه" width={127} height={55} /></div>
          <nav className={styles.nav}>
            <Link href="/user/home" className={styles.navItem}><span className={styles.navSpacer} /><span>خانه</span><img src={assets.home} alt="" width={20} height={20} /></Link>
            <Link href="/user/contracts" className={styles.navItem}><span className={styles.alertBadge}>۱</span><span>قراردادها</span><img src={assets.contracts} alt="" width={20} height={20} /></Link>
            <Link href="/user/receive-pay" className={`${styles.navItem} ${styles.navActive}`}><span className={styles.navSpacer} /><span>دریافت و پرداخت</span><img src={assets.payments} alt="" width={20} height={20} /></Link>
            <Link href="/user/account" className={styles.navItem}><span className={styles.navSpacer} /><span>حساب من</span><img src={assets.account} alt="" width={20} height={20} /></Link>
          </nav>
        </div>
        <UserPanelExit />
      </aside>
    </main>
  );
}
