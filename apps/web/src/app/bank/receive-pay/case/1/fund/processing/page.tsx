import Link from "next/link";
import BankReceivePayPage from "../../../../page";
import styles from "./page.module.css";

export default function BankFundingProcessingPage() {
  return (
    <div className={styles.wrap} data-node-id="304:2" data-name="Bank / Funding Processing">
      <BankReceivePayPage />
      <div className={styles.backdrop} aria-hidden="true" />
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="processing-title">
        <h1 id="processing-title">در حال تأمین وجه</h1>
        <p className={styles.lead}>درخواست انتقال به سرویس بانکی ارسال شده است.</p>
        <div className={styles.divider} />
        <div className={styles.processing}><div className={styles.processingTop}><span className={styles.dots}>•••</span><strong>در حال پردازش</strong></div><p>نتیجه تراکنش به‌صورت خودکار از سرویس بانکی دریافت می‌شود.</p></div>
        <strong className={styles.title}>جزئیات عملیات</strong>
        <div className={styles.details}><div className={styles.row}><span><strong>۱۴۰۵-۸۳۲۱ — محمد رضایی</strong></span><label>پرونده</label></div><div className={styles.row}><span><strong>۵۰۰٬۰۰۰٬۰۰۰ تومان</strong></span><label>مبلغ</label></div><div className={styles.row}><span>بانک نمونه ← کارگزاری همان بانک</span><label>مسیر</label></div></div>
        <div className={styles.divider} />
        <div className={styles.footer}><Link href="/bank/receive-pay/case/1/fund/success" className={styles.close}>بستن</Link><span className={styles.note}>در این مرحله امکان تغییر وضعیت به‌صورت دستی وجود ندارد.</span></div>
      </section>
    </div>
  );
}
