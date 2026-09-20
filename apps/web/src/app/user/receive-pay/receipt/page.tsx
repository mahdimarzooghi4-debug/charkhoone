import Link from "next/link";
import styles from "./page.module.css";
import { UserPanelSidebar } from "@/components/user/UserPanelSidebar";

import { previews, receiptKey } from "../demo-transactions";
import { ReceiptActions } from "./ReceiptActions";

export default async function ReceiptPage({ searchParams }: { searchParams: Promise<{ transaction?: string; method?: string }> }) {
  const params = await searchParams;
  const key = receiptKey(params.transaction);
  const method = params.method === "fund" || params.method === "monthly" ? params.method : undefined;
  const backHref = "/user/receive-pay" + (method ? "?method=" + method : "");
  const preview = previews[key];
  const details = [
    ["مبلغ", preview.amount, true],
    ["تاریخ", preview.date, false],
    ["ساعت (نمونه)", preview.time, false],
    ["شماره پیگیری", preview.reference, false],
    ["بابت", preview.description, false],
    ["قرارداد", preview.contract, false],
    ...(preview.installment ? [["شماره قسط", preview.installment, false] as const] : []),
  ] as const;
  return (
    <main className={styles.page} data-node-id="173:542" data-name="Web App / Receipt">
      <section className={styles.mainContent} data-node-id="173:543">
        <header className={styles.headerBlock} data-node-id="173:544">
          <Link href={backHref} className={styles.backLink} data-node-id="173:545">بازگشت به دریافت و پرداخت <span aria-hidden="true">›</span></Link>
          <div className={styles.headerRight} data-node-id="173:549">
            <div className={styles.breadcrumb} data-node-id="173:550"><span className={styles.current}>رسید</span><span>/</span><span>دریافت و پرداخت</span></div>
            <h1 data-node-id="173:554">رسید تراکنش</h1>
            <p data-node-id="173:555">رسید صرفاً نمونه طراحی است؛ هیچ تراکنش بانکی واقعی ثبت نشده است</p>
          </div>
        </header>

        <section className={styles.receiptWrapper} data-node-id="173:556">
          <article className={styles.receiptCard} data-node-id="173:557">
            <div className={styles.brandBlock} data-node-id="173:558"><strong data-node-id="173:559">چارخونه</strong><div className={styles.divider} /></div>

            <div className={styles.statusSection} data-node-id="173:561">
              <span className={styles.checkCircle} data-node-id="173:562"><span aria-hidden="true">✓</span></span>
              <h2 data-node-id="173:564">{preview.kind === "دریافت" ? "رسید نمونه دریافت" : "رسید نمونه پرداخت موفق"}</h2>
              <strong className={styles.amount} data-node-id="173:565">{preview.amount}</strong>
              <div className={styles.badges} data-node-id="173:566"><span className={styles.paidBadge}>نمایشی / نمونه</span><span className={styles.paymentBadge}>{preview.kind}</span></div>
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

            <Link href={preview.role === "مالک" ? "/user/contracts" : "/user/contracts/123456789012"} className={styles.contractContext} data-node-id="173:594">
              <span className={styles.contractAction}>{preview.role === "مالک" ? "مشاهده قراردادها" : "مشاهده قرارداد"}</span>
              <span className={styles.contractInfo}><span className={styles.tenantBadge}>{preview.role}</span><strong>قرارداد {preview.contract}</strong></span>
            </Link>
          </article>

          <ReceiptActions preview={preview} />
        </section>
      </section>

      <UserPanelSidebar nodeId="142:2169" />
    </main>
  );
}
