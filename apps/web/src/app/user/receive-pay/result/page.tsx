import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelExit } from "@/components/user/UserPanelExit";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/ae2b7aef-201c-4c82-bd2b-3effdd275a91.png",
  avatar: "https://www.figma.com/api/mcp/asset/b1b9b5f1-5e0d-4161-927a-285325b0c1c8.png",
  check: "https://www.figma.com/api/mcp/asset/bd0dcfef-ff40-4251-8416-1052d4889107.svg",
  home: "https://www.figma.com/api/mcp/asset/53fb9812-b27e-4e4e-8a06-9272820d4a7b.svg",
  contracts: "https://www.figma.com/api/mcp/asset/aca1c790-b6dd-4e84-9ff9-7ad5861be19a.svg",
  payments: "https://www.figma.com/api/mcp/asset/a39a39e8-d0d6-485e-817e-de2ec79553d9.svg",
  account: "https://www.figma.com/api/mcp/asset/0b1a2f2f-2322-4f42-8c16-2fe2a4d38e7a.svg",
} as const;

const details = [
  ["مبلغ", "۱۸٬۵۰۰٬۰۰۰ تومان", true],
  ["بابت", "قسط ماهانه تأمین مالی", false],
  ["تاریخ", "۱۵ آبان ۱۴۰۵", false],
  ["ساعت", "۱۴:۳۵", false],
  ["شماره پیگیری", "۱۲۳۴۵۶۷۸۹", false],
  ["قرارداد", "سعادت‌آباد", false],
  ["شماره قسط", "۲ از ۱۲", false],
] as const;

export default function PaymentResultPage() {
  return (
    <main className={styles.page} data-node-id="173:639" data-name="Web App / Payment Return">
      <section className={styles.mainContent} data-node-id="173:640">
        <header className={styles.headerBlock} data-node-id="173:641">
          <Link href="/user/receive-pay" className={styles.backLink} data-node-id="173:642">بازگشت به دریافت و پرداخت <span aria-hidden="true">›</span></Link>
          <div className={styles.headerRight} data-node-id="173:646">
            <div className={styles.breadcrumb} data-node-id="173:647"><span className={styles.current}>نتیجه پرداخت</span><span>/</span><span>دریافت و پرداخت</span></div>
            <h1 data-node-id="173:651">نتیجه پرداخت</h1>
            <p data-node-id="173:652">وضعیت تراکنش شما در سامانه چارخونه</p>
          </div>
        </header>

        <section className={styles.resultWrapper} data-node-id="173:653">
          <article className={styles.resultCard} data-node-id="173:654">
            <div className={styles.brandBlock} data-node-id="173:655"><strong data-node-id="173:656">چارخونه</strong><div className={styles.divider} /></div>

            <div className={styles.statusSection} data-node-id="173:658">
              <span className={styles.checkCircle} data-node-id="173:659"><img src={assets.check} alt="" width={24} height={24} /></span>
              <h2 data-node-id="173:662">پرداخت با موفقیت انجام شد</h2>
              <strong className={styles.amount} data-node-id="173:663">۱۸٬۵۰۰٬۰۰۰ تومان</strong>
              <span className={styles.successBadge} data-node-id="173:665">موفق</span>
            </div>

            <div className={styles.divider} />

            <div className={styles.detailsList} data-node-id="173:668">
              {details.map(([label, value, strong], index) => (
                <div className={styles.detailRow} key={label} data-node-id={`173:${670 + index * 5}`}>
                  {strong ? <strong>{value}</strong> : <span>{value}</span>}
                  <span className={styles.detailLabel}>{label}</span>
                </div>
              ))}
            </div>

            <Link href="/user/contracts/123456789012" className={styles.contractContext} data-node-id="173:703">
              <span className={styles.contractAction}>مشاهده قرارداد</span>
              <span className={styles.contractInfo}><span className={styles.tenantBadge}>مستأجر</span><strong>قرارداد سعادت‌آباد</strong></span>
            </Link>
          </article>

          <div className={styles.actions} data-node-id="173:709">
            <Link href="/user/receive-pay" className={styles.secondaryAction} data-node-id="173:710">بازگشت به دریافت و پرداخت</Link>
            <Link href="/user/receive-pay/receipt" className={styles.primaryAction} data-node-id="173:712">مشاهده رسید</Link>
          </div>
        </section>
      </section>

      <aside className={styles.sidebar} data-node-id="142:2196">
        <div className={styles.sidebarTop}>
          <div className={styles.logoWrap}><img src={assets.logo} alt="چارخونه" width={127} height={55} /></div>
          <nav className={styles.nav} aria-label="ناوبری حساب کاربری">
            <Link href="/user/home" className={styles.navItem}><span className={styles.navSpacer} /><span>خانه</span><img src={assets.home} alt="" width={20} height={20} /></Link>
            <Link href="/user/contracts" className={styles.navItem}><span className={styles.alertBadge}>۱</span><span>قراردادها</span><img src={assets.contracts} alt="" width={20} height={20} /></Link>
            <Link href="/user/receive-pay" className={`${styles.navItem} ${styles.navActive}`}><span className={styles.navSpacer} /><span>دریافت و پرداخت</span><img src={assets.payments} alt="" width={20} height={20} /></Link>
            <div className={styles.navItem}><span className={styles.navSpacer} /><span>حساب من</span><img src={assets.account} alt="" width={20} height={20} /></div>
          </nav>
        </div>
        <UserPanelExit />
      </aside>
    </main>
  );
}
