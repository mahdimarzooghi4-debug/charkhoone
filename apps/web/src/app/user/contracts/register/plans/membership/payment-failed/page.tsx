import Link from "next/link";
import styles from "../payment-success/page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/9130923c-8888-489b-ae64-a1e7d7a0d5f8.png",
  avatar: "https://www.figma.com/api/mcp/asset/b0e67653-6272-4600-a040-0e72b04ec4ef.png",
  check: "https://www.figma.com/api/mcp/asset/f55b29db-a30d-45bb-9efa-8c2136a91653.svg",
  home: "https://www.figma.com/api/mcp/asset/b5abfe33-ce1f-406e-80cd-4162f5acf73b.svg",
  contracts: "https://www.figma.com/api/mcp/asset/4be66202-e888-415e-a75a-84fdd19690d0.svg",
  payments: "https://www.figma.com/api/mcp/asset/16ef6c98-ee48-44c0-9b2a-b344c929800e.svg",
  account: "https://www.figma.com/api/mcp/asset/5f91e42c-e128-4f2b-95c2-aaeb35265a5f.svg",
} as const;

const rows = [
  ["مبلغ", "۲٬۵۰۰٬۰۰۰ تومان", true],
  ["بابت", "حق عضویت چارخونه", false],
  ["تاریخ", "۱۵ آبان ۱۴۰۵", false],
  ["ساعت", "۱۴:۳۵", false],
  ["شماره پیگیری", "۱۲۳۴۵۶۷۸۹", false],
  ["وضعیت", "ناموفق", false],
] as const;

export default function MembershipPaymentFailedPage() {
  return (
    <main className={styles.page} data-node-id="912:382" data-name="Web App / Membership Payment / Failed">
      <section className={styles.mainContent} data-node-id="912:383">
        <header className={styles.headerBlock} data-node-id="912:384">
          <Link href="/user/receive-pay" className={styles.backLink} data-node-id="912:385">بازگشت به دریافت و پرداخت <span>›</span></Link>
          <div className={styles.headerRight} data-node-id="912:389">
            <div className={styles.breadcrumb} data-node-id="912:390"><span>دریافت و پرداخت</span><span>/</span><strong>نتیجه پرداخت</strong></div>
            <h1 data-node-id="912:394">نتیجه پرداخت</h1>
            <p data-node-id="912:395">وضعیت تراکنش شما در سامانه چارخونه</p>
          </div>
        </header>

        <div className={styles.resultWrapper} data-node-id="912:396">
          <section className={styles.resultCard} data-node-id="912:397">
            <div className={styles.receiptBrand} data-node-id="912:398"><strong data-node-id="912:399">چارخونه</strong><div className={styles.divider} /></div>
            <div className={styles.statusSection} data-node-id="912:401">
              <span className={`${styles.checkCircle} ${styles.failedCircle}`} data-node-id="912:402"><img src={assets.check} alt="" width={24} height={24} /></span>
              <h2 data-node-id="912:406">پرداخت حق عضویت انجام نشد</h2>
              <strong className={`${styles.amount} ${styles.failedAmount}`} data-node-id="912:407">۲٬۵۰۰٬۰۰۰ تومان</strong>
              <span className={styles.failedBadge} data-node-id="912:409">ناموفق</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.details} data-node-id="912:412">
              {rows.map(([label, value, strong], index) => (
                <div key={label} className={`${styles.detailRow} ${index === rows.length - 1 ? styles.lastRow : ""}`}>
                  {strong ? <strong>{value}</strong> : <span>{value}</span>}
                  <small>{label}</small>
                </div>
              ))}
            </div>
            <div className={styles.membershipContext} data-node-id="912:447">
              <Link href="/user/receive-pay" className={styles.membershipLink} data-node-id="912:448">مشاهده وضعیت پرداخت</Link>
              <div><span className={styles.tenantBadge} data-node-id="912:450">مستأجر</span><strong data-node-id="912:452">پرداخت ثبت نشده است</strong></div>
            </div>
          </section>

          <div className={styles.actions} data-node-id="912:453">
            <Link href="/user/contracts/123456789012" className={styles.secondaryAction} data-node-id="912:454">بازگشت به قرارداد</Link>
            <Link href="/user/contracts/register/plans/membership" className={styles.primaryAction} data-node-id="912:456">تلاش مجدد برای پرداخت</Link>
          </div>
        </div>
      </section>

      <UserPanelSidebar nodeId="912:458" />
    </main>
  );
}
