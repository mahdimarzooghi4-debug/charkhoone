import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/981106b2-192d-4c86-87e9-1dc25ec1d1cf.png",
  avatar: "https://www.figma.com/api/mcp/asset/79111bd2-37d4-442c-9373-20dcd1f5b5e3.png",
  check: "https://www.figma.com/api/mcp/asset/7a0202a1-53c5-4340-9de0-598f00ac232f.svg",
  home: "https://www.figma.com/api/mcp/asset/c4618e51-2b1b-4c75-a6c4-be27e781de6c.svg",
  contracts: "https://www.figma.com/api/mcp/asset/a3298079-e535-4f60-8263-7c530b10e4a6.svg",
  payments: "https://www.figma.com/api/mcp/asset/29f04ed2-7b56-41cb-8c24-2b0fd46c9236.svg",
  account: "https://www.figma.com/api/mcp/asset/3a27d4ea-e0b1-4a54-8146-d24022524754.svg",
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
    <main className={styles.page} data-node-id="175:856" data-name="Web App / Payment Return / Membership Failed">
      <section className={styles.mainContent} data-node-id="175:857">
        <header className={styles.headerBlock} data-node-id="175:858"><Link href="/user/receive-pay" className={styles.backLink} data-node-id="175:859">بازگشت به دریافت و پرداخت <span>›</span></Link><div className={styles.headerRight} data-node-id="175:863"><div className={styles.breadcrumb}><span>دریافت و پرداخت</span><span>/</span><strong>نتیجه پرداخت</strong></div><h1 data-node-id="175:868">نتیجه پرداخت</h1><p data-node-id="175:869">وضعیت تراکنش شما در سامانه چارخونه</p></div></header>

        <div className={styles.resultWrapper} data-node-id="175:870">
          <section className={styles.resultCard} data-node-id="175:871">
            <div className={styles.receiptBrand} data-node-id="175:872"><strong data-node-id="175:873">چارخونه</strong><div className={styles.divider} /></div>
            <div className={styles.statusSection} data-node-id="175:875"><span className={styles.failedCircle} data-node-id="175:876"><img src={assets.check} alt="" width={24} height={24} /></span><h2 data-node-id="175:880">پرداخت حق عضویت انجام نشد</h2><strong className={styles.amount} data-node-id="175:881">۲٬۵۰۰٬۰۰۰ تومان</strong><span className={styles.failedBadge} data-node-id="175:883">ناموفق</span></div>
            <div className={styles.divider} />
            <div className={styles.details} data-node-id="175:886">{rows.map(([label, value, strong], index) => <div key={label} className={`${styles.detailRow} ${index === rows.length - 1 ? styles.lastRow : ""}`}>{strong ? <strong>{value}</strong> : <span>{value}</span>}<small>{label}</small></div>)}</div>
            <div className={styles.membershipContext} data-node-id="175:921"><Link href="/user/contracts/register/plans/membership" className={styles.membershipLink} data-node-id="175:922">مشاهده وضعیت عضویت</Link><div><span className={styles.tenantBadge}>مستأجر</span><strong data-node-id="175:926">عضویت فعال نشده</strong></div></div>
          </section>
          <div className={styles.actions} data-node-id="175:927"><Link href="/user/contracts/register/plans/membership" className={styles.secondaryAction} data-node-id="175:928">بازگشت به انتخاب عضویت</Link><Link href="/user/contracts/register/plans/membership/result" className={styles.primaryAction} data-node-id="175:930">تلاش مجدد برای پرداخت</Link></div>
        </div>
      </section>

      <UserPanelSidebar nodeId="142:2364" />
    </main>
  );
}
