import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

import { previews } from "../demo-transactions";

export default async function PaymentResultPage({ searchParams }: { searchParams: Promise<{ transaction?: string }> }) {
  const selected = (await searchParams).transaction === "overdue" ? "overdue" : "due";
  const preview = previews[selected];
  const details = [
    ["مبلغ", preview.amount, true],
    ["بابت", preview.description, false],
    ["تاریخ", preview.date, false],
    ["ساعت (نمونه)", preview.time, false],
    ["شماره پیگیری", preview.reference, false],
    ["قرارداد", preview.contract, false],
    ["شماره قسط", preview.installment ?? "—", false],
  ] as const;
  return (
    <main className={styles.page} data-node-id="173:639" data-name="Web App / Payment Return">
      <section className={styles.mainContent} data-node-id="173:640">
        <header className={styles.headerBlock} data-node-id="173:641">
          <Link href="/user/receive-pay" className={styles.backLink} data-node-id="173:642">بازگشت به دریافت و پرداخت <span aria-hidden="true">›</span></Link>
          <div className={styles.headerRight} data-node-id="173:646">
            <div className={styles.breadcrumb} data-node-id="173:647"><span className={styles.current}>نتیجه پرداخت</span><span>/</span><span>دریافت و پرداخت</span></div>
            <h1 data-node-id="173:651">نتیجه پرداخت</h1>
            <p data-node-id="173:652">نتیجه نمایشی پرداخت؛ هیچ تراکنش بانکی انجام نشده است</p>
          </div>
        </header>

        <section className={styles.resultWrapper} data-node-id="173:653">
          <article className={styles.resultCard} data-node-id="173:654">
            <div className={styles.brandBlock} data-node-id="173:655"><strong data-node-id="173:656">چارخونه</strong><div className={styles.divider} /></div>

            <div className={styles.statusSection} data-node-id="173:658">
              <span className={styles.checkCircle} data-node-id="173:659"><span aria-hidden="true">✓</span></span>
              <h2 data-node-id="173:662">نمونه نتیجه پرداخت موفق</h2>
              <strong className={styles.amount} data-node-id="173:663">{preview.amount}</strong>
              <span className={styles.successBadge} data-node-id="173:665">موفق (نمونه)</span>
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
            <Link href={"/user/receive-pay/receipt?transaction=" + selected} className={styles.primaryAction} data-node-id="173:712">مشاهده رسید نمونه</Link>
          </div>
        </section>
      </section>

      <UserPanelSidebar nodeId="142:2196" />
    </main>
  );
}
