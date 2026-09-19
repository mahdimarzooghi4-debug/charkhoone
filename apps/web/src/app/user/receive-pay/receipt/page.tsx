import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

const assets = {
  logo: "https://www.figma.com/api/mcp/asset/281e2ee6-cffc-430a-b5e1-45ab4452963c.png",
  avatar: "https://www.figma.com/api/mcp/asset/e5350bec-5a6f-402f-93e5-0cb8c59432c7.png",
  check: "https://www.figma.com/api/mcp/asset/2a285d52-dc5e-435a-992d-94028a04c7d7.svg",
  home: "https://www.figma.com/api/mcp/asset/0fb714fd-f90f-45ae-b2e3-92b007371b5e.svg",
  contracts: "https://www.figma.com/api/mcp/asset/33c38a9b-06df-4e24-8119-86b24338eda3.svg",
  payments: "https://www.figma.com/api/mcp/asset/f2107347-1091-438b-9adb-b1844512900a.svg",
  account: "https://www.figma.com/api/mcp/asset/48f07b09-54bc-4ab1-9ff3-fb99c8715428.svg",
} as const;

const details = [
  ["مبلغ", "۱۸٬۵۰۰٬۰۰۰ تومان", true],
  ["تاریخ", "۱۵ آبان ۱۴۰۵", false],
  ["ساعت", "۱۴:۳۵", false],
  ["شماره پیگیری", "۱۲۳۴۵۶۷۸۹", false],
  ["بابت", "قسط ماهانه تأمین مالی", false],
  ["قرارداد", "سعادت‌آباد", false],
  ["شماره قسط", "۲ از ۱۲", false],
] as const;

export default function ReceiptPage() {
  return (
    <main className={styles.page} data-node-id="173:542" data-name="Web App / Receipt">
      <section className={styles.mainContent} data-node-id="173:543">
        <header className={styles.headerBlock} data-node-id="173:544">
          <Link href="/user/receive-pay" className={styles.backLink} data-node-id="173:545">بازگشت به دریافت و پرداخت <span aria-hidden="true">›</span></Link>
          <div className={styles.headerRight} data-node-id="173:549">
            <div className={styles.breadcrumb} data-node-id="173:550"><span className={styles.current}>رسید</span><span>/</span><span>دریافت و پرداخت</span></div>
            <h1 data-node-id="173:554">رسید تراکنش</h1>
            <p data-node-id="173:555">جزئیات تراکنش ثبت‌شده در چارخونه</p>
          </div>
        </header>

        <section className={styles.receiptWrapper} data-node-id="173:556">
          <article className={styles.receiptCard} data-node-id="173:557">
            <div className={styles.brandBlock} data-node-id="173:558"><strong data-node-id="173:559">چارخونه</strong><div className={styles.divider} /></div>

            <div className={styles.statusSection} data-node-id="173:561">
              <span className={styles.checkCircle} data-node-id="173:562"><img src={assets.check} alt="" width={24} height={24} /></span>
              <h2 data-node-id="173:564">پرداخت با موفقیت انجام شد</h2>
              <strong className={styles.amount} data-node-id="173:565">۱۸٬۵۰۰٬۰۰۰ تومان</strong>
              <div className={styles.badges} data-node-id="173:566"><span className={styles.paidBadge}>پرداخت شده</span><span className={styles.paymentBadge}>پرداخت</span></div>
            </div>

            <div className={styles.divider} />

            <div className={styles.detailsList} data-node-id="173:572">
              {details.map(([label, value, strong]) => (
                <div className={styles.detailRow} key={label}>
                  {strong ? <strong>{value}</strong> : <span>{value}</span>}
                  <span className={styles.detailLabel}>{label}</span>
                </div>
              ))}
            </div>

            <Link href="/user/contracts/123456789012" className={styles.contractContext} data-node-id="173:594">
              <span className={styles.contractAction}>مشاهده قرارداد</span>
              <span className={styles.contractInfo}><span className={styles.tenantBadge}>مستأجر</span><strong>قرارداد سعادت‌آباد</strong></span>
            </Link>
          </article>

          <div className={styles.actions} data-node-id="173:600">
            <button type="button" className={styles.printAction} data-node-id="173:601">چاپ رسید</button>
            <button type="button" className={styles.primaryAction} data-node-id="173:603">ذخیره تصویر رسید</button>
            <button type="button" className={styles.primaryAction} data-node-id="173:606">اشتراک‌گذاری رسید</button>
          </div>
        </section>
      </section>

      <UserPanelSidebar nodeId="142:2169" />
    </main>
  );
}
