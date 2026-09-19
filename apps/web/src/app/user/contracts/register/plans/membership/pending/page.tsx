import Link from "next/link";
import styles from "../result/page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/d5416d2d-81a7-4e6d-9fb0-f24a3c0b3e21.png",
  avatar: "https://www.figma.com/api/mcp/asset/0d12bd66-7fe2-446a-b4d2-fac2eb8d6efb.png",
  check: "https://www.figma.com/api/mcp/asset/fdbaec9a-2684-44f2-ae8e-8a006e4ca3d7.svg",
  home: "https://www.figma.com/api/mcp/asset/7335c859-c3bb-4104-8aa2-cc9c3fb186f7.svg",
  contracts: "https://www.figma.com/api/mcp/asset/b9479b88-e6e6-47bd-8cb7-ea06baeb2026.svg",
  payments: "https://www.figma.com/api/mcp/asset/68c66e93-d039-4ed6-8cbf-d5021126fb95.svg",
  account: "https://www.figma.com/api/mcp/asset/77759807-a25b-4904-ac25-0db70d55ced7.svg",
} as const;

const rows = [
  ["مبلغ", "۲٬۵۰۰٬۰۰۰ تومان", true],
  ["بابت", "حق عضویت چارخونه", false],
  ["تاریخ", "۱۵ آبان ۱۴۰۵", false],
  ["ساعت", "۱۴:۳۵", false],
  ["شماره پیگیری", "۱۲۳۴۵۶۷۸۹", false],
  ["وضعیت عضویت", "در انتظار تأیید پرداخت", false],
] as const;

export default function MembershipPaymentPendingPage() {
  return (
    <main className={styles.page} data-node-id="175:958" data-name="Web App / Payment Return / Membership Pending">
      <section className={styles.mainContent} data-node-id="175:959">
        <header className={styles.headerBlock} data-node-id="175:960">
          <Link href="/user/receive-pay" className={styles.backLink} data-node-id="175:961">بازگشت به دریافت و پرداخت <span>›</span></Link>
          <div className={styles.headerRight} data-node-id="175:965">
            <div className={styles.breadcrumb} data-node-id="175:966"><span>دریافت و پرداخت</span><span>/</span><strong>نتیجه پرداخت</strong></div>
            <h1 data-node-id="175:970">نتیجه پرداخت</h1>
            <p data-node-id="175:971">وضعیت تراکنش شما در سامانه چارخونه</p>
          </div>
        </header>

        <div className={styles.resultWrapper} data-node-id="175:972">
          <section className={styles.resultCard} data-node-id="175:973">
            <div className={styles.receiptBrand} data-node-id="175:974"><strong data-node-id="175:975">چارخونه</strong><div className={styles.divider} /></div>
            <div className={styles.statusSection} data-node-id="175:977">
              <span className={`${styles.checkCircle} ${styles.pendingCircle}`} data-node-id="175:978"><img src={assets.check} alt="" width={24} height={24} /></span>
              <h2 data-node-id="175:982">وضعیت پرداخت حق عضویت در حال بررسی است</h2>
              <strong className={`${styles.amount} ${styles.pendingAmount}`} data-node-id="175:983">۲٬۵۰۰٬۰۰۰ تومان</strong>
              <span className={styles.pendingBadge} data-node-id="175:985">در حال بررسی</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.details} data-node-id="175:988">
              {rows.map(([label, value, strong], index) => (
                <div key={label} className={`${styles.detailRow} ${index === rows.length - 1 ? styles.lastRow : ""}`}>
                  {strong ? <strong>{value}</strong> : <span>{value}</span>}<small>{label}</small>
                </div>
              ))}
            </div>
            <div className={styles.membershipContext} data-node-id="175:1023">
              <Link href="/user/account" className={styles.membershipLink} data-node-id="175:1024">مشاهده وضعیت عضویت</Link>
              <div><span className={styles.tenantBadge} data-node-id="175:1026">مستأجر</span><strong data-node-id="175:1028">عضویت در انتظار تأیید</strong></div>
            </div>
          </section>

          <div className={styles.actions} data-node-id="175:1029">
            <Link href="/user/receive-pay" className={styles.secondaryAction} data-node-id="175:1030">بازگشت به دریافت و پرداخت</Link>
            <Link href="/user/contracts/register/plans/membership/pending" className={styles.primaryAction} data-node-id="175:1032">بررسی مجدد وضعیت</Link>
          </div>
        </div>
      </section>

      <UserPanelSidebar nodeId="142:2391" />
    </main>
  );
}
