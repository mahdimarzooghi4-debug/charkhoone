import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelExit } from "@/components/user/UserPanelExit";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/50483827-b0cc-4b2b-b01d-0fd6712633fa.png",
  avatar: "https://www.figma.com/api/mcp/asset/91384515-d563-4608-888f-93305774b686.png",
  check: "https://www.figma.com/api/mcp/asset/b0be19f9-caae-4916-a961-08defd618fc8.svg",
  home: "https://www.figma.com/api/mcp/asset/489e8483-70c8-466d-af9a-a256804b766e.svg",
  contracts: "https://www.figma.com/api/mcp/asset/2c075e2b-53ff-4433-8c2e-b9c93faa5415.svg",
  payments: "https://www.figma.com/api/mcp/asset/dd88f914-c9cb-4088-a66e-63feebb42958.svg",
  account: "https://www.figma.com/api/mcp/asset/3c4bbf5c-e772-4d6a-8d51-73c7005a807e.svg",
} as const;

const rows = [
  ["مبلغ", "۲٬۵۰۰٬۰۰۰ تومان", true],
  ["بابت", "حق عضویت چارخونه", false],
  ["تاریخ", "۱۵ آبان ۱۴۰۵", false],
  ["ساعت", "۱۴:۳۵", false],
  ["شماره پیگیری", "۱۲۳۴۵۶۷۸۹", false],
  ["سقف تأمین مالی", "تا ۵۰۰٬۰۰۰٬۰۰۰ تومان", false],
  ["وضعیت عضویت", "فعال", false],
] as const;

export default function MembershipPaymentSuccessPage() {
  return (
    <main className={styles.page} data-node-id="175:754" data-name="Web App / Payment Return / Membership Success">
      <section className={styles.mainContent} data-node-id="175:755">
        <header className={styles.headerBlock} data-node-id="175:756">
          <Link href="/user/receive-pay" className={styles.backLink} data-node-id="175:757">بازگشت به دریافت و پرداخت <span>›</span></Link>
          <div className={styles.headerRight} data-node-id="175:761"><div className={styles.breadcrumb}><span>دریافت و پرداخت</span><span>/</span><strong>نتیجه پرداخت</strong></div><h1 data-node-id="175:766">نتیجه پرداخت</h1><p data-node-id="175:767">وضعیت تراکنش شما در سامانه چارخونه</p></div>
        </header>

        <div className={styles.resultWrapper} data-node-id="175:768">
          <section className={styles.resultCard} data-node-id="175:769">
            <div className={styles.receiptBrand} data-node-id="175:770"><strong data-node-id="175:771">چارخونه</strong><div className={styles.divider} /></div>
            <div className={styles.statusSection} data-node-id="175:773">
              <span className={styles.checkCircle}><img src={assets.check} alt="" width={24} height={24} /></span>
              <h2 data-node-id="175:778">حق عضویت با موفقیت پرداخت شد</h2>
              <strong className={styles.amount} data-node-id="175:779">۲٬۵۰۰٬۰۰۰ تومان</strong>
              <span className={styles.successBadge} data-node-id="175:781">موفق</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.details} data-node-id="175:784">
              {rows.map(([label, value, strong], index) => <div key={label} className={`${styles.detailRow} ${index === rows.length - 1 ? styles.lastRow : ""}`}>{strong ? <strong>{value}</strong> : <span>{value}</span>}<small>{label}</small></div>)}
            </div>
            <div className={styles.membershipContext} data-node-id="175:819"><Link href="/user/account" className={styles.membershipLink} data-node-id="175:820">مشاهده جزئیات عضویت</Link><div><span className={styles.tenantBadge}>مستأجر</span><strong data-node-id="175:824">دفعات استفاده: ۱ بار</strong></div></div>
          </section>

          <div className={styles.actions} data-node-id="175:825"><Link href="/user/contracts/123456789012" className={styles.secondaryAction} data-node-id="175:826">بازگشت به قرارداد</Link><Link href="/user/contracts/register/plans/contribution" className={styles.primaryAction} data-node-id="175:828">ادامه و پرداخت آورده</Link></div>
        </div>
      </section>

      <aside className={styles.sidebar} data-node-id="175:830">
        <div className={styles.sidebarTop}><div className={styles.logoWrap}><img src={assets.logo} alt="چارخونه" width={127} height={55} /></div><nav className={styles.nav}><Link href="/user/home" className={styles.navItem}><span className={styles.navSpacer} /><span>خانه</span><img src={assets.home} alt="" width={20} height={20} /></Link><Link href="/user/contracts" className={styles.navItem}><span className={styles.alertBadge}>۱</span><span>قراردادها</span><img src={assets.contracts} alt="" width={20} height={20} /></Link><Link href="/user/receive-pay" className={`${styles.navItem} ${styles.navActive}`}><span className={styles.navSpacer} /><span>دریافت و پرداخت</span><img src={assets.payments} alt="" width={20} height={20} /></Link><Link href="/user/account" className={styles.navItem}><span className={styles.navSpacer} /><span>حساب من</span><img src={assets.account} alt="" width={20} height={20} /></Link></nav></div>
        <UserPanelExit />
      </aside>
    </main>
  );
}
